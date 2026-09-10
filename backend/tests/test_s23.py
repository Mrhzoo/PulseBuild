import pytest
from fastapi.testclient import TestClient

from app.digest.emailer import allow_email_stub, email_configured, send_digest_email
from app.digest.payload import DigestPayload
from app.main import app


def test_health_exposes_email_configured_not_token():
    body = TestClient(app).get("/api/health").json()
    assert "email_configured" in body
    assert "postmark" not in str(body).lower()
    assert "token" not in str(body).lower()


@pytest.mark.asyncio
async def test_prod_without_token_refuses(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "email_stub", False)
    monkeypatch.setattr(config.settings, "postmark_server_token", "")
    assert email_configured() is False
    assert allow_email_stub() is False
    with pytest.raises(RuntimeError):
        await send_digest_email(DigestPayload(date="2026-09-10", tenant="T", company="T", projects_scanned=0), ["a@b.c"])


@pytest.mark.asyncio
async def test_email_stub_flag_allows_write(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "email_stub", True)
    monkeypatch.setattr(config.settings, "postmark_server_token", "")
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    via = await send_digest_email(DigestPayload(date="2026-09-10", tenant="T", company="T", projects_scanned=0, digest_id="x"), ["a@b.c"])
    assert via == "stub"
