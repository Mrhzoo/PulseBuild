# S25 Ingest resilience

## Parse honesty
Empty-text PDFs stay `needs_ocr`. Unreadable files stay `needs_better_file`.
Agents do **not** auto-run on those statuses. No invented text.

`ENABLE_OCR=true` turns on the hook in `app/ingest/ocr.py`. The shipped hook returns nothing — wire an engine later. If the hook returns text, status becomes `extracted` with pointer `#ocr`.

## Coaching
`GET /api/documents` includes `coach`.
Projects UI lists assigned + unassigned files and shows the coach line.
`POST /api/documents/{id}/ocr-ticket` opens an assisted-ops ticket (`ocr_ticket`). Text is still not invented.

## Inbound
`GET /api/inbound/status` — configured flag, forward addresses, last inbound parse status, checklist:
1. `POSTMARK_INBOUND_SECRET`
2. Postmark webhook → `POST /api/inbound/email`
3. Forward a project address to yourself and send a test

Production inbound without the secret is 401.
