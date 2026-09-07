# S2 Agents v0

Heuristic specialists read Events (and optional document excerpts) and emit ranked Findings. No Compliance. No live LLM unless `ENABLE_LIVE_LLM=true` and a key is set. Default path is heuristics only.

## Graph

Events + excerpts → collect_signals → Schedule + Cash-Flow + Change-Order → Orchestrator (drop Act without pointer, dedupe, cap Act at 5) → Finding rows + digest.

Orchestrator never invents facts the specialists did not supply.

## Contracts

Each specialist returns severity act|watch|low, title, why_it_hits_us, evidence.snippet, evidence.pointer, confidence, rationale.

`severity=act` requires a non-empty pointer (`docId#p1`, `docId#msg:2`). Amounts and dates are only echoed from source text.

## Heuristic bar

- Schedule: delay/slip/postpone/reschedule/float/تأخير — Act only if a date window is in the same text
- Cash-flow: IPC/retention/payment/certified/overdue/مستخلص — never invent AED amounts
- Change-order: variation/VO/qty increase/drawing rev — Watch until the instruction is explicit

Weak signal → Watch or drop. Never Act on vibes. Empty project → no fake risks.

## Run (Owner/Ops)

```bash
curl -s -X POST http://localhost:8000/api/projects/$PROJECT_ID/run -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:8000/api/digest/today -H "Authorization: Bearer $TOKEN"
```

S3 is outbound digest email. Live LLM is opt-in and unused by default.
