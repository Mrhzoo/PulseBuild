"""Text-layer PDF extract. OCR is a status flag only — no OCR engine in S1."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader

from app.ingest.types import ExtractedEvent, ParseResult, detect_language


def parse_pdf(data: bytes, document_id: str) -> ParseResult:
    try:
        reader = PdfReader(BytesIO(data))
    except Exception:
        return ParseResult(
            extracted_text="",
            parse_status="needs_better_file",
            language="unknown",
            events=[
                ExtractedEvent(
                    type="parse.failed",
                    payload={"reason": "unreadable_pdf", "pointer": f"{document_id}#file"},
                    confidence=0.2,
                    pointer=f"{document_id}#file",
                )
            ],
        )

    pages: list[str] = []
    events: list[ExtractedEvent] = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        text = text.replace("\x00", "")
        pages.append(text)
        if text.strip():
            events.append(
                ExtractedEvent(
                    type="doc.ingested",
                    payload={"page": i, "text": text[:4000], "pointer": f"{document_id}#p{i}"},
                    confidence=0.85,
                    pointer=f"{document_id}#p{i}",
                )
            )

    joined = "\n".join(pages).strip()
    if not joined:
        return ParseResult(
            extracted_text="",
            parse_status="needs_ocr",
            language="unknown",
            events=[
                ExtractedEvent(
                    type="parse.failed",
                    payload={
                        "reason": "no_text_layer",
                        "hint": "Upload a text PDF or a photo of the table.",
                        "pointer": f"{document_id}#file",
                    },
                    confidence=0.3,
                    pointer=f"{document_id}#file",
                )
            ],
        )
    if len(joined) < 40:
        return ParseResult(
            extracted_text=joined,
            parse_status="needs_better_file",
            language=detect_language(joined),
            events=events
            or [
                ExtractedEvent(
                    type="parse.partial",
                    payload={"text": joined, "pointer": f"{document_id}#p1"},
                    confidence=0.4,
                    pointer=f"{document_id}#p1",
                )
            ],
        )
    return ParseResult(
        extracted_text=joined[:20_000],
        parse_status="extracted",
        language=detect_language(joined),
        events=events,
    )
