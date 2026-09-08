"""Tenant daily token ledger. Heuristics stay free; LLM calls check this first."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.orm import TokenUsage


def remaining(used: int, cap: int | None = None) -> int:
    limit = settings.tenant_daily_token_cap if cap is None else cap
    return max(0, limit - used)


def allow_tokens(used: int, incoming: int, cap: int | None = None) -> bool:
    limit = settings.tenant_daily_token_cap if cap is None else cap
    if incoming <= 0:
        return True
    return used + incoming <= limit


async def tokens_used_today(session: AsyncSession, tenant_id: UUID, day: date | None = None) -> int:
    day = day or date.today()
    row = (await session.execute(select(TokenUsage).where(TokenUsage.tenant_id == tenant_id, TokenUsage.usage_date == day))).scalar_one_or_none()
    return int(row.tokens_used) if row else 0


async def record_tokens(session: AsyncSession, tenant_id: UUID, incoming: int, day: date | None = None) -> dict:
    day = day or date.today()
    used = await tokens_used_today(session, tenant_id, day)
    cap = settings.tenant_daily_token_cap
    if not allow_tokens(used, incoming, cap):
        return {"allowed": False, "used": used, "remaining": remaining(used, cap), "cap": cap, "status": "cap_exceeded"}
    row = (await session.execute(select(TokenUsage).where(TokenUsage.tenant_id == tenant_id, TokenUsage.usage_date == day))).scalar_one_or_none()
    if row is None:
        session.add(TokenUsage(tenant_id=tenant_id, usage_date=day, tokens_used=incoming))
        now = incoming
    else:
        row.tokens_used = used + incoming
        now = row.tokens_used
    await session.flush()
    return {"allowed": True, "used": now, "remaining": remaining(now, cap), "cap": cap, "status": "ok"}
