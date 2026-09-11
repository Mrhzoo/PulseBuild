from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.db import get_session
from app.models.orm import Document, Project, Tenant, User

router = APIRouter()


@router.post("/onboarding/complete")
async def complete_onboarding(principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    if not tenant.onboarding_completed_at:
        tenant.onboarding_completed_at = datetime.now(timezone.utc)
        await session.commit()
    return {"ok": True, "onboarding_completed_at": tenant.onboarding_completed_at.isoformat()}


@router.get("/onboarding/status")
async def onboarding_status(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    return {
        "completed": bool(tenant.onboarding_completed_at),
        "onboarding_completed_at": tenant.onboarding_completed_at.isoformat() if tenant.onboarding_completed_at else None,
        "company": tenant.name,
        "aed_per_delay_day": tenant.aed_per_delay_day,
    }


@router.get("/settings/tenant")
async def get_tenant_settings(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    return {"name": tenant.name, "aed_per_delay_day": tenant.aed_per_delay_day, "currency": tenant.currency.value}


@router.patch("/settings/tenant")
async def patch_tenant_settings(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    if "aed_per_delay_day" in payload:
        raw = payload.get("aed_per_delay_day")
        if raw is None or raw == "":
            tenant.aed_per_delay_day = None
        else:
            tenant.aed_per_delay_day = float(raw)
    await session.commit()
    return {"name": tenant.name, "aed_per_delay_day": tenant.aed_per_delay_day}


@router.get("/inbound/status")
async def inbound_status(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    projects = list((await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all())
    last = (await session.execute(select(Document).where(Document.tenant_id == principal.tenant_id, Document.source_type == "email").order_by(Document.created_at.desc()))).scalars().first()
    live = bool((settings.postmark_inbound_secret or "").strip()) and settings.app_env != "development"
    return {
        "live": live,
        "note": "Inbound is a stub in development. Send yourself a test only after Postmark inbound is wired." if not live else "Inbound webhook is configured.",
        "forwards": [{"project": p.name, "forward_address": p.forward_address} for p in projects if p.forward_address],
        "last_inbound": None if not last else {"id": str(last.id), "filename": last.filename, "parse_status": last.parse_status, "created_at": last.created_at.isoformat() if last.created_at else None},
    }


async def _set_whatsapp(session: AsyncSession, principal: Principal, payload: dict) -> dict:
    user = await session.get(User, principal.user_id)
    if not user:
        raise HTTPException(404, "user")
    if "whatsapp_e164" in payload:
        number = (payload.get("whatsapp_e164") or "").strip()
        user.whatsapp_e164 = number or None
    await session.commit()
    return {"whatsapp_e164": user.whatsapp_e164, "note": "WhatsApp is best-effort — email is the morning SLA"}


@router.post("/people/me/whatsapp")
async def set_own_whatsapp(payload: dict, principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    return await _set_whatsapp(session, principal, payload)


@router.patch("/users/me")
@router.patch("/me")
async def patch_self(payload: dict, principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    return await _set_whatsapp(session, principal, payload)
