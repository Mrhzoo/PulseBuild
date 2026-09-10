from __future__ import annotations

import hashlib
import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import Principal, get_principal, require_write
from app.db import get_session
from app.ingest.pipeline import ingest_document, sniff_parser
from app.models.orm import Document, Event, Membership, Project, Role, Tenant, User
from app.security import hash_password
from app.services.audit import write_audit
from app.services.billing import enforce_project_quota
from app.services.crypto_store import write_encrypted
from app.services.findings_run import maybe_auto_run, run_project_agents
from app.services.matching import match_inbound
from app.services.tenancy import require_project_for_tenant

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"ok": True, "product": "pulsebuild", "channel": "email"}


@router.get("/projects")
async def list_projects(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all()
    return [{"id": str(p.id), "name": p.name, "code": p.code, "slug": p.slug, "forward_address": p.forward_address} for p in rows]


@router.post("/projects")
async def create_project(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    await enforce_project_quota(session, tenant)
    code = payload["code"].strip()
    slug = payload.get("slug") or code.lower()
    project = Project(tenant_id=principal.tenant_id, name=payload["name"], code=code, slug=slug, match_aliases=payload.get("aliases", []), forward_address=f"{slug}@{tenant.slug}.pulsebuild.local")
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return {"id": str(project.id), "forward_address": project.forward_address}


@router.get("/documents")
async def list_documents(unassigned: int = 0, principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> list[dict]:
    stmt = select(Document).where(Document.tenant_id == principal.tenant_id)
    if unassigned:
        stmt = stmt.where(Document.project_id.is_(None))
    rows = (await session.execute(stmt.order_by(Document.created_at.desc()))).scalars().all()
    return [{"id": str(d.id), "filename": d.filename, "project_id": str(d.project_id) if d.project_id else None, "parse_status": d.parse_status, "unassigned": d.project_id is None} for d in rows]


@router.post("/documents")
async def upload_document(file: UploadFile = File(...), project_id: str | None = Form(default=None), subject: str | None = Form(default=None), principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    raw = await file.read()
    digest = hashlib.sha256(raw).hexdigest()
    try:
        text = raw.decode("utf-8", errors="ignore")[:20_000]
    except Exception:
        text = ""
    match = await match_inbound(session, principal.tenant_id, subject=subject, filename=file.filename)
    assigned = None
    if project_id:
        project = await require_project_for_tenant(session, principal.tenant_id, UUID(project_id))
        assigned = project.id
    else:
        assigned = match.project_id
    storage_key = f"{principal.tenant_id}/{digest}/{file.filename}"
    write_encrypted(storage_key, raw)
    kind = sniff_parser(file.filename or "", "upload")
    source_type = {"pdf": "pdf", "excel": "excel", "email": "email", "whatsapp": "whatsapp"}.get(kind, "upload")
    doc = Document(tenant_id=principal.tenant_id, project_id=assigned, source_type=source_type, filename=file.filename or "untitled", content_hash=digest, storage_key=storage_key, extracted_text=text, language="mixed", parse_status="pending")
    session.add(doc)
    await session.flush()
    events = await ingest_document(session, principal.tenant_id, doc.id)
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="document.upload", entity_type="document", entity_id=str(doc.id), after={"filename": file.filename, "project_id": str(assigned) if assigned else None})
    agents_run = await maybe_auto_run(session, principal.tenant_id, doc.project_id, doc.parse_status)
    await session.commit()
    await session.refresh(doc)
    return {"id": str(doc.id), "project_id": str(doc.project_id) if doc.project_id else None, "unassigned": doc.project_id is None, "parse_status": doc.parse_status, "event_count": len(events), "match_method": match.method, "agents_run": agents_run}


@router.post("/documents/{document_id}/reassign")
async def reassign_document(document_id: UUID, payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    doc = await session.get(Document, document_id)
    if not doc or doc.tenant_id != principal.tenant_id:
        raise HTTPException(404, "document")
    before = str(doc.project_id)
    new_id = UUID(payload["project_id"]) if payload.get("project_id") else None
    if new_id is not None:
        await require_project_for_tenant(session, principal.tenant_id, new_id)
    doc.project_id = new_id
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="document.reassign", entity_type="document", entity_id=str(doc.id), before={"project_id": before}, after={"project_id": str(new_id) if new_id else None})
    agents_run = await maybe_auto_run(session, principal.tenant_id, new_id, doc.parse_status)
    await session.commit()
    return {"ok": True, "project_id": str(new_id) if new_id else None, "agents_run": agents_run}


@router.post("/documents/{document_id}/reingest")
async def reingest_document(document_id: UUID, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    doc = await session.get(Document, document_id)
    if not doc or doc.tenant_id != principal.tenant_id:
        raise HTTPException(404, "document")
    events = await ingest_document(session, principal.tenant_id, doc.id)
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="document.reingest", entity_type="document", entity_id=str(doc.id), after={"parse_status": doc.parse_status, "event_count": len(events)})
    agents_run = await maybe_auto_run(session, principal.tenant_id, doc.project_id, doc.parse_status)
    await session.commit()
    return {"id": str(doc.id), "parse_status": doc.parse_status, "event_count": len(events), "project_id": str(doc.project_id) if doc.project_id else None, "agents_run": agents_run}


@router.get("/projects/{project_id}/events")
async def list_project_events(project_id: UUID, principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> list[dict]:
    project = await session.get(Project, project_id)
    if not project or project.tenant_id != principal.tenant_id:
        raise HTTPException(404, "project")
    rows = (await session.execute(select(Event).where(Event.tenant_id == principal.tenant_id, Event.project_id == project_id).order_by(Event.created_at.desc()))).scalars().all()
    return [{"id": str(e.id), "type": e.type, "project_id": str(e.project_id) if e.project_id else None, "document_id": str(e.document_id) if e.document_id else None, "payload": e.payload, "confidence": e.confidence} for e in rows]


@router.post("/projects/{project_id}/run")
async def run_agents(project_id: UUID, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    project = await session.get(Project, project_id)
    if not project or project.tenant_id != principal.tenant_id:
        raise HTTPException(404, "project")
    out = await run_project_agents(session, principal.tenant_id, project)
    await session.commit()
    return out


@router.post("/people/invite")
async def invite_reader(payload: dict, principal: Principal = Depends(require_write), session: AsyncSession = Depends(get_session)) -> dict:
    if principal.role != Role.OWNER and payload.get("role", "reader") != "reader":
        raise HTTPException(403, "only owner can invite ops")
    role = Role.READER
    requested = payload.get("role", "reader")
    if requested == "ops" and principal.role == Role.OWNER:
        role = Role.OPS
    elif requested not in ("reader", "ops"):
        raise HTTPException(400, "role must be reader or ops")
    email = payload["email"].lower().strip()
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    temp_password = None
    if not user:
        temp_password = secrets.token_urlsafe(10)
        user = User(email=email, full_name=payload.get("full_name") or email, hashed_password=hash_password(temp_password))
        session.add(user)
        await session.flush()
    existing = (await session.execute(select(Membership).where(Membership.tenant_id == principal.tenant_id, Membership.user_id == user.id))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "already a member")
    session.add(Membership(tenant_id=principal.tenant_id, user_id=user.id, role=role))
    await write_audit(session, tenant_id=principal.tenant_id, actor=str(principal.user_id), action="member.invite", entity_type="user", entity_id=str(user.id), after={"role": role.value, "email": email})
    await session.commit()
    return {"user_id": str(user.id), "role": role.value, "email": email, "temporary_password": temp_password, "note": "Reader is read-only. Email invite delivery is stub until Postmark."}


@router.get("/people")
async def list_people(principal: Principal = Depends(get_principal), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.execute(select(Membership, User).join(User, User.id == Membership.user_id).where(Membership.tenant_id == principal.tenant_id))).all()
    return [{"user_id": str(u.id), "email": u.email, "name": u.full_name, "role": m.role.value, "whatsapp_e164": u.whatsapp_e164} for m, u in rows]
