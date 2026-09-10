from app.digest.payload import DigestPayload, subject_line


def test_subject_quiet_en():
    payload = DigestPayload(date="2026-09-10", tenant="X", company="X", projects_scanned=1, locale="en")
    assert "Quiet morning" in subject_line(payload)


def test_subject_ar_when_locale_set():
    payload = DigestPayload(date="2026-09-10", tenant="X", company="X", projects_scanned=1, locale="ar")
    assert "صباح هادئ" in subject_line(payload)
