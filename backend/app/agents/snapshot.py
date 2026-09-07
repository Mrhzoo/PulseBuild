"""Build a ProjectSnapshot from tenant-scoped ORM rows."""

from __future__ import annotations

from app.models.orm import Document, Event, Project
from app.schemas.agents import ProjectSnapshot


def build_snapshot(project: Project, events: list[Event], documents: list[Document]) -> ProjectSnapshot:
    event_rows = []
    for event in events:
        payload = dict(event.payload or {})
        payload.setdefault("pointer", payload.get("pointer") or f"{event.document_id}#event")
        event_rows.append(
            {
                "type": event.type,
                "payload": payload,
                "confidence": event.confidence,
                "pointer": payload.get("pointer"),
                "text": payload.get("text") or payload.get("body") or "",
            }
        )
    excerpts = [
        {"pointer": f"{doc.id}#extract", "text": doc.extracted_text}
        for doc in documents
        if doc.extracted_text
    ]
    return ProjectSnapshot(
        project_id=str(project.id),
        project_name=project.name,
        tenant_role=project.tenant_role.value,
        currency=project.currency.value,
        events=event_rows,
        document_excerpts=excerpts,
    )
