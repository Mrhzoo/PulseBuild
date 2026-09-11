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
    agent: str = ""


class DigestPayload(BaseModel):
    date: str
    tenant: str
    company: str
    projects_scanned: int
    last_data_received: str | None = None
    channel_promise: str = "Briefing by email at the time you set."
    act: list[DigestCard] = Field(default_factory=list)
    watch: list[DigestCard] = Field(default_factory=list)
    low: list[DigestCard] = Field(default_factory=list)
    quiet_projects: list[str] = Field(default_factory=list)
    unassigned_count: int = 0
    ask: str | None = None
    digest_id: str | None = None
    delivered_via: str = "web"
    locale: str = "en"
    cues: list[str] = Field(default_factory=list)


def _has_arabic(*parts: str) -> bool:
    return any(any("\u0600" <= ch <= "\u06FF" for ch in part) for part in parts if part)


def resolve_locale(payload: DigestPayload, preferred: str | None = None) -> str:
    if preferred in {"ar", "en"}:
        payload.locale = preferred
        return preferred
    if payload.locale in {"ar", "en"} and payload.locale == "ar":
        return "ar"
    blob = [payload.ask or "", payload.company, payload.channel_promise]
    blob.extend(c.title for c in payload.act + payload.watch)
    if _has_arabic(*blob):
        payload.locale = "ar"
        return "ar"
    payload.locale = payload.locale if payload.locale in {"ar", "en"} else "en"
    return payload.locale


def subject_line(payload: DigestPayload) -> str:
    locale = resolve_locale(payload)
    if locale == "ar":
        if payload.act:
            return f"PulseBuild · {payload.date} · {len(payload.act)} بنود إجراء"
        return f"PulseBuild · {payload.date} · صباح هادئ"
    if payload.act:
        return f"PulseBuild · {payload.date} · {len(payload.act)} Act items"
    return f"PulseBuild · {payload.date} · Quiet morning"


def coaching_ask(unassigned: int, project_names: list[str], has_material: bool) -> str | None:
    if unassigned:
        noun = "file" if unassigned == 1 else "files"
        return f"{unassigned} {noun} need a project — assign them so tomorrow’s briefing can score them."
    if project_names and not has_material:
        return f"Quiet on {project_names[0]}. Upload the latest programme, last IPC, or a variation email so we have something real to read."
    return None
