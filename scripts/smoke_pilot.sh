#!/usr/bin/env bash
set -euo pipefail
API=${API_BASE:-http://localhost:8000}
EMAIL=${SMOKE_EMAIL:-owner@demo.pulsebuild.local}
PASS=${SMOKE_PASSWORD:-demo-owner-pass}

curl -sf "$API/api/health" | grep -q '"ok"'
echo "health ok"

TOKEN=$(curl -sf -X POST "$API/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

curl -sf -H "Authorization: Bearer $TOKEN" "$API/api/digest/today" | grep -q 'channel_promise'
echo "digest ok"
echo smoke_ok
