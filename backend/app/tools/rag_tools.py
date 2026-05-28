"""RAG tools — query the local Chroma index over the corpus.

Graceful fallback: if the index is missing, `rag_lookup_incident` returns the
CSV's corrective-action hint from the active issue so the demo never hard-fails.
"""

from __future__ import annotations

from backend.app import sessions
from backend.app.rag import retriever


def query_rag(query: str, doc_type: str | None = None, k: int = 3) -> dict:
    """Semantic search over the corpus (manuals | incidents | sops). Returns
    ranked snippets with their source doc ids."""
    hits = retriever.search(query, k=k, doc_type=doc_type)
    return {"query": query, "hits": hits, "retrieved": len(hits)}


def rag_lookup_incident(symptoms: str) -> dict:
    """Find the past incident that best matches a symptom description."""
    hits = retriever.search(symptoms, k=3, doc_type="incidents")
    if hits:
        top = hits[0]
        return {"matched_incident": top.get("doc_id"), "snippet": top["text"],
                "other_candidates": [h.get("doc_id") for h in hits[1:]], "source": "rag"}
    issue = sessions.current().issue
    ctx = issue.get("context", {})
    return {
        "matched_incident": None,
        "snippet": ctx.get("corrective_action") or ctx.get("error_description") or "",
        "other_candidates": [],
        "source": "issue_context_fallback",
    }
