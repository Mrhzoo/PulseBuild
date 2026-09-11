"""Public self-serve register is default-deny. Production never opens it."""

from __future__ import annotations

from fastapi import HTTPException

from app.config import settings

CLOSED = "registration_closed"


def public_register_allowed(invite_code: str | None) -> bool:
    if (settings.app_env or "").strip().lower() == "production":
        return False
    expected = (settings.pilot_invite_code or "").strip()
    if not expected:
        return False
    return (invite_code or "").strip() == expected


def assert_public_register_allowed(invite_code: str | None) -> None:
    if not public_register_allowed(invite_code):
        raise HTTPException(status_code=403, detail=CLOSED)
