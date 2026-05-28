"""Replay engine — streams committed fixture frames so the dashboard behaves as
if data were arriving live, then fires the anomaly notification and launches the
(real) agent analysis.

Nothing is generated at runtime: every frame comes from the scenario JSON.
"""

from __future__ import annotations

import asyncio

from backend.app.config import settings
from backend.app.sessions import Session


async def run_replay(session: Session) -> None:
    """Drive one session: advance the playhead, push frames, fire the agents."""
    fix = session.fixture
    meta = fix["meta"]
    hz = float(meta.get("hz", 2.0))
    speed = max(0.25, settings.replay_speed)
    dt = 1.0 / hz / speed
    fire_at = float(meta.get("fire_at_t", 1e9))

    sframes = fix["sensors"]["frames"]
    cframes = fix["cv"]["frames"]
    fired = False

    # let the client open its SSE connections before we start pushing
    await asyncio.sleep(0.6)

    for i, sf in enumerate(sframes):
        session.playhead_t = sf["t"]
        session.emit("sensors", {"type": "sensor", "frame": sf, "playhead_t": sf["t"]})
        if i < len(cframes):
            cf = cframes[i]
            session.emit("cv", {"type": "cv", "frame": cf, "playhead_t": sf["t"]})

        if not fired and sf["t"] >= fire_at:
            fired = True
            session.status = "analyzing"
            session.emit(
                "agent",
                {
                    "type": "notification",
                    "scenario": session.scenario,
                    "session": session.id,
                    "title": meta["title"],
                    "equipment_id": meta["equipment_id"],
                    "line": meta["line"],
                    "severity": meta["severity"],
                    "t": sf["t"],
                },
            )
            # run the agent analysis concurrently so frames keep streaming
            asyncio.create_task(_run_agents(session))

        await asyncio.sleep(dt)

    session.close_stream("sensors")
    session.close_stream("cv")


async def _run_agents(session: Session) -> None:
    """Invoke the agent orchestrator; events are emitted from inside the nodes."""
    from backend.app.agents.runner import analyze  # lazy import (avoids cycles)

    try:
        await analyze(session)
        session.status = "done"
    except Exception as exc:  # never let a bad LLM response kill the demo
        session.status = "error"
        session.emit("agent", {"type": "error", "message": str(exc)})
    finally:
        session.close_stream("agent")
