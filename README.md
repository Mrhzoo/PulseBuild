# PulseBuild

SME project-risk intelligence for UAE construction first.

PulseBuild sits between messy project communication (email, PDFs, schedules, chat exports) and the subcontractor or supplier who has to protect cash, crew, and margin. It is **not** an ERP, BIM viewer, or chatbot.

**The product is the daily digest.** Email is the SLA channel.

Spec: `docs/` (architecture, stack, thesis, journey — v1.1). Ingest: `docs/S1-ingest.md`. Agents: `docs/S2-agents.md`.

## Locked v1 decisions

- Agents in paid pilot: Schedule, Cash-Flow, Change-Order, Orchestrator. **No Compliance until v1.5.**
- Roles: Owner, Ops, **Reader** (read-only).
- Project matching is explicit; unmatched files go to **Unassigned**; one-tap reassign.
- No Act card without an evidence pointer.
- UAE + AED first.
- Assisted-ops in weeks 1–4 only, capped and audited.

## Local run

```bash
cp .env.example .env
docker compose up -d postgres redis minio
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
cd backend && pytest
```

## Status

- **S0** foundation — re-smoke PASS.
- **S1** ingest — closed.
- **S2** agents v0 on `main` (heuristics default; no live LLM).
- **S3** digest email next.
