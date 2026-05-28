"""FastAPI entrypoint for OvenMind.

Endpoints:
  GET  /health
  GET  /model/info                 -> feature names, importances, class labels
  POST /simulate                   -> run the hardcoded batch through the real
                                      predictive model, return one issue per row
  GET  /issues                     -> current set of issues
  POST /issues/{id}/analyze        -> kick off the agent analysis (idempotent
                                      via run cache), returns a session id
  GET  /stream/agent?session=      -> SSE stream of agent events for the session
  GET  /report/{session}           -> final report + workOrder + trace
"""

from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend.app import issues, sessions
from backend.app.ml.predictor import model_info

app = FastAPI(title="OvenMind", version="0.2.0")

# Open CORS — this is a hackathon demo, the frontend is the only client. Lets
# the same backend serve a Vercel deploy, a second ngrok URL, etc. without
# extra config. Lock down before any production use.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/model/info")
def get_model_info() -> dict:
    return model_info()


@app.post("/simulate")
def simulate() -> dict:
    return {"issues": issues.run_simulation()}


@app.get("/issues")
def get_issues() -> dict:
    return {"issues": issues.all_issues()}


@app.post("/issues/{issue_id}/analyze")
async def analyze_issue(issue_id: str) -> dict:
    try:
        issue = issues.get(issue_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    session = sessions.create_session(issue)
    asyncio.create_task(_run_analysis(session))
    return {"session": session.id, "issue_id": issue_id}


async def _run_analysis(session: sessions.Session) -> None:
    from backend.app.agents.runner import analyze

    try:
        await analyze(session)
        session.status = "done"
    except Exception as exc:  # never let a bad LLM response kill the stream
        session.status = "error"
        session.emit({"type": "error", "message": str(exc)})
    finally:
        session.close()


@app.get("/stream/agent")
async def stream_agent(session: str = Query(...)) -> EventSourceResponse:
    try:
        sess = sessions.get_session(session)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async def gen():
        async for event in sessions.stream_events(sess):
            yield {"data": json.dumps(event, default=str)}

    # Headers that tell every intermediary (Next.js prod compress, ngrok,
    # generic reverse proxies) NOT to gzip / re-encode this response. SSE
    # writes are small and infrequent, so any compression buffer never
    # flushes and the browser sees zero bytes (the failure we hit on ngrok).
    return EventSourceResponse(
        gen(),
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Content-Encoding": "identity",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/report/{session}")
def report(session: str) -> dict:
    try:
        sess = sessions.get_session(session)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "session": sess.id,
        "status": sess.status,
        "cached": sess.cached,
        "tokens": sess.tokens,
        "cost_usd": round(sess.cost_usd, 4),
        "report": sess.report,
        "work_order": sess.work_order,
        "trace": sess.trace,
        "issue": sess.issue,
    }
