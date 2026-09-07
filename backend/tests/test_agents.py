from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.agents.cashflow import run_cashflow
from app.agents.change_order import run_change_order
from app.agents.graph import run_v1_graph
from app.agents.orchestrator import orchestrate
from app.agents.schedule import run_schedule
from app.api.deps import Principal, require_write
from app.eval.harness import run_golden
from app.models.orm import Role
from app.schemas.agents import AgentFinding, OrchestratorCard, ProjectSnapshot
from app.services.tenancy import require_project_for_tenant


def _snap(**kwargs) -> ProjectSnapshot:
    base = {"project_id": "p1", "project_name": "Marina Fitout", "tenant_role": "sub", "currency": "AED"}
    base.update(kwargs)
    return ProjectSnapshot(**base)


def test_empty_snapshot_no_fake_risks():
    result = run_v1_graph(_snap())
    assert result.cards == []
    assert "empty_project_no_fake_risks" in result.dropped


def test_schedule_delay_has_pointer():
    result = run_v1_graph(
        _snap(events=[{"type": "chat.message", "payload": {"text": "Site delay confirmed — two weeks slip", "pointer": "doc-delay#msg:2"}}])
    )
    cards = [c for c in result.cards if "schedule" in c.source_agents]
    assert cards
    assert cards[0].evidence.pointer == "doc-delay#msg:2"


def test_cashflow_echoes_no_invented_amount():
    findings = run_cashflow(
        _snap(events=[{"type": "doc.ingested", "payload": {"text": "IPC-04 certified. Retention held.", "pointer": "doc-ipc#p1"}}])
    )
    assert findings[0].evidence.pointer == "doc-ipc#p1"
    assert findings[0].amount is None


def test_change_order_watch_on_variation():
    findings = run_change_order(
        _snap(events=[{"type": "email.message", "payload": {"text": "Please note quantity increase on facade panels.", "pointer": "doc-vo#msg:1"}}])
    )
    assert findings[0].proposed_severity == "watch"
    assert findings[0].evidence.pointer == "doc-vo#msg:1"


def test_act_without_pointer_rejected():
    with pytest.raises(Exception):
        OrchestratorCard(severity="act", title="Invented", why_it_hits_us="no", evidence={"snippet": "none", "pointer": "  "}, confidence=0.9, source_agents=["cashflow"])


def test_orchestrator_drops_missing_pointer():
    result = orchestrate([AgentFinding(agent="schedule", proposed_severity="watch", title="No pointer", why_it_hits_us="x", evidence={"snippet": "delay", "pointer": ""}, confidence=0.9)])
    assert result.cards == []
    assert result.dropped


def test_golden_evidence_gate():
    report = run_golden()
    assert report["pass"] is True
    assert report["act_evidence_rate"] >= 0.95


def test_reader_cannot_run():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_run_is_404():
    foreign = type("P", (), {"id": uuid4(), "tenant_id": uuid4()})()

    class _Sess:
        async def get(self, _model, _id):
            return foreign

    with pytest.raises(HTTPException) as exc:
        await require_project_for_tenant(_Sess(), uuid4(), foreign.id)
    assert exc.value.status_code == 404


def test_schedule_specialist_direct():
    findings = run_schedule(_snap(document_excerpts=[{"pointer": "doc-s#p1", "text": "Works postponed until next week."}]))
    assert findings[0].evidence.pointer == "doc-s#p1"
