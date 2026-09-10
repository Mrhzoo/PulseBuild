from __future__ import annotations

from dataclasses import dataclass, field


def detect_language(text: str) -> str:
    arabic = sum(1 for ch in text if "\u0600" <= ch <= "\u06FF")
    latin = sum(1 for ch in text if ch.isascii() and ch.isalpha())
    if arabic and latin:
        return "mixed"
    if arabic:
        return "ar"
    if latin:
        return "en"
    return "unknown"


def parse_coach(status: str) -> str:
    if status == "needs_ocr":
        return "No text layer. Upload a selectable PDF or open an assisted-ops ticket — we do not invent text."
    if status == "needs_better_file":
        return "File could not be read well enough. Try a clearer PDF or spreadsheet."
    if status == "pending":
        return "Not parsed yet."
    return ""


@dataclass
class ExtractedEvent:
    type: str
    payload: dict
    confidence: float
    pointer: str


@dataclass
class ParseResult:
    extracted_text: str
    parse_status: str
    language: str
    events: list[ExtractedEvent] = field(default_factory=list)
