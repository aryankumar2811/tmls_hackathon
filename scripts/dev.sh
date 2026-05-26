#!/usr/bin/env bash
# Boot the OvenMind backend + frontend together for local dev.
# Usage: ./scripts/dev.sh   (Ctrl-C stops both)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ starting FastAPI backend on :8000"
uv run uvicorn backend.app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "→ starting Next.js frontend on :3000"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT
wait
