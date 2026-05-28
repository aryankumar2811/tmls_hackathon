"""Ingest corpus/ markdown into a local Chroma collection. Run: `make ingest`.

Uses Chroma's default on-device embedding (MiniLM via onnxruntime) so NO embeddings
API key is required — only ANTHROPIC_API_KEY is needed to run the full demo.
"""

from __future__ import annotations

from pathlib import Path

from backend.app.config import settings

CORPUS_DIR = Path(__file__).resolve().parents[3] / "corpus"
COLLECTION = "ovenmind"
CHUNK_CHARS = 900
CHUNK_OVERLAP = 150


def _chunk(text: str) -> list[str]:
    text = text.strip()
    if len(text) <= CHUNK_CHARS:
        return [text]
    chunks, start = [], 0
    while start < len(text):
        end = start + CHUNK_CHARS
        chunks.append(text[start:end])
        start = end - CHUNK_OVERLAP
    return chunks


def _docs() -> list[dict]:
    out = []
    for path in sorted(CORPUS_DIR.glob("*/*.md")):
        if path.name.lower() == "readme.md":
            continue
        doc_type = path.parent.name          # incidents | manuals | sops | haccp | work_orders
        doc_id = path.stem
        for i, chunk in enumerate(_chunk(path.read_text())):
            out.append(
                {
                    "id": f"{doc_id}::{i}",
                    "text": chunk,
                    "meta": {"type": doc_type, "doc_id": doc_id,
                             "source": str(path.relative_to(CORPUS_DIR))},
                }
            )
    return out


def ingest() -> None:
    import chromadb  # imported lazily so the rest of the app loads without it

    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    # rebuild from scratch for a clean, deterministic index
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    col = client.create_collection(COLLECTION)

    docs = _docs()
    if not docs:
        print("no corpus docs found — nothing ingested")
        return
    col.add(
        ids=[d["id"] for d in docs],
        documents=[d["text"] for d in docs],
        metadatas=[d["meta"] for d in docs],
    )
    n_files = len({d["meta"]["doc_id"] for d in docs})
    print(f"ingested {len(docs)} chunks from {n_files} docs into '{COLLECTION}' "
          f"at {settings.chroma_persist_dir}")


if __name__ == "__main__":
    ingest()
