"""Per-tenant digest clock. Email remains the SLA; timing is local to the tenant."""

from __future__ import annotations

import re
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException

from app.models.orm import Country

DEFAULT_TIME = "07:00"
WINDOW_MINUTES = 15
TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$")
COUNTRY_TZ = {
    Country.UAE.value: "Asia/Dubai",
    Country.KSA.value: "Asia/Riyadh",
    "UAE": "Asia/Dubai",
    "KSA": "Asia/Riyadh",
}


def country_value(country) -> str:
    if country is None:
        return Country.UAE.value
    return country.value if hasattr(country, "value") else str(country)


def default_timezone(country) -> str:
    return COUNTRY_TZ.get(country_value(country), "Asia/Dubai")


def resolved_timezone(tenant) -> str:
    raw = (getattr(tenant, "digest_timezone", None) or "").strip()
    if raw:
        try:
            ZoneInfo(raw)
            return raw
        except ZoneInfoNotFoundError:
            pass
    return default_timezone(getattr(tenant, "country", None))


def resolved_time(tenant) -> str:
    raw = (getattr(tenant, "digest_local_time", None) or "").strip()
    if TIME_RE.match(raw):
        hour, minute = raw.split(":")[:2]
        return f"{int(hour):02d}:{int(minute):02d}"
    return DEFAULT_TIME


def parse_hhmm(value: str) -> tuple[int, int]:
    if not TIME_RE.match(value or ""):
        raise HTTPException(400, "digest_local_time must be HH:MM")
    hour, minute = value.split(":")[:2]
    return int(hour), int(minute)


def validate_local_time(value: str) -> str:
    hour, minute = parse_hhmm(value)
    return f"{hour:02d}:{minute:02d}"


def validate_timezone(name: str) -> str:
    value = (name or "").strip()
    if not value:
        raise HTTPException(400, "digest_timezone required")
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise HTTPException(400, "unknown digest_timezone") from exc
    return value


def apply_digest_prefs(tenant, payload: dict) -> None:
    if "digest_timezone" in payload:
        tenant.digest_timezone = validate_timezone(str(payload.get("digest_timezone") or ""))
    if "digest_local_time" in payload:
        tenant.digest_local_time = validate_local_time(str(payload.get("digest_local_time") or ""))


def local_now(tz_name: str, now: datetime | None = None) -> datetime:
    instant = now or datetime.now(timezone.utc)
    if instant.tzinfo is None:
        instant = instant.replace(tzinfo=timezone.utc)
    return instant.astimezone(ZoneInfo(tz_name))


def digest_local_date(tz_name: str, now: datetime | None = None) -> date:
    return local_now(tz_name, now).date()


def tenant_digest_date(tenant, now: datetime | None = None) -> date:
    return digest_local_date(resolved_timezone(tenant), now)


def in_send_window(local_dt: datetime, hhmm: str, window_minutes: int = WINDOW_MINUTES) -> bool:
    hour, minute = parse_hhmm(hhmm)
    target = hour * 60 + minute
    current = local_dt.hour * 60 + local_dt.minute
    return target <= current < target + window_minutes


def emailed_via(delivered_via: str | None) -> bool:
    via = (delivered_via or "").lower()
    return any(token in via for token in ("email", "postmark", "stub"))


def already_sent_for_local_day(digest_row, local_date: date) -> bool:
    if digest_row is None:
        return False
    row_date = getattr(digest_row, "digest_date", None)
    if row_date != local_date:
        return False
    return emailed_via(getattr(digest_row, "delivered_via", None))


def is_due(
    *,
    timezone_name: str,
    local_time: str,
    now: datetime,
    digest_row=None,
    window_minutes: int = WINDOW_MINUTES,
) -> bool:
    local_dt = local_now(timezone_name, now)
    if not in_send_window(local_dt, local_time, window_minutes):
        return False
    if already_sent_for_local_day(digest_row, local_dt.date()):
        return False
    return True


def tenant_is_due(tenant, now: datetime, digest_row=None) -> bool:
    return is_due(
        timezone_name=resolved_timezone(tenant),
        local_time=resolved_time(tenant),
        now=now,
        digest_row=digest_row,
    )
