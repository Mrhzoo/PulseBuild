"""Certificates / approvals / ICV–Nitaqat notes. Never invent missing docs."""

from __future__ import annotations

from app.agents.signals import collect_signals, first_match, has_date_window
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = (
    "certificate", "certification", "insurance", "expiry", "expires", "expired",
    "trade licence", "trade license", "approval", "permit", "icv", "nitaqat",
    "تأمين", "رخصة", "شهادة",
)
STRONG = ("expires", "expired", "expiry", "due", "تنتهي")


def run_compliance(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    pointer = hit.pointer.strip()
    if not pointer:
        return []
    dated = has_date_window(hit.text)
    strong = dated and any(word in hit.blob for word in STRONG)
    return [
        AgentFinding(
            agent="compliance",
            proposed_severity="act" if strong else "watch",
            title="Certificate or approval date in a project file",
            why_it_hits_us=(
                "A certificate, licence, or insurance date is named. Check whether it still covers this crew window."
                if strong
                else "Certificate or approval language appeared. Confirm what is actually on file — we do not invent missing papers."
            ),
            evidence={"snippet": hit.text[:280], "pointer": pointer},
            confidence=0.78 if strong else 0.55,
            rationale="compliance heuristic — Act only with pointer + date window",
        )
    ]
