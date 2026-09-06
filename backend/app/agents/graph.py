"""v1 agent graph. Compliance is intentionally absent."""

from __future__ import annotations

from app.schemas.agents import AgentFinding, AgentGraphResult, OrchestratorCard, ProjectSnapshot


def _heuristic_findings(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    """Deterministic first-pass used until LLM wiring lands. Never invents numbers."""
    findings: list[AgentFinding] = []
    text = " ".join(str(d.get("text", "")) for d in snapshot.document_excerpts).lower()
    if not text.strip():
        return findings

    if any(w in text for w in ("delay", "postpone", "slipped")):
        pointer = str(snapshot.document_excerpts[0].get("pointer", "doc#extract"))
        findings.append(
            AgentFinding(
                agent="schedule",
                proposed_severity="watch",
                title="Possible programme movement",
                why_it_hits_us="A delay word appeared in a project file. Confirm whether your work window moved.",
                evidence={"snippet": "delay language detected", "pointer": pointer},
                confidence=0.55,
                rationale="keyword heuristic — promote only with dates",
            )
        )
    if any(w in text for w in ("retention", "ipc", "payment certificate")):
        pointer = str(snapshot.document_excerpts[0].get("pointer", "doc#extract"))
        findings.append(
            AgentFinding(
                agent="cashflow",
                proposed_severity="watch",
                title="Payment language detected",
                why_it_hits_us="Cash language appeared. Review whether an IPC or retention event is due in 7-14 days.",
                evidence={"snippet": "payment language detected", "pointer": pointer},
                confidence=0.55,
            )
        )
    if any(w in text for w in ("variation", "change order", "revised qty")):
        pointer = str(snapshot.document_excerpts[0].get("pointer", "doc#extract"))
        findings.append(
            AgentFinding(
                agent="change_order",
                proposed_severity="watch",
                title="Possible variation",
                why_it_hits_us="Scope or quantity change language appeared. Confirm before it becomes an argument.",
                evidence={"snippet": "variation language detected", "pointer": pointer},
                confidence=0.55,
            )
        )
    return findings


def orchestrate(findings: list[AgentFinding]) -> AgentGraphResult:
    cards: list[OrchestratorCard] = []
    dropped: list[str] = []
    for f in findings:
        if not f.evidence.pointer.strip():
            dropped.append(f.title)
            continue
        severity = f.proposed_severity
        if severity == "act" and f.confidence < 0.75:
            severity = "watch"
        cards.append(
            OrchestratorCard(
                severity=severity,
                title=f.title,
                why_it_hits_us=f.why_it_hits_us,
                evidence=f.evidence,
                confidence=f.confidence,
                source_agents=[f.agent],
                rationale=f.rationale,
            )
        )
    act = [c for c in cards if c.severity == "act"][:5]
    rest = [c for c in cards if c.severity != "act"]
    return AgentGraphResult(cards=act + rest, dropped=dropped)


def run_v1_graph(snapshot: ProjectSnapshot) -> AgentGraphResult:
    if not snapshot.document_excerpts and not snapshot.events:
        return AgentGraphResult(cards=[], dropped=["empty_project_no_fake_risks"])
    return orchestrate(_heuristic_findings(snapshot))
