# PULSEBUILD — User Journey · v1.1
SME project intelligence for UAE & Saudi construction · DOCUMENT 04

From first conversation to a daily habit that protects cash. Primary actor: SME commercial or operations manager.

## 1. Actors

- **Primary:** company owner, commercial manager, or site/ops coordinator (**Owner** / **Ops** roles).
- **Secondary:** colleague who only reads the digest (**Reader** role — v1).
- **System:** ingestion service, agent graph, email notifier; optional assisted-ops reviewer in pilot weeks 1–4.
- **Out of scope in v1:** owner and main-contractor seats as paying users.

## 2. End-to-end journey (happy path)

1. **Discover** — founder conversation about last delayed IPC or surprise variation.
2. **Paid pilot** — company account created, 1–3 live projects named, billing starts (AED).
3. **Connect channels** — forward address + first schedule/BOQ/PDF upload; confirm project matches.
4. **First digest** — within 24 hours, even if thin; confidence shown honestly. Delivered by **email** + web.
5. **Daily use** — morning open, scan Act / Watch, flag what affects the company.
6. **Invite Reader** — one extra read-only seat for a colleague.
7. **Weekly review** — one conversation: did any card match a real event?
8. **Convert** — remain on monthly plan; add projects; keep Reader.

## 3. Core screens

- **Home:** today’s digest across projects. Act items first.
- **Project:** timeline of events and findings. Source files listed. **Reassign** on misfiled docs.
- **Finding card:** title, why it matters for cash/crew, evidence, confidence, flag.
- **Upload / forward help:** three examples of useful files + Unassigned queue.
- **People:** invite Reader (read-only).
- **Billing:** projects included, add-on pack.

## 4. Primary flow diagram

Customer → PulseBuild app → Agent system

1. Signs up → Create tenant, roles (Owner/Ops/Reader), empty projects
2. Forwards / uploads → Store encrypted, match/attach to project (or Unassigned), parse + event
3. Agents run → Schedule + Cash-Flow + Change-Order + Orchestrator (Compliance = v1.5)
4. Digest ready → Act / Watch / Low; persist findings with evidence + confidence
5. Opens digest → Email (SLA) or app; deep link to cards
6a. Flags issue → “This affects us” + note → audit record
6b. Adds better file / reassigns project if thin or wrong match
7. Stays subscribed → Adds project, invites Reader → billing + usage

## 5. Daily digest anatomy

The digest is the product. If this page is weak, nothing else matters.

| Block | Content |
| --- | --- |
| Header | Date, company, projects scanned, last data received |
| Act this week | Max 5 cards. Risk, why it hits this company, evidence line, confidence |
| Watch | Possible signals. Promote to Act or dismiss |
| Quiet projects | One line: no new material risk (this is a feature) |
| Ask | Optional coaching + Unassigned count |

## 6. Exception flows

- **No files yet:** three example uploads + forward address. Do not generate fake risks.
- **Unreadable scan:** ask for text PDF or photo of the table. Say so plainly.
- **Wrong project match:** one-tap reassign.
- **User disagrees with a card:** dismiss + reason → trains next orchestrator pass.
- **Churn warning:** digest unopened 7 days → one human-sounding email, not five.
- **WhatsApp unavailable:** no impact on pilot success; email remains the channel.

## 7. One-week validation signal

After seven days, at least 60% of pilot users can answer: “What is the single biggest risk to my cash flow or margin on Project X in the next 14 days?” using a card the system produced.

## 8. Language and tone

Interface in English first, Arabic labels where they reduce friction. Copy is short, commercial, and specific. No sci-fi agent language in the UI.

**Channel promise in copy:** “Morning briefing by email.” Do not promise WhatsApp delivery in v1 marketing.
