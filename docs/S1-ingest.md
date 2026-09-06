# S1 Ingest

Turn uploaded or forwarded files into **Events** on a project (or Unassigned). No invented amounts. No OCR engine. No outbound mail.

## Parser matrix

| File | Module | Events | Failure |
| --- | --- | --- | --- |
| PDF (text layer) | `app/ingest/pdf_text.py` | `doc.ingested` per page with `{id}#pN` | empty layer → `needs_ocr` / `needs_better_file`, `parse.failed` only |
| Excel / CSV | `app/ingest/excel_boq.py` | `schedule.row` or `boq.row` | unknown sheet → `parse.partial`, never 500 |
| `.eml` / inbound stub | `app/ingest/email_message.py` | `email.message` | unreadable → `parse.failed` |
| WhatsApp export `.txt` | `app/ingest/whatsapp_export.py` | `chat.message` | stickers/media lines dropped |
| Other text | pipeline sniff | `doc.ingested` | empty → `needs_better_file` |

Arabic and English are accepted. Decode uses replacement, not crash.

## Event types

`doc.ingested` · `schedule.row` · `boq.row` · `email.message` · `chat.message` · `parse.partial` · `parse.failed`

Every fact payload includes `pointer`.

## API

After `POST /api/documents` the file is encrypted, matched (soft guesses stay Unassigned), then ingested synchronously.

```bash
curl -X POST http://localhost:8000/api/documents/$DOC_ID/reingest -H "Authorization: Bearer $TOKEN"
curl http://localhost:8000/api/projects/$PROJECT_ID/events -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8000/api/inbound/email \
  -H "Content-Type: application/json" \
  -H "X-Inbound-Secret: $POSTMARK_INBOUND_SECRET" \
  -d '{"tenant_slug":"demo","to":"marina@demo.pulsebuild.local","subject":"[PB:MARINA] IPC delay","text_body":"Retention held."}'
```

If `POSTMARK_INBOUND_SECRET` is empty and `APP_ENV=development`, the stub logs a warning and accepts the call. Non-dev requires the secret.

Soft suggest never auto-commits. No outbound mail.

Deferred: live OCR, production Postmark webhook signature, job queue, live LLM (S2).
