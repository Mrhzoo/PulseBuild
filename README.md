# PulseBuild

SME project-risk intelligence for UAE construction first.

PulseBuild sits between messy project communication (email, PDFs, schedules, chat exports) and the subcontractor or supplier who has to protect cash, crew, and margin. It is **not** an ERP, BIM viewer, or chatbot.

**The product is the daily digest.** Email is the SLA channel.

Spec: `docs/` (architecture, stack, thesis, journey — v1.1).

## Locked v1 decisions

- Agents in paid pilot: Schedule, Cash-Flow, Change-Order, Orchestrator. **No Compliance until v1.5.**
- Roles: Owner, Ops, **Reader** (read-only).
- Project matching is explicit; unmatched files go to **Unassigned**; one-tap reassign.
- No Act card without an evidence pointer.
- UAE + AED first.
- Assisted-ops in weeks 1–4 only, capped and audited.

## Repo layout

```
backend/     FastAPI + SQLAlchemy + LangGraph contracts
frontend/    Next.js App Router (digest-first UI)
docs/        founding briefs v1.1
fixtures/    golden eval set
```

## Local run

```bash
cp .env.example .env
docker compose up -d postgres redis minio
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

## Trust rules (non-negotiable)

1. Never invent amounts or dates.
2. Cards without `evidence_pointer` cannot enter **Act**.
3. Do not generate fake risks when a project has no files.
4. Do not train public models on customer documents.
5. Every assisted-ops edit is logged.

## Status

S0–S3 scaffold on `main`. Ingest parsers, live LLM wiring, and email delivery land next.
