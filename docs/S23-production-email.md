# S23 Production email + cron

## When mail is real
- `POSTMARK_SERVER_TOKEN` set → Postmark outbound.
- Else if `APP_ENV=development` **or** `EMAIL_STUB=true` → write `.eml` under `data/digests/` (`via=stub`).
- Else `POST /api/digest/today/send` returns **503**. Cron logs and skips that tenant.

`GET /api/health` → `{ email_configured: bool }` (no token leaked).

WhatsApp is never recorded as delivered unless the Graph call returns `whatsapp`. Stub/fail → email SLA only.

## Scheduled job (per-tenant clock)

Do **not** treat 06:00 Asia/Dubai as a product rule. Owner sets IANA timezone + local HH:MM (default 07:00). Run the job **every 15 minutes**; it no-ops tenants outside their window and tenants already emailed that local day. See [S32-digest-schedule.md](S32-digest-schedule.md).

```bash
cd /opt/pulsebuild/backend
python -m scripts.send_morning_digests
# alias: python -m scripts.send_scheduled_digests
```

### cron
```
*/15 * * * * www-data cd /opt/pulsebuild/backend && /opt/pulsebuild/.venv/bin/python -m scripts.send_morning_digests >> /var/log/pulsebuild-digest.log 2>&1
```

### systemd timer
`pulsebuild-digest.service` + `OnCalendar=*-*-* *:00,15,30,45:00`.

### Fly.io
```
[processes]
  cron = "python -m scripts.send_morning_digests"
```
plus a 15-minute schedule, or an external cron hitting a locked admin endpoint later (not in S23).

## Send UI
Success line uses `delivered_via` + `whatsapp`. Failed WA says WhatsApp was not sent. 503 shows send failed — email not configured.
