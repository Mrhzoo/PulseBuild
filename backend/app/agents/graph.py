"""v1 agent graph. Compliance is intentionally absent. Heuristics are the default."""

from __future__ import annotations

from app.agents.cashflow import run_cashflow
from app.agents.change_order import run_change_order
from app.agents.orchestrator import orchestrate
from app.agents.schedule import run_schedule
from app.schemas.agents import AgentGraphResult, ProjectSnapshot


def _live_llm_enabled() -> bool:
    try:
        from app.config import settings

        return bool(getattr(settings, "enable_live_llm", False)) and bool(
            getattr(settings, "openai_api_key", "") or getattr(settings, "anthropic_api_key", "")
        )
    except Exception:
        return False


def run_specialists(snapshot: ProjectSnapshot):
    _ = _live_llm_enabled()
    return [
        *run_schedule(snapshot),
        *run_cashflow(snapshot),
        *run_change_order(snapshot),
    ]


def run_v1_graph(snapshot: ProjectSnapshot) -> AgentGraphResult:
    if not snapshot.document_excerpts and not snapshot.events:
        return AgentGraphResult(cards=[], dropped=["empty_project_no_fake_risks"])
    findings = run_specialists(snapshot)
    if not findings:
        return AgentGraphResult(cards=[], dropped=["no_heuristic_signal"])
    return orchestrate(findings)
