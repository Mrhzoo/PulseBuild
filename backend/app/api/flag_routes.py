from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.db import get_session
from app.models.orm import Flag, Finding, Project
from app.services.audit import write_audit
from app.services.flags import create_flag, dismiss_flag, public_share_payload, revoke_share, share_url

router = APIRouter()


@router.post("/findings/{finding_id}/flag")
async def flag_finding(finding_id: UUID, payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    flag = await create_flag(session, tenant_id=principal.tenant_id, user_id=principal.user_id, finding_id=finding_id, note=payload.get("note") or "This affects us")
    await session.commit()
    return {"id": str(flag.id), "share_token": flag.share_token, "share_url": share_url(flag.share_token), "note": flag.note}


@router.post("/findings/{finding_id}/dismiss")
async def dismiss_finding(finding_id: UUID, payload: dict | None = None, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    finding = await session.get(Finding, finding_id)
    if not finding or finding.tenant_id != principal.tenant_id:
        raise HTTPException(404, "finding")
    finding.dismissed = True
    finding.dismiss_reason = (payload or {}).get("reason", "")
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="finding_dismissed", entity_type="finding", entity_id=str(finding.id), after={"reason": finding.dismiss_reason})
    await session.commit()
    return {"ok": True}


@router.get("/flags")
async def list_flags(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.execute(select(Flag).where(Flag.tenant_id == principal.tenant_id, Flag.dismissed_at.is_(None)).order_by(Flag.created_at.desc()))).scalars().all()
    out = []
    for flag in rows:
        finding = await session.get(Finding, flag.finding_id)
        project_name = ""
        if finding:
            project = await session.get(Project, finding.project_id)
            project_name = project.name if project else ""
        out.append({"id": str(flag.id), "finding_id": str(flag.finding_id), "note": flag.note, "project_name": project_name, "title": finding.title if finding else "", "created_at": flag.created_at.isoformat() if flag.created_at else None, "share_url": share_url(flag.share_token) if flag.share_revoked_at is None else None, "share_revoked": flag.share_revoked_at is not None})
    return out


@router.post("/flags/{flag_id}/dismiss")
async def dismiss_open_flag(flag_id: UUID, payload: dict | None = None, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    await dismiss_flag(session, principal.tenant_id, principal.user_id, flag_id, (payload or {}).get("reason", ""))
    await session.commit()
    return {"ok": True}


@router.post("/flags/{flag_id}/revoke-share")
async def revoke_flag_share(flag_id: UUID, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    await revoke_share(session, principal.tenant_id, principal.user_id, flag_id)
    await session.commit()
    return {"ok": True}


@router.get("/share/{token}")
async def public_share(token: str, session: AsyncSession = Depends(get_session)) -> dict:
    return await public_share_payload(session, token)
