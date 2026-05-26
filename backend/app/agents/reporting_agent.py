"""Reporting Agent (Claude Haiku 4.5).

Drafts a concise incident/summary report from the final state. Tools:
draft_report, generate_pdf, query_rag, log_action.

TODO (Wed): create_react_agent bound to report + audit tools.
"""

from backend.app.config import settings


def build_reporting_agent():
    raise NotImplementedError("TODO (Wed): build Reporting agent (Haiku)")
