# PulseBuild

SME project-risk intelligence for UAE construction first. Email is the SLA channel.

- S0–S8 closed
- **S9** marketing landing on `main` (`/` static, digest at `/app`)
- Next: S10 light/dark — not started

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
