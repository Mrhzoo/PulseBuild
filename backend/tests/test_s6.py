from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.agents.compliance import run_compliance
from app.agents.graph import run_v1_graph
from app.api.deps import Principal, require_write
from app.eval.golden import GOLDEN_CASES
from app.eval.harness import run_golden
from app.models.orm import Role
from app.notify.whatsapp import notify_digest
from app.digest.payload import DigestPayload
from app.schemas.agents import ProjectSnapshot


def test_compliance_hit_with_pointer():
    snap = ProjectSnapshot(project_id="p1", project_name="Marina", tenant_role="sub", currency="AED", document_excerpts=[{"pointer": "doc-ins#p1", "text": "Insurance certificate expires 30 Sep 2026."}])
    cards = run_compliance(snap)
    assert cards and cards[0].evidence.pointer == "doc-ins#p1"


def test_compliance_garbage_no_act():
    snap = ProjectSnapshot(project_id="p1", project_name="Marina", tenant_role="sub", currency="AED", document_excerpts=[{"pointer": "doc-x#p1", "text": "Please find attached the weekly look-ahead."}])
    assert run_compliance(snap) == []


def test_golden_still_passes_with_compliance():
    report = run_golden()
    assert report["pass"] is True
    assert report["empty_act_cards"] == 0
    assert "compliance_insurance_expiry" in {c["name"] for c in GOLDEN_CASES}


@pytest.mark.asyncio
async def test_whatsapp_stub_without_credentials(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "enable_whatsapp_push", False)
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    payload = DigestPayload(date="2026-09-08", tenant="Demo", company="Demo", projects_scanned=1, digest_id="d1")
    assert await notify_digest(payload, ["+971500000000"]) == "stub"
    assert list((tmp_path / "whatsapp").glob("*.txt"))


@pytest.mark.asyncio
async def test_whatsapp_mock_graph_call(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "enable_whatsapp_push", True)
    monkeypatch.setattr(config.settings, "app_env", "staging")
    monkeypatch.setattr(config.settings, "whatsapp_token", "tok")
    monkeypatch.setattr(config.settings, "whatsapp_phone_number_id", "123")
    monkeypatch.setattr(config.settings, "whatsapp_template_name", "morning_brief")
    called = {}

    class _Resp:
        def raise_for_status(self):
            return None

    class _Client:
        def __init__(self, *a, **k):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return None
        async def post(self, url, headers=None, json=None):
            called["url"] = url
            called["json"] = json
            return _Resp()

    monkeypatch.setattr("app.notify.whatsapp.httpx.AsyncClient", _Client)
    payload = DigestPayload(date="2026-09-08", tenant="Demo", company="Demo", projects_scanned=1, digest_id="d1")
    assert await notify_digest(payload, ["971500000000"]) == "whatsapp"
    assert "graph.facebook.com" in called["url"]
    assert called["json"]["type"] == "template"


def test_reader_cannot_sync_portal():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


def test_empty_graph_still_no_fake_risks():
    result = run_v1_graph(ProjectSnapshot(project_id="p", project_name="New", tenant_role="sub", currency="AED"))
    assert result.cards == []
