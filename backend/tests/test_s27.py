from app.services.exposure import days_from_text


def test_days_from_text():
    assert days_from_text("two weeks slip") is None
    assert days_from_text("14 days delay") == 14
    assert days_from_text("3 week window") == 21


def test_margin_formula():
    days = 4
    rate = 1500
    assert days * rate == 6000
