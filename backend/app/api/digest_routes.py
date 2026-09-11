from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.db import get_session
from app.digest.builder import build_digest, persist_digest
from app.digest.emailer import email_configured, send_digest_email
from app.digest.recipients import briefing_recipients
from app.notify.whatsapp import notify_digest, whatsapp_numbers
from app.services.audit import write_audit
from app.services.exposure import exposure_strip

router = APIRouter()


@router.get("/health")
async def digest_health() -> dict:
    return {"ok": True, "product": "pulsebuild", "channel": "email", "email_configured": email_configured()}


@router.get("/digest/today")
async def digest_today(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    payload = await build_digest(session, principal.tenant_id, date.today())
    return payload.model_dump()


@router.get("/digest/exposure")
async def digest_exposure(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    return await exposure_strip(session, principal.tenant_id)


@router.post("/digest/today/build")
async def digest_build(principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    payload = await build_digest(session, principal.tenant_id, date.today())
    await persist_digest(session, principal.tenant_id, payload, delivered_via="web")
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="digest.build", entity_type="digest", entity_id=payload.digest_id or "", after={"date": payload.date, "act": len(payload.act)})
    await session.commit()
    return payload.model_dump()


@router.post("/digest/today/send")
async def digest_send(principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    payload = await build_digest(session, principal.tenant_id, date.today())
    recipients = await briefing_recipients(session, principal.tenant_id)
    if not recipients:
        raise HTTPException(400, "no active members to brief")
    try:
        via = await send_digest_email(payload, recipients)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    delivered = "email+web" if via == "email" else via
    wa = "skipped"
    try:
        numbers = await whatsapp_numbers(session, principal.tenant_id)
        wa = await notify_digest(payload, numbers)
        if wa == "whatsapp":
            delivered = f"{delivered}+whatsapp"
    except Exception:
        wa = "failed"
    await persist_digest(session, principal.tenant_id, payload, delivered_via=delivered)
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="digest.send", entity_type="digest", entity_id=payload.digest_id or "", after={"via": delivered, "whatsapp": wa, "recipients": len(recipients)})
    await session.commit()
    return {
        "ok": True,
        "delivered_via": payload.delivered_via,
        "whatsapp": wa,
        "digest_id": payload.digest_id,
        "recipients": recipients if settings.app_env == "development" else len(recipients),
        "email_configured": email_configured(),
    }
