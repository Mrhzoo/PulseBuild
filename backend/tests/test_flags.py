from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.models.orm import Role
from app.services.flags import new_share_token, public_share_payload, share_url
from app.services.tenancy import require_project_for_tenant


def test_share_token_is_unguessable():
    a, b = new_share_token(), new_share_token()
    assert a != b
    assert len(a) >= 32


def test_reader_cannot_flag():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_finding_404():
    foreign = type("P", (), {"id": uuid4(), "tenant_id": uuid4()})()

    class _Sess:
        async def get(self, _model, _id):
            return foreign

    with pytest.raises(HTTPException) as exc:
        await require_project_for_tenant(_Sess(), uuid4(), foreign.id)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_revoked_share_is_410():
    class _Sess:
        async def execute(self, _stmt):
            class _R:
                def scalar_one_or_none(self):
                    return SimpleNamespace(share_revoked_at=datetime.now(timezone.utc), dismissed_at=None, finding_id=uuid4(), tenant_id=uuid4())
            return _R()

    with pytest.raises(HTTPException) as exc:
        await public_share_payload(_Sess(), "abc")
    assert exc.value.status_code == 410


@pytest.mark.asyncio
async def test_live_share_payload_is_minimal():
    finding_id = uuid4()
    tenant_id = uuid4()
    project_id = uuid4()

    class _Sess:
        async def execute(self, _stmt):
            class _R:
                def scalar_one_or_none(self):
                    return SimpleNamespace(share_token="live", share_revoked_at=None, dismissed_at=None, finding_id=finding_id, tenant_id=tenant_id, created_at=datetime.now(timezone.utc), note="Crew window slips")
            return _R()

        async def get(self, model, _id):
            if "Finding" in str(model):
                return SimpleNamespace(title="Programme movement", why_it_hits_us="Delay named in file", evidence_snippet="two weeks slip", evidence_pointer="doc#p1", confidence=0.8, project_id=project_id, severity=SimpleNamespace(value="act"))
            if "Project" in str(model):
                return SimpleNamespace(name="Marina")
            return SimpleNamespace(name="Demo Co")

    payload = await public_share_payload(_Sess(), "live")
    assert payload["title"] == "Programme movement"
    assert "email" not in payload
    assert share_url("x").endswith("/share/x")
