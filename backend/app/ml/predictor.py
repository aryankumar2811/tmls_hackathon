"""Load the trained robotic-failure predictor and run inference.

Loads `robot_model.pkl` (RandomForestClassifier, 14 numeric features + one-hot
Sensor_Status) once on first use. Classes map to severity: 1=low, 2=medium,
3=critical.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[3]
MODEL_PATH = REPO_ROOT / "robot_model.pkl"

# 14 numeric features the model uses (matches training script).
NUMERIC_FEATURES: list[str] = [
    "Year_Installed", "Operating_Hours", "Motor_Temp_C", "Ambient_Temp_C",
    "Vibration_mm_s", "RPM", "Power_Draw_kW", "Conveyor_Speed_m_min",
    "Pressure_PSI", "Hydraulic_Fluid_Temp_C", "Noise_Level_dB", "Defect_Count",
    "Defect_Rate_Pct", "Days_Since_Maintenance",
]

# typical / healthy baselines (used by the UI and the agent tools to flag
# anomalous values).
BASELINES: dict[str, float] = {
    "Year_Installed": 2022, "Operating_Hours": 1500, "Motor_Temp_C": 52,
    "Ambient_Temp_C": 22, "Vibration_mm_s": 1.2, "RPM": 1450,
    "Power_Draw_kW": 4.2, "Conveyor_Speed_m_min": 6.0, "Pressure_PSI": 105,
    "Hydraulic_Fluid_Temp_C": 50, "Noise_Level_dB": 68, "Defect_Count": 5,
    "Defect_Rate_Pct": 0.8, "Days_Since_Maintenance": 30,
}

ANOMALY_THRESHOLD: dict[str, float] = {
    "Motor_Temp_C": 70, "Vibration_mm_s": 2.5, "Defect_Rate_Pct": 3.0,
    "Noise_Level_dB": 80, "Defect_Count": 25, "Hydraulic_Fluid_Temp_C": 65,
    "Operating_Hours": 5000, "Days_Since_Maintenance": 90,
}

UNITS: dict[str, str] = {
    "Motor_Temp_C": "°C", "Ambient_Temp_C": "°C", "Hydraulic_Fluid_Temp_C": "°C",
    "Vibration_mm_s": "mm/s", "RPM": "rpm", "Power_Draw_kW": "kW",
    "Conveyor_Speed_m_min": "m/min", "Pressure_PSI": "PSI", "Noise_Level_dB": "dB",
    "Defect_Rate_Pct": "%", "Operating_Hours": "h", "Days_Since_Maintenance": "d",
}

CLASS_LABELS = [1, 2, 3]
CLASS_NAMES = {1: "low", 2: "medium", 3: "critical"}


@lru_cache(maxsize=1)
def _model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"robot_model.pkl not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def feature_names() -> list[str]:
    """All columns the model expects (numeric + one-hot Sensor_Status flags)."""
    return list(_model().feature_names_in_)


def feature_importances() -> dict[str, float]:
    m = _model()
    return {n: float(i) for n, i in zip(m.feature_names_in_, m.feature_importances_)}


def _encode(rows: list[dict]) -> pd.DataFrame:
    """Apply the same preprocessing as the training script: select the 15
    inputs, one-hot Sensor_Status (drop_first=True), then reindex to match the
    columns the model was trained on (missing one-hot cols default to False)."""
    cols = NUMERIC_FEATURES + ["Sensor_Status"]
    df = pd.DataFrame([{c: r.get(c) for c in cols} for r in rows])
    df = pd.get_dummies(df, columns=["Sensor_Status"], drop_first=True)
    expected = feature_names()
    for c in expected:
        if c not in df.columns:
            df[c] = False if c.startswith("Sensor_Status_") else 0
    return df[expected]


def predict_batch(rows: list[dict]) -> list[dict]:
    """Run the model on a batch of raw rows (each must include the 14 numeric
    features and a string `Sensor_Status`). Returns one prediction record per
    row with class, probabilities, top contributing features, and a list of
    anomalous numeric features for the UI."""
    m = _model()
    df = _encode(rows)
    classes = m.predict(df).tolist()
    proba = m.predict_proba(df).tolist()
    imp = feature_importances()

    out = []
    for i, row in enumerate(rows):
        scored = []
        anomalous = []
        for n in NUMERIC_FEATURES:
            base = BASELINES.get(n)
            val = row.get(n, 0)
            if base and base != 0:
                dev = abs(val - base) / abs(base)
                scored.append((n, imp.get(n, 0) * dev))
            thresh = ANOMALY_THRESHOLD.get(n)
            if thresh is not None and val is not None and val >= thresh:
                anomalous.append(n)
        top = [n for n, _ in sorted(scored, key=lambda x: x[1], reverse=True)[:3]]
        cls = int(classes[i])
        out.append(
            {
                "class": cls,
                "class_name": CLASS_NAMES[cls],
                "probabilities": [round(p, 4) for p in proba[i]],
                "top_features": top,
                "anomalous_features": anomalous,
            }
        )
    return out


def model_info() -> dict:
    return {
        "feature_names": feature_names(),
        "numeric_features": NUMERIC_FEATURES,
        "feature_importances": feature_importances(),
        "class_labels": CLASS_LABELS,
        "class_names": CLASS_NAMES,
        "baselines": BASELINES,
        "anomaly_thresholds": ANOMALY_THRESHOLD,
        "units": UNITS,
    }
