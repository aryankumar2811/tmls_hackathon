"""Drive one agent analysis for a session.

On a cache miss: set the active session, run the LangGraph, then persist the trace.
On a cache hit: replay the cached agent events (with light pacing) so the UI shows
the same workflow instantly and for free.
"""

from __future__ import annotations

import asyncio

from backend.app import runcache, sessions
from backend.app.config import settings


async def analyze(session: sessions.Session) -> None:
    sessions.set_current(session)
    issue_id = session.issue["id"]

    cached = runcache.load(issue_id) if settings.use_run_cache else None
    if cached:
        await _replay_cached(session, cached)
        return

    from backend.app.agents.graph import build_graph

    graph = build_graph()
    await graph.ainvoke(
        {"completed": [], "findings": {}, "turns": 0},
        {"recursion_limit": 2 * settings.max_supervisor_turns + 5},
    )

    # persist for next time
    if settings.use_run_cache:
        runcache.save(
            issue_id,
            {
                "events": session.trace,
                "report": session.report,
                "work_order": session.work_order,
                "tokens": session.tokens,
                "cost_usd": round(session.cost_usd, 4),
            },
        )


async def _replay_cached(session: sessions.Session, cached: dict) -> None:
    session.cached = True
    session.report = cached.get("report")
    session.work_order = cached.get("work_order")
    session.tokens = cached.get("tokens", 0)
    session.cost_usd = cached.get("cost_usd", 0.0)

    # pace events so the workflow animates rather than dumping at once
    delays = {"tool_call": 0.25, "tool_result": 0.25, "agent_start": 0.5,
              "agent_done": 0.5, "supervisor": 0.4, "work_order": 0.4, "report": 0.3}
    for ev in cached.get("events", []):
        session.emit({**ev, "cached": True})
        await asyncio.sleep(delays.get(ev.get("type"), 0.2))
