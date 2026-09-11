from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.db import get_session
from app.digest.emailer import email_configured
from app.eval.harness import run_golden
from app.models.orm import Project
from app.services.assisted_ops import apply_edit, minutes_used
from app.services.billing import billing_configured
from app.services.usage import remaining, tokens_used_today

router = APIRouter()


@router.get("/eval/golden")
async def eval_golden(principal: Principal = Depends(require_write)) -> dict:
    return run_golden()


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


@router.get("/pilot/checklist")
async def pilot_checklist(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    projects = (await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all()
    https_ok = (settings.web_base_url or "").startswith("https://")
    return {
        "app_env": settings.app_env,
        "items": [
            {"id": "email", "ok": email_configured(), "label": "Postmark token (morning email SLA)"},
            {"id": "cron", "ok": None, "label": "Digest cron every 15 min (see docs/S32-digest-schedule.md) — ops confirm"},
            {"id": "stripe", "ok": billing_configured(), "label": "Stripe live (BILLING_STUB=false + keys)"},
            {"id": "whatsapp", "ok": bool(settings.enable_whatsapp_push), "label": "WhatsApp optional — best-effort only"},
            {"id": "forward", "ok": any(p.forward_address for p in projects), "label": "Project forward address"},
            {"id": "https", "ok": https_ok or settings.app_env != "production", "label": "WEB_BASE_URL is https in production"},
            {"id": "seed", "ok": settings.app_env != "production", "label": "Demo seed refused in production"},
            {"id": "register", "ok": (settings.app_env or "").lower() == "production" or not bool((settings.pilot_invite_code or "").strip()), "label": "Public register default-deny (always closed in production)"},
        ],
        "forwards": [p.forward_address for p in projects if p.forward_address],
    }
