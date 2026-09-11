from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Flag, Finding, Severity, Tenant

_DAYS = re.compile(r"(\d+)\s*(day|days|يوم|أيام)", re.I)
_WEEKS = re.compile(r"(\d+)\s*(week|weeks|أسبوع|اسابيع)", re.I)


def days_from_text(*parts: str) -> int | None:
    blob = " ".join(p for p in parts if p)
    m = _DAYS.search(blob)
    if m:
        return int(m.group(1))
    m = _WEEKS.search(blob)
    if m:
        return int(m.group(1)) * 7
    return None


async def exposure_strip(session: AsyncSession, tenant_id) -> dict:
    tenant = await session.get(Tenant, tenant_id)
    findings = list((await session.execute(select(Finding).where(Finding.tenant_id == tenant_id, Finding.dismissed.is_(False)))).scalars().all())
    act = [f for f in findings if f.severity == Severity.ACT]
    watch = [f for f in findings if f.severity == Severity.WATCH]
    measured = [days_from_text(f.title, f.why_it_hits_us, f.evidence_snippet) for f in act]
    measured = [d for d in measured if d is not None]
    days = sum(measured) if measured else None
    rate = tenant.aed_per_delay_day if tenant else None
    margin = None if days is None or rate is None else days * rate
    flags = list((await session.execute(select(Flag).where(Flag.tenant_id == tenant_id, Flag.dismissed_at.is_(None), Flag.share_revoked_at.is_(None)))).scalars().all())
    return {
        "open_act": len(act),
        "open_watch": len(watch),
        "days_flagged": days,
        "aed_per_delay_day": rate,
        "margin_at_risk": margin,
        "shared": len(flags),
        "formula": "days_flagged × aed_per_delay_day",
        "note": "Estimated exposure from your flagged days and the rate in Settings — not a guarantee.",
    }
