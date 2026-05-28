"""Work-order tools — assemble a WO from the active issue, with optional PDF/Slack."""

from __future__ import annotations

import datetime as dt

from backend.app import sessions
from backend.app.config import settings

_TECH_BY_TYPE = {
    "Conveying": "M. Tremblay (Mech)",
    "Freezing": "A. Webb (Refrig)",
    "Decorating": "L. Costa (Robotics)",
    "Labeling": "R. Singh (Controls)",
    "Mixing": "J. Okafor (Mech)",
    "Baking": "R. Singh (Electrical)",
    "Packaging": "M. Tremblay (Mech)",
    "Forming": "L. Costa (Robotics)",
    "Proofing": "L. Costa (Controls)",
    "CIP": "A. Webb (Sanitation)",
}
_IMPACT_BY_SEVERITY = {
    "critical": (15_000, 30_000),
    "medium": (5_000, 15_000),
    "low": (1_000, 5_000),
}
_RUL_BY_SEVERITY = {"critical": 8, "medium": 48, "low": 168}

_seq = {"n": 0}


def _suggested_parts(issue: dict) -> list[str]:
    feats = issue["features"]
    parts: list[str] = []
    if (feats.get("Motor_Temp_C") or 0) >= 70:
        parts.append("Motor (overheat) — inspect/replace per service bulletin")
    if (feats.get("Vibration_mm_s") or 0) >= 2.5:
        parts.append("Drive-end bearing (vibration > threshold)")
    if (feats.get("Hydraulic_Fluid_Temp_C") or 0) >= 65:
        parts.append("Hydraulic fluid + filter")
    if (feats.get("Noise_Level_dB") or 0) >= 80:
        parts.append("Acoustic enclosure / housing inspection")
    if (feats.get("Defect_Count") or 0) >= 50:
        parts.append("Recalibrate quality sensor")
    if not parts:
        parts.append("General PM kit per OEM manual")
    return parts


def create_wo(root_cause: str, severity: str) -> dict:
    """Assemble a work order from the active issue. Pulls equipment + line +
    estimated impact from the issue snapshot; suggests parts from anomalous
    feature readings."""
    s = sessions.current()
    issue = s.issue
    ctx = issue.get("context", {})
    _seq["n"] += 1
    today = dt.date.today()
    wo_id = f"WO-{today:%Y-%m%d}-{_seq['n']:03d}"
    lo, hi = _IMPACT_BY_SEVERITY.get(severity, (3_000, 10_000))
    return {
        "wo_id": wo_id,
        "equipment_id": issue["equipment_id"],
        "equipment_name": issue["machine_name"],
        "line": issue["line"],
        "plant": issue["plant"],
        "severity": severity,
        "root_cause": root_cause,
        "parts": _suggested_parts(issue),
        "technician": _TECH_BY_TYPE.get(issue.get("machine_type"), "Unassigned"),
        "eta_hours": _RUL_BY_SEVERITY.get(severity, 24),
        "estimated_impact_usd": [lo, hi],
        "error_code": ctx.get("error_code"),
        "suggested_action_csv": ctx.get("corrective_action"),
        "created": today.isoformat(),
    }


def generate_pdf(wo: dict) -> dict:
    """Render the work order to a PDF (best-effort; ReportLab optional)."""
    try:
        from backend.app.reports.work_order_pdf import render

        path = render(wo)
        return {"pdf_path": path, "ok": True}
    except Exception as exc:
        return {"pdf_path": None, "ok": False, "note": f"PDF skipped: {exc}"}


def post_slack(wo: dict) -> dict:
    """Post the WO to the maintenance Slack channel (no-op without a webhook)."""
    if not settings.slack_webhook_url:
        return {"posted": False, "note": "SLACK_WEBHOOK_URL unset — skipped"}
    try:
        from backend.app.integrations.slack import post_message

        text = (f"*{wo['severity'].upper()}* — {wo['equipment_id']} ({wo['line']})\n"
                f"{wo['root_cause']}\nWO {wo['wo_id']} • impact "
                f"${wo['estimated_impact_usd'][0]:,}–${wo['estimated_impact_usd'][1]:,}")
        post_message(text, severity=wo["severity"])
        return {"posted": True, "channel": "#maintenance"}
    except Exception as exc:
        return {"posted": False, "note": str(exc)}
