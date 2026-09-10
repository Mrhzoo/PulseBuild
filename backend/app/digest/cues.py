"""Honest IPC / look-ahead chips. Never invents dates or amounts."""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.agents.signals import DATEISH, echoed_date_window, echoed_ipc

DUBAI = ZoneInfo("Asia/Dubai")
ISO = re.compile(r"\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b")


def _today() -> date:
    return datetime.now(DUBAI).date()


def _parse_iso(text: str) -> date | None:
    match = ISO.search(text or "")
    if not match:
        return None
    raw = match.group(0).replace("/", "-")
    parts = raw.split("-")
    try:
        return date(int(parts[0]), int(parts[1]), int(parts[2]))
    except ValueError:
        return None


def cue_lines(cards) -> list[str]:
    today = _today()
    horizon = today + timedelta(days=14)
    out: list[str] = []
    seen: set[str] = set()
    for card in cards:
        blob = " ".join([card.title or "", card.why_it_hits_us or "", card.evidence_snippet or ""])
        ipc = echoed_ipc(blob)
        window = echoed_date_window(blob)
        parsed = _parse_iso(blob)
        if ipc and (window or parsed):
            line = f"{ipc} window {window or parsed.isoformat()} (Asia/Dubai)"
            if line not in seen:
                seen.add(line)
                out.append(line)
        elif "retention" in blob.lower() and (window or parsed):
            line = f"Retention language + {window or parsed.isoformat()} (Asia/Dubai)"
            if line not in seen:
                seen.add(line)
                out.append(line)
        if parsed and today <= parsed <= horizon:
            line = f"Look-ahead {parsed.isoformat()} — named in file"
            if line not in seen:
                seen.add(line)
                out.append(line)
        elif window and DATEISH.search(blob) and ("delay" in blob.lower() or "تأخير" in blob):
            line = f"Schedule movement {window}"
            if line not in seen:
                seen.add(line)
                out.append(line)
    return out[:8]
