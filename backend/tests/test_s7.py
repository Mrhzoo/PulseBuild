import hashlib
import hmac
import json
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_owner
from app.digest.payload import DigestPayload
from app.models.orm import Role
from app.notify.whatsapp import _message_payload
from app.services.assisted_ops import apply_edit
from app.services.billing import apply_subscription_event, verify_stripe_signature


def test_stripe_signature_reject():
    assert verify_stripe_signature(b"{}", "t=1,v1=deadbeef", "whsec_test") is False


def test_owner_only_checkout_guard():
    with pytest.raises(HTTPException) as exc:
        require_owner(Principal(uuid4(), uuid4(), Role.OPS))
    assert exc.value.status_code == 403


def test_apply_payment_failed_sets_past_due():
    tenant = type("T", (), {"billing_status": "active", "stripe_customer_id": None, "stripe_subscription_id": None, "project_quota": 3})()
    apply_subscription_event(tenant, "invoice.payment_failed", {"object": {}})
    assert tenant.billing_status == "past_due"


@pytest.mark.asyncio
async def test_assisted_ops_requires_ticket(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "assisted_ops_requires_ticket", True)
    with pytest.raises(HTTPException) as exc:
        await apply_edit(None, tenant_id=uuid4(), actor_id=uuid4(), kind="dismiss_finding", entity_id=str(uuid4()), before={}, after={}, minutes=1, ticket=None)
    assert exc.value.status_code == 400


def test_whatsapp_template_payload_when_configured(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "whatsapp_template_name", "morning_brief")
    monkeypatch.setattr(config.settings, "whatsapp_allow_session_text", False)
    payload = DigestPayload(date="2026-09-09", tenant="Demo", company="Demo", projects_scanned=1)
    body = _message_payload(payload, "971500000000")
    assert body["type"] == "template"


def test_locale_dictionaries_exist():
    folder = Path(__file__).resolve().parents[2] / "frontend" / "src" / "i18n"
    en = json.loads((folder / "en.json").read_text(encoding="utf-8"))
    ar = json.loads((folder / "ar.json").read_text(encoding="utf-8"))
    for key in ("digest_title", "send_briefing", "billing", "onboarding", "whatsapp_best_effort", "quiet_morning"):
        assert key in en and key in ar
    assert "ملخص" in ar["digest_title"]
