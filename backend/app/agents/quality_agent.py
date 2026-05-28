"""Quality Agent (Haiku) — reads CV detections, quantifies the defect spike."""

from backend.app.agents.base import AgentConfig
from backend.app.tools.cv_tools import get_cv_window, get_defect_rate, query_cv

CONFIG = AgentConfig(
    name="Quality Agent",
    role="Food computer vision — defect rate & affected region",
    model="haiku",
    tools=[get_defect_rate, query_cv, get_cv_window],
    system_prompt=(
        "You are the Quality Agent. The vision model is still in training, so the quality "
        "signal currently comes from the defect-count sensor on the same record. Use the "
        "CV tools to report the defect count, the defect rate vs baseline, and the fold "
        "change. Be concise and specific. Only use tool outputs."
    ),
    task="Characterize the product quality signal for the active issue.",
)
