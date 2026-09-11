# S3 Digest + morning briefing

The digest is the product. Agents write Findings. S3 ranks them into Act / Watch / Quiet / Ask and delivers the briefing by email.

## HTTP

- GET `/api/digest/today` — Owner, Ops, Reader
- POST `/api/digest/today/build` — Owner, Ops
- POST `/api/digest/today/send` — Owner, Ops

## Email

`POSTMARK_SERVER_TOKEN` set → Postmark. Development and no token → `data/digests/{date}-{id}.html` and `.eml`. Non-dev without token → 503, does not pretend sent.

Subject: `PulseBuild · {date} · {N} Act items` or `Quiet morning`.

## Scheduled send

Owner sets timezone + local HH:MM (S32). Cron every 15 minutes:

```bash
cd backend && python -m scripts.send_morning_digests
```

```
*/15 * * * * cd /opt/pulsebuild/backend && .venv/bin/python -m scripts.send_morning_digests
```

## Env

```
POSTMARK_SERVER_TOKEN=
MAIL_FROM=briefing@pulsebuild.local
WEB_BASE_URL=http://localhost:3000
APP_ENV=development
```
