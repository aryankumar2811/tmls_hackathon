"""RAG tools — query the hybrid (BM25 + semantic) retriever over the corpus.

Shared by every agent. TODO (Tue): decorate with @tool, wire to rag.retriever.
"""


def query_rag(collection: str, query: str, k: int = 4) -> list[dict]:
    """Hybrid retrieval over a collection (manuals | incidents | sops | haccp |
    work_orders). Returns ranked chunks with source metadata."""
    raise NotImplementedError("TODO (Tue): query_rag")


def rag_lookup_incident(symptoms: str, k: int = 3) -> list[dict]:
    """Find past incidents matching a symptom description. The seeded
    INC-2025-0317 must surface for the demo scenario."""
    raise NotImplementedError("TODO (Tue): rag_lookup_incident")
