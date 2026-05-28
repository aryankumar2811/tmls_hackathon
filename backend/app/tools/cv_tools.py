"""Quality / vision tools — placeholder until the real vision model is trained.

For now the quality signal is sourced from the defect-count sensor on the same
record. Tools return the same fields the agents already expect, plus a clear
`note` flagging that the YOLOv11 model is still in training.
"""

from __future__ import annotations

from backend.app import sessions
from backend.app.ml.predictor import BASELINES

VISION_NOTE = "vision model pending; quality signal from defect-count sensor"


def query_cv() -> dict:
    issue = sessions.current().issue
    feats = issue["features"]
    return {
        "machine": issue["machine_name"],
        "product": issue.get("product"),
        "defect_count": feats.get("Defect_Count"),
        "defect_rate_pct": feats.get("Defect_Rate_Pct"),
        "classes_observed": [],
        "note": VISION_NOTE,
    }


def get_defect_rate() -> dict:
    """Current quality-signal rate vs baseline (sourced from the defect-rate
    sensor channel, not the vision model)."""
    issue = sessions.current().issue
    feats = issue["features"]
    current = float(feats.get("Defect_Rate_Pct") or 0)
    baseline = float(BASELINES.get("Defect_Rate_Pct") or 0.8)
    fold = round(current / baseline, 1) if baseline else None
    return {
        "defect_label": "quality_signal_proxy",
        "baseline_rate_pct": baseline,
        "current_rate_pct": current,
        "fold_change": fold,
        "defect_count": feats.get("Defect_Count"),
        "affected_region": "n/a (vision pending)",
        "note": VISION_NOTE,
    }


def get_cv_window() -> dict:
    """Placeholder window summary derived from the snapshot's defect counts."""
    issue = sessions.current().issue
    feats = issue["features"]
    return {
        "defect_label": "quality_signal_proxy",
        "peak_rate_pct": feats.get("Defect_Rate_Pct"),
        "defect_count": feats.get("Defect_Count"),
        "samples": 1,
        "note": VISION_NOTE,
    }
