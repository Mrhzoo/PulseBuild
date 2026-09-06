# PulseBuild

SME project-risk intelligence for UAE construction first.

PulseBuild sits between messy project communication (email, PDFs, schedules, chat exports) and the subcontractor or supplier who has to protect cash, crew, and margin. It is **not** an ERP, BIM viewer, or chatbot.

**The product is the daily digest.** Email is the SLA channel.

Spec: `docs/` (architecture, stack, thesis, journey — v1.1). Ingest: `docs/S1-ingest.md`.

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
docs/        founding briefs v1.1 + S1 ingest
fixtures/    golden eval set + ingest samples
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
cd backend && pytest tests/test_ingest.py tests/test_matching_and_graph.py tests/test_tenancy.py
```

## Trust rules (non-negotiable)

1. Never invent amounts or dates.
2. Cards without `evidence_pointer` cannot enter **Act**.
3. Do not generate fake risks when a project has no files.
4. Do not train public models on customer documents.
5. Every assisted-ops edit is logged.

## Status

- **S0** foundation on `main` (auth, tenancy, encrypted upload, Reader, audit) — re-smoke PASS.
- **S1** ingest on `main` (PDF/Excel/email/WhatsApp parsers → Event store, reingest, inbound stub).
- **S2** agents next (still heuristic graph only; no live LLM until confirmed).
