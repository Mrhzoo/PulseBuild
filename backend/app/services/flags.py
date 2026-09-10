from __future__ import annotations

import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.orm import Flag, Finding, Project, Tenant
from app.services.audit import write_audit


def new_share_token() -> str:
    return secrets.token_urlsafe(32)


def share_url(token: str) -> str:
    return f"{settings.web_base_url.rstrip('/')}/share/{token}"


async def require_finding(session: AsyncSession, tenant_id: UUID, finding_id: UUID) -> Finding:
    finding = await session.get(Finding, finding_id)
    if not finding or finding.tenant_id != tenant_id:
        raise HTTPException(404, "finding")
    return finding


async def active_flag_for(session: AsyncSession, tenant_id: UUID, finding_id: UUID) -> Flag | None:
    return (await session.execute(select(Flag).where(Flag.tenant_id == tenant_id, Flag.finding_id == finding_id, Flag.dismissed_at.is_(None)))).scalar_one_or_none()


async def create_flag(session: AsyncSession, *, tenant_id: UUID, user_id: UUID, finding_id: UUID, note: str) -> Flag:
    finding = await require_finding(session, tenant_id, finding_id)
    existing = await active_flag_for(session, tenant_id, finding.id)
    if existing:
        if note.strip():
            existing.note = note.strip()
        return existing
    flag = Flag(tenant_id=tenant_id, finding_id=finding.id, user_id=user_id, note=note.strip(), share_token=new_share_token())
    session.add(flag)
    await session.flush()
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="flag_created", entity_type="flag", entity_id=str(flag.id), after={"finding_id": str(finding.id), "note": flag.note})
    return flag


async def dismiss_flag(session: AsyncSession, tenant_id: UUID, user_id: UUID, flag_id: UUID, reason: str = "") -> Flag:
    flag = await session.get(Flag, flag_id)
    if not flag or flag.tenant_id != tenant_id:
        raise HTTPException(404, "flag")
    flag.dismissed_at = datetime.now(timezone.utc)
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="flag_dismissed", entity_type="flag", entity_id=str(flag.id), after={"reason": reason, "finding_id": str(flag.finding_id)})
    return flag


async def revoke_share(session: AsyncSession, tenant_id: UUID, user_id: UUID, flag_id: UUID) -> Flag:
    flag = await session.get(Flag, flag_id)
    if not flag or flag.tenant_id != tenant_id:
        raise HTTPException(404, "flag")
    flag.share_revoked_at = datetime.now(timezone.utc)
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="share_revoked", entity_type="flag", entity_id=str(flag.id), after={"finding_id": str(flag.finding_id)})
    return flag


async def public_share_payload(session: AsyncSession, token: str) -> dict:
    flag = (await session.execute(select(Flag).where(Flag.share_token == token))).scalar_one_or_none()
    if flag is not None:
        if flag.share_revoked_at is not None or flag.dismissed_at is not None:
            raise HTTPException(410, "share unavailable")
        finding = await session.get(Finding, flag.finding_id)
        if not finding:
            raise HTTPException(410, "share unavailable")
        project = await session.get(Project, finding.project_id)
        tenant = await session.get(Tenant, flag.tenant_id)
        return {
            "title": finding.title,
            "why_it_hits_us": finding.why_it_hits_us,
            "evidence_snippet": finding.evidence_snippet,
            "evidence_pointer": finding.evidence_pointer,
            "confidence": finding.confidence,
            "project_name": project.name if project else "",
            "flagged_at": flag.created_at.isoformat() if flag.created_at else None,
            "note": flag.note,
            "company": tenant.name if tenant else "",
            "severity": finding.severity.value,
        }
    from app.services.packs import pack_by_token, pack_payload
    pack = await pack_by_token(session, token)
    if pack is None:
        raise HTTPException(410, "share unavailable")
    return await pack_payload(session, pack)
