from __future__ import annotations

from pydantic import BaseModel, Field


class DigestCard(BaseModel):
    id: str
    project_id: str
    project_name: str
    severity: str
    title: str
    why_it_hits_us: str
    evidence_snippet: str
    evidence_pointer: str
    confidence: float


class DigestPayload(BaseModel):
    date: str
    tenant: str
    company: str
    projects_scanned: int
    last_data_received: str | None = None
    channel_promise: str = "Morning briefing by email."
    act: list[DigestCard] = Field(default_factory=list)
    watch: list[DigestCard] = Field(default_factory=list)
    low: list[DigestCard] = Field(default_factory=list)
    quiet_projects: list[str] = Field(default_factory=list)
    unassigned_count: int = 0
    ask: str | None = None
    digest_id: str | None = None
    delivered_via: str = "web"


def subject_line(payload: DigestPayload) -> str:
    if payload.act:
        return f"PulseBuild · {payload.date} · {len(payload.act)} Act items"
    return f"PulseBuild · {payload.date} · Quiet morning"


def coaching_ask(unassigned: int, project_names: list[str], has_material: bool) -> str | None:
    if unassigned:
        return f"{unassigned} files need a project"
    if project_names and not has_material:
        return f"Upload last IPC or programme for {project_names[0]}"
    return None
