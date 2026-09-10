from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.digest.builder import assemble_payload
from app.models.orm import AgentName, Role, Severity
from app.services.findings_run import maybe_auto_run


def test_digest_same_pointer_different_agents_both_keep():
    pid = uuid4()
    findings = [
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, agent=AgentName.SCHEDULE, severity=Severity.ACT, title="Delay Act", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.8),
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, agent=AgentName.CASHFLOW, severity=Severity.WATCH, title="IPC Watch", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.6),
    ]
    payload = assemble_payload(tenant_name="Demo", for_date=date(2026, 9, 10), findings=findings, projects=[SimpleNamespace(id=pid, name="Marina")], unassigned=0)
    assert len(payload.act) == 1
    assert len(payload.watch) == 1
    assert payload.act[0].title == "Delay Act"
    assert payload.watch[0].title == "IPC Watch"


def test_digest_same_agent_same_pointer_still_dedupes():
    pid = uuid4()
    findings = [
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, agent=AgentName.SCHEDULE, severity=Severity.ACT, title="A", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.8),
        SimpleNamespace(id=uuid4(), project_id=pid, dismissed=False, agent=AgentName.SCHEDULE, severity=Severity.WATCH, title="B", why_it_hits_us="w", evidence_snippet="s", evidence_pointer="doc#p1", confidence=0.5),
    ]
    payload = assemble_payload(tenant_name="Demo", for_date=date(2026, 9, 10), findings=findings, projects=[SimpleNamespace(id=pid, name="Marina")], unassigned=0)
    assert len(payload.act) == 1
    assert payload.watch == []


def test_reader_cannot_upload():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_auto_run_skips_unassigned(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "auto_run_agents_on_upload", True)
    called = []

    async def boom(*a, **k):
        called.append(1)
        return {"created": []}

    monkeypatch.setattr("app.services.findings_run.run_project_agents", boom)
    out = await maybe_auto_run(object(), uuid4(), None, "extracted")
    assert out is None
    assert called == []


@pytest.mark.asyncio
async def test_auto_run_respects_flag_off(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "auto_run_agents_on_upload", False)
    out = await maybe_auto_run(object(), uuid4(), uuid4(), "extracted")
    assert out is None
