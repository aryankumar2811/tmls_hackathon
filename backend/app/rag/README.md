# rag/

Chroma (local, in-process) + **hybrid retrieval** (BM25 keyword + semantic) via
LangChain's `EnsembleRetriever`. Technical docs full of part numbers and SKUs
respond much better to keyword search than embeddings alone.

- `ingest.py` — read `corpus/` markdown, chunk, embed, write to Chroma (one
  collection per doc type: manuals / incidents / sops / haccp / work_orders).
  Run with `make ingest`.
- `retriever.py` — build the EnsembleRetriever (BM25 + Chroma) used by `rag_tools`.

Embeddings: OpenAI `text-embedding-3-small` (default) or Voyage `voyage-3`.
25 docs is plenty — do not over-engineer. The seeded **INC-2025-0317** must be
retrievable for the demo scenario.
