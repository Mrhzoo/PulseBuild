from app.agents.change_order import run_change_order
from app.digest.cues import cue_lines
from app.main import app
from app.schemas.agents import ProjectSnapshot
from types import SimpleNamespace


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
