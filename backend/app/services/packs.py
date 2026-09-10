"""GC coordination pack: one token listing today's flagged Act cards."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Flag, Finding, Project, Severity, Tenant
from app.services.flags import new_share_token, share_url, write_audit

PACK_PREFIX = "PACK:"


def is_pack_note(note: str) -> bool:
    return (note or "").startswith(PACK_PREFIX)


async def create_pack(session: AsyncSession, *, tenant_id: UUID, user_id: UUID) -> dict:
    flags = list((await session.execute(select(Flag).where(Flag.tenant_id == tenant_id, Flag.dismissed_at.is_(None), Flag.share_revoked_at.is_(None)).order_by(Flag.created_at.desc()))).scalars().all())
    act_flags: list[Flag] = []
    for flag in flags:
        if is_pack_note(flag.note):
            continue
        finding = await session.get(Finding, flag.finding_id)
        if finding and finding.severity == Severity.ACT and finding.evidence_pointer:
            act_flags.append(flag)
    if not act_flags:
        raise HTTPException(400, "no flagged Act cards to pack")
    ids = ",".join(str(f.id) for f in act_flags)
    pack = Flag(tenant_id=tenant_id, finding_id=act_flags[0].finding_id, user_id=user_id, note=f"{PACK_PREFIX}{ids}", share_token=new_share_token())
    session.add(pack)
    await session.flush()
    await write_audit(session, tenant_id=tenant_id, actor=str(user_id), action="pack_created", entity_type="flag", entity_id=str(pack.id), after={"count": len(act_flags)})
    return {"id": str(pack.id), "share_token": pack.share_token, "share_url": share_url(pack.share_token), "count": len(act_flags)}


async def pack_payload(session: AsyncSession, pack: Flag) -> dict:
    if pack.share_revoked_at is not None or pack.dismissed_at is not None:
        raise HTTPException(410, "share unavailable")
    raw_ids = (pack.note or "")[len(PACK_PREFIX):].split(",")
    tenant = await session.get(Tenant, pack.tenant_id)
    cards = []
    for raw in raw_ids:
        raw = raw.strip()
        if not raw:
            continue
        try:
            flag = await session.get(Flag, UUID(raw))
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
            "severity": finding.severity.value,
            "project_name": project.name if project else "",
            "confidence": finding.confidence,
        })
    return {
        "pack": True,
        "company": tenant.name if tenant else "",
        "watermark": "For coordination only",
        "cards": cards,
        "count": len(cards),
    }
