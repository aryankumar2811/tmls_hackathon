"""In-memory session store + agent-stream fan-out.

A session is one agent analysis run for one issue. It owns the issue snapshot
the tools read against, an asyncio queue the SSE endpoint drains, and the
captured trace + final report.
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
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    trace: list[dict] = field(default_factory=list)   # captured agent events
    report: dict | None = None
    work_order: dict | None = None
    tokens: int = 0
    cost_usd: float = 0.0

    # ── producers ─────────────────────────────────────────────────────────
    def emit(self, payload: dict) -> None:
        """Push an agent event onto the SSE queue and record it in the trace."""
        self.trace.append(payload)
        self.queue.put_nowait(payload)

    def close(self) -> None:
        self.queue.put_nowait({"type": "end"})


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
    """Async generator yielding events from the agent queue until {'end'}."""
    while True:
        item: dict[str, Any] = await session.queue.get()
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
