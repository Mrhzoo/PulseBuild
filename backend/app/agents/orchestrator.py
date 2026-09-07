"""Merge specialist findings. Never invent facts they did not supply."""

from __future__ import annotations

from app.schemas.agents import AgentFinding, AgentGraphResult, OrchestratorCard


def orchestrate(findings: list[AgentFinding]) -> AgentGraphResult:
    cards: list[OrchestratorCard] = []
    dropped: list[str] = []
    seen: set[tuple[str, str]] = set()
    for finding in findings:
        pointer = finding.evidence.pointer.strip()
        if not pointer:
            dropped.append(f"{finding.title}:missing_pointer")
            continue
        severity = finding.proposed_severity
        if severity == "act" and finding.confidence < 0.75:
            severity = "watch"
        key = (finding.agent, pointer)
        if key in seen:
            dropped.append(f"{finding.title}:duplicate")
            continue
        seen.add(key)
        cards.append(
            OrchestratorCard(
                severity=severity,
                title=finding.title,
                why_it_hits_us=finding.why_it_hits_us,
                evidence=finding.evidence,
                confidence=finding.confidence,
                source_agents=[finding.agent],
                rationale=finding.rationale,
            )
        )
    act = [card for card in cards if card.severity == "act"][:5]
    rest = [card for card in cards if card.severity != "act"]
    return AgentGraphResult(cards=act + rest, dropped=dropped)
