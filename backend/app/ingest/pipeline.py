"""Run the right parser and persist Event rows. Never invent amounts."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingest.email_message import parse_eml
from app.ingest.excel_boq import parse_excel
from app.ingest.pdf_text import parse_pdf
from app.ingest.types import ParseResult
from app.ingest.whatsapp_export import parse_whatsapp
from app.models.orm import Document, Event
from app.services.crypto_store import decrypt_bytes, read_encrypted


def sniff_parser(filename: str, source_type: str) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf") or source_type == "pdf":
        return "pdf"
    if name.endswith((".xlsx", ".xls", ".csv")) or source_type in {"excel", "csv"}:
        return "excel"
    if name.endswith(".eml") or source_type == "email":
        return "email"
    if name.endswith(".txt") and ("whatsapp" in name or "chat" in name):
        return "whatsapp"
    if source_type == "whatsapp":
        return "whatsapp"
    return "text"


def parse_bytes(data: bytes, filename: str, document_id: str, source_type: str = "upload") -> ParseResult:
    kind = sniff_parser(filename, source_type)
    if kind == "pdf":
        return parse_pdf(data, document_id)
    if kind == "excel":
        return parse_excel(data, document_id, filename)
    if kind == "email":
        return parse_eml(data, document_id)
    if kind == "whatsapp":
        return parse_whatsapp(data, document_id)
    text = data.decode("utf-8", errors="replace")[:20_000]
    from app.ingest.types import ExtractedEvent, detect_language

    if not text.strip():
        return ParseResult("", "needs_better_file", "unknown", [])
    if " - " in text[:400] and any(ch.isdigit() for ch in text[:80]):
        wa = parse_whatsapp(data, document_id)
        if any(e.type == "chat.message" for e in wa.events):
            return wa
    pointer = f"{document_id}#extract"
    return ParseResult(
        text,
        "extracted",
        detect_language(text),
        [
            ExtractedEvent(
                type="doc.ingested",
                payload={"text": text[:4000], "pointer": pointer},
                confidence=0.7,
                pointer=pointer,
            )
        ],
    )


async def ingest_document(session: AsyncSession, tenant_id: UUID, document_id: UUID) -> list[Event]:
    doc = await session.get(Document, document_id)
    if doc is None or doc.tenant_id != tenant_id:
        return []

    try:
        blob = read_encrypted(doc.storage_key)
        data = decrypt_bytes(blob)
    except Exception:
        data = (doc.extracted_text or "").encode("utf-8")

    result = parse_bytes(data, doc.filename, str(doc.id), doc.source_type)
    doc.extracted_text = result.extracted_text
    doc.parse_status = result.parse_status
    doc.language = result.language

    await session.execute(delete(Event).where(Event.document_id == doc.id, Event.tenant_id == tenant_id))

    written: list[Event] = []
    for item in result.events:
        payload = dict(item.payload)
        payload.setdefault("pointer", item.pointer)
        event = Event(
            tenant_id=tenant_id,
            project_id=doc.project_id,
            document_id=doc.id,
            type=item.type,
            payload=payload,
            confidence=max(0.0, min(1.0, item.confidence)),
        )
        session.add(event)
        written.append(event)
    await session.flush()
    return written
