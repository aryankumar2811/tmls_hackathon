"""Supervisor entrypoint — see graph.py for the real implementation.

Kept as a stable import surface: the LangGraph supervisor + specialist nodes live
in `graph.py`; the per-run driver lives in `runner.py`.
"""

from backend.app.agents.graph import build_graph

__all__ = ["build_graph"]
