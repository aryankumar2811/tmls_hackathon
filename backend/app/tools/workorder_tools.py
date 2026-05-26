"""Work-order tools — create the WO, render the PDF, post to Slack.

TODO (Wed): decorate with @tool. Test the Slack + PDF path 10×.
"""

from backend.app.schemas.models import WorkOrder


def create_wo(
    equipment_id: str, root_cause: str, severity: str, matched_incident: str | None = None
) -> WorkOrder:
    """Assemble a WorkOrder: parts from the manual (RAG), technician from the
    roster, ETA + $ impact estimate. WO id format: WO-YYYY-MMDD-NNN."""
    raise NotImplementedError("TODO (Wed): create_wo")


def generate_pdf(wo: WorkOrder) -> str:
    """Render the work order to a PDF (reports.work_order_pdf). Returns file path."""
    raise NotImplementedError("TODO (Wed): generate_pdf")


def post_slack(wo: WorkOrder, pdf_path: str) -> dict:
    """Post the WO to the maintenance Slack channel with the PDF + severity badge."""
    raise NotImplementedError("TODO (Wed): post_slack")
