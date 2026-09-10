# Deploy PulseBuild (pilot)

Recommended path: **Docker Compose for data + one API process + one Next process** behind HTTPS.
Assume TLS at the reverse proxy (Caddy / nginx / Fly). Set `WEB_BASE_URL` to the public `https://` origin.

## 1. Data plane

```bash
docker compose up -d postgres redis minio
```

## 2. Env (copy `.env.example`)

Required in production:

```
APP_ENV=production
APP_SECRET_KEY=  # long random
WEB_BASE_URL=https://app.example.com
API_BASE_URL=https://api.example.com
DATABASE_URL=postgresql+asyncpg://pulsebuild:...@postgres:5432/pulsebuild
FILE_ENCRYPTION_KEY=  # Fernet key
POSTMARK_SERVER_TOKEN=
POSTMARK_INBOUND_SECRET=
MAIL_FROM=briefing@example.com
BILLING_STUB=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PILOT_AED=
STRIPE_PRICE_PROJECT_ADDON_AED=
```

Optional: `ENABLE_WHATSAPP_PUSH`, Meta vars, `ENABLE_OCR`, `ENABLE_LIVE_LLM` (keep false until ready).

Do **not** run `python -m scripts.seed` in production.

## 3. API

```bash
cd backend
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Morning SLA (Asia/Dubai 06:00 = 02:00 UTC):

```
0 2 * * * cd /opt/pulsebuild/backend && .venv/bin/python -m scripts.send_morning_digests
```

## 4. Web

```bash
cd frontend
NEXT_PUBLIC_API_BASE_URL=https://api.example.com npm run build && npm start
```

CORS allows only `WEB_BASE_URL` when `APP_ENV=production`.

## Fly / Render
Same env list. One web process (API) + one cron/schedule for `python -m scripts.send_morning_digests`. Point Stripe + Postmark webhooks at `/api/billing/webhook` and `/api/inbound/email`.

## Smoke

```bash
API_BASE=https://api.example.com SMOKE_EMAIL=... SMOKE_PASSWORD=... bash scripts/smoke_pilot.sh
```
