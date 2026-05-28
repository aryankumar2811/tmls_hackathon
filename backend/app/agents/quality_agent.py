"""Quality Agent (Haiku) — reads CV detections, quantifies the defect spike."""

from backend.app.agents.base import AgentConfig
from backend.app.tools.cv_tools import get_cv_window, get_defect_rate, query_cv

CONFIG = AgentConfig(
    name="Quality Agent",
    role="Food computer vision — defect rate & affected region",
    model="haiku",
    tools=[get_defect_rate, query_cv, get_cv_window],
    system_prompt=(
        "You are the Quality Agent. Use the CV tools to quantify the product defect "
        "rate versus baseline, the fold-change, the defect class, the onset time, and "
        "the affected region of the product. Be concise and specific. Only use tool "
        "outputs."
    ),
    task="Characterize the product quality issue on the active line.",
)
