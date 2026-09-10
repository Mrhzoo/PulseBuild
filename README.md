# PulseBuild

SME project-risk intelligence for UAE construction first. Email is the SLA channel.

- S0–S9 closed
- **S10** design system on `main` (dark/light + en/ar, shared tokens)
- Next: S11 cinematic login — not started

Theme: `localStorage.pb_theme` (`dark` default). Locale: `pb_locale`. See `docs/S10-design-system.md`.

## Local demo

```bash
docker compose up -d
cd backend && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload --port 8000
cd ../frontend && npm run dev
```

- Landing: http://localhost:3000/
- Digest: http://localhost:3000/app
- Login: http://localhost:3000/login

Seed: `owner@demo.pulsebuild.local` / `demo-owner-pass`
