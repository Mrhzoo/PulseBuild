# S21 SME wedge

## GC pack (S21b)
Packs are rows in **`share_packs`**, not `flags`.
`POST /api/flags/pack` (write) copies currently flagged **Act** ids into `flag_ids` JSONB and issues a new `share_token`.
That insert never touches `uq_flags_active_tenant_finding`.

Public: `GET /api/share/{token}` looks up `flags.share_token` first, then `share_packs.share_token`.
Pack payload: `{pack:true, watermark:"For coordination only", cards:[...]}`.
Revoke: `POST /api/flags/{pack_id}/revoke-share` sets `share_packs.revoked_at`.
Revoked pack → 410. Revoked member flag drops out of the pack view.

Alembic: `0008_share_packs`.

## IPC / look-ahead
Digest `cues[]` only when source text already names IPC/retention **and** a date window. Timezone: Asia/Dubai. No invented amounts.

## Signed VO → Act
`change_order` emits Act only with approval phrase + evidence pointer (confidence ≥ 0.78).

## Inbound status
`GET /api/inbound/status` — forward addresses, last inbound parse, stub honesty.

## Demo smoke
1. `alembic upgrade head`
2. Login owner → upload → Run agents → flag an Act.
3. `POST /api/flags/pack` → 200 + `share_url`.
4. Open `/share/{token}` — watermark + cards.
5. Revoke pack → share 410.
6. Reader: pack POST 403.
