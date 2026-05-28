"""Correlation tools — the cross-modal causal-inference primitives.

`compute_correlation` aligns the sensor anomaly onset with the CV defect onset in
time and space and returns a common-root-cause probability the Correlation Agent
reasons over. Deterministic math over the replayed windows.
"""

from __future__ import annotations

from backend.app import sessions
from backend.app.tools.cv_tools import _region


def _sensor_onset(window: list[dict], channels: list[dict]) -> tuple[float | None, str | None]:
    """Earliest sustained departure from baseline across all channels.

    Baseline mean+std is taken from the first portion of the window; onset is the
    first frame (past the baseline window) that exceeds mean ± 5σ AND stays out for
    the next frame too — robust against per-frame sensor noise.
    """
    n = len(window)
    if n < 8:
        return None, None
    b_end = max(4, n // 5)  # baseline = first ~20% of the window
    base, std = {}, {}
    for c in channels:
        k = c["key"]
        vals = [window[i]["values"][k] for i in range(b_end)]
        m = sum(vals) / len(vals)
        var = sum((v - m) ** 2 for v in vals) / len(vals)
        base[k], std[k] = m, max(var**0.5, 1e-6)

    best: tuple[float, str] | None = None
    for c in channels:
        k = c["key"]
        thresh = 5 * std[k]
        for i in range(b_end, n - 1):
            d0 = abs(window[i]["values"][k] - base[k])
            d1 = abs(window[i + 1]["values"][k] - base[k])
            if d0 > thresh and d1 > thresh:
                if best is None or window[i]["t"] < best[0]:
                    best = (window[i]["t"], k)
                break
    return best if best else (None, None)


def compute_correlation() -> dict:
    """Temporal + spatial alignment of the sensor anomaly and the CV defect."""
    s = sessions.current()
    sw = s.sensor_window()
    cw = s.cv_window()
    channels = s.fixture["channels"]

    s_onset, s_channel = _sensor_onset(sw, channels)
    baseline = s.fixture["cv"]["baseline_rate"]
    c_onset = next((f["t"] for f in cw if f["defect_rate"] > baseline * 2), None)

    if s_onset is None or c_onset is None:
        return {"common_root_cause_probability": 0.0, "note": "onsets not both present"}

    lag = round(c_onset - s_onset, 1)  # CV usually lags the sensor anomaly
    label = s.fixture["cv"]["defect_label"]
    region = _region(cw[-1]["detections"], label) if cw else "n/a"

    # spatial plausibility: a "top surface" defect aligns with a top-element fault, etc.
    spatial_match = region not in ("n/a", "")
    # closer in time + spatially consistent => higher common-cause probability
    temporal_score = max(0.0, 1.0 - abs(lag) / 30.0)
    prob = round(min(0.97, 0.45 + 0.4 * temporal_score + (0.12 if spatial_match else 0)), 2)

    return {
        "sensor_anomaly_onset_t": s_onset,
        "leading_sensor_channel": s_channel,
        "cv_defect_onset_t": c_onset,
        "temporal_lag_s": lag,
        "affected_region": region,
        "spatial_match": spatial_match,
        "common_root_cause_probability": prob,
    }


def link_timeline() -> dict:
    """Merged, time-ordered sensor + CV events for the incident timeline UI."""
    s = sessions.current()
    corr = compute_correlation()
    events = []
    if corr.get("sensor_anomaly_onset_t") is not None:
        events.append({"t": corr["sensor_anomaly_onset_t"],
                       "kind": "sensor",
                       "text": f"{corr['leading_sensor_channel']} began drifting"})
    if corr.get("cv_defect_onset_t") is not None:
        events.append({"t": corr["cv_defect_onset_t"],
                       "kind": "cv",
                       "text": f"{s.fixture['cv']['defect_label']} defects appeared "
                               f"({corr.get('affected_region')})"})
    events.sort(key=lambda e: e["t"])
    return {"events": events, "common_root_cause_probability":
            corr.get("common_root_cause_probability", 0.0)}
