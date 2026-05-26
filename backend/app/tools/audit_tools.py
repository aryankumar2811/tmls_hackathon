"""Audit tool — every agent calls log_action so the "Show reasoning" modal can
replay the full decision trail (tool calls, RAG hits, tokens, cost).

TODO (Wed): decorate with @tool; append to state.audit_log and emit on /stream/agent.
"""

from backend.app.schemas.models import AuditEntry


def log_action(agent: str, reasoning: str, tool: str | None = None) -> AuditEntry:
    """Record a single reasoning step / tool call to the audit trail."""
    raise NotImplementedError("TODO (Wed): log_action")
