"""FastAPI entrypoint for OvenMind.

Endpoints:
  GET  /health
  GET  /scenarios                  -> the 4 triggerable scenarios (meta)
  POST /trigger?scenario=          -> create a session, start replay + agent analysis
  GET  /stream/{kind}?session=     -> SSE: kind in {sensors, cv, agent}
  GET  /report/{session}           -> final report + trace + ML artifacts (detail view)

Data is replayed from committed fixtures (it behaves like a live stream); the agent
analysis makes real Claude calls. Both are honest demo behaviours.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend.app import sessions
from backend.app.fixtures import list_scenarios, load_fixture
from backend.app.simulator.replay import run_replay

app = FastAPI(title="OvenMind", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_VALID_STREAMS = {"sensors", "cv", "agent"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/scenarios")
def scenarios() -> dict:
    return {"scenarios": list_scenarios()}


@app.post("/trigger")
async def trigger(scenario: str = Query(...)) -> dict:
    try:
        fixture = load_fixture(scenario)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    session = sessions.create_session(scenario, fixture)
    asyncio.create_task(run_replay(session))  # drives streams + launches agents
    return {
        "session": session.id,
        "scenario": scenario,
        "meta": fixture["meta"],
        "channels": fixture["channels"],
        "cv_image": fixture["cv"]["image"],
    }


@app.get("/stream/{kind}")
async def stream(kind: str, session: str = Query(...)) -> EventSourceResponse:
    if kind not in _VALID_STREAMS:
        raise HTTPException(status_code=404, detail=f"unknown stream {kind!r}")
    try:
        sess = sessions.get_session(session)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async def gen():
        async for event in sessions.stream_events(sess, kind):
            yield {"data": json.dumps(event, default=str)}

    return EventSourceResponse(gen())


@app.get("/report/{session}")
def report(session: str) -> dict:
    try:
        sess = sessions.get_session(session)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "session": sess.id,
        "scenario": sess.scenario,
        "status": sess.status,
        "cached": sess.cached,
        "tokens": sess.tokens,
        "cost_usd": round(sess.cost_usd, 4),
        "report": sess.report,
        "work_order": sess.work_order,
        "trace": sess.trace,
        "ml": sess.fixture["ml"],
        "cv_image": sess.fixture["cv"]["image"],
        "ground_truth": sess.fixture["ground_truth"],
        "meta": sess.fixture["meta"],
    }
