from datetime import date, datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.digest.schedule import (
    apply_digest_prefs,
    already_sent_for_local_day,
    default_timezone,
    is_due,
    tenant_is_due,
)


def test_country_defaults():
    assert default_timezone("UAE") == "Asia/Dubai"
    assert default_timezone("KSA") == "Asia/Riyadh"


def test_due_in_window():
    now = datetime(2026, 9, 11, 3, 5, tzinfo=timezone.utc)  # 07:05 Dubai
    assert is_due(timezone_name="Asia/Dubai", local_time="07:00", now=now) is True


def test_not_due_before_window():
    now = datetime(2026, 9, 11, 2, 50, tzinfo=timezone.utc)  # 06:50 Dubai
    assert is_due(timezone_name="Asia/Dubai", local_time="07:00", now=now) is False


def test_not_due_after_window():
    now = datetime(2026, 9, 11, 3, 20, tzinfo=timezone.utc)  # 07:20 Dubai
    assert is_due(timezone_name="Asia/Dubai", local_time="07:00", now=now) is False


def test_already_sent_skips():
    now = datetime(2026, 9, 11, 3, 5, tzinfo=timezone.utc)
    row = SimpleNamespace(digest_date=date(2026, 9, 11), delivered_via="email+web")
    assert already_sent_for_local_day(row, date(2026, 9, 11)) is True
    assert is_due(timezone_name="Asia/Dubai", local_time="07:00", now=now, digest_row=row) is False


def test_web_only_row_still_due_for_email():
    now = datetime(2026, 9, 11, 3, 5, tzinfo=timezone.utc)
    row = SimpleNamespace(digest_date=date(2026, 9, 11), delivered_via="web")
    assert is_due(timezone_name="Asia/Dubai", local_time="07:00", now=now, digest_row=row) is True


def test_two_tenants_different_zones():
    now = datetime(2026, 9, 11, 3, 5, tzinfo=timezone.utc)  # 07:05 Dubai / 06:05 Riyadh
    dubai = SimpleNamespace(digest_timezone="Asia/Dubai", digest_local_time="07:00", country="UAE")
    riyadh = SimpleNamespace(digest_timezone="Asia/Riyadh", digest_local_time="07:00", country="KSA")
    assert tenant_is_due(dubai, now) is True
    assert tenant_is_due(riyadh, now) is False
    later = datetime(2026, 9, 11, 4, 5, tzinfo=timezone.utc)  # 08:05 Dubai / 07:05 Riyadh
    assert tenant_is_due(dubai, later) is False
    assert tenant_is_due(riyadh, later) is True


def test_patch_round_trip_prefs():
    tenant = SimpleNamespace(digest_timezone="Asia/Dubai", digest_local_time="07:00")
    apply_digest_prefs(tenant, {"digest_timezone": "Asia/Riyadh", "digest_local_time": "21:00"})
    assert tenant.digest_timezone == "Asia/Riyadh"
    assert tenant.digest_local_time == "21:00"
    with pytest.raises(HTTPException) as exc:
        apply_digest_prefs(tenant, {"digest_timezone": "Not/AZone"})
    assert exc.value.status_code == 400
    with pytest.raises(HTTPException):
        apply_digest_prefs(tenant, {"digest_local_time": "9am"})
    assert tenant.digest_local_time == "21:00"
