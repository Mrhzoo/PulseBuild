from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.ingest.email_message import parse_eml
from app.ingest.excel_boq import parse_excel
from app.ingest.pdf_text import parse_pdf
from app.ingest.pipeline import parse_bytes
from app.ingest.whatsapp_export import parse_whatsapp
from app.models.orm import Role
from app.services.matching import match_inbound
from app.services.tenancy import require_project_for_tenant

ROOT = Path(__file__).resolve().parents[2] / "fixtures" / "ingest"

TEXT_PDF = b"""%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj
4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
5 0 obj<< /Length 78 >>stream
BT /F1 12 Tf 72 720 Td (IPC certified. Retention 10 percent held until handover.) Tj ET
endstream
endobj
trailer<< /Size 6 /Root 1 0 R >>
%%EOF
"""

CHAT_SAMPLE = b"""12/03/2026, 09:14 - Ahmed: Site delay confirmed for Marina tower
12/03/2026, 09:15 - Ahmed: <Media omitted>
12/03/2026, 09:16 - Fatima: IPC will slip two weeks
12/03/2026, 09:17 - Ahmed: sticker omitted
12/03/2026, 09:18 - Fatima: Retention still held
"""

EML_SAMPLE = b"From: mc@owner.example\nTo: marina@demo.pulsebuild.local\nSubject: [PB:MARINA] Variation on facade qty\n\nPlease note quantity increase.\n"


def _xlsx_bytes() -> bytes:
    from io import BytesIO
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Schedule"
    ws.append(["Activity", "Start", "Finish", "Duration"])
    ws.append(["First fix MEP", "2026-09-01", "2026-09-20", "15"])
    ws.append(["Commissioning", "2026-09-21", "2026-10-05", "10"])
    notes = wb.create_sheet("Notes")
    notes.append(["Random", "Stuff"])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _blank_pdf() -> bytes:
    from io import BytesIO
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_pdf_text_layer_emits_pointer():
    data = (ROOT / "ipc-text.pdf").read_bytes() if (ROOT / "ipc-text.pdf").exists() else TEXT_PDF
    result = parse_pdf(data, "doc-pdf")
    assert result.parse_status == "extracted"
    assert result.events
    assert all(e.pointer.startswith("doc-pdf#") for e in result.events)
    assert "Retention" in result.extracted_text


def test_blank_pdf_no_fake_facts():
    data = (ROOT / "scanned-blank.pdf").read_bytes() if (ROOT / "scanned-blank.pdf").exists() else _blank_pdf()
    result = parse_pdf(data, "doc-blank")
    assert result.parse_status in {"needs_ocr", "needs_better_file"}
    assert not any(e.type in {"schedule.row", "boq.row", "doc.ingested"} for e in result.events)


def test_excel_aliased_headers():
    result = parse_excel(_xlsx_bytes(), "doc-xlsx", "schedule.xlsx")
    rows = [e for e in result.events if e.type == "schedule.row"]
    assert len(rows) >= 2
    assert rows[0].payload.get("activity")
    assert "sheet:" in rows[0].pointer


def test_whatsapp_ignores_junk():
    path = ROOT / "chat-export.txt"
    result = parse_whatsapp(path.read_bytes() if path.exists() else CHAT_SAMPLE, "doc-wa")
    texts = [e.payload["text"] for e in result.events if e.type == "chat.message"]
    assert "Site delay confirmed for Marina tower" in texts
    assert all("omitted" not in t.lower() and "sticker" not in t.lower() for t in texts)


def test_eml_subject_kept():
    path = ROOT / "inbound-sample.eml"
    result = parse_eml(path.read_bytes() if path.exists() else EML_SAMPLE, "doc-eml")
    assert result.events[0].type == "email.message"
    assert "[PB:MARINA]" in result.events[0].payload["subject"]


class _Scalar:
    def __init__(self, rows):
        self._rows = rows
    def all(self):
        return self._rows

class _Result:
    def __init__(self, rows):
        self._rows = rows
    def scalars(self):
        return _Scalar(self._rows)

class _Session:
    def __init__(self, projects):
        self._projects = projects
    async def execute(self, _stmt):
        return _Result(self._projects)

class _FakeGet:
    def __init__(self, project):
        self.project = project
    async def get(self, _model, _id):
        return self.project


@pytest.mark.asyncio
async def test_inbound_subject_token_matches_project():
    project = type("P", (), {"id": uuid4(), "tenant_id": uuid4(), "code": "MARINA", "slug": "marina", "match_aliases": [], "forward_address": "marina@demo.pulsebuild.local"})()
    result = await match_inbound(_Session([project]), project.tenant_id, subject="[PB:MARINA] Variation", filename=None)
    assert result.project_id == project.id
    assert result.method == "subject_token"


@pytest.mark.asyncio
async def test_events_list_is_tenant_scoped():
    foreign = type("P", (), {"id": uuid4(), "tenant_id": uuid4()})()
    with pytest.raises(HTTPException) as exc:
        await require_project_for_tenant(_FakeGet(foreign), uuid4(), foreign.id)
    assert exc.value.status_code == 404


def test_reader_cannot_reingest():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


def test_plain_text_does_not_invent_amounts():
    result = parse_bytes(b"hello site diary", "notes.txt", "doc-txt")
    assert result.parse_status == "extracted"
    assert "amount" not in result.events[0].payload
