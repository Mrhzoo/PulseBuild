from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Digest, Document, Flag, Finding, SharePack


async def tenant_activity(session: AsyncSession, tenant_id) -> dict:
    items: list[dict] = []
    flags = list((await session.execute(select(Flag).where(Flag.tenant_id == tenant_id).order_by(Flag.created_at.desc()).limit(12))).scalars().all())
    for flag in flags:
        finding = await session.get(Finding, flag.finding_id)
        items.append({
            "kind": "flag",
            "at": flag.created_at.isoformat() if flag.created_at else None,
            "title": finding.title if finding else "Flag",
            "note": flag.note,
            "shared": flag.share_revoked_at is None,
        })
    packs = list((await session.execute(select(SharePack).where(SharePack.tenant_id == tenant_id).order_by(SharePack.created_at.desc()).limit(6))).scalars().all())
    for pack in packs:
        items.append({
            "kind": "pack",
            "at": pack.created_at.isoformat() if pack.created_at else None,
            "title": pack.watermark or "Coordination pack",
            "note": "share pack",
            "shared": pack.revoked_at is None,
        })
    digest = (await session.execute(select(Digest).where(Digest.tenant_id == tenant_id).order_by(Digest.created_at.desc()))).scalars().first()
    if digest:
        items.append({
            "kind": "briefing",
            "at": digest.created_at.isoformat() if digest.created_at else None,
            "title": digest.delivered_via,
            "note": str(digest.digest_date),
            "shared": False,
        })
    inbound = (await session.execute(select(Document).where(Document.tenant_id == tenant_id).order_by(Document.created_at.desc()))).scalars().first()
    if inbound:
        items.append({
            "kind": "inbound",
            "at": inbound.created_at.isoformat() if inbound.created_at else None,
            "title": inbound.filename,
            "note": inbound.parse_status,
            "shared": inbound.project_id is None,
        })
    items.sort(key=lambda row: row.get("at") or "", reverse=True)
    return {"items": items[:20]}
