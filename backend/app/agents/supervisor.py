"""LangGraph supervisor (Claude Sonnet 4.6).

Orchestrates the 5 specialist agents via tool-call handoffs. Chooses the next
agent based on observed state — NOT a fixed pipeline.

TODO (Tue): build the StateGraph, register handoff tools, enforce the turn cap.
TODO: add LangSmith tracing (it's our audit trail).
"""

from backend.app.agents.state import OvenMindState
from backend.app.config import settings


def build_supervisor():
    """Construct and compile the supervisor StateGraph.

    Enforce settings.max_supervisor_turns and settings.max_tokens_per_agent.
    """
    raise NotImplementedError("TODO (Tue): build supervisor StateGraph")


def run(state: OvenMindState) -> OvenMindState:
    """Run one supervisor turn: inspect state, route to a sub-agent."""
    raise NotImplementedError("TODO (Tue): supervisor routing logic")
