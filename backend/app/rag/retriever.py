"""Hybrid retriever factory: BM25 + Chroma semantic via EnsembleRetriever.

TODO (Tue): build and cache one EnsembleRetriever per collection.
"""

from backend.app.config import settings


def get_retriever(collection: str):
    """Return a cached hybrid retriever for the given collection."""
    raise NotImplementedError("TODO (Tue): build EnsembleRetriever(BM25 + Chroma)")
