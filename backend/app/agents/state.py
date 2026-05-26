"""Shared LangGraph state passed between the supervisor and sub-agents.

TODO (Tue): refine fields as the graph takes shape.
"""

from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages

from backend.app.schemas.models import AuditEntry, CorrelationResult, WorkOrder


class OvenMindState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    scenario: str
    sensor_window: list[dict]          # recent SensorReading dicts
    cv_window: list[dict]              # recent Detection dicts
    correlation: CorrelationResult | None
    work_order: WorkOrder | None
    audit_log: list[AuditEntry]
    supervisor_turns: int              # enforce MAX_SUPERVISOR_TURNS
