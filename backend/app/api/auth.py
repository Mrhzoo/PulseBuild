from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.orm import Membership, Role, Tenant, User
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(payload: dict, session: AsyncSession = Depends(get_session)) -> dict:
    email = payload["email"].lower().strip()
    existing = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "email exists")
    slug = payload.get("company_slug") or payload["company_name"].lower().replace(" ", "-")[:80]
    tenant = Tenant(name=payload["company_name"], slug=slug)
    user = User(
        email=email,
        full_name=payload.get("full_name") or email,
        hashed_password=hash_password(payload["password"]),
    )
    session.add(tenant)
    session.add(user)
    await session.flush()
    session.add(Membership(tenant_id=tenant.id, user_id=user.id, role=Role.OWNER))
    await session.commit()
    token = create_access_token(tenant_id=tenant.id, user_id=user.id, role=Role.OWNER)
    return {
        "access_token": token,
        "tenant_id": str(tenant.id),
        "user_id": str(user.id),
        "role": Role.OWNER.value,
    }


@router.post("/login")
async def login(payload: dict, session: AsyncSession = Depends(get_session)) -> dict:
    email = payload["email"].lower().strip()
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(payload["password"], user.hashed_password):
        raise HTTPException(401, "invalid credentials")
    membership = (
        await session.execute(select(Membership).where(Membership.user_id == user.id))
    ).scalar_one_or_none()
    if not membership:
        raise HTTPException(403, "no tenant")
    token = create_access_token(
        tenant_id=membership.tenant_id, user_id=user.id, role=membership.role
    )
    return {
        "access_token": token,
        "tenant_id": str(membership.tenant_id),
        "user_id": str(user.id),
        "role": membership.role.value,
    }
