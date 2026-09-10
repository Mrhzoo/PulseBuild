import json
from pathlib import Path

import pytest

from app.digest.payload import DigestPayload
from app.notify.whatsapp import notify_digest

REQUIRED_I18N = {
    "digest_title", "login", "logout", "login_failed", "email", "password",
    "projects", "upload", "flags", "billing", "onboarding", "errors_unavailable",
    "sign_in_link", "whatsapp_best_effort", "quiet_morning",
    "nav_home", "get_started", "hero_line1", "trust", "stat_briefing",
}


def test_i18n_key_parity():
    root = Path(__file__).resolve().parents[2] / "frontend" / "src" / "i18n"
    en = json.loads((root / "en.json").read_text(encoding="utf-8"))
    ar = json.loads((root / "ar.json").read_text(encoding="utf-8"))
    assert REQUIRED_I18N <= set(en)
    assert set(en) == set(ar)
    assert "ملخص" in ar["digest_title"]


@pytest.mark.asyncio
async def test_production_whatsapp_without_template_fails_soft(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "enable_whatsapp_push", True)
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "whatsapp_token", "tok")
    monkeypatch.setattr(config.settings, "whatsapp_phone_number_id", "123")
    monkeypatch.setattr(config.settings, "whatsapp_template_name", "")
    monkeypatch.setattr(config.settings, "whatsapp_allow_session_text", False)
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    payload = DigestPayload(date="2026-09-10", tenant="Demo", company="Demo", projects_scanned=1, digest_id="d1")
    status = await notify_digest(payload, ["971500000000"])
    assert status in {"failed", "stub"}
