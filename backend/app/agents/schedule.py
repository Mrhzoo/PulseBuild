from __future__ import annotations

from app.agents.signals import collect_signals, first_match, has_date_window
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = ("delay", "delayed", "slip", "slipped", "postpone", "postponed", "reschedule", "rescheduled", "float", "تأخير", "تاجيل", "تأجيل")


def run_schedule(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    strong = has_date_window(hit.text)
    return [
        AgentFinding(
            agent="schedule",
            proposed_severity="act" if strong else "watch",
            title="Programme movement on this project",
            why_it_hits_us=(
                "A delay or slip is named in a project file. Check whether your crew window moved."
                if strong
                else "Delay language appeared. Confirm whether your work window moved."
            ),
            evidence={"snippet": hit.text[:280], "pointer": hit.pointer},
            confidence=0.78 if strong else 0.55,
            rationale="schedule heuristic — Act only when a date window is also present",
        )
    ]
