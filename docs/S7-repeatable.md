# S7 Repeatable product

AED billing first. Email remains the SLA. Live LLM stays off.

## Billing

Pilot plan includes 3 projects. Extra pack via Checkout `addon: true`.

- `POST /api/billing/checkout` Owner only. Stub when `BILLING_STUB=true` or no Stripe key / development.
- `GET /api/billing/status` plan, quota, used.
- `POST /api/billing/webhook` verifies `Stripe-Signature` when a webhook secret is set.
- `POST /api/projects` returns **402** when `billing_status` is active/past_due and quota is full. Trialing may exceed (soft).

## i18n

UI `en` + `ar` in `frontend/src/i18n`. Toggle persists `pb_locale`. Email stays English in S7.

## WhatsApp

Template-first outside development. `GET /api/whatsapp/webhook` Meta verify. Failures never block email. See `docs/S7-meta-whatsapp.md`.

## Assisted-ops

`ASSISTED_OPS_REQUIRES_TICKET=true`. Missing ticket → 400. Exception lane for agent bugs, not daily consulting.

## Onboarding

`/onboarding` then `POST /api/onboarding/complete`. Incomplete tenants stay usable.
