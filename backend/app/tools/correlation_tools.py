"""Correlation tools — joint anomaly score on the issue snapshot.

The predictive model emits a single snapshot per issue, so 'temporal' alignment
doesn't apply. Instead we compute the joint elevation of the equipment side
(vibration + motor temp) and the quality side (defect rate + defect count), and
return a common-root-cause probability.
"""

from __future__ import annotations

from backend.app import sessions
from backend.app.ml.predictor import ANOMALY_THRESHOLD, BASELINES


def _norm(name: str, value: float) -> float:
    """0..1 score: 0 at baseline, 1 at the anomaly threshold."""
    base = BASELINES.get(name) or 0
    thresh = ANOMALY_THRESHOLD.get(name)
    if thresh is None or thresh == base:
        return 0.0
    return max(0.0, min(1.0, (value - base) / (thresh - base)))


def compute_correlation() -> dict:
    """Joint anomaly score between the equipment-side channels and the quality-
    side signal on the active issue. High on both sides -> high probability of
    a single common root cause."""
    issue = sessions.current().issue
    feats = issue["features"]

    eq_channels = ("Vibration_mm_s", "Motor_Temp_C")
    q_channels = ("Defect_Rate_Pct", "Defect_Count")

    eq_score = max(_norm(c, float(feats.get(c) or 0)) for c in eq_channels)
    q_score = max(_norm(c, float(feats.get(c) or 0)) for c in q_channels)
    joint = round((eq_score * q_score) ** 0.5, 3)  # geometric mean
    p_crit = issue["prediction"]["probabilities"][2]
    common = round(min(0.97, 0.55 * joint + 0.45 * p_crit), 3)

    leading_eq = max(eq_channels, key=lambda c: _norm(c, float(feats.get(c) or 0)))
    return {
        "leading_equipment_channel": leading_eq,
        "equipment_anomaly_score": round(eq_score, 3),
        "quality_anomaly_score": round(q_score, 3),
        "joint_anomaly_score": joint,
        "model_p_critical": p_crit,
        "common_root_cause_probability": common,
        "affected_region": "n/a (vision pending)",
        "spatial_match": False,
    }


def link_timeline() -> dict:
    """Synthetic snapshot-style 'timeline' for the incident UI — a single
    moment with both events captured together."""
    corr = compute_correlation()
    issue = sessions.current().issue
    return {
        "events": [
            {"t": 0, "kind": "sensor",
             "text": f"{corr['leading_equipment_channel']} elevated above baseline"},
            {"t": 0, "kind": "quality",
             "text": f"Defect rate {issue['features'].get('Defect_Rate_Pct')}% on the same record"},
        ],
        "common_root_cause_probability": corr["common_root_cause_probability"],
    }
