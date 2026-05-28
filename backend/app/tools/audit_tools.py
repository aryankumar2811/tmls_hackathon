"""Audit tool — record a reasoning step to the active session's agent stream.

The runner already emits structured tool_call events automatically; agents may also
call this to narrate an explicit decision. Plain function; wrapped by the agent layer.
"""

from __future__ import annotations

from backend.app import sessions


def log_action(agent: str, reasoning: str) -> dict:
    """Append a reasoning note to the audit trail (shown in 'Show reasoning')."""
    s = sessions.current()
    s.emit("agent", {"type": "note", "agent": agent, "reasoning": reasoning,
                     "t": s.playhead_t})
    return {"logged": True}
