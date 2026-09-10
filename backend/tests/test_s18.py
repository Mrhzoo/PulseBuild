from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.agents.cashflow import run_cashflow
from app.agents.schedule import run_schedule
from app.api.deps import Principal
from app.digest.builder import assemble_payload
from app.digest.payload import DigestPayload
from app.main import cors_origins
from app.models.orm import AgentName, Role, Severity
from app.schemas.agents import ProjectSnapshot
from app.services.findings_run import plan_upsert


def _card(title="Delay", pointer="doc#p1", agent="schedule", severity="act"):
    return SimpleNamespace(
        title=title,
        severity=severity,
        why_it_hits_us="why",
        evidence=SimpleNamespace(snippet="snip", pointer=pointer),
        confidence=0.8,
        rationale="r",
        source_agents=[agent],
    )


def _row(**kwargs):
    data = {
        "agent": AgentName.SCHEDULE,
        "evidence_pointer": "doc#p1",
        "dismissed": False,
        "title": "old",
        "why_it_hits_us": "old",
        "evidence_snippet": "old",
        "confidence": 0.4,
        "rationale": "old",
        "severity": Severity.WATCH,
    }
    data.update(kwargs)
    return SimpleNamespace(**data)


def test_cors_allows_loopback():
    origins = cors_origins()
    assert "http://localhost:3000" in origins
    assert "http://127.0.0.1:3000" in origins


def test_upsert_second_run_updates_not_creates():
    existing = [_row()]
    to_update, to_create, skipped = plan_upsert(existing, [_card(title="Programme delayed two weeks")])
    assert len(to_create) == 0
    assert len(to_update) == 1
    assert to_update[0].title == "Programme delayed two weeks"
    assert skipped == []


def test_upsert_leaves_dismissed_alone():
    existing = [_row(dismissed=True)]
    to_update, to_create, skipped = plan_upsert(existing, [_card()])
    assert to_update == []
    assert to_create == []
    assert any("left_dismissed" in s for s in skipped)


def test_digest_dedupes_same_pointer():
    pid = uuid4()
    findings = [
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, severity=Severity.ACT, title="A", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.8),
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, severity=Severity.ACT, title="B", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.7),
    ]
    payload = assemble_payload(tenant_name="Demo", for_date=__import__("datetime").date(2026, 9, 10), findings=findings, projects=[SimpleNamespace(id=pid, name="Marina")], unassigned=0)
    assert len(payload.act) == 1


def test_schedule_title_includes_window():
    findings = run_schedule(ProjectSnapshot(project_id="p1", project_name="Marina", tenant_role="sub", currency="AED", events=[], document_excerpts=[{"pointer": "doc-sched-1#page=1", "text": "The programme is delayed by two weeks due to late access."}]))
    assert findings
    assert "two weeks" in findings[0].title.lower() or "two weeks" in findings[0].why_it_hits_us.lower()


def test_cashflow_title_echoes_ipc():
    findings = run_cashflow(ProjectSnapshot(project_id="p2", project_name="WH", tenant_role="sub", currency="AED", events=[], document_excerpts=[{"pointer": "doc-ipc-2#page=1", "text": "Interim payment certificate IPC-04. Retention held at 10 percent."}]))
    assert findings
    assert "IPC-04" in findings[0].title or "IPC-04" in findings[0].why_it_hits_us


@pytest.mark.asyncio
async def test_digest_today_does_not_persist(monkeypatch):
    from app.api import digest_routes

    async def fake_build(*a, **k):
        return DigestPayload(date="2026-09-10", tenant="T", company="T", projects_scanned=0)

    called = []

    async def fake_persist(*a, **k):
        called.append(1)
        return None

    monkeypatch.setattr(digest_routes, "build_digest", fake_build)
    monkeypatch.setattr(digest_routes, "persist_digest", fake_persist)
    out = await digest_routes.digest_today(Principal(uuid4(), uuid4(), Role.OWNER), session=object())
    assert called == []
    assert out["date"] == "2026-09-10"
