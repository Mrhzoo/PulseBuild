from app.services.billing import HARD_STATUSES
from app.main import app


def test_trialing_is_hard_quota():
    assert "trialing" in HARD_STATUSES


def test_own_whatsapp_route_registered():
    paths = set(app.openapi()["paths"])
    assert "/api/people/me/whatsapp" in paths
