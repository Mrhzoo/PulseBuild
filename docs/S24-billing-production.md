# S24 Billing production

## Modes
Live when `STRIPE_SECRET_KEY` is set **and** `BILLING_STUB=false`.
Also set `STRIPE_PRICE_PILOT_AED`, `STRIPE_PRICE_PROJECT_ADDON_AED`, `STRIPE_WEBHOOK_SECRET`.

Stub **only** when `APP_ENV` is not `production` and (`BILLING_STUB=true` or development).
`APP_ENV=production` never writes a fake `cs_stub` — missing keys → `POST /api/billing/checkout|portal` **503** `billing not configured`. UI shows that copy.

## Trial → active
New tenants start `billing_status=trialing`, `project_quota=3`.
Checkout Session completed (pilot price, `payment_status=paid`) → webhook sets `active` + stores customer id.
Addon checkout metadata `addon=1` → quota += 3.
`invoice.payment_failed` → `past_due`.
`customer.subscription.deleted` → `canceled`.
Quota 402 still applies while `trialing` / `active` / `past_due`.

## Endpoints
- `GET /api/billing/status` — `stripe_live`, `configured`, `billing_not_configured`, `stub`
- `POST /api/billing/checkout` `{addon?}` — Owner
- `POST /api/billing/portal` — Owner, needs customer id when live
- `POST /api/billing/webhook` — Stripe signature required when live or secret set

Pricing CTAs go to `/app/billing` (login `?next=/app/billing` if anonymous).
