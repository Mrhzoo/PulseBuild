from __future__ import annotations

from app.agents.signals import collect_signals, echoed_amount, first_match
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = ("ipc", "retention", "payment", "certified", "overdue", "certificate", "احتجاز", "مستخلص", "دفعة")
STRONG = ("retention", "ipc", "certified", "overdue", "احتجاز", "مستخلص")


def run_cashflow(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    strong = any(word in hit.blob for word in STRONG)
    amount = echoed_amount(hit.text)
    why = "Cash language appeared. Review whether an IPC or retention event hits in 7–14 days."
    if amount:
        why = f"Payment language names {amount} already in the file. Do not treat this as a calculated figure."
    return [
        AgentFinding(
            agent="cashflow",
            proposed_severity="act" if strong else "watch",
            title="Payment or retention signal",
            why_it_hits_us=why,
            evidence={"snippet": hit.text[:280], "pointer": hit.pointer},
            confidence=0.76 if strong else 0.52,
            rationale="cashflow heuristic — amounts only echoed from source text",
        )
    ]
