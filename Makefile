.PHONY: install model-info backend frontend ingest demo lint test

install:          ## install python + node deps
	uv sync
	cd frontend && npm install

model-info:       ## print the loaded predictive model's feature list + importances
	uv run python -c "from backend.app.ml.predictor import model_info; import json; print(json.dumps(model_info(), default=str, indent=2))"

ingest:           ## build the Chroma RAG index from corpus/
	uv run python -m backend.app.rag.ingest

backend:          ## run FastAPI backend on :8000
	uv run uvicorn backend.app.main:app --reload --port 8000

frontend:         ## run Next.js dev server on :3000
	cd frontend && npm run dev

demo:             ## one-shot: ingest, then print next steps
	$(MAKE) ingest
	@echo "Set ANTHROPIC_API_KEY in .env, then run 'make backend' and 'make frontend'."

lint:
	uv run ruff check .

test:
	uv run pytest
