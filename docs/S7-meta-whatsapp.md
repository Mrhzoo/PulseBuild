# Meta WhatsApp checklist

1. Meta Business app + WhatsApp product.
2. Approve a template (`WHATSAPP_TEMPLATE_NAME`), language `en`.
3. Copy phone number id → `WHATSAPP_PHONE_NUMBER_ID`.
4. Permanent token → `WHATSAPP_TOKEN`.
5. Set `WHATSAPP_VERIFY_TOKEN` and point the callback to `GET/POST /api/whatsapp/webhook`.
6. Flip `ENABLE_WHATSAPP_PUSH=true` only after template approval.
7. Keep `WHATSAPP_ALLOW_SESSION_TEXT=false` in production.
8. Email remains the morning SLA even when WhatsApp is live.
