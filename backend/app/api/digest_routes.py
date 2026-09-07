from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.db import get_session
from app.digest.builder import build_digest, persist_digest
from app.digest.emailer import send_digest_email
from app.digest.recipients import briefing_recipients
from app.services.audit import write_audit

router = APIRouter()


@router.get("/digest/today")
async def digest_today(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    payload = await build_digest(session, principal.tenant_id, date.today())
    await persist_digest(session, principal.tenant_id, payload, delivered_via="web")
    await session.commit()
    return payload.model_dump()


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
    await persist_digest(session, principal.tenant_id, payload, delivered_via="email+web" if via == "email" else via)
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="digest.send", entity_type="digest", entity_id=payload.digest_id or "", after={"via": via, "recipients": len(recipients)})
    await session.commit()
    return {"ok": True, "delivered_via": payload.delivered_via, "digest_id": payload.digest_id, "recipients": recipients if settings.app_env == "development" else len(recipients)}
