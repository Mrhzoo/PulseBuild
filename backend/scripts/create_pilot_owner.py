"""Create a paying-pilot Owner. Allowed in production. Not the demo seed.

Usage:
  python -m scripts.create_pilot_owner --email owner@firm.ae --company "Marina MEP"
  PILOT_OWNER_EMAIL=... PILOT_OWNER_PASSWORD=... PILOT_COMPANY_NAME=... python -m scripts.create_pilot_owner
"""

from __future__ import annotations

import argparse
import asyncio
import os
import secrets
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models.orm import Country, Currency, Membership, Role, Tenant, User
from app.security import hash_password


def _slug(name: str) -> str:
    raw = "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-")
    while "--" in raw:
        raw = raw.replace("--", "-")
    return (raw or "pilot")[:80]


async def create_owner(email: str, password: str, company: str, slug: str | None) -> None:
    email = email.lower().strip()
    company = company.strip()
    if not email or not company or not password:
        print("email, password, and company are required", file=sys.stderr)
        raise SystemExit(2)
    slug = (slug or _slug(company))[:80]
    async with SessionLocal() as session:
        existing = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if existing:
            print(f"user already exists: {email}", file=sys.stderr)
            raise SystemExit(1)
        taken = (await session.execute(select(Tenant).where(Tenant.slug == slug))).scalar_one_or_none()
        if taken:
            print(f"slug already exists: {slug}", file=sys.stderr)
            raise SystemExit(1)
        tenant = Tenant(
            name=company,
            slug=slug,
            country=Country.UAE,
            currency=Currency.AED,
            billing_plan="pilot",
        )
        owner = User(email=email, full_name=company, hashed_password=hash_password(password))
        session.add_all([tenant, owner])
        await session.flush()
        session.add(Membership(tenant_id=tenant.id, user_id=owner.id, role=Role.OWNER))
        await session.commit()
        print("created pilot owner")
        print(f"email={email}")
        print(f"company={company} slug={slug}")
        print(f"tenant_id={tenant.id}")
        print("password printed once — store it, then Sign in. No public register.")
        print(password)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a PulseBuild pilot Owner (production-safe).")
    parser.add_argument("--email", default=os.environ.get("PILOT_OWNER_EMAIL", ""))
    parser.add_argument("--password", default=os.environ.get("PILOT_OWNER_PASSWORD", ""))
    parser.add_argument("--company", default=os.environ.get("PILOT_COMPANY_NAME", ""))
    parser.add_argument("--slug", default=os.environ.get("PILOT_COMPANY_SLUG", "") or None)
    args = parser.parse_args()
    password = args.password or secrets.token_urlsafe(16)
    asyncio.run(create_owner(args.email, password, args.company, args.slug))


if __name__ == "__main__":
    main()
