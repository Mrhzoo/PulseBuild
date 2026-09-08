"""Best-effort WhatsApp Cloud API notify. Email remains the SLA channel."""

from __future__ import annotations

from pathlib import Path
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.digest.payload import DigestPayload
from app.models.orm import Membership, User


def _preview_text(payload: DigestPayload) -> str:
    home = settings.web_base_url.rstrip("/")
    titles = [c.title for c in payload.act[:2]]
    bits = [f"PulseBuild {payload.date}: {len(payload.act)} Act"]
    if titles:
        bits.append(" · ".join(titles))
    bits.append(home)
    return " — ".join(bits)[:900]


def write_stub(payload: DigestPayload, numbers: list[str]) -> Path:
    folder = Path(settings.local_upload_dir).resolve().parent / "whatsapp"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{payload.date}-{payload.digest_id or 'preview'}.txt"
    path.write_text(f"to={','.join(numbers) or '(none)'}\n{_preview_text(payload)}\n", encoding="utf-8")
    return path


def _configured() -> bool:
    return bool(settings.enable_whatsapp_push and (settings.whatsapp_token or "").strip() and (settings.whatsapp_phone_number_id or "").strip() and settings.app_env != "development")


async def whatsapp_numbers(session: AsyncSession, tenant_id: UUID) -> list[str]:
    rows = (await session.execute(select(User.whatsapp_e164).join(Membership, Membership.user_id == User.id).where(Membership.tenant_id == tenant_id, User.is_active.is_(True), User.whatsapp_e164.is_not(None)))).scalars().all()
    return [n for n in rows if n and n.strip()]


async def notify_digest(payload: DigestPayload, numbers: list[str]) -> str:
    if not numbers:
        return "skipped"
    if not settings.enable_whatsapp_push or not _configured():
        write_stub(payload, numbers)
        return "stub"
    token = settings.whatsapp_token.strip()
    phone_id = settings.whatsapp_phone_number_id.strip()
    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    body_text = _preview_text(payload)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            for number in numbers:
                payload_json = {"messaging_product": "whatsapp", "to": number.lstrip("+"), "type": "text", "text": {"body": body_text}}
                if settings.whatsapp_template_name:
                    payload_json = {"messaging_product": "whatsapp", "to": number.lstrip("+"), "type": "template", "template": {"name": settings.whatsapp_template_name, "language": {"code": "en"}}}
                await client.post(url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=payload_json)
        return "whatsapp"
    except Exception:
        write_stub(payload, numbers)
        return "failed"
