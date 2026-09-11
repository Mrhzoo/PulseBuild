"""Scheduled briefing: agents → digest → email SLA → optional WhatsApp.
From backend/: python -m scripts.send_morning_digests
Alias: python -m scripts.send_scheduled_digests
Run every 15 minutes. Each tenant sends at their local HH:MM — see docs/S32-digest-schedule.md
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.db import SessionLocal
from app.digest.builder import build_digest, persist_digest
from app.digest.emailer import send_digest_email
from app.digest.recipients import briefing_recipients
from app.digest.schedule import tenant_digest_date, tenant_is_due
from app.models.orm import Digest, Document, Event, Project, Tenant
from app.notify.whatsapp import notify_digest, whatsapp_numbers
from app.services.audit import write_audit
from app.services.findings_run import run_project_agents

log = logging.getLogger("pulsebuild.digest")


async def _project_has_material(session, tenant_id, project_id) -> bool:
    docs = (await session.execute(select(Document.id).where(Document.tenant_id == tenant_id, Document.project_id == project_id))).first()
    if docs:
        return True
    events = (await session.execute(select(Event.id).where(Event.tenant_id == tenant_id, Event.project_id == project_id))).first()
    return bool(events)


async def run(now: datetime | None = None) -> None:
    instant = now or datetime.now(timezone.utc)
    async with SessionLocal() as session:
        tenants = (await session.execute(select(Tenant))).scalars().all()
        for tenant in tenants:
            local_date = tenant_digest_date(tenant, instant)
            existing = (
                await session.execute(select(Digest).where(Digest.tenant_id == tenant.id, Digest.digest_date == local_date))
            ).scalar_one_or_none()
            if not tenant_is_due(tenant, instant, existing):
                continue
            projects = (await session.execute(select(Project).where(Project.tenant_id == tenant.id))).scalars().all()
            for project in projects:
                try:
                    if not await _project_has_material(session, tenant.id, project.id):
                        continue
                    await run_project_agents(session, tenant.id, project)
                except Exception:
                    log.exception("agents failed tenant=%s project=%s", tenant.id, project.id)
                    continue
            payload = await build_digest(session, tenant.id, local_date)
            recipients = await briefing_recipients(session, tenant.id)
            if not recipients:
                continue
            try:
                via = await send_digest_email(payload, recipients)
            except Exception:
                log.exception("email failed tenant=%s — not marking sent", tenant.id)
                continue
            delivered = "email+web" if via == "email" else via
            try:
                numbers = await whatsapp_numbers(session, tenant.id)
                wa = await notify_digest(payload, numbers)
                if wa == "whatsapp":
                    delivered = f"{delivered}+whatsapp"
            except Exception:
                log.exception("whatsapp failed tenant=%s — email already sent", tenant.id)
            await persist_digest(session, tenant.id, payload, delivered_via=delivered)
            await write_audit(session, tenant_id=tenant.id, actor="system:cron", action="digest.send", entity_type="digest", entity_id=payload.digest_id or "", after={"via": delivered, "local_date": str(local_date)})
        await session.commit()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run())
