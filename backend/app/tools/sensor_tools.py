"""Sensor tools — read the current issue's feature snapshot.

Each tool returns plain JSON-friendly dicts. The active issue is read from the
session contextvar set by the agent runner.
"""

from __future__ import annotations

from backend.app import sessions
from backend.app.ml.predictor import (
    ANOMALY_THRESHOLD,
    BASELINES,
    NUMERIC_FEATURES,
    UNITS,
)

_CATEGORIES: dict[str, list[str]] = {
    "operating": ["Operating_Hours", "Days_Since_Maintenance", "Year_Installed", "RPM",
                  "Conveyor_Speed_m_min"],
    "thermal": ["Motor_Temp_C", "Ambient_Temp_C", "Hydraulic_Fluid_Temp_C"],
    "mechanical": ["Vibration_mm_s", "Power_Draw_kW", "Pressure_PSI"],
    "acoustic": ["Noise_Level_dB"],
    "quality": ["Defect_Count", "Defect_Rate_Pct"],
}


def _features() -> dict:
    return sessions.current().issue["features"]


def _summarize(name: str, value) -> dict:
    base = BASELINES.get(name)
    thresh = ANOMALY_THRESHOLD.get(name)
    deviation_pct = None
    if base and isinstance(value, (int, float)) and base != 0:
        deviation_pct = round(((value - base) / base) * 100, 1)
    anomalous = (thresh is not None and isinstance(value, (int, float)) and value >= thresh)
    return {
        "feature": name,
        "value": value,
        "unit": UNITS.get(name, ""),
        "baseline": base,
        "pct_vs_baseline": deviation_pct,
        "anomalous": anomalous,
    }


def query_sensor(feature: str) -> dict:
    """Look up a single feature on the current issue snapshot (value, unit,
    baseline, % vs baseline, anomalous flag)."""
    feats = _features()
    if feature not in feats:
        return {"feature": feature, "error": "unknown feature",
                "available": list(feats.keys())}
    return _summarize(feature, feats[feature])


def get_sensor_window() -> dict:
    """Categorized snapshot of every numeric feature on the active issue, with
    anomaly flags and the sensor-status string. (One reading — not a window —
    because the predictive model operates on a single record.)"""
    feats = _features()
    by_cat: dict[str, list[dict]] = {}
    for cat, names in _CATEGORIES.items():
        by_cat[cat] = [_summarize(n, feats.get(n)) for n in names]
    anomalous = [n for n in NUMERIC_FEATURES
                 if (t := ANOMALY_THRESHOLD.get(n)) is not None
                 and isinstance(feats.get(n), (int, float)) and feats[n] >= t]
    return {
        "sensor_status": feats.get("Sensor_Status"),
        "categories": by_cat,
        "anomalous_features": anomalous,
    }


def get_rul() -> dict:
    """Estimate remaining useful life from the predictive model's class
    probabilities. P(critical) high -> short window; P(low) high -> long."""
    issue = sessions.current().issue
    p = issue["prediction"]["probabilities"]  # [P1, P2, P3]
    p_low, p_med, p_crit = p[0], p[1], p[2]
    # weighted blend of representative hour windows
    if p_crit > 0.5:
        lo, hi = 4, 24
    elif p_med > 0.5:
        lo, hi = 24, 168
    else:
        lo, hi = 168, 720
    return {
        "equipment_id": issue["equipment_id"],
        "rul_hours_low": lo,
        "rul_hours_high": hi,
        "predicted_class": issue["prediction"]["class"],
        "class_name": issue["prediction"]["class_name"],
        "probabilities": {"low": p_low, "medium": p_med, "critical": p_crit},
    }
