# PulseBuild

Morning project-risk briefings for UAE construction SMEs. Email is the SLA. WhatsApp is best-effort. Act cards require an evidence pointer.

**S0–S31** on `main`. Public register is closed in production. Create a pilot Owner with `python -m scripts.create_pilot_owner` — see [docs/S31-publish-ready.md](docs/S31-publish-ready.md).

Theme default: bone studio. Locale: `pb_locale`.

## Local demo

```bash
docker compose up -d
cd backend && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload --port 8000
cd ../frontend && npm run dev
bash scripts/smoke_pilot.sh
```

- Landing: http://localhost:3000/
- Login: http://localhost:3000/login
- Digest: http://localhost:3000/app

Seed (dev only): `owner@demo.pulsebuild.local` / `demo-owner-pass`  
Seed is refused when `APP_ENV=production`.

Morning cron: `cd backend && python -m scripts.send_morning_digests`

Ship: [docs/DEPLOY.md](docs/DEPLOY.md) · Studio: [docs/S27-studio.md](docs/S27-studio.md)
