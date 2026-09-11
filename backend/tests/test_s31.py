import pytest
from fastapi import HTTPException

from app.services.registration import CLOSED, assert_public_register_allowed, public_register_allowed


def test_production_always_denies_register(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "pilot_invite_code", "let-me-in")
    assert public_register_allowed("let-me-in") is False
    with pytest.raises(HTTPException) as exc:
        assert_public_register_allowed("let-me-in")
    assert exc.value.status_code == 403
    assert exc.value.detail == CLOSED


def test_dev_default_deny_without_invite_code(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "app_env", "development")
    monkeypatch.setattr(config.settings, "pilot_invite_code", "")
    assert public_register_allowed("") is False
    assert public_register_allowed("anything") is False
    with pytest.raises(HTTPException) as exc:
        assert_public_register_allowed(None)
    assert exc.value.status_code == 403


def test_dev_invite_code_must_match(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "app_env", "development")
    monkeypatch.setattr(config.settings, "pilot_invite_code", "pilot-uae")
    assert public_register_allowed("nope") is False
    assert public_register_allowed("pilot-uae") is True
    assert_public_register_allowed("pilot-uae")
    with pytest.raises(HTTPException):
        assert_public_register_allowed("wrong")
