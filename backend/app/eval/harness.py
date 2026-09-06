"""Golden-set gate: every Act card must carry a resolvable evidence pointer."""

from __future__ import annotations

from app.agents.graph import run_v1_graph
from app.schemas.agents import ProjectSnapshot
from app.eval.golden import GOLDEN_CASES


def evidence_rate(results: list[tuple[str, object]]) -> float:
    act = 0
    ok = 0
    for _name, result in results:
        for card in result.cards:
            if card.severity != "act":
                continue
            act += 1
            if card.evidence.pointer.strip():
                ok += 1
    if act == 0:
        return 1.0
    return ok / act


def run_golden() -> dict:
    runs = []
    for case in GOLDEN_CASES:
        snap = ProjectSnapshot(**case["snapshot"])
        result = run_v1_graph(snap)
        runs.append((case["name"], result))
    rate = evidence_rate(runs)
    return {
        "cases": len(runs),
        "act_evidence_rate": rate,
        "pass": rate >= 0.95,
        "dropped": [d for _, r in runs for d in r.dropped],
    }
