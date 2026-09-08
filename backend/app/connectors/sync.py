from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.generic_https import collect
from app.ingest.pipeline import ingest_document, sniff_parser
from app.models.orm import Document, PortalConnection
from app.services.crypto_store import write_encrypted
from app.services.matching import match_inbound


async def sync_portal(session: AsyncSession, tenant_id: UUID, base_url: str = "", api_key: str = "") -> dict:
    files, result = await collect(base_url, api_key)
    created = 0
    for item in files:
        digest = hashlib.sha256(item.data).hexdigest()
        existing = (await session.execute(select(Document).where(Document.tenant_id == tenant_id, Document.content_hash == digest))).scalar_one_or_none()
        if existing:
            continue
        match = await match_inbound(session, tenant_id, filename=item.filename)
        storage_key = f"{tenant_id}/{digest}/{item.filename}"
        write_encrypted(storage_key, item.data)
        kind = sniff_parser(item.filename, "upload")
        source_type = {"pdf": "pdf", "excel": "excel", "email": "email"}.get(kind, "portal")
        doc = Document(tenant_id=tenant_id, project_id=match.project_id, source_type=source_type, filename=item.filename, content_hash=digest, storage_key=storage_key, extracted_text="", language="mixed", parse_status="pending")
        session.add(doc)
        await session.flush()
        await ingest_document(session, tenant_id, doc.id)
        created += 1
    conn = (await session.execute(select(PortalConnection).where(PortalConnection.tenant_id == tenant_id))).scalar_one_or_none()
    if conn is None:
        conn = PortalConnection(tenant_id=tenant_id)
        session.add(conn)
    conn.connector_type = "generic_https"
    conn.base_url = base_url or conn.base_url
    conn.last_sync_at = datetime.now(timezone.utc)
    conn.last_status = "ok" if not result.errors else "error"
    conn.last_error = "; ".join(result.errors) if result.errors else None
    conn.docs_pulled = created
    await session.flush()
    return {"docs_pulled": created, "listed": result.docs_pulled, "mode": result.mode, "errors": result.errors, "last_sync_at": conn.last_sync_at.isoformat(), "status": conn.last_status}
