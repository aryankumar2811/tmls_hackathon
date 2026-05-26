"""Render a WorkOrder to a professional PDF via ReportLab.

TODO (Wed): parts table + severity badge + $ impact + QR code. Cache by wo_id.
"""

from backend.app.schemas.models import WorkOrder


def render(wo: WorkOrder, out_dir: str = "./out") -> str:
    """Render the work order to a PDF; return the file path."""
    raise NotImplementedError("TODO (Wed): ReportLab work-order PDF")
