# S31 — Publish-ready without public hosting

PulseBuild is founder-led. There is **no public self-serve signup** and **no public host required** to rehearse a paying pilot.

`POST /api/auth/register` is **default-deny**.

- `APP_ENV=production` → always `403 registration_closed` (even if `PILOT_INVITE_CODE` is set).
- Other envs → open only when `PILOT_INVITE_CODE` is set **and** the body `invite_code` matches. Empty code = closed.

Create the first Owner with the production-safe script (not `scripts.seed`):

```bash
cd backend
python -m scripts.create_pilot_owner \
  --email owner@firm.ae \
  --company "Marina MEP"
```

Optional: `--password`, `--slug`, or env `PILOT_OWNER_EMAIL` / `PILOT_OWNER_PASSWORD` / `PILOT_COMPANY_NAME` / `PILOT_COMPANY_SLUG`. A password is generated if omitted — print once, store it.

Demo seed (`python -m scripts.seed`) remains **refused in production**.

## Local production rehearsal (laptop / LAN — not a public host)

Run the real morning path on the founder machine. Do not publish DNS.

```bash
# data plane local
docker compose up -d postgres redis minio

# API as production
export APP_ENV=production
export APP_SECRET_KEY=  # long random
export FILE_ENCRYPTION_KEY=  # Fernet
export POSTMARK_SERVER_TOKEN=  # live token
export MAIL_FROM=briefing@yourdomain
export EMAIL_STUB=false
export BILLING_STUB=false   # only if Stripe keys are real; else leave true
export WEB_BASE_URL=http://127.0.0.1:3000
export API_BASE_URL=http://127.0.0.1:8000

cd backend && alembic upgrade head
python -m scripts.create_pilot_owner --email you@firm.ae --company "Your Co"
uvicorn app.main:app --host 127.0.0.1 --port 8000

# prove the gate
curl -sS -o /tmp/reg.json -w "%{http_code}" -X POST http://127.0.0.1:8000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"open@x.com","password":"x","company_name":"Nope","invite_code":"anything"}'
# expect 403
```

Morning SLA locally (Asia/Dubai 06:00 = 02:00 UTC):

```bash
cd backend && python -m scripts.send_morning_digests
# or crontab on this machine only:
# 0 2 * * * cd /path/backend && .venv/bin/python -m scripts.send_morning_digests
```

Inbound Postmark webhook can point at a tunnel **you** control, or wait — email outbound is the SLA. Do not list a public URL as the product.

Sign in at `/login` with the owner from `create_pilot_owner`. Upload a live file. Confirm the digest email.

## Out of scope
Public hosting, invite UI, self-serve checkout for strangers.
