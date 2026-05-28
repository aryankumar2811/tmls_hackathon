"""Sensor tools — read the replayed window of the active session.

Plain functions (no langchain dependency); the agent layer wraps them as tools.
Every call returns real values computed from the committed fixture frames.
"""

from __future__ import annotations

from backend.app import sessions


def _channels() -> dict[str, dict]:
    s = sessions.current()
    return {c["key"]: c for c in s.fixture["channels"]}


def query_sensor(channel: str) -> dict:
    """Latest value (at the current playhead) for one sensor channel."""
    s = sessions.current()
    window = s.sensor_window()
    if not window:
        return {"channel": channel, "value": None, "note": "no data yet"}
    meta = _channels().get(channel, {})
    return {
        "channel": channel,
        "label": meta.get("label", channel),
        "unit": meta.get("unit", ""),
        "value": window[-1]["values"].get(channel),
        "t": window[-1]["t"],
    }


def get_sensor_window() -> dict:
    """Per-channel summary over the replayed window: baseline, current, % change,
    and trend — enough for the agent to judge which channels are anomalous."""
    s = sessions.current()
    window = s.sensor_window()
    chans = _channels()
    if len(window) < 2:
        return {"channels": [], "note": "insufficient data"}

    out = []
    head = window[: max(2, len(window) // 4)]  # early baseline portion
    for key, meta in chans.items():
        baseline = sum(f["values"][key] for f in head) / len(head)
        current = window[-1]["values"][key]
        pct = ((current - baseline) / baseline * 100) if baseline else 0.0
        out.append(
            {
                "channel": key,
                "label": meta["label"],
                "unit": meta["unit"],
                "baseline": round(baseline, 3),
                "current": round(current, 3),
                "pct_change": round(pct, 1),
                "trend": "rising" if pct > 3 else "falling" if pct < -3 else "stable",
            }
        )
    out.sort(key=lambda c: abs(c["pct_change"]), reverse=True)
    return {"window_s": [window[0]["t"], window[-1]["t"]], "channels": out}


def get_rul() -> dict:
    """Predictive-model remaining-useful-life estimate and current failure
    probability for the equipment on this line (from the predictive model output)."""
    s = sessions.current()
    ml = s.fixture["ml"]
    fp = ml["failure_probability"]
    current_p = next((f["p"] for f in reversed(fp) if f["t"] <= s.playhead_t), fp[0]["p"])
    lo, hi = ml["rul_hours"]
    return {
        "equipment_id": s.fixture["meta"]["equipment_id"],
        "rul_hours_low": lo,
        "rul_hours_high": hi,
        "failure_probability": round(current_p, 3),
        "top_features": ml["feature_contributions"],
    }
