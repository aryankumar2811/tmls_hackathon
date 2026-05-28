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
make install                # uv sync + npm install (Python 3.12 + Node 20)
cp .env.example .env        # set ANTHROPIC_API_KEY (only key required)

make fixtures               # (re)generate the 4 scenario datasets (already committed)
make ingest                 # build the local Chroma RAG index from corpus/ (no API key)

make backend                # FastAPI + SSE on :8000
make frontend               # Next.js control room on :3000  ->  open http://localhost:3000
```

Open the dashboard, click a scenario under **Trigger scenario**, watch the sensor
chart drift and a notification fire, then click the notification to see the LLM
incident report, the live agent workflow, and the ML model panels.

> **What's real vs. mocked:** the LangGraph supervisor + agents make real Claude calls;
> the sensor/CV data is committed fixture data replayed to behave like a live stream
> (the two ML models are not run — their outputs come from the fixtures). The first
> trigger of each scenario runs the agents for real and is cached; later triggers replay
> the cached run instantly and for free (`USE_RUN_CACHE`).

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
