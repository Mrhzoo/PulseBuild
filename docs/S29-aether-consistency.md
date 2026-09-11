# S29 — Full-site Aether consistency

Tip: full-site kit on marketing, login, share, AppShell, and `/app/*`.

## Routes
- Marketing: `/` `LandingAether`, `/product` `/pricing` `/case-studies` `/contact` via `MarketingFrame` + sky wash + `ae-footer`
- `/login` kit card; locale/theme tools use i18n
- `/share/[token]` aether proof cards
- AppShell `.ae-nav` / `.ae-shell` — same wordmark and `.ae-btn`
- `/app` Morning Command tiles; `/app/projects` `/app/flags` `/app/billing` `/app/settings` `/app/onboarding`

## Fixes
- Flags: Open list is `!share_revoked`; revoked listed separately
- Theme name `studio` remapped to `light`
- Next overlay badge hidden in CSS (`[data-next-badge]`) — not a product issue

## APIs
Unchanged. Owner / Ops / Reader gates unchanged. No public signup.
