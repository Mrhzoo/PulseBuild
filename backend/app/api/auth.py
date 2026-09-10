from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.db import get_session
from app.models.orm import Membership, Role, Tenant, User
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _session_payload(user: User, membership: Membership, tenant: Tenant | None) -> dict:
    return {
        "access_token": create_access_token(tenant_id=membership.tenant_id, user_id=user.id, role=membership.role),
        "token_type": "bearer",
        "role": membership.role.value,
        "email": user.email,
        "tenant_name": tenant.name if tenant else "",
        "tenant_id": str(membership.tenant_id),
        "user_id": str(user.id),
        "whatsapp_e164": user.whatsapp_e164,
    }


@router.post("/register")
async def register(payload: dict, session: AsyncSession = Depends(get_session)) -> dict:
    email = payload["email"].lower().strip()
    existing = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "email exists")
    slug = payload.get("company_slug") or payload["company_name"].lower().replace(" ", "-")[:80]
    tenant = Tenant(name=payload["company_name"], slug=slug)
    user = User(email=email, full_name=payload.get("full_name") or email, hashed_password=hash_password(payload["password"]))
    session.add(tenant)
    session.add(user)
    await session.flush()
    membership = Membership(tenant_id=tenant.id, user_id=user.id, role=Role.OWNER)
    session.add(membership)
    await session.commit()
    return _session_payload(user, membership, tenant)


@router.post("/login")
async def login(payload: dict, session: AsyncSession = Depends(get_session)) -> dict:
    email = payload["email"].lower().strip()
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(payload["password"], user.hashed_password):
        raise HTTPException(401, "invalid credentials")
    membership = (await session.execute(select(Membership).where(Membership.user_id == user.id))).scalar_one_or_none()
    if not membership:
        raise HTTPException(403, "no tenant")
    tenant = await session.get(Tenant, membership.tenant_id)
    return _session_payload(user, membership, tenant)


@router.get("/me")
async def me(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    user = await session.get(User, principal.user_id)
    tenant = await session.get(Tenant, principal.tenant_id)
    if not user or not tenant:
        raise HTTPException(404, "account")
    return {
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": principal.role.value,
        "tenant_id": str(tenant.id),
        "tenant_name": tenant.name,
        "whatsapp_e164": user.whatsapp_e164,
    }


@router.post("/logout")
async def logout() -> dict:
    return {"ok": True, "note": "Stateless JWT. Drop pb_token on the client."}


@router.patch("/me")
@router.patch("/users/me")
async def patch_me(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    user = await session.get(User, principal.user_id)
    if not user:
        raise HTTPException(404, "user")
    if "whatsapp_e164" in payload:
        number = (payload.get("whatsapp_e164") or "").strip()
        user.whatsapp_e164 = number or None
    if payload.get("full_name"):
        user.full_name = payload["full_name"]
    await session.commit()
    return {"email": user.email, "whatsapp_e164": user.whatsapp_e164, "note": "WhatsApp is best-effort — email is the morning SLA"}
