"""YOLOv11 inference -> Detection frames streamed over SSE.

TODO (Tue): load weights, run on the (looping) demo video / image sequence,
emit Detection objects. Cache results for the demo to keep latency flat.
"""

from collections.abc import Iterator

from backend.app.schemas.models import Detection


def stream_detections(line: str) -> Iterator[Detection]:
    """Yield detections for a line's CV feed."""
    raise NotImplementedError("TODO (Tue): YOLOv11 inference stream")
