"""Project matching contract (Architecture §6). First hit wins. Soft suggest never auto-commits."""

from __future__ import annotations

import re
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Project


@dataclass
class MatchResult:
    project_id: UUID | None
    method: str
    needs_confirmation: bool = False
    suggested_project_id: UUID | None = None


TOKEN_RE = re.compile(r"\[PB:([A-Za-z0-9_-]+)\]", re.I)


async def match_inbound(
    session: AsyncSession,
    tenant_id: UUID,
    *,
    to_address: str | None = None,
    subject: str | None = None,
    filename: str | None = None,
) -> MatchResult:
    projects = (
        await session.execute(select(Project).where(Project.tenant_id == tenant_id))
    ).scalars().all()

    if to_address:
        addr = to_address.lower().strip()
        for p in projects:
            if p.forward_address and p.forward_address.lower() == addr:
                return MatchResult(p.id, "forward_address")

    if subject:
        token = TOKEN_RE.search(subject)
        if token:
            code = token.group(1).lower()
            for p in projects:
                if p.code.lower() == code or p.slug.lower() == code:
                    return MatchResult(p.id, "subject_token")
                aliases = [str(a).lower() for a in (p.match_aliases or [])]
                if code in aliases:
                    return MatchResult(p.id, "subject_token")

    if filename:
        name = filename.lower()
        for p in projects:
            aliases = [str(a).lower() for a in (p.match_aliases or [])]
            hay = [p.code.lower(), p.slug.lower(), p.name.lower(), *aliases]
            if any(h and h in name for h in hay):
                return MatchResult(p.id, "filename_alias")

    return MatchResult(None, "unassigned")
