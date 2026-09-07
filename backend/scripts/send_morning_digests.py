"""Nightly briefing sender. From backend/: python -m scripts.send_morning_digests"""

from __future__ import annotations

import asyncio
from datetime import date

from sqlalchemy import select

from app.db import SessionLocal
from app.digest.builder import build_digest, persist_digest
from app.digest.emailer import send_digest_email
from app.digest.recipients import briefing_recipients
from app.models.orm import Tenant
from app.services.audit import write_audit


async def run() -> None:
    async with SessionLocal() as session:
        tenants = (await session.execute(select(Tenant))).scalars().all()
        for tenant in tenants:
            payload = await build_digest(session, tenant.id, date.today())
            recipients = await briefing_recipients(session, tenant.id)
            if not recipients:
                continue
            via = await send_digest_email(payload, recipients)
            await persist_digest(session, tenant.id, payload, delivered_via="email+web" if via == "email" else via)
            await write_audit(session, tenant_id=tenant.id, actor="system:cron", action="digest.send", entity_type="digest", entity_id=payload.digest_id or "", after={"via": via})
        await session.commit()


if __name__ == "__main__":
    asyncio.run(run())
