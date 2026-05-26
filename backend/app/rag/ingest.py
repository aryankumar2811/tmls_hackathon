"""Ingest corpus/ markdown into Chroma. Run: `make ingest`.

One collection per doc type. TODO (Tue): chunk, embed, persist.
"""

from pathlib import Path

from backend.app.config import settings

CORPUS_DIR = Path(__file__).resolve().parents[3] / "corpus"
COLLECTIONS = ["manuals", "incidents", "sops", "haccp", "work_orders"]


def ingest() -> None:
    """Load each corpus subfolder into its own Chroma collection."""
    raise NotImplementedError("TODO (Tue): chunk + embed + persist to Chroma")


if __name__ == "__main__":
    ingest()
