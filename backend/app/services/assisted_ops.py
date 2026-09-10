"""Time-capped human edits for pilot weeks 1–4. Never invent amounts."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.orm import AssistedOpsEdit, Document, Finding
from app.services.audit import write_audit

ALLOWED_KINDS = frozenset({"reassign", "dismiss_finding", "fix_pointer", "rewrite_copy", "ocr_ticket"})


async def minutes_used(session: AsyncSession, tenant_id: UUID, day: date | None = None) -> int:
    day = day or date.today()
    total = (await session.execute(select(func.coalesce(func.sum(AssistedOpsEdit.minutes_spent), 0)).where(AssistedOpsEdit.tenant_id == tenant_id, func.date(AssistedOpsEdit.created_at) == day))).scalar_one()
    return int(total or 0)


def over_cap(used: int, incoming: int, cap: int | None = None) -> bool:
    limit = settings.assisted_ops_daily_minutes if cap is None else cap
    return used + incoming > limit


async def apply_edit(session: AsyncSession, *, tenant_id: UUID, actor_id: UUID, kind: str, entity_id: str, before: dict | None, after: dict | None, minutes: int, ticket: str | None) -> AssistedOpsEdit:
    if kind not in ALLOWED_KINDS:
        raise HTTPException(400, "unknown assisted-ops kind")
    if settings.assisted_ops_requires_ticket and not (ticket or "").strip():
        raise HTTPException(400, "assisted_ops_requires_ticket")
    used = await minutes_used(session, tenant_id)
    incoming = max(1, int(minutes or 1))
    if over_cap(used, incoming):
        raise HTTPException(429, f"Assisted-ops cap reached ({settings.assisted_ops_daily_minutes} min/day). Reads still work.")
    if kind == "dismiss_finding":
        finding = await session.get(Finding, UUID(entity_id))
        if not finding or finding.tenant_id != tenant_id:
            raise HTTPException(404, "finding")
        finding.dismissed = True
        finding.dismiss_reason = (after or {}).get("reason") or "assisted_ops"
    elif kind == "fix_pointer":
        finding = await session.get(Finding, UUID(entity_id))
        if not finding or finding.tenant_id != tenant_id:
            raise HTTPException(404, "finding")
        pointer = (after or {}).get("evidence_pointer") or ""
        if not pointer.strip():
            raise HTTPException(400, "pointer required")
        finding.evidence_pointer = pointer.strip()
    elif kind == "rewrite_copy":
        finding = await session.get(Finding, UUID(entity_id))
        if not finding or finding.tenant_id != tenant_id:
            raise HTTPException(404, "finding")
        if after and after.get("amount"):
            raise HTTPException(400, "never invent amounts")
        if after and after.get("title"):
            finding.title = after["title"]
        if after and after.get("why_it_hits_us"):
            finding.why_it_hits_us = after["why_it_hits_us"]
    elif kind == "reassign":
        doc = await session.get(Document, UUID(entity_id))
        if not doc or doc.tenant_id != tenant_id:
            raise HTTPException(404, "document")
        new_id = (after or {}).get("project_id")
        doc.project_id = UUID(new_id) if new_id else None
    elif kind == "ocr_ticket":
        doc = await session.get(Document, UUID(entity_id))
        if not doc or doc.tenant_id != tenant_id:
            raise HTTPException(404, "document")
    row = AssistedOpsEdit(tenant_id=tenant_id, actor_id=actor_id, kind=kind, entity_id=entity_id, minutes_spent=incoming, ticket=ticket, before=before, after=after)
    session.add(row)
    await session.flush()
    await write_audit(session, tenant_id=tenant_id, actor=str(actor_id), action=f"assisted_ops_{kind}", entity_type="assisted_ops", entity_id=str(row.id), before=before, after={"minutes_spent": incoming, **(after or {})})
    return row
