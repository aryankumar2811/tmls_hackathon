# backend/

Owner: **Agent / Backend lead**.

FastAPI app + LangGraph supervisor + 5 agents + tools + RAG + drift simulator + PDF/Slack.

```
app/
├── main.py          FastAPI app, SSE endpoints (/stream/sensors, /stream/cv, /stream/agent, /trigger)
├── config.py        pydantic-settings (reads .env)
├── agents/          LangGraph supervisor + specialist agents
├── tools/           one tool = one function; every call must be REAL
├── rag/             Chroma ingest + hybrid retriever
├── simulator/       numpy drift simulator + 4 scenario presets
├── reports/         ReportLab PDF work orders
├── integrations/    Slack webhook
└── schemas/         pydantic models
```

Run: `make backend` (uvicorn on :8000). Trace every agent step to LangSmith — it's a free audit trail and a judging gift.

**Build order:** Mon — one agent, one tool. Tue — supervisor + 4 sub-agents routing a fake event. Wed — the Correlation Agent (the whole day) + Work-Order → PDF → Slack + audit modal.
