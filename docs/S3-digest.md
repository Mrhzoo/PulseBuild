# S3 Digest + morning briefing

The digest is the product. Agents write Findings. S3 ranks them into Act / Watch / Quiet / Ask and delivers the briefing by email.

## HTTP

- GET `/api/digest/today` — Owner, Ops, Reader
- POST `/api/digest/today/build` — Owner, Ops
- POST `/api/digest/today/send` — Owner, Ops

## Email

`POSTMARK_SERVER_TOKEN` set → Postmark. Development and no token → `data/digests/{date}-{id}.html` and `.eml`. Non-dev without token → 503, does not pretend sent.

Subject: `PulseBuild · {date} · {N} Act items` or `Quiet morning`.

## Nightly

```bash
cd backend && python -m scripts.send_morning_digests
```

Cron (06:10 Asia/Dubai):

```
10 6 * * * cd /opt/pulsebuild/backend && .venv/bin/python -m scripts.send_morning_digests
```

## Env

```
POSTMARK_SERVER_TOKEN=
MAIL_FROM=briefing@pulsebuild.local
WEB_BASE_URL=http://localhost:3000
APP_ENV=development
```
