# S26 Pilot polish + ship kit

- Settings → Pilot checklist (`GET /api/pilot/checklist`)
- CORS: production origins = `WEB_BASE_URL` only
- `python -m scripts.seed` exits 2 in production
- Schedule titles echo a short clip from the file when activity/window are missing
- Deploy: `docs/DEPLOY.md`
- Smoke: `scripts/smoke_pilot.sh`
