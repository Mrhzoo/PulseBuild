from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Membership, Role, User


async def briefing_recipients(session: AsyncSession, tenant_id: UUID) -> list[str]:
    rows = (await session.execute(select(User.email, Membership.role).join(Membership, Membership.user_id == User.id).where(Membership.tenant_id == tenant_id, User.is_active.is_(True)))).all()
    owners_ops = [email for email, role in rows if role in {Role.OWNER, Role.OPS}]
    readers = [email for email, role in rows if role == Role.READER]
    return owners_ops + readers
