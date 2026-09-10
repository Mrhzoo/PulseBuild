"""Inbound email stub. No outbound mail. Not production Postmark."""

from __future__ import annotations

import hashlib
import logging
import secrets
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal
from app.config import settings
from app.db import get_session
from app.ingest.pipeline import ingest_document
from app.models.orm import Document, Project, Tenant
from app.services.audit import write_audit
from app.services.crypto_store import write_encrypted
from app.services.matching import match_inbound

logger = logging.getLogger("pulsebuild.inbound")
router = APIRouter(tags=["inbound"])


def _check_secret(header_value: str | None) -> None:
    expected = (settings.postmark_inbound_secret or "").strip()
    if expected:
        if not header_value or not secrets.compare_digest(header_value, expected):
            raise HTTPException(401, "inbound secret")
        return
    if settings.app_env != "development":
        raise HTTPException(401, "POSTMARK_INBOUND_SECRET required")
    logger.warning("inbound email accepted without secret because APP_ENV=development")


@router.get("/inbound/status")
async def inbound_status(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> dict:
    secret = bool((settings.postmark_inbound_secret or "").strip())
    projects = (await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all()
    last = (await session.execute(select(Document).where(Document.tenant_id == principal.tenant_id, Document.source_type == "email").order_by(Document.created_at.desc()))).scalars().first()
    return {
        "configured": secret,
        "app_env": settings.app_env,
        "webhook_path": "/api/inbound/email",
        "note": "Send yourself a test after Postmark inbound points at /api/inbound/email. Until then this is a stub.",
        "checklist": [
            {"id": "secret", "label": "POSTMARK_INBOUND_SECRET set", "ok": secret},
            {"id": "webhook", "label": "Postmark inbound webhook → POST /api/inbound/email", "ok": False},
            {"id": "forward", "label": "Forward a project address to yourself", "ok": bool(projects)},
        ],
        "forwards": [{"project": p.name, "forward_address": p.forward_address} for p in projects if p.forward_address],
        "last_inbound": {"filename": last.filename, "parse_status": last.parse_status} if last else None,
    }


@router.post("/inbound/email")
async def inbound_email(
    payload: dict | None = None,
    session: AsyncSession = Depends(get_session),
    x_inbound_secret: str | None = Header(default=None, alias="X-Inbound-Secret"),
) -> dict:
    _check_secret(x_inbound_secret)
    return await _ingest_stub(session, payload or {}, attachments=[])


@router.post("/inbound/email/multipart")
async def inbound_email_multipart(
    from_addr: str = Form(default=""),
    to: str = Form(default=""),
    subject: str = Form(default=""),
    text_body: str = Form(default=""),
    tenant_slug: str = Form(default="demo"),
    files: list[UploadFile] | None = File(default=None),
    session: AsyncSession = Depends(get_session),
    x_inbound_secret: str | None = Header(default=None, alias="X-Inbound-Secret"),
) -> dict:
    _check_secret(x_inbound_secret)
    attachments = [(item.filename or "attachment", await item.read()) for item in files or []]
    return await _ingest_stub(
        session,
        {"from": from_addr, "to": to, "subject": subject, "text_body": text_body, "tenant_slug": tenant_slug},
        attachments=attachments,
    )


async def _ingest_stub(session: AsyncSession, body: dict[str, Any], attachments: list[tuple[str, bytes]]) -> dict:
    slug = (body.get("tenant_slug") or "demo").strip()
    tenant = None
    if body.get("tenant_id"):
        try:
            tenant = await session.get(Tenant, UUID(str(body["tenant_id"])))
        except Exception:
            tenant = None
    if tenant is None:
        tenant = (await session.execute(select(Tenant).where(Tenant.slug == slug))).scalar_one_or_none()
    if tenant is None:
        raise HTTPException(404, "tenant")

    subject = body.get("subject") or ""
    to_addr = body.get("to") or body.get("to_address") or ""
    text_body = body.get("text_body") or body.get("text") or ""
    from_addr = body.get("from") or body.get("from_addr") or ""
    raw = f"From: {from_addr}\nTo: {to_addr}\nSubject: {subject}\n\n{text_body}".encode("utf-8")

    match = await match_inbound(session, tenant.id, to_address=to_addr, subject=subject, filename=None)
    created = [
        await _store_and_ingest(
            session,
            tenant_id=tenant.id,
            assigned=match.project_id,
            filename="inbound.eml",
            raw=raw,
            source_type="email",
            subject=subject,
        )
    ]
    for name, blob in attachments:
        extra = await match_inbound(session, tenant.id, to_address=to_addr, subject=subject, filename=name)
        created.append(
            await _store_and_ingest(
                session,
                tenant_id=tenant.id,
                assigned=extra.project_id or match.project_id,
                filename=name,
                raw=blob,
                source_type="upload",
                subject=subject,
            )
        )
    await write_audit(
        session,
        tenant_id=tenant.id,
        actor="inbound.email",
        action="inbound.email",
        entity_type="document",
        entity_id=created[0]["id"],
        after={"subject": subject, "match_method": match.method},
    )
    await session.commit()
    return {
        "documents": created,
        "match_method": match.method,
        "unassigned": match.project_id is None,
        "note": "Inbound stub only. No outbound mail.",
    }


async def _store_and_ingest(session, *, tenant_id, assigned, filename, raw, source_type, subject):
    digest = hashlib.sha256(raw).hexdigest()
    storage_key = f"{tenant_id}/{digest}/{filename}"
    write_encrypted(storage_key, raw)
    doc = Document(
        tenant_id=tenant_id,
        project_id=assigned,
        source_type=source_type,
        filename=filename,
        content_hash=digest,
        storage_key=storage_key,
        extracted_text="",
        language="mixed",
        parse_status="pending",
    )
    session.add(doc)
    await session.flush()
    events = await ingest_document(session, tenant_id, doc.id)
    return {
        "id": str(doc.id),
        "filename": filename,
        "project_id": str(doc.project_id) if doc.project_id else None,
        "unassigned": doc.project_id is None,
        "parse_status": doc.parse_status,
        "event_count": len(events),
        "subject": subject,
    }
