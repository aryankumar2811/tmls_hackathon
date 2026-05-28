"""Deterministic fixture generator for the 4 demo scenarios.

Produces one JSON per scenario under `scenarios/`. Each fixture is the *mocked ML
output* the agents reason over: a sensor timeline (baseline -> drift -> step), a CV
defect timeline with per-frame detections, predictive-model metadata, and ground truth.

The ML models themselves are NOT run — these files stand in for their output.

Run:  `make fixtures`  (or `python -m backend.app.fixtures.generate`)
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "scenarios"

HZ = 2.0
DURATION_S = 60.0
N = int(DURATION_S * HZ)  # 120 frames
DRIFT_START_S = 25.0
STEP_S = 45.0
FIRE_AT_S = 40.0  # when the operator notification fires


def _ramp(t: float) -> float:
    """0 before drift start, smooth 0->1 across the drift window, 1 after step."""
    if t < DRIFT_START_S:
        return 0.0
    if t >= STEP_S:
        return 1.0
    return (t - DRIFT_START_S) / (STEP_S - DRIFT_START_S)


def _sensor_series(rng, baseline, noise, drift_to, t):
    """baseline + noise + drift toward `drift_to` following the ramp."""
    r = _ramp(t)
    val = baseline + (drift_to - baseline) * r + rng.gauss(0, noise)
    return round(float(val), 3)


_SLOTS = 6  # product positions across one row of the conveyor


def _detections(rng, ramp, label):
    """One detection per product slot, evenly spaced in a single row, so the
    box always frames its product. As the ramp rises, more slots flip to the
    defect class. bbox = [x, y, w, h] normalized 0..1."""
    n_def = int(round(ramp * 4))  # 0 at baseline -> 4 of 6 at peak
    dets = []
    for i in range(_SLOTS):
        x = round(0.045 + i * 0.155, 3)
        if i < n_def:
            conf = min(0.97, 0.80 + ramp * 0.15 + float(rng.gauss(0, 0.02)))
            dets.append({"label": label, "confidence": round(max(0.55, conf), 3),
                         "bbox": [x, 0.40, 0.115, 0.36]})
        else:
            dets.append({"label": "good", "confidence": round(float(rng.uniform(0.9, 0.97)), 3),
                         "bbox": [x, 0.40, 0.115, 0.36]})
    return dets


SCENARIOS = {
    "oven_zone2_element_degradation": {
        "meta": {
            "id": "oven_zone2_element_degradation",
            "equipment_id": "TO-3",
            "equipment_name": "Tunnel Oven XB-2400",
            "line": "Line 3",
            "title": "Oven Zone 2 — heating element degradation",
            "severity": "critical",
            "product": "Naan",
            "image": "/images/naan_uneven.svg",
        },
        "channels": [
            {"key": "zone2_current_draw", "label": "Zone 2 current draw", "unit": "A",
             "baseline": 42.0, "noise": 0.4, "drift_to": 47.2},
            {"key": "thermocouple_variance", "label": "Thermocouple variance", "unit": "°C²",
             "baseline": 1.8, "noise": 0.2, "drift_to": 9.5},
            {"key": "zone2_temp", "label": "Zone 2 temp", "unit": "°C",
             "baseline": 232.0, "noise": 1.0, "drift_to": 246.0},
            {"key": "vibration_rms", "label": "Vibration RMS", "unit": "mm/s",
             "baseline": 1.1, "noise": 0.08, "drift_to": 1.15},
        ],
        "defect_label": "uneven_browning",
        "region": "top surface, leading edge",
        "defect_peak": 6.8,
        "ml": {
            "rul_hours": [14, 48],
            "feature_contributions": {
                "thermocouple_variance": 0.41,
                "zone2_current_draw": 0.33,
                "zone2_temp": 0.19,
                "vibration_rms": 0.07,
            },
            "cv_classes": ["good", "uneven_browning", "burnt"],
            "conf_threshold": 0.5,
        },
        "ground_truth": {
            "root_cause": "Zone 2 top heating element coil degradation from thermal cycling.",
            "matched_incident": "INC-2025-0317",
            "impact_usd": [14000, 22000],
        },
    },
    "mixer_bearing_wear": {
        "meta": {
            "id": "mixer_bearing_wear",
            "equipment_id": "SM-600",
            "equipment_name": "Spiral Mixer SM-600",
            "line": "Line 1",
            "title": "Spiral mixer — bearing wear",
            "severity": "high",
            "product": "Dough / Bread",
            "image": "/images/bread_dense.svg",
        },
        "channels": [
            {"key": "vibration_rms", "label": "Vibration RMS", "unit": "mm/s",
             "baseline": 1.2, "noise": 0.06, "drift_to": 2.6},
            {"key": "bearing_temp", "label": "Bearing temp", "unit": "°C",
             "baseline": 54.0, "noise": 0.6, "drift_to": 71.0},
            {"key": "mixer_load", "label": "Mixer load", "unit": "Nm",
             "baseline": 38.0, "noise": 0.5, "drift_to": 44.0},
            {"key": "mixer_rpm", "label": "Mixer RPM", "unit": "rpm",
             "baseline": 120.0, "noise": 0.8, "drift_to": 116.0},
        ],
        "defect_label": "dense_crumb",
        "region": "crumb structure / interior",
        "defect_peak": 5.1,
        "ml": {
            "rul_hours": [48, 168],
            "feature_contributions": {
                "vibration_rms": 0.52,
                "bearing_temp": 0.28,
                "mixer_load": 0.14,
                "mixer_rpm": 0.06,
            },
            "cv_classes": ["good", "dense_crumb", "collapsed"],
            "conf_threshold": 0.5,
        },
        "ground_truth": {
            "root_cause": "Spiral mixer drive-end bearing wear; rising vibration and heat.",
            "matched_incident": "INC-2025-0291",
            "impact_usd": [8000, 15000],
        },
    },
    "conveyor_belt_drift": {
        "meta": {
            "id": "conveyor_belt_drift",
            "equipment_id": "C-Series",
            "equipment_name": "Cooling Conveyor C-Series",
            "line": "Line 2",
            "title": "Conveyor — belt tracking drift",
            "severity": "medium",
            "product": "Buns",
            "image": "/images/buns_offset.svg",
        },
        "channels": [
            {"key": "belt_alignment", "label": "Belt alignment offset", "unit": "mm",
             "baseline": 1.0, "noise": 0.15, "drift_to": 11.0},
            {"key": "motor_current", "label": "Drive motor current", "unit": "A",
             "baseline": 9.0, "noise": 0.12, "drift_to": 11.8},
            {"key": "belt_speed", "label": "Belt speed", "unit": "m/min",
             "baseline": 6.0, "noise": 0.05, "drift_to": 5.6},
        ],
        "defect_label": "position_offset",
        "region": "off-center on belt",
        "defect_peak": 4.0,
        "ml": {
            "rul_hours": [8, 12],
            "feature_contributions": {
                "belt_alignment": 0.62,
                "motor_current": 0.25,
                "belt_speed": 0.13,
            },
            "cv_classes": ["good", "position_offset", "uneven_bake"],
            "conf_threshold": 0.5,
        },
        "ground_truth": {
            "root_cause": "Belt tracking drift causing product mis-position and uneven baking.",
            "matched_incident": "INC-2025-0204",
            "impact_usd": [3000, 7000],
        },
    },
    "proofer_humidity_loss": {
        "meta": {
            "id": "proofer_humidity_loss",
            "equipment_id": "P-12",
            "equipment_name": "Proofer P-12",
            "line": "Line 4",
            "title": "Proofer — humidity sensor drift",
            "severity": "high",
            "product": "Rolls",
            "image": "/images/rolls_underproofed.svg",
        },
        "channels": [
            {"key": "humidity", "label": "Chamber humidity", "unit": "%RH",
             "baseline": 82.0, "noise": 0.5, "drift_to": 63.0},
            {"key": "chamber_temp", "label": "Chamber temp", "unit": "°C",
             "baseline": 38.0, "noise": 0.3, "drift_to": 41.5},
            {"key": "steam_pressure", "label": "Steam pressure", "unit": "bar",
             "baseline": 1.4, "noise": 0.05, "drift_to": 0.9},
        ],
        "defect_label": "under_proofed",
        "region": "low rise / surface",
        "defect_peak": 5.7,
        "ml": {
            "rul_hours": [24, 72],
            "feature_contributions": {
                "humidity": 0.55,
                "steam_pressure": 0.27,
                "chamber_temp": 0.18,
            },
            "cv_classes": ["good", "under_proofed", "cracked"],
            "conf_threshold": 0.5,
        },
        "ground_truth": {
            "root_cause": "Proofer humidity sensor drift -> dry chamber -> inconsistent rise.",
            "matched_incident": "INC-2025-0155",
            "impact_usd": [5000, 11000],
        },
    },
}


def build(name: str, spec: dict) -> dict:
    rng = random.Random(name)  # deterministic per scenario name
    times = [round(i / HZ, 1) for i in range(N)]

    sensor_frames = []
    for t in times:
        values = {
            ch["key"]: _sensor_series(rng, ch["baseline"], ch["noise"], ch["drift_to"], t)
            for ch in spec["channels"]
        }
        sensor_frames.append({"t": t, "values": values})

    baseline_rate = 0.4
    cv_frames = []
    fail_prob = []
    for t in times:
        r = _ramp(t)
        rate = round(baseline_rate + (spec["defect_peak"] - baseline_rate) * r, 2)
        cv_frames.append(
            {
                "t": t,
                "defect_rate": rate,
                "detections": _detections(rng, r, spec["defect_label"]),
            }
        )
        # logistic-ish failure probability rising with the ramp
        p = 1.0 / (1.0 + math.exp(-(r * 6 - 2.5)))
        fail_prob.append({"t": t, "p": round(p, 3)})

    ml = dict(spec["ml"])
    ml["failure_probability"] = fail_prob
    ml["defect_peak_rate"] = spec["defect_peak"]
    ml["baseline_rate"] = baseline_rate

    return {
        "meta": {**spec["meta"], "fire_at_t": FIRE_AT_S, "hz": HZ, "duration_s": DURATION_S},
        "channels": spec["channels"],
        "sensors": {"frames": sensor_frames},
        "cv": {
            "image": spec["meta"]["image"],
            "defect_label": spec["defect_label"],
            "region": spec.get("region", "product surface"),
            "baseline_rate": baseline_rate,
            "frames": cv_frames,
        },
        "ml": ml,
        "ground_truth": spec["ground_truth"],
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, spec in SCENARIOS.items():
        fixture = build(name, spec)
        path = OUT_DIR / f"{name}.json"
        path.write_text(json.dumps(fixture, indent=2))
        n = len(fixture["sensors"]["frames"])
        print(f"wrote {path.relative_to(OUT_DIR.parents[3])}  ({n} frames)")


if __name__ == "__main__":
    main()
