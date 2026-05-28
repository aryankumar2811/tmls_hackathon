"""Work-Order Agent (Haiku) — creates the work order from the diagnosed root cause.

The agent calls create_wo; the graph node then renders the PDF and posts to Slack
(side effects) so those don't depend on the LLM passing a complex object.
"""

from backend.app.agents.base import AgentConfig
from backend.app.tools.rag_tools import query_rag
from backend.app.tools.workorder_tools import create_wo

CONFIG = AgentConfig(
    name="Work-Order Agent",
    role="Dispatch — work order, parts, technician, impact",
    model="haiku",
    tools=[create_wo, query_rag],
    system_prompt=(
        "You are the Work-Order Agent. Given the diagnosed root cause and severity, call "
        "create_wo to open a maintenance work order. You may query_rag the equipment "
        "manual or SOP for the correct part numbers and procedure. Summarize the work "
        "order you created: id, equipment, parts, technician, ETA, and dollar impact."
    ),
    task="Open a work order for the diagnosed fault and summarize it.",
)
