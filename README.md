# PulseBuild

Morning project-risk briefings for UAE construction SMEs. Email is the SLA. WhatsApp is best-effort. Act cards require an evidence pointer.

S0–S19 closed. **S20** i18n + marketing honesty on `main`.

Theme: `pb_theme`. Locale: `pb_locale`.

## Local demo

```bash
docker compose up -d
cd backend && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload --port 8000
cd ../frontend && npm run dev
```

- Landing: http://localhost:3000/
- Login: http://localhost:3000/login (also http://127.0.0.1:3000)
- Digest: http://localhost:3000/app

Seed: `owner@demo.pulsebuild.local` / `demo-owner-pass`

Morning cron: `cd backend && python -m scripts.send_morning_digests`
