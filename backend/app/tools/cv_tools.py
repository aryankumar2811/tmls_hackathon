"""CV tools — read YOLOv11 detections from the inference stream's rolling buffer.

TODO (Tue): decorate with @tool and read from the cv.infer shared state.
"""


def query_cv(line: str) -> list[dict]:
    """Latest detections (bounding boxes + labels) on a line."""
    raise NotImplementedError("TODO (Tue): query_cv")


def get_defect_rate(line: str, window_s: float = 90.0) -> dict:
    """Defect rate (and fold-change vs baseline) over the last window_s seconds."""
    raise NotImplementedError("TODO (Tue): get_defect_rate")


def get_cv_window(line: str, start: float, end: float) -> list[dict]:
    """All detections on a line within a time window."""
    raise NotImplementedError("TODO (Tue): get_cv_window")
