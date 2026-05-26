"""Work-Order Agent (Claude Haiku 4.5).

Creates a work order, generates a ReportLab PDF (parts pulled from the equipment
manual in RAG, technician auto-assigned, ETA + $ impact computed), and posts it
to Slack. Tools: create_wo, generate_pdf, post_slack, query_rag, log_action.

TODO (Wed): create_react_agent bound to workorder + rag + audit tools.
"""

from backend.app.config import settings


def build_workorder_agent():
    raise NotImplementedError("TODO (Wed): build Work-Order agent (Haiku)")
