"""Assemble today's digest from persisted findings. Never invents cards."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.digest.cues import cue_lines
from app.digest.payload import DigestCard, DigestPayload, coaching_ask
from app.models.orm import Digest, Document, Event, Finding, Project, Severity, Tenant


def card_from_finding(finding: Finding, project_name: str) -> DigestCard | None:
    pointer = (finding.evidence_pointer or "").strip()
    if finding.severity == Severity.ACT and not pointer:
        return None
    return DigestCard(
        id=str(finding.id),
        project_id=str(finding.project_id),
        project_name=project_name,
        severity=finding.severity.value,
        title=finding.title,
        why_it_hits_us=finding.why_it_hits_us,
        evidence_snippet=finding.evidence_snippet,
        evidence_pointer=pointer,
        confidence=finding.confidence,
    )


def assemble_payload(*, tenant_name: str, for_date: date, findings: list[Finding], projects: list[Project], unassigned: int, last_data_received: str | None = None) -> DigestPayload:
    names = {p.id: p.name for p in projects}
    cards: list[DigestCard] = []
    seen_pointers: set[str] = set()
    for finding in findings:
        if finding.dismissed:
            continue
        card = card_from_finding(finding, names.get(finding.project_id, ""))
        if not card:
            continue
        key = card.evidence_pointer or card.id
        if key in seen_pointers:
            continue
        seen_pointers.add(key)
        cards.append(card)
    act = [c for c in cards if c.severity == "act"][:5]
    watch = [c for c in cards if c.severity == "watch"]
    low = [c for c in cards if c.severity == "low"]
    material_ids = {c.project_id for c in act + watch}
    quiet = [p.name for p in projects if str(p.id) not in material_ids]
    has_material = bool(act or watch)
    return DigestPayload(
        date=str(for_date),
        tenant=tenant_name,
        company=tenant_name,
        projects_scanned=len(projects),
        last_data_received=last_data_received,
        act=act,
        watch=watch,
        low=low,
        quiet_projects=quiet,
        unassigned_count=unassigned,
        ask=coaching_ask(unassigned, [p.name for p in projects], has_material),
        cues=cue_lines(act + watch),
    )


async def build_digest(session: AsyncSession, tenant_id: UUID, for_date: date) -> DigestPayload:
    tenant = await session.get(Tenant, tenant_id)
    name = tenant.name if tenant else "Company"
    projects = list((await session.execute(select(Project).where(Project.tenant_id == tenant_id))).scalars().all())
    findings = list((await session.execute(select(Finding).where(Finding.tenant_id == tenant_id, Finding.dismissed.is_(False)).order_by(Finding.created_at.desc()))).scalars().all())
    unassigned = (await session.execute(select(func.count(Document.id)).where(Document.tenant_id == tenant_id, Document.project_id.is_(None)))).scalar_one()
    last_doc = (await session.execute(select(func.max(Document.created_at)).where(Document.tenant_id == tenant_id))).scalar_one()
    last_event = (await session.execute(select(func.max(Event.created_at)).where(Event.tenant_id == tenant_id))).scalar_one()
    last = max([d for d in (last_doc, last_event) if d is not None], default=None)
    return assemble_payload(tenant_name=name, for_date=for_date, findings=findings, projects=projects, unassigned=int(unassigned or 0), last_data_received=last.isoformat() if last else None)


async def persist_digest(session: AsyncSession, tenant_id: UUID, payload: DigestPayload, delivered_via: str) -> Digest:
    row = (await session.execute(select(Digest).where(Digest.tenant_id == tenant_id, Digest.digest_date == date.fromisoformat(payload.date)))).scalar_one_or_none()
    ids = [c.id for c in payload.act + payload.watch + payload.low]
    if row is None:
        row = Digest(tenant_id=tenant_id, digest_date=date.fromisoformat(payload.date), finding_ids=ids, delivered_via=delivered_via, unassigned_count=payload.unassigned_count)
        session.add(row)
    else:
        row.finding_ids = ids
        row.unassigned_count = payload.unassigned_count
        if delivered_via != "web" or row.delivered_via == "web":
            row.delivered_via = delivered_via
    await session.flush()
    payload.digest_id = str(row.id)
    payload.delivered_via = row.delivered_via
    return row
