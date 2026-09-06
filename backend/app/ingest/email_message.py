"""Parse .eml bytes or a stub dict. Body + attachment names only."""

from __future__ import annotations

import email
from email import policy

from app.ingest.types import ExtractedEvent, ParseResult, detect_language


def parse_eml(data: bytes, document_id: str) -> ParseResult:
    try:
        msg = email.message_from_bytes(data, policy=policy.default)
    except Exception:
        return ParseResult(
            "",
            "needs_better_file",
            "unknown",
            [
                ExtractedEvent(
                    type="parse.failed",
                    payload={"reason": "unreadable_eml", "pointer": f"{document_id}#file"},
                    confidence=0.2,
                    pointer=f"{document_id}#file",
                )
            ],
        )
    subject = str(msg.get("subject") or "")
    from_addr = str(msg.get("from") or "")
    to_addr = str(msg.get("to") or "")
    body_parts: list[str] = []
    attachments: list[str] = []
    if msg.is_multipart():
        for part in msg.walk():
            disp = str(part.get_content_disposition() or "")
            name = part.get_filename()
            if name:
                attachments.append(name)
            if part.get_content_type() == "text/plain" and disp != "attachment":
                payload = part.get_payload(decode=True) or b""
                body_parts.append(payload.decode(part.get_content_charset() or "utf-8", errors="replace"))
    else:
        payload = msg.get_payload(decode=True) or b""
        body_parts.append(payload.decode(msg.get_content_charset() or "utf-8", errors="replace"))
    body = "\n".join(body_parts).strip()
    text = f"Subject: {subject}\nFrom: {from_addr}\nTo: {to_addr}\n\n{body}"
    pointer = f"{document_id}#msg:1"
    event = ExtractedEvent(
        type="email.message",
        payload={
            "subject": subject,
            "from": from_addr,
            "to": to_addr,
            "body": body[:4000],
            "attachments": attachments,
            "pointer": pointer,
        },
        confidence=0.9,
        pointer=pointer,
    )
    return ParseResult(text[:20_000], "extracted", detect_language(text), [event])


def parse_stub(
    *,
    document_id: str,
    subject: str = "",
    from_addr: str = "",
    to_addr: str = "",
    text_body: str = "",
    attachments: list[str] | None = None,
) -> ParseResult:
    body = text_body or ""
    text = f"Subject: {subject}\nFrom: {from_addr}\nTo: {to_addr}\n\n{body}"
    pointer = f"{document_id}#msg:1"
    return ParseResult(
        text[:20_000],
        "extracted" if (subject or body) else "needs_better_file",
        detect_language(text),
        [
            ExtractedEvent(
                type="email.message",
                payload={
                    "subject": subject,
                    "from": from_addr,
                    "to": to_addr,
                    "body": body[:4000],
                    "attachments": attachments or [],
                    "pointer": pointer,
                },
                confidence=0.88,
                pointer=pointer,
            )
        ],
    )
