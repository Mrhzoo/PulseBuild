from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.db import get_session
from app.services.assisted_ops import apply_edit, minutes_used
from app.services.usage import remaining, tokens_used_today

router = APIRouter()


@router.get("/assisted-ops/usage")
async def assisted_usage(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    used = await minutes_used(session, principal.tenant_id)
    cap = settings.assisted_ops_daily_minutes
    return {"date": str(date.today()), "minutes_used": used, "minutes_remaining": max(0, cap - used), "cap": cap, "requires_ticket": settings.assisted_ops_requires_ticket}


@router.post("/assisted-ops/edits")
async def assisted_edit(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    row = await apply_edit(session, tenant_id=principal.tenant_id, actor_id=principal.user_id, kind=payload.get("kind", ""), entity_id=str(payload.get("entity_id") or ""), before=payload.get("before"), after=payload.get("after"), minutes=int(payload.get("minutes") or 1), ticket=payload.get("ticket"))
    await session.commit()
    used = await minutes_used(session, principal.tenant_id)
    return {"id": str(row.id), "kind": row.kind, "minutes_spent": row.minutes_spent, "minutes_used_today": used, "minutes_remaining": max(0, settings.assisted_ops_daily_minutes - used)}


@router.get("/usage/tokens")
async def token_usage(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    used = await tokens_used_today(session, principal.tenant_id)
    cap = settings.tenant_daily_token_cap
    return {"used": used, "remaining": remaining(used, cap), "cap": cap, "live_llm": settings.enable_live_llm}
