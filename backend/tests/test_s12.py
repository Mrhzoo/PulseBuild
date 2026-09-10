from fastapi.testclient import TestClient

from app.main import app


def test_contact_stub_writes_file(tmp_path, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "local_upload_dir", str(tmp_path / "uploads"))
    client = TestClient(app)
    res = client.post("/api/contact", json={"name": "Ali", "email": "ali@demo.local", "company": "Demo MEP", "message": "Pilot for Marina"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert list((tmp_path / "contact").glob("*.txt"))
