# S22 Trust fixes

## Digest dedupe
Key is **`(agent, evidence_pointer)`**, same as findings upsert.
Act + Watch that share a pointer but come from different agents both appear.
Same agent + same pointer still collapses; on collision keep **higher severity** (Act > Watch > Low).
Empty-pointer Act is still dropped. Cap remains 5 Act cards.

## Auto-run after ingest
Env: `AUTO_RUN_AGENTS_ON_UPLOAD` (settings `auto_run_agents_on_upload`).
Default **true** (dev and prod unless you set `false`).

Runs `run_project_agents` after:
- `POST /api/documents` when `project_id` is set and parse is not `pending` / `failed` / `needs_better_file`
- `POST /api/documents/{id}/reassign` when assigning to a project
- `POST /api/documents/{id}/reingest` when the doc is already assigned

Unassigned uploads: `agents_run: null`.
Response includes `agents_run: {created, updated, dropped}` or `null`.
Upsert still keys on `(agent, pointer)` — second upload updates, does not duplicate.
Reader cannot hit upload / reassign / run (require_write).
Manual **Run agents** stays on the projects page.
