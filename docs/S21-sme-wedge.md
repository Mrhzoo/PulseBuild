# S21 SME wedge

## GC pack
`POST /api/flags/pack` (write) builds one share token listing flagged **Act** cards with pointers.
Public: `GET /api/share/{token}` returns `{pack:true, watermark:"For coordination only", cards:[...]}`.
Revoke the pack token or any member flag; pack view drops revoked members.

## IPC / look-ahead
Digest `cues[]` only when source text already names IPC/retention **and** a date window. Timezone: Asia/Dubai. No invented amounts.

## Signed VO → Act
`change_order` emits Act only with approval phrase + evidence pointer (confidence ≥ 0.78 so orchestrator keeps Act).

## Inbound status
`GET /api/inbound/status` — forward addresses, last inbound parse, stub honesty.

## Demo smoke
1. Login owner → upload delay/IPC/VO files → Run agents → digest cues.
2. Flag an Act → Flags → Create pack → open `/share/{token}` watermark.
3. Revoke pack or member flag → share 410 or card dropped.
4. Settings inbound card — stub copy if inbound not live.
5. Reader: no pack button.
