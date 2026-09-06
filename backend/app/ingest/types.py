from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


EVENT_TYPES = frozenset(
    {
        "doc.ingested",
        "schedule.row",
        "boq.row",
        "email.message",
        "chat.message",
        "parse.partial",
        "parse.failed",
    }
)


@dataclass
class ExtractedEvent:
    type: str
    payload: dict[str, Any]
    confidence: float
    pointer: str


@dataclass
class ParseResult:
    extracted_text: str
    parse_status: str
    language: str
    events: list[ExtractedEvent] = field(default_factory=list)


def detect_language(text: str) -> str:
    if not text.strip():
        return "unknown"
    arabic = sum(1 for ch in text if "\u0600" <= ch <= "\u06FF")
    latin = sum(1 for ch in text if ("A" <= ch <= "Z") or ("a" <= ch <= "z"))
    if arabic and latin:
        return "mixed"
    if arabic:
        return "ar"
    return "en"
