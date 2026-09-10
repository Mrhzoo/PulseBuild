from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, require_write
from app.db import get_session
from app.models.orm import Tenant, User

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
async def onboarding_status(principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    return {"completed": bool(tenant.onboarding_completed_at), "onboarding_completed_at": tenant.onboarding_completed_at.isoformat() if tenant.onboarding_completed_at else None, "company": tenant.name}


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
async def set_own_whatsapp(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    return await _set_whatsapp(session, principal, payload)


@router.patch("/users/me")
@router.patch("/me")
async def patch_self(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    return await _set_whatsapp(session, principal, payload)
