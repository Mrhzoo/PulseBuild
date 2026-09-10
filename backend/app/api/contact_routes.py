from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings

router = APIRouter()


@router.post("/contact")
async def contact(payload: dict) -> dict:
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip()
    company = (payload.get("company") or "").strip()
    message = (payload.get("message") or "").strip()
    if not name or not email or not message:
        raise HTTPException(400, "name, email, and message required")
    folder = Path(settings.local_upload_dir).resolve().parent / "contact"
    folder.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = folder / f"{stamp}-{email.replace('@', '_at_')[:40]}.txt"
    path.write_text(f"name={name}\nemail={email}\ncompany={company}\n{message}\n", encoding="utf-8")
    return {"ok": True, "stored": str(path.name), "note": "Email remains the briefing SLA. This is a sales inbox stub."}
