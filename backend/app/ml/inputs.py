"""Pick a deterministic batch of input rows from the source CSV for /simulate.

The teammate's `food_robotics_machinery_data.csv` is the source of truth. We
load it once and pick the first two rows of each severity tier (1, 2, 3) so the
'Run simulation' button always produces the same six issues — predictable on
stage, and grounded in real fixture rows with rich descriptive metadata
(machine name, plant location, manufacturer, error code, etc.).
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd

from backend.app.ml.predictor import NUMERIC_FEATURES, REPO_ROOT

CSV_PATH = REPO_ROOT / "food_robotics_machinery_data.csv"

CONTEXT_COLUMNS = [
    "Record_ID", "Timestamp", "Plant_Location", "Production_Line",
    "Machine_ID", "Machine_Name", "Machine_Type", "Manufacturer", "Model",
    "Product_Type", "Last_Maintenance_Date", "Maintenance_Type",
    "Firmware_Version", "Sensor_Status", "Error_Code", "Error_Description",
    "Operator_ID", "Shift", "Severity_Level", "Severity_Description",
    "Corrective_Action",
]


@lru_cache(maxsize=1)
def _dataset() -> pd.DataFrame:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found at {CSV_PATH}")
    return pd.read_csv(CSV_PATH)


def load_batch(per_severity: int = 2) -> list[dict]:
    """Return six representative rows (per_severity per class) as plain dicts
    with both the model's inputs and the descriptive context."""
    df = _dataset()
    keep = list(dict.fromkeys(NUMERIC_FEATURES + ["Sensor_Status"] + CONTEXT_COLUMNS))
    keep = [c for c in keep if c in df.columns]

    parts = []
    for sev in (3, 2, 1):  # surface critical issues at the top of the list
        parts.append(df[df["Severity_Level"] == sev].head(per_severity)[keep])
    out = pd.concat(parts).reset_index(drop=True)
    return out.to_dict(orient="records")
