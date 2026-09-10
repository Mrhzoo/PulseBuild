"""Text-layer PDF extract. OCR only if ENABLE_OCR and the hook returns text."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader

from app.ingest.ocr import run_ocr
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
        ocr_text = (run_ocr(data) or "").strip()
        if ocr_text:
            pointer = f"{document_id}#ocr"
            return ParseResult(
                extracted_text=ocr_text[:20_000],
                parse_status="extracted",
                language=detect_language(ocr_text),
                events=[
                    ExtractedEvent(
                        type="doc.ingested",
                        payload={"text": ocr_text[:4000], "pointer": pointer, "via": "ocr"},
                        confidence=0.55,
                        pointer=pointer,
                    )
                ],
            )
        return ParseResult(
            extracted_text="",
            parse_status="needs_ocr",
            language="unknown",
            events=[
                ExtractedEvent(
                    type="parse.failed",
                    payload={
                        "reason": "no_text_layer",
                        "hint": "Upload a text PDF or open an assisted-ops ticket.",
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
