# S4 Flag + share link

Mark a finding as “This affects us,” keep a note and audit trail, and mint a read-only URL. No auto-email to the main contractor.

One active flag per (tenant_id, finding_id). After dismiss you may flag again. Token is token_urlsafe(32).

## HTTP

- POST `/api/findings/{id}/flag` `{ "note": "..." }` → share_url
- POST `/api/findings/{id}/dismiss`
- GET `/api/flags` tenant-scoped open flags
- POST `/api/flags/{id}/dismiss`
- POST `/api/flags/{id}/revoke-share`
- GET `/api/share/{token}` public minimal card; revoked → 410

Audit: `flag_created`, `flag_dismissed`, `share_revoked`, `finding_dismissed`.

Reader cannot mutate (403). Token is the secret. Revoke invalidates the URL.
