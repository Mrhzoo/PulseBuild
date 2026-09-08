# S5 Pilot harden

Heuristics stay default. Live LLM off unless ENABLE_LIVE_LLM=true and a key is set.

Eval: `python -m scripts.run_golden` or GET `/api/eval/golden` (Owner/Ops). Fail if Act evidence rate < 95% or empty case has Act cards.

Cost: TENANT_DAILY_TOKEN_CAP ledger. Cap hit → skip LLM, keep heuristics.

Assisted-ops: Owner/Ops only, 30 min/day, kinds reassign / dismiss_finding / fix_pointer / rewrite_copy. Never invent amounts. Over cap → 429. Flip ASSISTED_OPS_REQUIRES_TICKET after pilot weeks 1–4.
