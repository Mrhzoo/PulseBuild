# PULSEBUILD — Technology Stack & Roadmap · v1.1
SME project intelligence for UAE & Saudi construction · DOCUMENT 02

A small-team stack that can ship a paid pilot without an infrastructure department.

## 1. Stack principles

- Few moving parts. One database. One backend language. One frontend framework.
- Agents are application code, not a separate product. LangGraph (or equivalent) orchestrates calls; we own the contracts.
- Start cloud-managed on **one default region**. Move residency later if a paid customer requires it.
- LLM cost is a product cost. Cache, retrieve first, call models second.
- Manual fallback is allowed in week 1–4 of a pilot — **only inside the assisted-ops lane** (see §8).
- Email digest delivery is the SLA. WhatsApp is additive.

## 2. Recommended v1 stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js + TypeScript | Fast app, simple digest UI, auth + Reader invite |
| Backend | Python 3.12 + FastAPI | Agents, parsers, jobs |
| Agents | LangGraph + structured I/O | Specialists + orchestrator; Pydantic contracts |
| Models | Frontier LLM via API + small classify model | Quality first; cost control on classify |
| Database | PostgreSQL + pgvector | Events, tenants, vectors in one system |
| Files | Object storage (S3-compat) | Encrypted documents, signed download |
| Jobs | Redis + worker (or pg queue) | Ingest + nightly digest |
| Auth | Company accounts + roles | **Owner / Ops / Reader** in v1 |
| Email in | Inbound parse (Postmark etc.) | `project@tenant…` + company inbox |
| Notify | **Email first** | WhatsApp Cloud API only after Meta approval (v1.5) |
| Observability | Structured logs + traces | Agent cost and failure per tenant |
| Hosting | Managed cloud, single region | UAE residency when a payer demands it |
| Eval | Golden fixtures in repo + CI/smoke | Regression on Act evidence quality |

## 3. What we deliberately do not use in v1

- No Kubernetes unless traffic forces it.
- No multi-cloud. No custom vector database.
- No on-device models until cost or residency requires them.
- No public marketplace of third-party agents.
- No Compliance agent runtime until v1.5.
- No dependency on WhatsApp for pilot success.

## 4. Agent runtime design

A nightly job (and an on-upload job) loads new events for a project, builds a compact snapshot, and runs the graph:

**classify → retrieve evidence → Schedule + Cash-Flow + Change-Order in parallel → Orchestrator → persist findings → render digest.**

Each agent returns JSON matching a Pydantic schema. Free-form prose only inside evidence or rationale fields.

Cost control: classify with a small model; retrieve top chunks before large model; cap tokens per project per day; skip unchanged projects.

## 5. Ingestion quality bar

- Email: body + attachments; project via matching contract (Architecture §6).
- PDF: text layer first; OCR only if needed.
- Excel/CSV: map common schedule and BOQ columns; fail soft.
- WhatsApp export: timestamps and senders; ignore stickers/noise.
- Arabic and English both accepted. Mixed documents are normal.
- Every extracted fact stores a pointer back to page or message.
- Unreadable scan: ask for text PDF or photo of the table — no fake risks.

## 6. Build sequence (product, not calendar)

| Stage | Scope |
| --- | --- |
| S0 Foundation | Tenants, projects, roles (Owner/Ops/**Reader**), file upload, encrypted storage, audit log, retention/delete |
| S1 Ingest | Email forward + PDF/Excel parse + event store + **matching rules + reassign** |
| S2 Agents v0 | Schedule + Cash-Flow + Change-Order + Orchestrator (**no Compliance**) |
| S3 Digest | Web digest + **email delivery** + confidence labels + Reader invite |
| S4 Action | Flag / this-affects-us + shareable note |
| S5 Pilot hardening | Arabic quality, cost caps, empty-state coaching, **eval harness live**, assisted-ops lane |
| S6 v1.5 | WhatsApp push (best-effort), one portal connector, **Compliance agent** |

## 7. Roadmap by capability

**Now — Paid pilot:** Upload + email + 3 agents + orchestrator + digest + flag + Reader. Semi-manual review only inside assisted-ops caps. Charge from day one.

**Next — Repeatable product:** Stable Arabic extraction, WhatsApp push, 20-minute non-technical onboarding, billing, basic admin, Compliance.

**Later — Network effects:** Opt-in shared pulse between two SMEs on the same project. Light owner/main-contractor read-only invite. Still SME-paid.

**Not yet:** Full ERP sync, autonomous claims, marketplace, public third-party API.

## 8. Assisted-ops lane (pilot weeks 1–4)

Allowed so weak agents do not kill trust — not a license to become a consultancy.

- **Who:** founding eng/ops only (named people), not arbitrary contractors.
- **What they may do:** correct project match, drop hallucinated Act cards, attach missing evidence pointer, rewrite digest copy for clarity.
- **What they may never do:** invent numbers, invent risks, ship Act without source, customize per-tenant business logic outside the product.
- **Caps:** max **30 minutes / tenant / day**; if exceeded 3 days running → stop expanding that tenant until automation catches up.
- **Audit:** every human edit logged as `assisted_ops` with before/after.
- **Exit:** after S5, assisted edits require an explicit “agent bug” ticket; default is full automation.

## 9. Eval harness

- Maintain a **golden set** (anonymized): ≥1 schedule, ≥1 IPC/payment PDF, ≥1 change-order email, ≥1 thin/empty case.
- Automated check: every Act card from the golden run has `evidence_pointer` non-empty and resolvable.
- Weekly live sample: spot-check ≥10 Act cards across pilots for evidence validity.
- Gate: do not widen automation or add tenants if golden Act evidence rate < 95%.

## 10. Technical risks and controls

| Risk | Control |
| --- | --- |
| Hallucinated amounts/dates | Schema + evidence pointer + confidence; never Act without source |
| LLM cost blow-up | Per-tenant daily cap; retrieve-then-generate; cheap classifier; project-pack add-on |
| Garbage-in documents | Empty-state coaching; ask for one schedule file first |
| Bad project match | Matching contract + one-tap reassign + Unassigned bucket |
| Data residency demand | Single region now; migrate when a payer requires UAE residency |
| WhatsApp policy/access | Email is SLA; WhatsApp additive in v1.5 |
| Integration theater | No connectors until ~10 companies ask for the same one |
| Assisted-ops trap | Time caps + audit + exit criteria in §8 |
