"""Tenant isolation helpers. Missing or foreign projects are 404, not 403."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Project


async def require_project_for_tenant(
    session: AsyncSession,
    tenant_id: UUID,
    project_id: UUID,
) -> Project:
    project = await session.get(Project, project_id)
    if project is None or project.tenant_id != tenant_id:
        raise HTTPException(404, "project")
    return project
