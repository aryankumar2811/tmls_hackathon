# corpus/

Owner: **Demo / Product lead**. Synthesize Monday afternoon (~3 hours). **~25 docs
is plenty — do not over-engineer.** All markdown; ingested into Chroma by
`backend/app/rag/ingest.py`.

| Folder | Count | What |
|---|---|---|
| `manuals/` | 5 | Equipment maintenance manuals (part numbers, torque specs, fault codes, intervals) |
| `incidents/` | 8 | Past incident reports — **one MUST match the demo scenario** (INC-2025-0317) |
| `sops/` | 4 | Fabricated SOPs (oven cleaning, mixer lube, belt tracking, depositor sanitation) |
| `haccp/` | 3 | **Real public-domain** HACCP SOPs (USDA / NJ Dept of Agriculture) — drop in verbatim |
| `work_orders/` | 5 | Historical work orders (timestamps, technicians, parts, MTTR) |

Generate the fabricated docs with Claude (~3 pages each). Keep them specific:
real-looking part numbers, fault codes, dollar figures, downtime hours — that
specificity is what makes the RAG retrieval impressive on stage.
