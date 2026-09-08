"""Shared event/excerpt scan. Never invents amounts or dates."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.schemas.agents import ProjectSnapshot

DATEISH = re.compile(
    r"(\b\d{1,2}\s*(day|days|week|weeks|شهر|يوم|أسبوع)\b|\bأسبوعين\b|\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b|"
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|"
    r"\b7[-–]14\b|\bnext\s+\d+)",
    re.I,
)
AMOUNTISH = re.compile(r"(AED|SAR|USD|د.\إ|ريال)\s*[\d,]+|[\d,]+\s*(AED|SAR|USD)", re.I)


@dataclass
class Signal:
    text: str
    blob: str
    pointer: str


def _pointer_from(payload: dict[str, Any], fallback: str) -> str:
    for key in ("pointer", "evidence_pointer"):
        raw = payload.get(key)
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
    return fallback


def collect_signals(snapshot: ProjectSnapshot) -> list[Signal]:
    signals: list[Signal] = []
    for i, event in enumerate(snapshot.events):
        payload = event.get("payload") if isinstance(event.get("payload"), dict) else {}
        parts = [str(event.get("type") or ""), str(payload.get("text") or ""), str(payload.get("body") or ""), str(payload.get("subject") or ""), str(payload.get("activity") or ""), str(event.get("text") or "")]
        blob = " ".join(p for p in parts if p).strip()
        pointer = _pointer_from(payload, str(event.get("pointer") or f"{snapshot.project_id}#event:{i+1}"))
        if blob:
            signals.append(Signal(text=blob, blob=blob.lower(), pointer=pointer))
    for excerpt in snapshot.document_excerpts:
        text = str(excerpt.get("text") or "")
        pointer = str(excerpt.get("pointer") or "").strip()
        if text.strip() and pointer:
            signals.append(Signal(text=text, blob=text.lower(), pointer=pointer))
    return signals


def first_match(signals: list[Signal], keywords: tuple[str, ...]) -> Signal | None:
    for sig in signals:
        if any(word in sig.blob for word in keywords):
            return sig
    return None


def has_date_window(text: str) -> bool:
    return bool(DATEISH.search(text))


def echoed_amount(text: str) -> str | None:
    match = AMOUNTISH.search(text)
    return match.group(0) if match else None
