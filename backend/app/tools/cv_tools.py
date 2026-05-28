"""CV tools — read the replayed YOLO-style detections of the active session.

Plain functions; the agent layer wraps them as tools.
"""

from __future__ import annotations

from backend.app import sessions


def _region(detections: list[dict], label: str) -> str:
    """Describe where the defect sits from its bounding boxes (bbox = x,y,w,h)."""
    boxes = [d["bbox"] for d in detections if d["label"] == label]
    if not boxes:
        return "n/a"
    avg_y = sum(b[1] for b in boxes) / len(boxes)
    avg_x = sum(b[0] for b in boxes) / len(boxes)
    vert = "top surface" if avg_y < 0.34 else "bottom" if avg_y > 0.6 else "mid surface"
    horiz = "leading edge" if avg_x < 0.35 else "trailing edge" if avg_x > 0.6 else "center"
    return f"{vert}, {horiz}"


def query_cv() -> dict:
    """Latest CV detections on this line: counts by class and top confidences."""
    s = sessions.current()
    window = s.cv_window()
    if not window:
        return {"detections": [], "note": "no frames yet"}
    frame = window[-1]
    by_label: dict[str, list[float]] = {}
    for d in frame["detections"]:
        by_label.setdefault(d["label"], []).append(d["confidence"])
    summary = [
        {"label": lbl, "count": len(cs), "max_confidence": round(max(cs), 3)}
        for lbl, cs in by_label.items()
    ]
    return {"t": frame["t"], "classes": summary, "defect_rate_pct": frame["defect_rate"]}


def get_defect_rate() -> dict:
    """Current defect rate vs baseline, plus fold-change and affected region."""
    s = sessions.current()
    window = s.cv_window()
    if not window:
        return {"note": "no frames yet"}
    baseline = s.fixture["cv"]["baseline_rate"]
    current = window[-1]["defect_rate"]
    label = s.fixture["cv"]["defect_label"]
    fold = round(current / baseline, 1) if baseline else None
    return {
        "defect_label": label,
        "baseline_rate_pct": baseline,
        "current_rate_pct": current,
        "fold_change": fold,
        "affected_region": _region(window[-1]["detections"], label),
    }


def get_cv_window() -> dict:
    """Defect-rate trajectory across the replayed window (onset detection)."""
    s = sessions.current()
    window = s.cv_window()
    if len(window) < 2:
        return {"note": "insufficient data"}
    series = [{"t": f["t"], "rate": f["defect_rate"]} for f in window]
    baseline = s.fixture["cv"]["baseline_rate"]
    onset = next((p["t"] for p in series if p["rate"] > baseline * 2), None)
    return {
        "defect_label": s.fixture["cv"]["defect_label"],
        "onset_t": onset,
        "peak_rate_pct": max(p["rate"] for p in series),
        "samples": len(series),
    }
