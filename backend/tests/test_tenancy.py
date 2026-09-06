from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.models.orm import Role
from app.services.tenancy import require_project_for_tenant


class _FakeSession:
    def __init__(self, project=None):
        self.project = project

    async def get(self, _model, _id):
        return self.project


def test_reader_gets_403_on_write():
    principal = Principal(uuid4(), uuid4(), Role.READER)
    with pytest.raises(HTTPException) as exc:
        require_write(principal)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_cross_tenant_project_id_returns_404():
    foreign = type("P", (), {"id": uuid4(), "tenant_id": uuid4()})()
    with pytest.raises(HTTPException) as exc:
        await require_project_for_tenant(_FakeSession(foreign), uuid4(), foreign.id)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_same_tenant_project_is_allowed():
    tenant_id = uuid4()
    own = type("P", (), {"id": uuid4(), "tenant_id": tenant_id})()
    got = await require_project_for_tenant(_FakeSession(own), tenant_id, own.id)
    assert got is own
