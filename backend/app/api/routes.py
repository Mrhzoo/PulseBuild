from __future__ import annotations

import hashlib
import secrets
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import run_v1_graph
from app.api.deps import Principal, get_principal, require_write
from app.db import get_session
from app.eval.harness import run_golden
from app.ingest.pipeline import ingest_document, sniff_parser
from app.models.orm import (
    AgentName,
    Document,
    Event,
    Finding,
    Flag,
    Membership,
    Project,
    Role,
    Severity,
    Tenant,
    User,
)
from app.schemas.agents import ProjectSnapshot
from app.security import hash_password
from app.services.audit import write_audit
from app.services.crypto_store import write_encrypted
from app.services.matching import match_inbound
from app.services.tenancy import require_project_for_tenant

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"ok": True, "product": "pulsebuild", "channel": "email"}


@router.get("/eval/golden")
async def golden() -> dict:
    return run_golden()


@router.get("/projects")
async def list_projects(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    rows = (await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all()
    return [{"id": str(p.id), "name": p.name, "code": p.code, "slug": p.slug, "forward_address": p.forward_address} for p in rows]


@router.post("/projects")
async def create_project(
    payload: dict,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    tenant = await session.get(Tenant, principal.tenant_id)
    if not tenant:
        raise HTTPException(404, "tenant")
    code = payload["code"].strip()
    slug = payload.get("slug") or code.lower()
    project = Project(
        tenant_id=principal.tenant_id,
        name=payload["name"],
        code=code,
        slug=slug,
        match_aliases=payload.get("aliases", []),
        forward_address=f"{slug}@{tenant.slug}.pulsebuild.local",
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return {"id": str(project.id), "forward_address": project.forward_address}


@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    project_id: str | None = Form(default=None),
    subject: str | None = Form(default=None),
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    raw = await file.read()
    digest = hashlib.sha256(raw).hexdigest()
    text = ""
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
    doc = Document(
        tenant_id=principal.tenant_id,
        project_id=assigned,
        source_type=source_type,
        filename=file.filename or "untitled",
        content_hash=digest,
        storage_key=storage_key,
        extracted_text=text,
        language="mixed",
        parse_status="pending",
    )
    session.add(doc)
    await session.flush()
    events = await ingest_document(session, principal.tenant_id, doc.id)
    await write_audit(
        session,
        tenant_id=principal.tenant_id,
        actor=str(principal.user_id),
        action="document.upload",
        entity_type="document",
        entity_id=str(doc.id),
        after={"filename": file.filename, "project_id": str(assigned) if assigned else None},
    )
    await session.commit()
    await session.refresh(doc)
    return {
        "id": str(doc.id),
        "project_id": str(doc.project_id) if doc.project_id else None,
        "unassigned": doc.project_id is None,
        "parse_status": doc.parse_status,
        "event_count": len(events),
        "match_method": match.method,
    }


@router.post("/documents/{document_id}/reassign")
async def reassign_document(
    document_id: UUID,
    payload: dict,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    doc = await session.get(Document, document_id)
    if not doc or doc.tenant_id != principal.tenant_id:
        raise HTTPException(404, "document")
    before = str(doc.project_id)
    new_id = UUID(payload["project_id"]) if payload.get("project_id") else None
    if new_id is not None:
        await require_project_for_tenant(session, principal.tenant_id, new_id)
    doc.project_id = new_id
    await write_audit(
        session,
        tenant_id=principal.tenant_id,
        actor=str(principal.user_id),
        action="document.reassign",
        entity_type="document",
        entity_id=str(doc.id),
        before={"project_id": before},
        after={"project_id": str(new_id) if new_id else None},
    )
    await session.commit()
    return {"ok": True, "project_id": str(new_id) if new_id else None}


@router.post("/documents/{document_id}/reingest")
async def reingest_document(
    document_id: UUID,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    doc = await session.get(Document, document_id)
    if not doc or doc.tenant_id != principal.tenant_id:
        raise HTTPException(404, "document")
    events = await ingest_document(session, principal.tenant_id, doc.id)
    await write_audit(
        session,
        tenant_id=principal.tenant_id,
        actor=str(principal.user_id),
        action="document.reingest",
        entity_type="document",
        entity_id=str(doc.id),
        after={"parse_status": doc.parse_status, "event_count": len(events)},
    )
    await session.commit()
    return {
        "id": str(doc.id),
        "parse_status": doc.parse_status,
        "event_count": len(events),
        "project_id": str(doc.project_id) if doc.project_id else None,
    }


@router.get("/projects/{project_id}/events")
async def list_project_events(
    project_id: UUID,
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    project = await session.get(Project, project_id)
    if not project or project.tenant_id != principal.tenant_id:
        raise HTTPException(404, "project")
    rows = (
        await session.execute(
            select(Event)
            .where(Event.tenant_id == principal.tenant_id, Event.project_id == project_id)
            .order_by(Event.created_at.desc())
        )
    ).scalars().all()
    return [
        {
            "id": str(e.id),
            "type": e.type,
            "project_id": str(e.project_id) if e.project_id else None,
            "document_id": str(e.document_id) if e.document_id else None,
            "payload": e.payload,
            "confidence": e.confidence,
        }
        for e in rows
    ]


@router.post("/projects/{project_id}/run")
async def run_agents(
    project_id: UUID,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    project = await session.get(Project, project_id)
    if not project or project.tenant_id != principal.tenant_id:
        raise HTTPException(404, "project")
    docs = (
        await session.execute(
            select(Document).where(Document.tenant_id == principal.tenant_id, Document.project_id == project_id)
        )
    ).scalars().all()
    snapshot = ProjectSnapshot(
        project_id=str(project.id),
        project_name=project.name,
        tenant_role=project.tenant_role.value,
        currency=project.currency.value,
        document_excerpts=[{"pointer": f"{d.id}#extract", "text": d.extracted_text} for d in docs if d.extracted_text],
    )
    result = run_v1_graph(snapshot)
    created = []
    for card in result.cards:
        finding = Finding(
            tenant_id=principal.tenant_id,
            project_id=project_id,
            agent=AgentName.ORCHESTRATOR,
            severity=Severity(card.severity),
            title=card.title,
            why_it_hits_us=card.why_it_hits_us,
            evidence_snippet=card.evidence.snippet,
            evidence_pointer=card.evidence.pointer,
            confidence=card.confidence,
            rationale=card.rationale,
        )
        if finding.severity == Severity.ACT and not finding.evidence_pointer:
            continue
        session.add(finding)
        created.append(card.title)
    await session.commit()
    return {"created": created, "dropped": result.dropped}


@router.get("/digest/today")
async def digest_today(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> dict:
    findings = (
        await session.execute(
            select(Finding)
            .where(Finding.tenant_id == principal.tenant_id, Finding.dismissed.is_(False))
            .order_by(Finding.created_at.desc())
        )
    ).scalars().all()
    unassigned = (
        await session.execute(
            select(func.count(Document.id)).where(Document.tenant_id == principal.tenant_id, Document.project_id.is_(None))
        )
    ).scalar_one()
    projects = (await session.execute(select(Project).where(Project.tenant_id == principal.tenant_id))).scalars().all()
    by_project = {p.id: p.name for p in projects}

    def pack(f: Finding) -> dict:
        return {
            "id": str(f.id),
            "project_id": str(f.project_id),
            "project_name": by_project.get(f.project_id, ""),
            "severity": f.severity.value,
            "title": f.title,
            "why_it_hits_us": f.why_it_hits_us,
            "evidence_snippet": f.evidence_snippet,
            "evidence_pointer": f.evidence_pointer,
            "confidence": f.confidence,
        }

    act = [pack(f) for f in findings if f.severity == Severity.ACT][:5]
    watch = [pack(f) for f in findings if f.severity == Severity.WATCH]
    low = [pack(f) for f in findings if f.severity == Severity.LOW]
    quiet = [p.name for p in projects if all(f.project_id != p.id for f in findings)]
    return {
        "date": str(date.today()),
        "channel_promise": "Morning briefing by email.",
        "act": act,
        "watch": watch,
        "low": low,
        "quiet_projects": quiet,
        "unassigned_count": int(unassigned or 0),
        "ask": (f"{unassigned} files need a project" if unassigned else None),
    }


@router.post("/people/invite")
async def invite_reader(
    payload: dict,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
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
    existing = (
        await session.execute(
            select(Membership).where(Membership.tenant_id == principal.tenant_id, Membership.user_id == user.id)
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "already a member")
    session.add(Membership(tenant_id=principal.tenant_id, user_id=user.id, role=role))
    await write_audit(
        session,
        tenant_id=principal.tenant_id,
        actor=str(principal.user_id),
        action="member.invite",
        entity_type="user",
        entity_id=str(user.id),
        after={"role": role.value, "email": email},
    )
    await session.commit()
    return {
        "user_id": str(user.id),
        "role": role.value,
        "email": email,
        "temporary_password": temp_password,
        "note": "Reader is read-only. Email invite delivery is stub until Postmark.",
    }


@router.get("/people")
async def list_people(
    principal: Principal = Depends(get_principal),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    rows = (
        await session.execute(
            select(Membership, User).join(User, User.id == Membership.user_id).where(Membership.tenant_id == principal.tenant_id)
        )
    ).all()
    return [{"user_id": str(u.id), "email": u.email, "name": u.full_name, "role": m.role.value} for m, u in rows]


@router.post("/findings/{finding_id}/flag")
async def flag_finding(
    finding_id: UUID,
    payload: dict,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    finding = await session.get(Finding, finding_id)
    if not finding or finding.tenant_id != principal.tenant_id:
        raise HTTPException(404, "finding")
    flag = Flag(
        tenant_id=principal.tenant_id,
        finding_id=finding.id,
        user_id=principal.user_id,
        note=payload.get("note", "This affects us"),
        share_token=secrets.token_urlsafe(16),
    )
    session.add(flag)
    await write_audit(
        session,
        tenant_id=principal.tenant_id,
        actor=str(principal.user_id),
        action="finding.flag",
        entity_type="finding",
        entity_id=str(finding.id),
        after={"note": flag.note},
    )
    await session.commit()
    return {"share_token": flag.share_token}


@router.post("/findings/{finding_id}/dismiss")
async def dismiss_finding(
    finding_id: UUID,
    payload: dict,
    principal: Principal = Depends(require_write),
    session: AsyncSession = Depends(get_session),
) -> dict:
    finding = await session.get(Finding, finding_id)
    if not finding or finding.tenant_id != principal.tenant_id:
        raise HTTPException(404, "finding")
    finding.dismissed = True
    finding.dismiss_reason = payload.get("reason", "")
    await session.commit()
    return {"ok": True}
