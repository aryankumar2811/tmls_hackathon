# OvenMind — How it works

A predictive-maintenance operations console for industrial bakery robotics.
The operator presses **Run simulation**, the dashboard surfaces six issues
predicted by a real RandomForest model on records from a bakery-robotics
telemetry dataset, and clicking an issue opens an analysis run from a
LangGraph multi-agent pipeline (real Claude calls, real tool calls, real RAG)
that produces a maintenance incident report, a work order, and a raw ML view.

---

## 1. Architecture at a glance

```
                      ┌────────────────────────────────┐
                      │  Operator  (Next.js dashboard) │
                      └──────────────┬─────────────────┘
                                     │   /api/*  (Next.js rewrites)
                      ┌──────────────▼─────────────────┐
                      │            FastAPI             │
                      │ /simulate   /issues            │
                      │ /issues/{id}/analyze (async)   │
                      │ /stream/agent?session= (SSE)   │
                      │ /report/{session} /model/info  │
                      └──┬──────────────────────────┬──┘
                         │                          │
        ┌────────────────┴────┐         ┌───────────┴─────────────────┐
        │  Predictive layer   │         │  Agent orchestration         │
        │  RandomForest (.pkl)│         │  LangGraph supervisor +      │
        │  + 6 deterministic  │         │  5 specialists (Claude)      │
        │    CSV rows         │         │  + tools (sensor / cv / corr │
        │                     │         │    / rag / workorder)        │
        │  -> Issue records   │         │  + Chroma RAG over corpus/   │
        │     (in memory)     │         │  + on-disk run cache         │
        └─────────────────────┘         └───────────────────────────────┘
```

Single FastAPI app, single Next.js app. The agent run is a background asyncio
task; events fan out to the browser over a per-session SSE stream.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind, IBM Plex Sans/Mono, lucide-react, react-markdown |
| Backend | FastAPI + sse-starlette + pydantic-settings |
| Predictive model | scikit-learn `RandomForestClassifier`, loaded with joblib |
| Agent framework | LangGraph 1.x `StateGraph` (supervisor + handoffs) |
| LLM orchestrator | Claude Sonnet 4.6 (`claude-sonnet-4-6`) — supervisor + Correlation Agent |
| LLM specialists | Claude Haiku 4.5 (`claude-haiku-4-5`) — Equipment / Quality / Work-Order / Reporting |
| Tool wiring | `langchain_anthropic.ChatAnthropic.bind_tools` + `StructuredTool.from_function` |
| RAG | Chroma `PersistentClient` with the default on-device MiniLM embedding (no embeddings API key) |
| Vision model | (placeholder — see §8) |
| Reports | ReportLab PDF (best-effort) + optional Slack webhook |
| Storage | In-memory `ISSUES` and `SESSIONS` dicts + JSON `runcache/` per issue_id |
| Realtime | Server-Sent Events; single agent stream per session |

Only one external API is required to run the full demo: **`ANTHROPIC_API_KEY`**.
Chroma's default embedding runs locally via onnxruntime, so no embeddings API
key is needed. Slack and PDF are optional and degrade gracefully.

---

## 3. End-to-end data flow

1. **Press Run simulation.** Frontend POSTs `/api/simulate`.
2. **Backend reads a deterministic batch.** `backend/app/ml/inputs.py` loads
   the source CSV (`food_robotics_machinery_data.csv`) and picks the first two
   rows of each ground-truth severity tier (1 / 2 / 3) → 6 rows with rich
   descriptive metadata (machine name, plant, line, manufacturer, error code,
   ground-truth corrective action).
3. **Real model inference.** Those 6 rows are passed through
   `backend/app/ml/predictor.py::predict_batch`. The function applies the same
   preprocessing as the training script
   (`pd.get_dummies(columns=["Sensor_Status"], drop_first=True)`), reindexes to
   the 18 columns the model expects, and returns the predicted class, the
   probabilities, and the top contributing features per row.
4. **Issues are built and stored.** `backend/app/issues.py` wraps each
   prediction in an `Issue` record (id = CSV `Record_ID`) and stuffs it into the
   in-memory `ISSUES` dict. The response goes back to the dashboard.
5. **The dashboard renders the table.** Each issue shows its equipment, line,
   plant, machine type, severity (`low`/`medium`/`critical`), and a status
   badge (`Pending` until you open it).
6. **Open an issue.** The slide-over shows the Overview tab immediately —
   populated from the issue + the model output, no LLM call yet.
7. **Switch to "Agent report".** The frontend fires `POST
   /api/issues/{id}/analyze`. The backend creates a session bound to that
   issue, launches the LangGraph run in a background task, and opens
   `GET /api/stream/agent?session=…` to stream events back.
8. **Agents stream live.** Each agent's start, tool calls, results, and final
   markdown summary push as events; the UI shows running/done chips and the
   reasoning trace fills in. When the Reporting Agent emits its `report` event,
   the markdown swaps into the main report area.
9. **Run cache.** The full trace is persisted to `.run_cache/<issue_id>.json`
   on first run. Later opens replay from cache (instant + free).

---

## 4. Predictive model

- **File**: `robot_model.pkl` (sklearn 1.6.1, RandomForestClassifier, n_classes=3).
- **Trained on**: `food_robotics_machinery_data.csv` (500 records of food-robotics
  telemetry) using `robot_failures_model.py`.
- **Inputs (18 columns)**:
  14 numeric features: `Year_Installed, Operating_Hours, Motor_Temp_C,
  Ambient_Temp_C, Vibration_mm_s, RPM, Power_Draw_kW, Conveyor_Speed_m_min,
  Pressure_PSI, Hydraulic_Fluid_Temp_C, Noise_Level_dB, Defect_Count,
  Defect_Rate_Pct, Days_Since_Maintenance`
  plus 4 one-hot encoded `Sensor_Status` flags (drop_first=True from
  `["All Normal", "Degraded — Sensor #2", "Degraded — Sensor #5",
  "Multiple Sensors Offline", "Offline — Sensor #1"]`).
- **Output classes**: `1 = low`, `2 = medium`, `3 = critical`.
- **Top importances** (printed via `make model-info`): `Motor_Temp_C` ≈ 0.24,
  `Vibration_mm_s` ≈ 0.24, `Defect_Rate_Pct` ≈ 0.24, `Noise_Level_dB` ≈ 0.10,
  `Defect_Count` ≈ 0.07, `Hydraulic_Fluid_Temp_C` ≈ 0.06. The remaining 12
  features collectively account for ~5%.

Inference is millisecond-class on a 6-row batch; that's why the table populates
the instant you click Run simulation. We hold the button busy for 700 ms so the
click is visibly acknowledged.

---

## 5. The agent layer

A LangGraph `StateGraph` with a **supervisor** node and **five specialist**
nodes. The supervisor is itself a Claude call that routes to the next agent
based on what's completed (with a canonical fallback for safety); each
specialist runs a bounded `bind_tools` loop with real tools.

| Agent | Model | Role | Tools |
|---|---|---|---|
| Supervisor | `claude-sonnet-4-6` | Choose the next specialist (or `FINISH`) | — |
| Equipment Agent | `claude-haiku-4-5` | Read the snapshot, name the leading anomalous channel, state the failure mode + RUL window | `query_sensor`, `get_sensor_window`, `get_rul` |
| Quality Agent | `claude-haiku-4-5` | Characterise the quality signal vs baseline | `query_cv`, `get_defect_rate`, `get_cv_window` |
| Correlation Agent | `claude-sonnet-4-6` | Decide whether the equipment-side and quality-side anomalies share a single root cause; cite the matched historical incident | `compute_correlation`, `link_timeline`, `rag_lookup_incident`, `query_rag` |
| Work-Order Agent | `claude-haiku-4-5` | Open a maintenance work order from the diagnosis | `create_wo`, `query_rag` |
| Reporting Agent | `claude-haiku-4-5` | Synthesise the operator-facing incident report (markdown) | — |

**Pricing model used for the per-step `$X.XXXX` chip**: Sonnet `$3 / $15` per
million tokens; Haiku `$1 / $5` per million tokens. A typical full analysis is
~20 k tokens / ~$0.05.

**Cost guardrails** (from `.env.example`):
`MAX_SUPERVISOR_TURNS=8` and `MAX_TOKENS_PER_AGENT=4000`. Both are enforced.

### Agent tools

All tool functions live in `backend/app/tools/*.py`. They read the active
issue from a contextvar set by the runner (`backend/app/sessions.py::current()`)
and return plain JSON-friendly dicts. Notable behaviours:

- `get_sensor_window` — categorised snapshot (operating / thermal / mechanical
  / acoustic / quality) with anomaly flags and per-feature `% vs baseline`.
- `get_rul` — RUL window derived from the model probabilities (4–24 h critical,
  24–168 h medium, 168–720 h low).
- `compute_correlation` — joint anomaly score on
  `(Vibration_mm_s, Motor_Temp_C) × (Defect_Rate_Pct, Defect_Count)` plus the
  predictive model's `P(critical)`, blended into a
  `common_root_cause_probability`.
- `rag_lookup_incident` — semantic-search the `incidents/` collection; falls
  back to the issue's CSV `Corrective_Action` if Chroma is unavailable.
- `create_wo` — assemble a work order with parts (from anomalous features),
  technician (from a small roster keyed by `Machine_Type`), ETA (from the RUL
  window), and a `[low, high]` dollar impact band keyed by severity.

### LangGraph wiring

`backend/app/agents/graph.py` builds the `StateGraph`:

```python
g.set_entry_point("supervisor")
g.add_conditional_edges("supervisor", route_fn, {**specialists, "FINISH": END})
for key in specialists:
    g.add_edge(key, "supervisor")
```

A typical run yields ~40 SSE events: `supervisor → agent_start → tool_call ×
N → tool_result × N → agent_done` cycled five times, then `work_order` and
`report`. The runner persists everything to the run cache keyed by `issue_id`.

---

## 6. RAG

A single Chroma collection (`ovenmind`) over `corpus/`:

- 8 **incidents**: one per surfaced machine
  (`INC-2025-3401` Robotic Decorator, `…-3402` CIP System, `…-3403` Labeling
  System, `…-3404` Croissant Laminator, `…-3405` Modular Belt Conveyor,
  `…-3406` Spiral Freezer) + 2 distractors (Servo Depositor, Metal Detector).
- 6 **manuals** for the surfaced machines.
- 2 generic **SOPs** (bearing replacement, preventive lubrication).

Built with `python -m backend.app.rag.ingest` (or `make ingest`); persists to
`./chroma_db`. Embeddings are local — Chroma ships an ONNX MiniLM by default,
so no embeddings API key is required.

Verified after the latest corpus refresh: each of the six surfaced machines
retrieves *its own* incident as the top semantic hit.

---

## 7. Frontend

Next.js 15 App Router with everything under `frontend/`.

- **Type system**: `frontend/lib/types.ts` mirrors the FastAPI payloads
  (`Issue`, `Prediction`, `WorkOrder`, `AgentEvent`, `ModelInfo`, …).
- **REST client**: `frontend/lib/api.ts` (`runSimulation`, `analyzeIssue`,
  `getReport`, `getModelInfo`).
- **SSE**: `frontend/lib/sse.ts` — one helper, single per-session agent stream.
- **State**: `frontend/components/Dashboard.tsx` holds an `issues: Record<id,
  IssueState>` map and a per-session SSE closer. Agent analysis only kicks off
  when you open an issue's *Agent report* tab (on demand, idempotent via cache).

Key components:

| Component | Job |
|---|---|
| `RunSimulationButton` | Primary control. Spinner + "Running model…" for ≥ 700 ms |
| `IssuesList` | Sorted critical → medium → low; click a row to open the slide-over |
| `IncidentDetail` | Three tabs: Overview, Agent report, Raw ML output |
| `AgentWorkflow` | Static (post-stream) trace; tool args/results collapsed by default; each agent's final summary is rendered as markdown |
| `ClassProbabilityBar` | Horizontal stacked bar of `[P(low), P(medium), P(critical)]` with the predicted class highlighted |
| `FeatureValuesTable` | 14 numeric features × (current value, baseline, importance bar); anomalous values flagged |
| `VisionPlaceholder` | Stand-in for the vision model (see §8) |

Theme: IBM Plex Sans + IBM Plex Mono, restrained dark palette with severity-only
accent colors. No emoji, no decorative motion, one functional spinner where
work is actually in flight.

---

## 8. Vision model

_Coming soon._

The Quality Agent currently sources its signal from the `Defect_Count` and
`Defect_Rate_Pct` columns on the same record (treated as a sensor proxy) and
the UI ships a `VisionPlaceholder` card that explicitly notes the model is in
training. The agent prompts and the Raw ML tab both flag this.

---

## 9. What's real vs. authored (honesty)

For the avoidance of ambiguity:

- **Real**: the 18 feature values on each issue, the predicted class and
  probabilities, the top-feature ranking, the correlation score, every RAG
  retrieval result, every number the LLM quotes back from a tool.
- **Authored by me (not learned from the data)**: the per-feature baselines and
  anomaly thresholds in `predictor.py`, the RUL→hours mapping in
  `sensor_tools.py`, every document in `corpus/`, the work-order parts catalog
  and technician roster, the `$ impact` band per severity.
- **LLM domain reasoning** (interpretation on top of real numbers): the causal
  narratives ("collapsed lubricant film → raceway wear → thermal cascade"),
  named failure modes, comparative phrasing ("9× the failure-imminent
  threshold"). These are Claude applying mechanical-engineering knowledge to
  the real values it's been handed, not facts in the data.

The model and the retrieval are honest; some of the surrounding scaffolding is
my judgment calls. Calling that out beats finding out later.

---

## 10. Running it

### Local (laptop only)

```bash
# Terminal A — backend
python3 -m uvicorn backend.app.main:app --reload --port 8000

# Terminal B — frontend (Next dev server rewrites /api/* → :8000)
cd frontend && npm run dev
```

Open `http://localhost:3000`. Set `ANTHROPIC_API_KEY` in `.env` first — without
it the dashboard still renders the issues table, but the Agent report tab will
show the templated fallback (the analysis itself errors out).

### Share with teammates via ngrok (no deploy)

A single ngrok tunnel works because Next.js rewrites proxy `/api/*` to the
FastAPI backend; only port 3000 needs to be exposed.

```bash
# from the repo root
./scripts/serve-ngrok.sh
```

That boots backend + frontend and runs `ngrok http 3000`. Share the printed
`https://*.ngrok-free.app` URL. (Make sure `ngrok config add-authtoken <token>`
has been run once — a free ngrok account is enough.)

If you'd rather do it by hand: boot the two processes above, then
`ngrok http 3000` in a third terminal.

---

## 11. Easiest path to a permanent hackathon deployment

Recommended in order of effort / payoff:

1. **Vercel (frontend) + Render free / Railway (backend).** Push the repo to
   GitHub; Vercel deploys the `frontend/` directory from a Project root; Render
   or Railway runs `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   from the repo root with the venv requirements. Set
   `NEXT_PUBLIC_API_BASE` to the backend's public URL on the Vercel project so
   the rewrites are bypassed. Easiest to maintain after the hackathon.
2. **Fly.io (one app, both services).** Run uvicorn and Next together via a
   `Procfile`-style setup in a single Docker image. Slightly more work, fewer
   moving pieces, single URL.
3. **Modal Labs (Python-only) + Vercel (frontend).** Modal happily hosts the
   backend (it'll cold-start the model in seconds); Vercel hosts the frontend.
   Nice if the team is already on Modal.
4. **Stay on ngrok.** Totally fine for the demo session itself if you'd rather
   not deal with hosting. Free tier is rate-limited and the URL changes each
   reboot, but for a hackathon table that's typically a non-issue.

For a single-day hackathon I'd pick option 1 (Vercel + Render). Both have free
tiers, both deploy from GitHub on push, and both handle env vars cleanly.

---

## 12. Repo map

```
backend/app/
├── ml/             real model loader + deterministic input batch
├── issues.py       in-memory issue store
├── sessions.py     per-analysis session + agent SSE queue + contextvar
├── agents/         LangGraph supervisor + 5 specialists + runner
├── tools/          plain functions read by agents via the contextvar
├── rag/            Chroma ingest + retriever (default local embedding)
├── reports/        ReportLab work-order PDF (optional)
├── runcache.py     on-disk per-issue trace cache
└── main.py         FastAPI app: /simulate, /issues, /analyze, /stream/agent, /report, /model/info

frontend/
├── app/            Next.js App Router (page + layout + globals)
├── components/     dashboard primitives (see §7)
└── lib/            types, api, sse helpers

corpus/             RAG source documents (incidents, manuals, SOPs)
robot_model.pkl                          trained RandomForest (joblib)
food_robotics_machinery_data.csv         source telemetry dataset
robot_failures_model.py                  the teammate's training script
```
