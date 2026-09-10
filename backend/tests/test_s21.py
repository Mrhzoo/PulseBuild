from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.agents.change_order import run_change_order
from app.api.deps import Principal, require_write
from app.digest.cues import cue_lines
from app.main import app
from app.models.orm import Role, Severity
from app.schemas.agents import ProjectSnapshot
from app.services.flags import public_share_payload
from app.services.packs import create_pack, pack_payload, revoke_pack


def test_signed_vo_becomes_act():
    findings = run_change_order(ProjectSnapshot(
        project_id="p3",
        project_name="Facade",
        tenant_role="supplier",
        currency="AED",
        document_excerpts=[{"pointer": "msg-2026-09-01", "text": "Please proceed with a variation: revised qty for aluminium panels."}],
    ))
    assert findings and findings[0].proposed_severity == "act"
    assert findings[0].evidence.pointer


def test_unsigned_vo_stays_watch():
    findings = run_change_order(ProjectSnapshot(
        project_id="p3",
        project_name="Facade",
        tenant_role="supplier",
        currency="AED",
        document_excerpts=[{"pointer": "msg-x", "text": "Possible quantity increase on the drawing revision."}],
    ))
    assert findings and findings[0].proposed_severity == "watch"


def test_cues_empty_without_dates():
    card = SimpleNamespace(title="Payment or retention signal", why_it_hits_us="Cash language", evidence_snippet="retention held")
    assert cue_lines([card]) == []


def test_inbound_and_pack_routes_registered():
    paths = set(app.openapi()["paths"])
    assert "/api/flags/pack" in paths
    assert "/api/inbound/status" in paths


def test_reader_pack_is_403():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_create_pack_does_not_reuse_finding_id():
    tenant_id, user_id, finding_id, flag_id = uuid4(), uuid4(), uuid4(), uuid4()
    added = []

    class _R:
        def __init__(self, rows):
            self._rows = rows
        def scalars(self):
            return self
        def all(self):
            return self._rows

    class _Sess:
        async def execute(self, _stmt):
            return _R([SimpleNamespace(id=flag_id, finding_id=finding_id, dismissed_at=None, share_revoked_at=None)])
        async def get(self, model, _id):
            name = getattr(model, "__name__", str(model))
            if "Finding" in name:
                return SimpleNamespace(id=finding_id, severity=Severity.ACT, evidence_pointer="doc#p1", title="Act", why_it_hits_us="w", evidence_snippet="s", project_id=uuid4(), confidence=0.8)
            return None
        def add(self, obj):
            added.append(obj)
        async def flush(self):
            if added:
                added[-1].id = uuid4()

    from app.services import packs as packs_mod

    async def _audit(*a, **k):
        return None
    packs_mod.write_audit = _audit  # type: ignore

    out = await create_pack(_Sess(), tenant_id=tenant_id, user_id=user_id)
    assert out["pack"] is True
    assert out["share_url"]
    assert added and added[0].__class__.__name__ == "SharePack"
    assert added[0].flag_ids == [str(flag_id)]


@pytest.mark.asyncio
async def test_pack_share_then_revoke_410():
    pack = SimpleNamespace(id=uuid4(), tenant_id=uuid4(), revoked_at=None, flag_ids=[], watermark="For coordination only", share_token="pack-token")

    class _Sess:
        async def get(self, model, _id):
            name = getattr(model, "__name__", str(model))
            if "SharePack" in name:
                return pack
            if "Tenant" in name:
                return SimpleNamespace(name="Demo Co")
            return None
        async def execute(self, _stmt):
            class _R:
                def scalar_one_or_none(self):
                    return None
            return _R()

    from app.services import packs as packs_mod

    async def _audit(*a, **k):
        return None
    packs_mod.write_audit = _audit  # type: ignore

    body = await pack_payload(_Sess(), pack)
    assert body["pack"] is True
    assert body["watermark"] == "For coordination only"
    await revoke_pack(_Sess(), pack.tenant_id, uuid4(), pack.id)
    assert pack.revoked_at is not None
    with pytest.raises(HTTPException) as exc:
        await pack_payload(_Sess(), pack)
    assert exc.value.status_code == 410
