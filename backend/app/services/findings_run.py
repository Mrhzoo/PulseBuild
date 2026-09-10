"""Persist agent cards with upsert so daily runs do not duplicate open findings."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import run_v1_graph
from app.agents.snapshot import build_snapshot
from app.config import settings
from app.models.orm import AgentName, Document, Event, Finding, Project, Severity
from app.schemas.agents import AgentGraphResult

AGENT_MAP = {
    "schedule": AgentName.SCHEDULE,
    "cashflow": AgentName.CASHFLOW,
    "change_order": AgentName.CHANGE_ORDER,
    "compliance": AgentName.COMPLIANCE,
}

SKIP_PARSE = {"needs_better_file", "failed", "pending"}


def finding_key(agent: str, pointer: str) -> tuple[str, str]:
    return (agent, (pointer or "").strip())


def apply_card_to_finding(row: Finding, card, agent: AgentName) -> None:
    row.agent = agent
    row.severity = Severity(card.severity)
    row.title = card.title
    row.why_it_hits_us = card.why_it_hits_us
    row.evidence_snippet = card.evidence.snippet
    row.evidence_pointer = card.evidence.pointer
    row.confidence = card.confidence
    row.rationale = card.rationale


def plan_upsert(existing: list[Finding], cards) -> tuple[list[Finding], list, list[str]]:
    """Return (rows_to_update, cards_to_create, skipped). Dismissed keys are not recreated."""
    open_by_key: dict[tuple[str, str], Finding] = {}
    dismissed_keys: set[tuple[str, str]] = set()
    for row in existing:
        key = finding_key(row.agent.value, row.evidence_pointer)
        if row.dismissed:
            dismissed_keys.add(key)
        elif key not in open_by_key:
            open_by_key[key] = row
    to_update: list[Finding] = []
    to_create = []
    skipped: list[str] = []
    seen: set[tuple[str, str]] = set()
    for card in cards:
        if card.severity == "act" and not card.evidence.pointer.strip():
            skipped.append(f"{card.title}:act_without_pointer")
            continue
        source = card.source_agents[0] if card.source_agents else "orchestrator"
        agent = AGENT_MAP.get(source, AgentName.ORCHESTRATOR)
        key = finding_key(agent.value, card.evidence.pointer)
        if key in seen:
            skipped.append(f"{card.title}:duplicate_in_batch")
            continue
        seen.add(key)
        if key in dismissed_keys:
            skipped.append(f"{card.title}:left_dismissed")
            continue
        row = open_by_key.get(key)
        if row:
            apply_card_to_finding(row, card, agent)
            to_update.append(row)
        else:
            to_create.append((card, agent))
    return to_update, to_create, skipped


async def persist_graph_result(session: AsyncSession, tenant_id: UUID, project_id: UUID, result: AgentGraphResult) -> dict:
    existing = list(
        (await session.execute(select(Finding).where(Finding.tenant_id == tenant_id, Finding.project_id == project_id))).scalars().all()
    )
    to_update, to_create, skipped = plan_upsert(existing, result.cards)
    skipped = list(result.dropped) + skipped
    created: list[str] = []
    updated: list[str] = []
    for row in to_update:
        updated.append(row.title)
    for card, agent in to_create:
        session.add(
            Finding(
                tenant_id=tenant_id,
                project_id=project_id,
                agent=agent,
                severity=Severity(card.severity),
                title=card.title,
                why_it_hits_us=card.why_it_hits_us,
                evidence_snippet=card.evidence.snippet,
                evidence_pointer=card.evidence.pointer,
                confidence=card.confidence,
                rationale=card.rationale,
            )
        )
        created.append(card.title)
    return {"created": created, "updated": updated, "dropped": skipped}


async def run_project_agents(session: AsyncSession, tenant_id: UUID, project: Project) -> dict:
    docs = list((await session.execute(select(Document).where(Document.tenant_id == tenant_id, Document.project_id == project.id))).scalars().all())
    events = list((await session.execute(select(Event).where(Event.tenant_id == tenant_id, Event.project_id == project.id))).scalars().all())
    result = run_v1_graph(build_snapshot(project, events, docs))
    return await persist_graph_result(session, tenant_id, project.id, result)


async def maybe_auto_run(session: AsyncSession, tenant_id: UUID, project_id: UUID | None, parse_status: str | None = None) -> dict | None:
    if not settings.auto_run_agents_on_upload:
        return None
    if project_id is None:
        return None
    if (parse_status or "") in SKIP_PARSE:
        return None
    project = await session.get(Project, project_id)
    if not project or project.tenant_id != tenant_id:
        return None
    return await run_project_agents(session, tenant_id, project)
