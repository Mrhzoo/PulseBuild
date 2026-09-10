# S23 Production email + cron

## When mail is real
- `POSTMARK_SERVER_TOKEN` set → Postmark outbound.
- Else if `APP_ENV=development` **or** `EMAIL_STUB=true` → write `.eml` under `data/digests/` (`via=stub`).
- Else `POST /api/digest/today/send` returns **503**. Cron logs and skips that tenant.

`GET /api/health` → `{ email_configured: bool }` (no token leaked).

WhatsApp is never recorded as delivered unless the Graph call returns `whatsapp`. Stub/fail → email SLA only.

## Morning job (Asia/Dubai)
UAE pilots: run shortly after 06:00 Asia/Dubai (02:00 UTC in winter / 02:00–03:00 depending on DST — Dubai has no DST, so **02:00 UTC**).

```bash
cd /opt/pulsebuild/backend
python -m scripts.send_morning_digests
```

### cron
```
0 2 * * * www-data cd /opt/pulsebuild/backend && /opt/pulsebuild/.venv/bin/python -m scripts.send_morning_digests >> /var/log/pulsebuild-morning.log 2>&1
```

### systemd timer
`pulsebuild-morning.service` + `OnCalendar=*-*-* 06:00:00` with `TZ=Asia/Dubai`.

### Fly.io
```
[processes]
  cron = "python -m scripts.send_morning_digests"
```
plus a schedule machine, or an external cron hitting a locked admin endpoint later (not in S23).

## Send UI
Success line uses `delivered_via` + `whatsapp`. Failed WA says WhatsApp was not sent. 503 shows send failed — email not configured.
