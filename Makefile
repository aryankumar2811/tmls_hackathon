.PHONY: install backend frontend ingest sim lint test

install:          ## install python + node deps
	uv sync
	cd frontend && npm install

backend:          ## run FastAPI backend on :8000
	uv run uvicorn backend.app.main:app --reload --port 8000

frontend:         ## run Next.js dev server on :3000
	cd frontend && npm run dev

ingest:           ## build the Chroma RAG index from corpus/
	uv run python -m backend.app.rag.ingest

sim:              ## run the drift simulator standalone (prints SSE frames)
	uv run python -m backend.app.simulator.drift_simulator

lint:
	uv run ruff check .

test:
	uv run pytest
