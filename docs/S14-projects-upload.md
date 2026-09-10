# S14 Projects + upload

`/app/projects`

1. Create project `POST /api/projects` — 402 → billing
2. Upload `POST /api/documents` multipart `file` + optional `project_id`
3. Unassigned `GET /api/documents?unassigned=1` then `POST /api/documents/{id}/reassign`
4. `POST /api/projects/{id}/run` then open `/app`

Agents do not run on upload. Reader is view-only.
