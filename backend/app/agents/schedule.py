from __future__ import annotations

from app.agents.signals import collect_signals, echoed_activity, echoed_date_window, first_match, has_date_window
from app.schemas.agents import AgentFinding, ProjectSnapshot

KEYWORDS = ("delay", "delayed", "slip", "slipped", "postpone", "postponed", "reschedule", "rescheduled", "float", "تأخير", "تاجيل", "تأجيل")


def run_schedule(snapshot: ProjectSnapshot) -> list[AgentFinding]:
    hit = first_match(collect_signals(snapshot), KEYWORDS)
    if not hit:
        return []
    strong = has_date_window(hit.text)
    window = echoed_date_window(hit.text)
    activity = echoed_activity(hit.text)
    if activity and window:
        title = f"Programme slip on {activity} ({window})"
    elif window:
        title = f"Programme delayed {window}"
    elif activity:
        title = f"Programme movement on {activity}"
    else:
        title = "Programme movement on this project"
    if activity and window:
        why = f"{activity} is named with a {window} movement in a project file. Check whether your crew window moved."
    elif strong:
        why = f"A delay of {window or 'a dated window'} is named in a project file. Check whether your crew window moved."
    else:
        why = "Delay language appeared. Confirm whether your work window moved."
    return [
        AgentFinding(
            agent="schedule",
            proposed_severity="act" if strong else "watch",
            title=title,
            why_it_hits_us=why,
            evidence={"snippet": hit.text[:280], "pointer": hit.pointer},
            confidence=0.78 if strong else 0.55,
            rationale="schedule heuristic — Act only when a date window is also present",
        )
    ]
