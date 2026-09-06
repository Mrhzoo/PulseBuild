# PULSEBUILD — System & Design Architecture · v1.1
SME project intelligence for UAE & Saudi construction · DOCUMENT 01

A multi-agent intelligence layer that sits between noisy project communication and the SME that has to protect cash, crew, and margin.

## 1. Problem the system is built to solve

Small-to-mid contractors and suppliers in the UAE and Saudi Arabia work inside large multi-party projects. Schedule changes, change orders, approval delays, and payment signals arrive late, incomplete, or across WhatsApp, email, PDFs, and owner portals. Existing platforms are built for owners and main contractors. PulseBuild is the missing lower-tier intelligence layer.

## 2. Design principles

- Work with incomplete data. Never pretend the picture is perfect. Always show confidence.
- SME-first. Every view answers: what threatens my cash, crew, or margin this week?
- Thin layer, not another ERP. Ingest what already exists. Do not force a new operating system.
- Agent collaboration over a single chatbot. Specialized agents reason, then an orchestrator ranks.
- Company isolation from day one. Multi-tenant, project-scoped, audit-friendly.
- Human in the loop. The product advises and records. It does not silently act on a live contract.
- **Email is the reliability channel.** WhatsApp push is additive and best-effort.

## 3. Logical architecture

Five layers. Data moves upward from messy human channels into structured events, then into specialized agents, then into a ranked digest the user can act on.

| Layer | Name | Contents |
| --- | --- | --- |
| A | Channels | WhatsApp exports, forwarded email, PDF/Excel uploads; later light portal connectors |
| B | Ingestion | Parsers, classifiers, **project matching**, PII-aware storage, event store |
| C | Knowledge | Per-project graph: parties, packages, dates, payment terms, documents |
| D | Agents | **v1:** Schedule, Cash-Flow, Change-Order, Orchestrator. **v1.5:** + Compliance |
| E | Experience | Daily digest, risk cards, flag/record, email push (WhatsApp later) |

## 4. System diagram — data and agent flow

Signals enter as documents and messages → ingest → event store + knowledge graph → specialist agents → orchestrator → daily digest (web + email) → SME flags issue → timestamped record.

**v1 agent graph (paid pilot):** Schedule Impact · Cash-Flow Risk · Change-Order Detector · Priority Orchestrator.

**v1.5 addition:** Compliance & Docs (certificates, approvals, ICV/Nitaqat notes). Do not market Compliance flags in the first pilot wave.

## 5. Agent contracts

Each agent receives a project snapshot plus new events. Each returns a structured finding. The orchestrator never invents facts the agents did not supply.

| Agent | Stage | Input | Output | Failure mode |
| --- | --- | --- | --- | --- |
| Schedule Impact | v1 | Dates, sequences, delay language | Window shift + who is blocked | If dates missing: Watch, not Act |
| Cash-Flow Risk | v1 | Payment terms, IPC language, retention | Gap in next 7–14 days | Never invents amounts |
| Change-Order | v1 | Qty/scope wording, drawing rev | Suspected variation + evidence | Marks “possible” until confirmed |
| Orchestrator | v1 | All findings + prior digest | Ranked cards + digest copy | Drops low-confidence noise |
| Compliance | **v1.5** | Certificates, approvals, ICV/Nitaqat | Missing / expiring item | Only flags items seen or due |

## 6. Project matching contract (ingest)

Every inbound item must attach to exactly one project or land in **Unassigned**.

**Match order (first hit wins):**

1. Dedicated project forward address (`project-slug@tenant.pulsebuild…`).
2. Explicit project token in subject (`[PB:ProjectCode]` or tenant-configured aliases).
3. Filename / BOQ header aliases configured on the project.
4. Soft suggest from recent parties + keywords — **never auto-commit**; user confirms.

**User repair:** one-tap **Reassign project** on any document or event. Wrong match must be fixable without support.

**No match:** store as Unassigned, surface in digest Ask line (“2 files need a project”), never invent risks from orphan files.

## 7. Data model (minimum viable)

- **Tenant:** company id, country (`UAE` launch default; `KSA` later), billing plan, data-residency preference, default currency (`AED` launch).
- **Project:** name, owner/main contractor (optional), role of tenant (sub / supplier), start/end, currency, match aliases, forward address.
- **Party:** name, role, contact channel. No scraping beyond what the tenant uploads.
- **Document:** source type, hash, extracted text, language, linked project (nullable → Unassigned).
- **Event:** type, payload JSON, confidence 0–1, source document, created_at.
- **Finding:** agent name, severity, title, evidence snippets, valid_until.
- **Digest:** date, ranked finding ids, delivered_via, opened_at.
- **Flag:** user action on a finding, note, shareable token.
- **User / Role:** `Owner`, `Ops`, **`Reader` (read-only)**.

## 8. Security and tenancy

Every query is tenant-scoped. Documents encrypted at rest. Access tokens are company-level. Audit log records ingest, digest generation, flags, and reassigns.

**Launch posture:** one default cloud region chosen at infra setup (ME-friendly or EU with clear path to UAE residency). Move residency only when a **paying** customer requires it — not before first pilots.

No training of public models on customer documents. Document retention + deletion on tenant request must be supported from S0 (even if UI is admin-only).

## 9. Trust model

PulseBuild is an advisor, not a contract system of record. Findings always show: evidence snippet, source file or message date, and confidence. Low-confidence items appear under Watch. Useful when half the data is missing — that is the real SME environment.

**Hard rule:** no number without a source pointer. Cards without evidence never enter Act.

## 10. Non-goals for v1

- Not a full BIM viewer, digital twin, or 4D/5D planning suite.
- Not an ERP, accounting package, or payment rail.
- Not autonomous contracting or automatic claims submission.
- Not a social network of contractors.
- Not a replacement for WhatsApp.
- **Not Compliance / ICV / Nitaqat intelligence in the paid pilot** (v1.5).
- Not WhatsApp as the reliability SLA channel.

## 11. Success metric for the architecture

Within one week of first use, a pilot user can answer without calling anyone: “What is the single biggest risk to my cash flow or margin on Project X in the next 14 days?” and point to a specific signal the system surfaced.

**Supporting eval metric (new):** weekly, on golden fixtures + live pilots — % of Act cards that have a valid evidence pointer to page/message. Target ≥ 95% before widening automation.

## 12. Evolution path

v1 proves value with upload + email + 3 specialist agents + orchestrator + digest + flag + Reader invite.
v1.5 adds Compliance, Arabic-first extraction quality, WhatsApp push (best-effort), one portal connector.
v2 adds opt-in shared pulses and richer cash-flow simulation. Architecture above does not need a rewrite for that path.
