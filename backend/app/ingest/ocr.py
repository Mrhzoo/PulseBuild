"""Optional OCR hook. No engine ships in S25 — never invent text."""

from __future__ import annotations

from app.config import settings


def run_ocr(_data: bytes) -> str | None:
    if not settings.enable_ocr:
        return None
    return None
