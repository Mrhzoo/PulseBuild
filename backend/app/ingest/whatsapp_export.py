"""WhatsApp chat export. Keep timestamps + senders. Drop stickers/media noise."""

from __future__ import annotations

import re

from app.ingest.types import ExtractedEvent, ParseResult, detect_language

LINE_RE = re.compile(
    r"^(?:\[)?(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)"
    r"(?:\])?\s*-\s*([^:]+):\s*(.*)$"
)
NOISE = re.compile(
    r"(omitted|sticker|image|video|audio|gif|document omitted|<media omitted)|هذا الرسالة تم حذفها",
    re.I,
)


def parse_whatsapp(data: bytes, document_id: str) -> ParseResult:
    text = data.decode("utf-8", errors="replace")
    events: list[ExtractedEvent] = []
    kept: list[str] = []
    msg_n = 0
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        match = LINE_RE.match(line)
        if not match:
            continue
        date_s, time_s, sender, body = match.groups()
        body = body.strip()
        if not body or NOISE.search(body):
            continue
        if body.lower() in {"this message was deleted", "you deleted this message"}:
            continue
        msg_n += 1
        pointer = f"{document_id}#msg:{msg_n}"
        kept.append(line)
        events.append(
            ExtractedEvent(
                type="chat.message",
                payload={
                    "date": date_s,
                    "time": time_s,
                    "sender": sender.strip(),
                    "text": body[:2000],
                    "pointer": pointer,
                },
                confidence=0.8,
                pointer=pointer,
            )
        )
    if not events:
        return ParseResult(
            text[:2000],
            "needs_better_file",
            detect_language(text),
            [
                ExtractedEvent(
                    type="parse.partial",
                    payload={"reason": "no_chat_lines", "pointer": f"{document_id}#file"},
                    confidence=0.3,
                    pointer=f"{document_id}#file",
                )
            ],
        )
    return ParseResult("\n".join(kept)[:20_000], "extracted", detect_language("\n".join(kept)), events)
