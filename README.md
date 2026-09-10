# PulseBuild

SME project-risk intelligence for UAE construction first. Email is the SLA channel.

- S0–S7 closed
- **S8** remaining product on `main` (human auth, WhatsApp self-update, i18n parity)
- Next: visual rebuild (S9+) — not started

## Local demo

```bash
docker compose up -d
cd backend && alembic upgrade head && python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

Seed logins:

- Owner `owner@demo.pulsebuild.local` / `demo-owner-pass`
- Reader `reader@demo.pulsebuild.local` / `demo-reader-pass`

Open `/login`, then today’s digest. See `docs/S8-auth.md`.
