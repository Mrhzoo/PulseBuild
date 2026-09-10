# S18 Reliability

## CORS / hosts
Allowed origins: `WEB_BASE_URL`, `http://localhost:3000`, `http://127.0.0.1:3000`.
Open the app as either host; login DEV prefills on both.

## Finding upsert
Key: `(agent, evidence_pointer)` per project.
- Open match → update title/why/confidence/severity
- New key → insert
- Dismissed key → leave alone (no recreate)

`POST /api/projects/{id}/run` and the morning script share `run_project_agents`.

## Digest GET
`GET /api/digest/today` is read-only. Persist only on `POST /build` and `POST /send`.

## Morning email
From `backend/`:

```
python -m scripts.send_morning_digests
```

Per tenant: run agents on projects with docs/events (failures logged, other projects continue) → build digest → email (Postmark or stub). WhatsApp cron is S19.

## Titles
Heuristics echo date windows, IPC ids, and source amounts into title/why. No invented figures. Live LLM still off by default.
