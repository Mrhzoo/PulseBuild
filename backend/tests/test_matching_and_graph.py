import pytest

from app.agents.graph import run_v1_graph
from app.eval.harness import run_golden
from app.schemas.agents import OrchestratorCard, ProjectSnapshot


def test_empty_project_creates_no_fake_risks():
    result = run_v1_graph(
        ProjectSnapshot(
            project_id="x",
            project_name="Empty",
            tenant_role="sub",
            currency="AED",
        )
    )
    assert result.cards == []
    assert "empty_project_no_fake_risks" in result.dropped


def test_act_schema_rejects_missing_pointer():
    with pytest.raises(Exception):
        OrchestratorCard(
            severity="act",
            title="Invented",
            why_it_hits_us="no",
            evidence={"snippet": "none", "pointer": "  "},
            confidence=0.9,
            source_agents=["cashflow"],
        )


def test_golden_evidence_gate():
    report = run_golden()
    assert report["pass"] is True
    assert report["act_evidence_rate"] >= 0.95
