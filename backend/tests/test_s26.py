from app.main import cors_origins
from app.agents.schedule import run_schedule
from app.schemas.agents import ProjectSnapshot


def test_prod_cors_is_web_base_only(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "web_base_url", "https://app.pulsebuild.example")
    assert cors_origins() == ["https://app.pulsebuild.example"]


def test_schedule_title_uses_clip():
    snap = ProjectSnapshot(
        project_id="p1",
        project_name="Marina",
        tenant_role="sub",
        currency="AED",
        document_excerpts=[{"pointer": "doc#p1", "text": "Delay confirmed on site diary line."}],
    )
    findings = run_schedule(snap)
    assert findings
    assert "Delay confirmed" in findings[0].title or "Programme" in findings[0].title
