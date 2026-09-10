"""GC coordination pack stored in share_packs — never a Flag row."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Flag, Finding, Project, Severity, SharePack, Tenant
from app.services.audit import write_audit
from app.services.flags import new_share_token, share_url

WATERMARK = "For coordination only"


async def create_pack(session: AsyncSession, *, tenant_id: UUID, user_id: UUID) -> dict:
    flags = list((await session.execute(select(Flag).where(Flag.tenant_id == tenant_id, Flag.dismissed_at.is_(None), Flag.share_revoked_at.is_(None)).order_by(Flag.created_at.desc()))).scalars().all())
    act_flags: list[Flag] = []
    for flag in flags:
        finding = await session.get(Finding, flag.finding_id)
        if finding and finding.severity == Severity.ACT and (finding.evidence_pointer or "").strip():
            act_flags.append(flag)
    if not act_flags:
        raise HTTPException(400, "no flagged Act cards to pack")
    pack = SharePack(
        tenant_id=tenant_id,
        user_id=user_id,
        share_token=new_share_token(),
        flag_ids=[str(f.id) for f in act_flags],
        watermark=WATERMARK,
    )
    session.add(pack)
    await session.flush()
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="pack_created", entity_type="share_pack", entity_id=str(pack.id), after={"count": len(act_flags)})
    return {"id": str(pack.id), "share_token": pack.share_token, "share_url": share_url(pack.share_token), "count": len(act_flags), "pack": True}


async def revoke_pack(session: AsyncSession, tenant_id: UUID, user_id: UUID, pack_id: UUID) -> SharePack:
    pack = await session.get(SharePack, pack_id)
    if not pack or pack.tenant_id != tenant_id:
        raise HTTPException(404, "pack")
    pack.revoked_at = datetime.now(timezone.utc)
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="pack_revoked", entity_type="share_pack", entity_id=str(pack.id), after={})
    return pack


async def pack_payload(session: AsyncSession, pack: SharePack) -> dict:
    if pack.revoked_at is not None:
        raise HTTPException(410, "share unavailable")
    tenant = await session.get(Tenant, pack.tenant_id)
    cards = []
    for raw in pack.flag_ids or []:
        try:
            flag = await session.get(Flag, UUID(str(raw)))
        except Exception:
            continue
        if not flag or flag.share_revoked_at is not None or flag.dismissed_at is not None:
            continue
        finding = await session.get(Finding, flag.finding_id)
        if not finding:
            continue
        project = await session.get(Project, finding.project_id)
        cards.append({
            "title": finding.title,
            "why_it_hits_us": finding.why_it_hits_us,
            "evidence_snippet": finding.evidence_snippet,
            "evidence_pointer": finding.evidence_pointer,
            "severity": finding.severity.value if hasattr(finding.severity, "value") else str(finding.severity),
            "project_name": project.name if project else "",
            "confidence": finding.confidence,
        })
    return {
        "pack": True,
        "company": tenant.name if tenant else "",
        "watermark": pack.watermark or WATERMARK,
        "cards": cards,
        "count": len(cards),
    }


async def pack_by_token(session: AsyncSession, token: str) -> SharePack | None:
    return (await session.execute(select(SharePack).where(SharePack.share_token == token))).scalar_one_or_none()
