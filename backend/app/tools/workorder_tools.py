"""Work-order tools — assemble the WO, render an optional PDF, post to Slack.

Plain functions; the agent layer wraps them as tools.
"""

from __future__ import annotations

import datetime as dt

from backend.app import sessions
from backend.app.config import settings

# small fake roster + parts catalog keyed by equipment (stand-ins for a CMMS)
_ROSTER = {
    "Line 1": "J. Okafor (Mech)",
    "Line 2": "M. Tremblay (Mech)",
    "Line 3": "R. Singh (Electrical)",
    "Line 4": "L. Costa (Controls)",
    "Line 5": "A. Webb (Mech)",
}
_PARTS = {
    "TO-3": ["HE-2400-Z2 (Zone 2 top element)", "TC-2400-Z2 (thermocouple pair)"],
    "SM-600": ["BRG-600-DE (drive-end bearing)", "food-grade NLGI-2 grease"],
    "C-Series": ["CG-CS-04 (edge guide)"],
    "P-12": ["HS-P12-RH (humidity probe)", "SIN-P12 (steam injector nozzle)"],
}

_seq = {"n": 0}


def create_wo(root_cause: str, severity: str) -> dict:
    """Create a work order: parts from the equipment catalog, technician from the
    roster, ETA, and the predicted dollar impact for this line."""
    s = sessions.current()
    meta = s.fixture["meta"]
    gt = s.fixture["ground_truth"]
    _seq["n"] += 1
    today = dt.date.today()
    wo_id = f"WO-{today:%Y-%m%d}-{_seq['n']:03d}"
    lo, hi = gt.get("impact_usd", [0, 0])
    rul_lo = s.fixture["ml"]["rul_hours"][0]
    return {
        "wo_id": wo_id,
        "equipment_id": meta["equipment_id"],
        "equipment_name": meta["equipment_name"],
        "line": meta["line"],
        "severity": severity,
        "root_cause": root_cause,
        "parts": _PARTS.get(meta["equipment_id"], ["see equipment manual"]),
        "technician": _ROSTER.get(meta["line"], "Unassigned"),
        "eta_hours": rul_lo,
        "estimated_impact_usd": [lo, hi],
        "matched_incident": gt.get("matched_incident"),
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
