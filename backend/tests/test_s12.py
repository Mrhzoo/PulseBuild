from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_contact_stub_writes_file(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/contact", json={"name": "Ali", "email": "ali@demo.local", "company": "Demo MEP", "message": "Pilot for Marina"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert list((tmp_path / "contact").glob("*.txt"))
