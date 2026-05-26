"""Slack incoming-webhook integration.

Posts work-order alerts to the maintenance channel. TODO (Wed): implement;
read settings.slack_webhook_url. Have a screenshot fallback ready for stage.
"""

from backend.app.config import settings


def post_message(text: str, pdf_path: str | None = None, severity: str = "high") -> dict:
    """Post a message (optionally with a PDF attachment) to the Slack webhook."""
    raise NotImplementedError("TODO (Wed): Slack webhook post")
