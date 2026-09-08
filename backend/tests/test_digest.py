from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.digest.builder import assemble_payload, card_from_finding
from app.digest.emailer import send_digest_email
from app.digest.payload import DigestPayload, subject_line
from app.models.orm import Role, Severity
from app.services.tenancy import require_project_for_tenant


def _finding(**kwargs):
    data = {"id": uuid4(), "project_id": uuid4(), "dismissed": False, "severity": Severity.WATCH, "title": "Signal", "why_it_hits_us": "Check this week.", "evidence_snippet": "retention held", "evidence_pointer": "doc-1#p1", "confidence": 0.7}
    data.update(kwargs)
    return SimpleNamespace(**data)


def test_empty_findings_no_fake_act():
    project = SimpleNamespace(id=uuid4(), name="Marina")
    payload = assemble_payload(tenant_name="Demo", for_date=date(2026, 9, 7), findings=[], projects=[project], unassigned=0)
    assert payload.act == []
    assert payload.watch == []
    assert "Marina" in payload.quiet_projects
    assert payload.ask


def test_act_capped_and_pointer_required():
    pid = uuid4()
    findings = [_finding(id=uuid4(), project_id=pid, severity=Severity.ACT, title=f"A{i}", evidence_pointer="doc#p1") for i in range(7)]
    findings.append(_finding(id=uuid4(), project_id=pid, severity=Severity.ACT, title="No pointer", evidence_pointer="  "))
    payload = assemble_payload(tenant_name="Demo", for_date=date(2026, 9, 7), findings=findings, projects=[SimpleNamespace(id=pid, name="Marina")], unassigned=2)
    assert len(payload.act) == 5
    assert all(c.evidence_pointer.strip() for c in payload.act)
    assert payload.ask and "2 files need a project" in payload.ask


def test_card_without_pointer_dropped():
    assert card_from_finding(_finding(severity=Severity.ACT, evidence_pointer=""), "Marina") is None


@pytest.mark.asyncio
async def test_emailer_dev_stub(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "development")
    monkeypatch.setattr(config.settings, "postmark_server_token", "")
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    payload = DigestPayload(date="2026-09-07", tenant="Demo", company="Demo", projects_scanned=1, digest_id="d1")
    via = await send_digest_email(payload, ["owner@demo.test"])
    assert via == "stub"
    assert list((tmp_path / "digests").glob("*.eml"))


@pytest.mark.asyncio
async def test_emailer_postmark_mocked(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "postmark_server_token", "token-test")
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

    monkeypatch.setattr("app.digest.emailer.httpx.AsyncClient", _Client)
    payload = DigestPayload(date="2026-09-07", tenant="Demo", company="Demo", projects_scanned=0, digest_id="d1")
    via = await send_digest_email(payload, ["ops@demo.test"])
    assert via == "email"
    assert called["url"] == "https://api.postmarkapp.com/email"
    assert called["json"]["To"] == "ops@demo.test"


def test_reader_cannot_send():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_digest_tenant_isolation():
    foreign = type("P", (), {"id": uuid4(), "tenant_id": uuid4()})()

    class _Sess:
        async def get(self, _model, _id):
            return foreign

    with pytest.raises(HTTPException) as exc:
        await require_project_for_tenant(_Sess(), uuid4(), foreign.id)
    assert exc.value.status_code == 404


def test_subject_quiet():
    payload = DigestPayload(date="2026-09-07", tenant="X", company="X", projects_scanned=1)
    assert "Quiet morning" in subject_line(payload)
