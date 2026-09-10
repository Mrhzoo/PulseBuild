"""Seed a UAE demo tenant. Usage: python -m scripts.seed — refused in production."""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import select

from app.config import settings
from app.db import SessionLocal
from app.models.orm import Country, Currency, Membership, Project, Role, Tenant, User
from app.security import hash_password


async def seed() -> None:
    if settings.app_env == "production":
        print("refusing seed in production", file=sys.stderr)
        raise SystemExit(2)
    async with SessionLocal() as session:
        existing = (
            await session.execute(select(User).where(User.email == "owner@demo.pulsebuild.local"))
        ).scalar_one_or_none()
        if existing:
            print("seed already applied")
            return
        tenant = Tenant(
            name="Demo MEP LLC",
            slug="demo-mep",
            country=Country.UAE,
            currency=Currency.AED,
            billing_plan="pilot",
        )
        owner = User(
            email="owner@demo.pulsebuild.local",
            full_name="Demo Owner",
            hashed_password=hash_password("demo-owner-pass"),
        )
        reader = User(
            email="reader@demo.pulsebuild.local",
            full_name="Demo Reader",
            hashed_password=hash_password("demo-reader-pass"),
        )
        session.add_all([tenant, owner, reader])
        await session.flush()
        session.add_all(
            [
                Membership(tenant_id=tenant.id, user_id=owner.id, role=Role.OWNER),
                Membership(tenant_id=tenant.id, user_id=reader.id, role=Role.READER),
                Project(
                    tenant_id=tenant.id,
                    name="Marina Fitout",
                    code="MARINA",
                    slug="marina",
                    match_aliases=["marina-fitout"],
                    forward_address="marina@demo-mep.pulsebuild.local",
                ),
                Project(
                    tenant_id=tenant.id,
                    name="Warehouse MEP",
                    code="WHMEP",
                    slug="whmep",
                    match_aliases=["warehouse-mep"],
                    forward_address="whmep@demo-mep.pulsebuild.local",
                ),
            ]
        )
        await session.commit()
        print("seeded tenant demo-mep")
        print("owner@demo.pulsebuild.local / demo-owner-pass")
        print("reader@demo.pulsebuild.local / demo-reader-pass")


if __name__ == "__main__":
    asyncio.run(seed())
