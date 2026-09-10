from __future__ import annotations

from app.agents.signals import collect_signals, first_match
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = (
    "variation", "change order", "change-order", " vo ", "qty increase",
    "quantity increase", "revised qty", "drawing rev", "drawing revision",
    "أمر تغيير", "تغيير نطاق", "زيادة كمية",
)
STRONG = ("please proceed", "approved variation", "change order approved", "proceed with a variation")


def run_change_order(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    strong = any(phrase in hit.blob for phrase in STRONG)
    qty = "qty" in hit.blob or "quantity" in hit.blob or "كمية" in hit.text
    title = "Possible variation with quantity change" if qty else "Possible variation"
    return [
        AgentFinding(
            agent="change_order",
            proposed_severity="watch",
            title=title,
            why_it_hits_us=(
                "A variation instruction is named. Confirm scope and quantity before it becomes an argument."
                if strong
                else "Scope or quantity change language appeared. Treat as possible until confirmed."
            ),
            evidence={"snippet": hit.text[:280], "pointer": hit.pointer},
            confidence=0.7 if strong else 0.55,
            rationale="change-order heuristic — stays Watch until the instruction is explicit",
        )
    ]
