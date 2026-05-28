#!/usr/bin/env bash
# Boot OvenMind locally and expose it through one ngrok tunnel.
#
# Architecture: Next.js (3000) rewrites /api/* -> FastAPI (8000), so we only
# tunnel the frontend. Both processes log to /tmp; Ctrl-C tears everything down.
#
# Prereqs:
#   - python venv with the backend deps installed
#   - frontend/node_modules installed (npm install)
#   - ngrok installed AND authenticated (`ngrok config add-authtoken <token>`)
#   - .env at repo root with ANTHROPIC_API_KEY=...

set -euo pipefail
cd "$(dirname "$0")/.."

VENV_PY="${VENV_PY:-/Users/rajasreekumar/Documents/Code/venv/bin/python}"
BACKEND_PORT=8000
FRONTEND_PORT=3000

echo "→ backend on :$BACKEND_PORT  (uvicorn)"
"$VENV_PY" -m uvicorn backend.app.main:app --port "$BACKEND_PORT" >/tmp/ovenmind-be.log 2>&1 &
BE_PID=$!

echo "→ frontend on :$FRONTEND_PORT (next dev)"
(cd frontend && npm run dev -- -p "$FRONTEND_PORT") >/tmp/ovenmind-fe.log 2>&1 &
FE_PID=$!

cleanup() {
  echo
  echo "→ shutting down"
  kill $BE_PID $FE_PID 2>/dev/null || true
  pkill -f "ngrok http $FRONTEND_PORT" 2>/dev/null || true
}
trap cleanup EXIT

# wait for next-dev to be ready
echo -n "  waiting for frontend"
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$FRONTEND_PORT"; then break; fi
  echo -n "."; sleep 1
done
echo " ready."

echo
echo "→ ngrok http $FRONTEND_PORT  (Ctrl-C to stop everything)"
echo "  share the https://*.ngrok-free.app URL printed below with your team."
echo "  logs: /tmp/ovenmind-be.log  /tmp/ovenmind-fe.log"
echo
ngrok http "$FRONTEND_PORT"
