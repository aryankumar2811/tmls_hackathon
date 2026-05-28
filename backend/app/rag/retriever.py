"""Query the local Chroma index built by ingest.py.

Exposes `search()`. Returns [] if the index is missing or chromadb isn't installed
so callers (rag_tools) can fall back to the fixture's ground-truth incident.
"""

from __future__ import annotations

from functools import lru_cache

from backend.app.config import settings
from backend.app.rag.ingest import COLLECTION


@lru_cache(maxsize=1)
def _collection():
    import chromadb

    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    return client.get_collection(COLLECTION)


def search(query: str, k: int = 4, doc_type: str | None = None) -> list[dict]:
    """Semantic search over the corpus. Optionally filter by doc `type`."""
    try:
        col = _collection()
    except Exception:
        return []  # index not built / chromadb missing — caller falls back
    where = {"type": doc_type} if doc_type else None
    res = col.query(query_texts=[query], n_results=k, where=where)
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0] if res.get("distances") else [None] * len(docs)
    return [
        {"text": d, "doc_id": m.get("doc_id"), "type": m.get("type"),
         "source": m.get("source"), "distance": dist}
        for d, m, dist in zip(docs, metas, dists)
    ]
