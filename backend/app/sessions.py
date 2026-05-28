"""In-memory session store + per-session SSE fan-out.

A *session* is one triggered scenario run. It owns three asyncio queues (sensors,
cv, agent) that the SSE endpoints drain, a playhead the agent tools read against,
and the captured agent trace + final report used by GET /report.

Single event loop, no threads — every producer (replay loop, agent nodes) and
consumer (SSE generators) runs in the same loop, so asyncio.Queue is safe.
"""

from __future__ import annotations

import asyncio
import contextvars
import uuid
from dataclasses import dataclass, field
from typing import Any

Stream = str  # "sensors" | "cv" | "agent"
_STREAMS: tuple[Stream, ...] = ("sensors", "cv", "agent")


@dataclass
class Session:
    scenario: str
    fixture: dict
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    playhead_t: float = 0.0
    status: str = "running"          # running | analyzing | done | error
    cached: bool = False
    queues: dict[Stream, asyncio.Queue] = field(default_factory=dict)
    trace: list[dict] = field(default_factory=list)   # captured agent events
    report: dict | None = None
    work_order: dict | None = None
    tokens: int = 0
    cost_usd: float = 0.0

    def __post_init__(self) -> None:
        self.queues = {s: asyncio.Queue() for s in _STREAMS}

    # ── producers ─────────────────────────────────────────────────────────
    def emit(self, stream: Stream, payload: dict) -> None:
        """Push an event to a stream (and record agent events for /report)."""
        if stream == "agent":
            self.trace.append(payload)
        self.queues[stream].put_nowait(payload)

    def close_stream(self, stream: Stream) -> None:
        self.queues[stream].put_nowait({"type": "end"})

    # ── tool-facing views over the replayed window ────────────────────────
    def sensor_window(self) -> list[dict]:
        """Sensor frames up to the current playhead."""
        return [f for f in self.fixture["sensors"]["frames"] if f["t"] <= self.playhead_t]

    def cv_window(self) -> list[dict]:
        return [f for f in self.fixture["cv"]["frames"] if f["t"] <= self.playhead_t]


_SESSIONS: dict[str, Session] = {}


def create_session(scenario: str, fixture: dict) -> Session:
    s = Session(scenario=scenario, fixture=fixture)
    _SESSIONS[s.id] = s
    return s


def get_session(session_id: str) -> Session:
    if session_id not in _SESSIONS:
        raise KeyError(f"unknown session {session_id!r}")
    return _SESSIONS[session_id]


async def stream_events(session: Session, stream: Stream):
    """Async generator yielding SSE-ready dicts until an {'end'} sentinel."""
    q = session.queues[stream]
    while True:
        item: dict[str, Any] = await q.get()
        yield item
        if item.get("type") == "end":
            return


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
