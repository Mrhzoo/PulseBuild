from __future__ import annotations

from app.agents.signals import collect_signals, first_match
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = (
    "variation", "change order", "change-order", " vo ", "qty increase",
    "quantity increase", "revised qty", "drawing rev", "drawing revision",
    "أمر تغيير", "تغيير نطاق", "زيادة كمية",
)
STRONG = ("please proceed", "approved variation", "change order approved", "proceed with a variation", "signed variation", "vo approved")


def run_change_order(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    strong = any(phrase in hit.blob for phrase in STRONG)
    pointer = (hit.pointer or "").strip()
    qty = "qty" in hit.blob or "quantity" in hit.blob or "كمية" in hit.text
    act = strong and bool(pointer)
    title = "Signed variation — confirm qty" if act and qty else ("Signed variation instruction" if act else ("Possible variation with quantity change" if qty else "Possible variation"))
    why = (
        "A signed/approved variation is named with a file pointer. Confirm scope and quantity before it becomes an argument."
        if act
        else (
            "A variation instruction is named. Confirm scope and quantity before it becomes an argument."
            if strong
            else "Scope or quantity change language appeared. Treat as possible until confirmed."
        )
    )
    return [
        AgentFinding(
            agent="change_order",
            proposed_severity="act" if act else "watch",
            title=title,
            why_it_hits_us=why,
            evidence={"snippet": hit.text[:280], "pointer": pointer},
            confidence=0.78 if act else (0.7 if strong else 0.55),
            rationale="change-order heuristic — Act only with approval phrase + pointer",
        )
    ]
