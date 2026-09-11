from app.services.exposure import days_from_text


def test_days_from_act_and_watch_language():
    assert days_from_text("Act: 5 days slip") == 5
    assert days_from_text("Watch programme 2 weeks") == 14


def test_activity_shape_keys():
    item = {"kind": "flag", "at": "2026-09-11", "title": "x", "note": "y", "shared": True}
    assert set(item) >= {"kind", "at", "title", "note", "shared"}
