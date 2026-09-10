from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.api.deps import Principal, get_principal, require_owner
from app.config import settings
from app.db import get_session
from app.models.orm import Tenant
from app.services.billing import apply_subscription_event, project_count, stripe_live, verify_stripe_signature

router = APIRouter()


@router.get("/billing/status")
async def billing_status(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    used = await project_count(session, principal.tenant_id)
    quota = int(getattr(tenant, "project_quota", None) or 3)
    return {"plan": tenant.billing_plan, "currency": "AED", "billing_status": getattr(tenant, "billing_status", None) or "trialing", "project_quota": quota, "projects_used": used, "stripe_live": stripe_live(), "stub": not stripe_live()}


@router.post("/billing/checkout")
async def billing_checkout(payload: dict | None = None, principal: Principal = Depends(require_owner), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    addon = bool((payload or {}).get("addon"))
    price = settings.stripe_price_project_addon_aed if addon else settings.stripe_price_pilot_aed
    dest = f"{settings.web_base_url}/app/billing"
    if not stripe_live():
        fake = f"cs_stub_{uuid4().hex[:12]}"
        folder = Path(settings.local_upload_dir).resolve().parent / "billing"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / f"{fake}.txt").write_text(f"tenant={tenant.id} addon={addon}\n", encoding="utf-8")
        return {"url": f"{dest}?session={fake}", "mode": "stub", "session_id": fake}
    body = {
        "mode": "subscription",
        "success_url": f"{dest}?ok=1",
        "cancel_url": f"{dest}?canceled=1",
        "line_items[0][price]": price,
        "line_items[0][quantity]": "1",
        "client_reference_id": str(tenant.id),
        "metadata[tenant_id]": str(tenant.id),
    }
    if tenant.stripe_customer_id:
        body["customer"] = tenant.stripe_customer_id
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post("https://api.stripe.com/v1/checkout/sessions", data=body, auth=(settings.stripe_secret_key, ""))
        response.raise_for_status()
        data = response.json()
    return {"url": data.get("url"), "mode": "live", "session_id": data.get("id")}


@router.post("/billing/portal")
async def billing_portal(principal: Principal = Depends(require_owner), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    dest = f"{settings.web_base_url}/app/billing"
    if not stripe_live() or not getattr(tenant, "stripe_customer_id", None):
        return {"url": f"{dest}?portal=stub", "mode": "stub"}
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post("https://api.stripe.com/v1/billing_portal/sessions", data={"customer": tenant.stripe_customer_id, "return_url": dest}, auth=(settings.stripe_secret_key, ""))
        response.raise_for_status()
        return {"url": response.json().get("url"), "mode": "live"}


@router.post("/billing/webhook")
async def billing_webhook(request: Request, stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"), session: AsyncSession = Depends(get_session)) -> dict:
    raw = await request.body()
    if stripe_live() or (settings.stripe_webhook_secret or "").strip():
        if not verify_stripe_signature(raw, stripe_signature or "", settings.stripe_webhook_secret):
            raise HTTPException(400, "invalid stripe signature")
    payload = await request.json()
    event_type = payload.get("type") or ""
    data = payload.get("data") or {}
    obj = data.get("object") or {}
    tenant_id = (obj.get("metadata") or {}).get("tenant_id") or obj.get("client_reference_id")
    tenant = await session.get(Tenant, tenant_id) if tenant_id else None
    if tenant is None and obj.get("customer"):
        tenant = (await session.execute(select(Tenant).where(Tenant.stripe_customer_id == str(obj.get("customer"))))).scalar_one_or_none()
    if tenant:
        apply_subscription_event(tenant, event_type, data)
        await session.commit()
    return {"ok": True, "type": event_type}
