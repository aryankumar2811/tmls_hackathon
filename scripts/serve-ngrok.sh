#!/usr/bin/env bash
# Boot OvenMind locally and expose it through one ngrok tunnel.
#
# Uses the Next.js production build so:
#   - rewrites stream SSE through reliably (next dev sometimes buffers via ngrok)
#   - the bundle is rebuilt fresh, picking up the /api default for API_BASE
#     instead of an old localhost:8000 baked in earlier.
#
# Architecture: Next.js (3000) rewrites /api/* -> FastAPI (8000), so we only
# tunnel the frontend. Logs in /tmp; Ctrl-C tears everything down.
#
# Prereqs:
#   - python venv with the backend deps installed
#   - frontend/node_modules installed (npm install)
#   - ngrok installed AND authenticated (`ngrok config add-authtoken <token>`)
#   - .env at repo root with ANTHROPIC_API_KEY=...

set -euo pipefail
cd "$(dirname "$0")/.."

# Pick a Python: explicit override > repo-local .venv > system python3.
if [ -n "${VENV_PY:-}" ]; then
  :  # honour the explicit override
elif [ -x "./.venv/bin/python" ]; then
  VENV_PY="./.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  VENV_PY="$(command -v python3)"
else
  echo "✗ no python found. Create one with: python3 -m venv .venv" >&2
  exit 1
fi
echo "  python: $VENV_PY  ($("$VENV_PY" -V))"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# explicitly unset so the production build defaults API_BASE to "/api" and the
# bundle calls back through the same origin — works behind ngrok.
unset NEXT_PUBLIC_API_BASE

echo "→ building frontend (production)"
(cd frontend && npm run build) >/tmp/ovenmind-build.log 2>&1
echo "  build OK"

echo "→ backend on :$BACKEND_PORT  (uvicorn)"
"$VENV_PY" -m uvicorn backend.app.main:app --port "$BACKEND_PORT" >/tmp/ovenmind-be.log 2>&1 &
BE_PID=$!

echo "→ frontend on :$FRONTEND_PORT (next start)"
(cd frontend && npm run start -- -p "$FRONTEND_PORT") >/tmp/ovenmind-fe.log 2>&1 &
FE_PID=$!

cleanup() {
  echo
  echo "→ shutting down"
  kill $BE_PID $FE_PID 2>/dev/null || true
  pkill -f "ngrok http $FRONTEND_PORT" 2>/dev/null || true
}
trap cleanup EXIT

# wait for next start to be ready
echo -n "  waiting for frontend"
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://localhost:$FRONTEND_PORT"; then break; fi
  echo -n "."; sleep 1
done
echo " ready."

echo
echo "→ ngrok http $FRONTEND_PORT --inspect=false  (Ctrl-C to stop everything)"
echo "  --inspect=false disables ngrok's traffic capture, which would otherwise"
echo "  buffer SSE responses indefinitely. Combined with the SSE response's"
echo "  Cache-Control: no-transform header, this keeps the agent stream flowing."
echo "  Share the https://*.ngrok-free.app URL printed below with your team."
echo "  logs: /tmp/ovenmind-be.log  /tmp/ovenmind-fe.log  /tmp/ovenmind-build.log"
echo
ngrok http "$FRONTEND_PORT" --inspect=false
