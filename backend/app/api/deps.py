from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.orm import Membership, Role
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


class Principal:
    def __init__(self, tenant_id: UUID, user_id: UUID, role: Role):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.role = role

    @property
    def can_write(self) -> bool:
        return self.role in {Role.OWNER, Role.OPS}


async def get_principal(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> Principal:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(401, "missing bearer token")
    try:
        payload = decode_access_token(creds.credentials)
        tenant_id = UUID(payload["tid"])
        user_id = UUID(payload["uid"])
    except Exception as exc:
        raise HTTPException(401, "invalid token") from exc
    membership = (
        await session.execute(
            select(Membership).where(
                Membership.tenant_id == tenant_id,
                Membership.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not membership:
        raise HTTPException(403, "no membership")
    return Principal(tenant_id, user_id, membership.role)


def require_write(principal: Principal = Depends(get_principal)) -> Principal:
    if not principal.can_write:
        raise HTTPException(403, "Reader cannot mutate")
    return principal
