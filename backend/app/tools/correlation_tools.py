"""Correlation tools — the cross-modal causal-inference primitives.

TODO (Wed): decorate with @tool. These are the heart of the demo.
"""

from backend.app.schemas.models import CorrelationResult


def compute_correlation(
    line: str, sensor_start: float, sensor_end: float
) -> CorrelationResult:
    """Align a sensor anomaly with a CV defect spike in time AND space, and
    return the probability of a common root cause."""
    raise NotImplementedError("TODO (Wed): compute_correlation")


def link_timeline(line: str, start: float, end: float) -> list[dict]:
    """Build a merged, time-ordered timeline of sensor + CV events for the UI."""
    raise NotImplementedError("TODO (Wed): link_timeline")
