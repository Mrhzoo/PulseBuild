# S32 — User-set digest schedule

Email is still the SLA. The clock is per tenant.

- `digest_timezone` — IANA (default `Asia/Dubai` for UAE, `Asia/Riyadh` for Saudi)
- `digest_local_time` — `HH:MM` 24h (default `07:00`). Not marketed as morning-only.

Settings → Prefs → timezone + local time. `PATCH /api/settings/tenant`.

Cron every **15 minutes**. A tenant is emailed only when local time is in the 15-minute window **and** that local calendar day has not already been emailed. `POST /api/digest/today/send` still sends anytime.

```bash
# every 15 minutes
*/15 * * * * cd /opt/pulsebuild/backend && .venv/bin/python -m scripts.send_morning_digests
# alias:
# python -m scripts.send_scheduled_digests
```
