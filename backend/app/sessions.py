"""In-memory session store + agent-stream fan-out.

A session is one agent analysis run for one issue. It owns the issue snapshot
the tools read against, the captured trace, and a list of live SSE consumers
that each receive every emitted event. New consumers (e.g. an EventSource
auto-reconnect, or a React StrictMode double-subscribe) replay the trace
they missed before joining the live broadcast, so no consumer ends up with
half the events.
"""

from __future__ import annotations

import asyncio
import contextvars
import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Session:
    issue: dict
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    status: str = "running"          # running | done | error
    cached: bool = False
    consumers: list[asyncio.Queue] = field(default_factory=list)
    trace: list[dict] = field(default_factory=list)   # captured agent events
    closed: bool = False
    report: dict | None = None
    work_order: dict | None = None
    tokens: int = 0
    cost_usd: float = 0.0

    # ── producers ─────────────────────────────────────────────────────────
    def emit(self, payload: dict) -> None:
        """Push an agent event to the trace AND every live consumer."""
        self.trace.append(payload)
        for q in self.consumers:
            q.put_nowait(payload)

    def close(self) -> None:
        """Signal end-of-stream to every consumer (idempotent)."""
        self.closed = True
        for q in self.consumers:
            q.put_nowait({"type": "end"})


_SESSIONS: dict[str, Session] = {}


def create_session(issue: dict) -> Session:
    s = Session(issue=issue)
    _SESSIONS[s.id] = s
    return s


def get_session(session_id: str) -> Session:
    if session_id not in _SESSIONS:
        raise KeyError(f"unknown session {session_id!r}")
    return _SESSIONS[session_id]


async def stream_events(session: Session):
    """Async generator for one SSE consumer. Catches up on any events that
    already happened, then drains live broadcasts until {'end'} is delivered.

    Safe for late joiners and auto-reconnects: each consumer sees the FULL
    event timeline regardless of when it connected.
    """
    q: asyncio.Queue = asyncio.Queue()
    # ── atomic subscribe + catch-up (no await between these two steps) ──
    session.consumers.append(q)
    for ev in list(session.trace):
        q.put_nowait(ev)
    if session.closed:
        q.put_nowait({"type": "end"})
    try:
        while True:
            item: dict[str, Any] = await q.get()
            yield item
            if item.get("type") == "end":
                return
    finally:
        if q in session.consumers:
            session.consumers.remove(q)


# ── the session the agent tools should read while a run is in flight ──────
_current: contextvars.ContextVar[Session | None] = contextvars.ContextVar(
    "current_session", default=None
)


def set_current(session: Session) -> None:
    _current.set(session)


def current() -> Session:
    s = _current.get()
    if s is None:
        raise RuntimeError("no active session (set_current was not called)")
    return s
