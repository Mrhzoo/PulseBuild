# S24 Billing production

## Modes
Live when `STRIPE_SECRET_KEY` is set **and** `BILLING_STUB=false`.
Also set `STRIPE_PRICE_PILOT_AED`, `STRIPE_PRICE_PROJECT_ADDON_AED`, `STRIPE_WEBHOOK_SECRET`.

Stub only when `BILLING_STUB=true` **or** `APP_ENV=development` without live keys.
Production without keys → `POST /api/billing/checkout|portal` returns **503** `billing not configured`. UI shows that copy. No fake `cs_stub` success.

## Trial → active
New tenants start `billing_status=trialing`, `project_quota=3`.
Checkout Session completed (pilot price) → webhook sets `active` + stores customer id.
Addon checkout metadata `addon=1` → quota += 3.
`invoice.payment_failed` → `past_due`.
`customer.subscription.deleted` → `canceled`.
Quota 402 still applies while `trialing` / `active` / `past_due`.

## Endpoints
- `GET /api/billing/status` — `stripe_live`, `configured`, `billing_not_configured`, `stub`
- `POST /api/billing/checkout` `{addon?}` — Owner
- `POST /api/billing/portal` — Owner, needs customer id when live
- `POST /api/billing/webhook` — Stripe signature required when live or secret set

Pricing CTAs go to `/app/billing` (login next if anonymous).
