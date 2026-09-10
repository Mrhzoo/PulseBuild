# S16 Billing, onboarding, settings

- `/app/billing` status + Owner checkout/pack/portal. Stub writes `data/billing/` and returns `?session=`.
- `/app/onboarding` 4 steps: project → invite → WhatsApp optional → complete.
- `/app/settings` theme/locale, people, invite, own WhatsApp.
- Old `/billing` and `/onboarding` redirect.

Reader cannot checkout or invite (`require_owner` / `require_write`).
