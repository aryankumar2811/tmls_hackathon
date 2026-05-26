# 🔥 OvenMind

> **Agentic intelligence layer that fuses predictive maintenance and food computer vision for industrial bakeries.**

A LangGraph supervisor coordinates four specialist agents (Equipment, Quality, Work-Order, Reporting) plus a Correlation agent over synthetic IoT sensor data and a YOLOv11 bakery-defect model. The killer demo: a simulated oven heating-element fault triggers a sensor anomaly, the CV model catches uneven browning on the same line seconds later, the agent **autonomously links the two**, retrieves the matching past incident from RAG, and dispatches a PDF work order to Slack — live, in under 90 seconds.

Built for the **TMLS Hackathon, May 25–29 2026**. Target customer: **FGF Brands** (~$1.4B industrial bakery, 22+ sites).

> ⚠️ **All sensor and image data in this demo is synthetic.** Failure modes and sensor distributions are grounded in published industry references (UCI AI4I 2020, OXMaint failure-mode literature) and a real fine-tuned YOLOv11 baseline. Be honest about this on stage.

---

## Stack

| Layer | Choice |
|---|---|
| Agent framework | LangGraph 1.0 (supervisor via tool-calls) |
| Orchestrator LLM | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| Sub-agent LLM | Claude Haiku 4.5 (`claude-haiku-4-5`) |
| Food CV | YOLOv11 (Ultralytics) fine-tuned on synthetic + Roboflow data |
| Synthetic defects | Stable Diffusion + ControlNet |
| Predictive-maint data | UCI AI4I 2020 + custom `numpy` drift simulator |
| Vector DB / RAG | Chroma (local, in-process) + hybrid BM25 + semantic retrieval |
| Embeddings | OpenAI `text-embedding-3-small` or Voyage `voyage-3` |
| Backend | FastAPI + SSE |
| Frontend | Next.js 15 + Tailwind + shadcn/ui + Apache ECharts |
| PDF work orders | ReportLab |
| Alerts | Slack incoming webhook |
| Deployment | Modal (backend + GPU) + Vercel (frontend) |

See [docs/architecture.md](docs/architecture.md) for the agent graph and [docs/demo-script.md](docs/demo-script.md) for the 90-second script.

---

## Quickstart

```bash
# Python backend (uv)
uv sync
cp .env.example .env        # fill in API keys

# Frontend
cd frontend && npm install && cd ..

# Run everything
make install                # uv sync + npm install
make backend                # FastAPI on :8000
make frontend               # Next.js on :3000
make ingest                 # build the Chroma RAG index from corpus/
make sim                    # run the drift simulator standalone
```

> This is a **skeleton**. Most modules are stubs that raise `NotImplementedError`. Fill them in per the day-by-day plan.

---

## Team roles

| Role | Owns | Directories |
|---|---|---|
| Agent / Backend lead | LangGraph supervisor + agents, FastAPI, RAG | [backend/](backend/) |
| CV / Data lead | YOLOv11, synthetic data, AI4I, drift simulator | [cv/](cv/), [data/](data/) |
| Frontend lead | Next.js control-room dashboard | [frontend/](frontend/) |
| Demo / Product lead | RAG corpus, Slack, PDF, narrative, demo script | [corpus/](corpus/), [docs/](docs/) |

## Repo map

- [backend/](backend/) — FastAPI + LangGraph agents, tools, RAG, simulator, reports
- [cv/](cv/) — YOLOv11 training & inference
- [data/](data/) — AI4I 2020 relabeling
- [corpus/](corpus/) — RAG source documents (manuals, incidents, SOPs, HACCP, work orders)
- [frontend/](frontend/) — Next.js dashboard
- [docs/](docs/) — architecture, demo script, rubric mapping
