"""Shared pydantic data models used across agents, tools, and the API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    line: str
    equipment_id: str  # e.g. "TO-3"
    ts: datetime
    channel: str       # e.g. "zone2_current_draw", "thermocouple_variance"
    value: float
    unit: str


class Detection(BaseModel):
    line: str
    ts: datetime
    label: str         # e.g. "uneven_browning", "burnt", "good"
    confidence: float
    bbox: tuple[float, float, float, float]  # x, y, w, h (normalized)


class CorrelationResult(BaseModel):
    equipment_id: str
    defect_label: str
    temporal_alignment_s: float
    spatial_match: bool
    common_root_cause_probability: float
    hypothesis: str


class WorkOrder(BaseModel):
    wo_id: str               # e.g. "WO-2026-0528-001"
    equipment_id: str
    severity: Literal["low", "medium", "high", "critical"]
    root_cause: str
    parts: list[str] = Field(default_factory=list)
    technician: str
    eta_hours: float
    estimated_impact_usd: tuple[int, int]  # (low, high)
    matched_incident: str | None = None     # e.g. "INC-2025-0317"


class AuditEntry(BaseModel):
    ts: datetime
    agent: str
    tool: str | None = None
    reasoning: str
    tokens: int = 0
    cost_usd: float = 0.0
