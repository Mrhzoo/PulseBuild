# S19 Adoption UX

- Onboarding keeps `forward_address` on later steps with copy + upload link.
- Digest header shows `last_data_received` and `unassigned_count`.
- Run agents banner: created / updated / dropped, or no new findings.
- Trial (`trialing`) hits the same project quota as paid; 402 + billing CTA.
- Stub checkout does **not** change quota until a webhook is applied.
- Any member: `POST /api/people/me/whatsapp`. Morning cron sends WA after email; WA failure never blocks email.
- Reader shell hides Billing and Onboarding.
