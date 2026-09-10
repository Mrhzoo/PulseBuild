# S8 Auth

JWT is stateless. Email remains the briefing SLA.

## `POST /api/auth/login`

```json
{
  "access_token": "…",
  "token_type": "bearer",
  "role": "owner",
  "email": "owner@demo.pulsebuild.local",
  "tenant_name": "Demo MEP LLC",
  "tenant_id": "…",
  "user_id": "…",
  "whatsapp_e164": null
}
```

Store `access_token` as `pb_token` and `role` as `pb_role`.

## `GET /api/auth/me`

Bearer required. Returns user + role + tenant.

## `POST /api/auth/logout`

No-op on the server. Client must drop `pb_token`.

## `PATCH /api/auth/me` (also `/api/auth/users/me`)

Owner/Ops self-update. Body `{ "whatsapp_e164": "+9715…" }`.

Temporary UI: `/login` until S11 restyle.
