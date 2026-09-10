# PulseBuild

SME project-risk intelligence for UAE construction first. Email is the SLA channel.

- S0–S10 closed
- **S11** cinematic login + app shell on `main`
- Next: S12 pricing — not started

Theme: `pb_theme`. Locale: `pb_locale`. See `docs/S10-design-system.md` and `docs/S11-auth-shell.md`.

## Local demo

```bash
docker compose up -d
cd backend && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload --port 8000
cd ../frontend && npm run dev
```

- Landing: http://localhost:3000/
- Login: http://localhost:3000/login
- Digest: http://localhost:3000/app

Seed: `owner@demo.pulsebuild.local` / `demo-owner-pass`
