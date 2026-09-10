# S15 Flags + share

- List: `/app/flags` (`/flags` redirects)
- Public: `/share/{token}` and `GET /api/share/{token}`
- Revoke: `POST /api/flags/{id}/revoke-share`
- Dismiss: `POST /api/flags/{id}/dismiss`

Click path: flag on `/app` → `/app/flags` → copy → revoke → share page “Link unavailable”.
Reader can list and open; cannot revoke or dismiss.
