"""In-memory issue store: a batch of /simulate predictions, lookup by id."""

from __future__ import annotations

import time

from backend.app.ml.inputs import load_batch
from backend.app.ml.predictor import NUMERIC_FEATURES, predict_batch

ISSUES: dict[str, dict] = {}


def _issue_from_row(row: dict, pred: dict, detected_at_ms: int) -> dict:
    feature_values = {n: row.get(n) for n in NUMERIC_FEATURES}
    feature_values["Sensor_Status"] = row.get("Sensor_Status")

    return {
        "id": row.get("Record_ID"),
        "equipment_id": row.get("Machine_ID"),
        "machine_name": row.get("Machine_Name"),
        "machine_type": row.get("Machine_Type"),
        "line": row.get("Production_Line"),
        "plant": row.get("Plant_Location"),
        "manufacturer": f"{row.get('Manufacturer','')} {row.get('Model','')}".strip(),
        "product": row.get("Product_Type"),
        "title": f"{row.get('Machine_Name','Machine')} — {row.get('Production_Line','')}".strip(),
        "detectedAt": detected_at_ms,
        "severity": pred["class_name"],
        "features": feature_values,
        "prediction": pred,
        "context": {
            "error_code": row.get("Error_Code"),
            "error_description": row.get("Error_Description"),
            "last_maintenance_date": row.get("Last_Maintenance_Date"),
            "maintenance_type": row.get("Maintenance_Type"),
            "firmware_version": row.get("Firmware_Version"),
            "operator_id": row.get("Operator_ID"),
            "shift": row.get("Shift"),
            "ground_truth_severity": row.get("Severity_Level"),
            "ground_truth_description": row.get("Severity_Description"),
            "corrective_action": row.get("Corrective_Action"),
        },
    }


def run_simulation() -> list[dict]:
    """Replace the issues set with a fresh batch (deterministic input rows
    fed through the real model). Returns the list of issues in display order."""
    rows = load_batch()
    preds = predict_batch(rows)
    now_ms = int(time.time() * 1000)
    ISSUES.clear()
    out = []
    for r, p in zip(rows, preds):
        issue = _issue_from_row(r, p, now_ms)
        ISSUES[issue["id"]] = issue
        out.append(issue)
    return out


def get(issue_id: str) -> dict:
    if issue_id not in ISSUES:
        raise KeyError(f"unknown issue {issue_id!r}")
    return ISSUES[issue_id]


def all_issues() -> list[dict]:
    return list(ISSUES.values())
