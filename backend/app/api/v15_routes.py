from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.config import settings
from app.connectors.sync import sync_portal
from app.db import get_session
from app.models.orm import PortalConnection

router = APIRouter()


@router.get("/connectors/portal/status")
async def portal_status(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    row = (await session.execute(select(PortalConnection).where(PortalConnection.tenant_id == principal.tenant_id))).scalar_one_or_none()
    return {"connector_type": settings.portal_connector_type, "configured": bool(settings.portal_base_url), "last_sync_at": row.last_sync_at.isoformat() if row and row.last_sync_at else None, "docs_pulled": row.docs_pulled if row else 0, "status": row.last_status if row else "never", "errors": [row.last_error] if row and row.last_error else []}


@router.post("/connectors/portal/sync")
async def portal_sync(principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    result = await sync_portal(session, principal.tenant_id, settings.portal_base_url, settings.portal_api_key)
    await session.commit()
    return result
