from app.ingest.ocr import run_ocr
from app.ingest.pdf_text import parse_pdf
from app.ingest.types import parse_coach
from app.services.findings_run import SKIP_PARSE
from tests.test_ingest import _blank_pdf


def test_blank_pdf_needs_ocr_not_invented():
    result = parse_pdf(_blank_pdf(), "doc-scan")
    assert result.parse_status == "needs_ocr"
    assert result.extracted_text == ""
    assert not any(e.type == "doc.ingested" for e in result.events)
    assert "invent" in parse_coach("needs_ocr").lower() or "not invent" in parse_coach("needs_ocr").lower() or "do not invent" in parse_coach("needs_ocr")


def test_ocr_hook_off_returns_none(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "enable_ocr", False)
    assert run_ocr(b"%PDF") is None


def test_ocr_flag_on_still_no_engine(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "enable_ocr", True)
    assert run_ocr(b"%PDF") is None
    result = parse_pdf(_blank_pdf(), "doc-ocr")
    assert result.parse_status == "needs_ocr"


def test_needs_ocr_skips_autorun():
    assert "needs_ocr" in SKIP_PARSE
