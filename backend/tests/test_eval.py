from app.agents.graph import run_v1_graph
from app.eval.golden import GOLDEN_CASES
from app.eval.harness import run_golden
from app.schemas.agents import ProjectSnapshot


def test_golden_gate_passes():
    report = run_golden()
    assert report["pass"] is True
    assert report["act_evidence_rate"] >= 0.95
    assert report["empty_act_cards"] == 0
    assert "arabic_delay_letter" in {c["name"] for c in GOLDEN_CASES}


def test_empty_case_zero_act():
    case = next(c for c in GOLDEN_CASES if c["name"] == "thin_empty")
    result = run_v1_graph(ProjectSnapshot(**case["snapshot"]))
    assert not any(c.severity == "act" for c in result.cards)


def test_arabic_case_has_pointer_if_act():
    case = next(c for c in GOLDEN_CASES if c["name"] == "arabic_delay_letter")
    result = run_v1_graph(ProjectSnapshot(**case["snapshot"]))
    assert result.cards
    for card in result.cards:
        if card.severity == "act":
            assert card.evidence.pointer.strip()
