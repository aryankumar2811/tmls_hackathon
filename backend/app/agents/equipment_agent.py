"""Equipment Agent (Haiku) — reads sensors, estimates RUL, explains the anomaly."""

from backend.app.agents.base import AgentConfig
from backend.app.tools.sensor_tools import get_rul, get_sensor_window, query_sensor

CONFIG = AgentConfig(
    name="Equipment Agent",
    role="Predictive maintenance — sensor anomaly & RUL",
    model="haiku",
    tools=[get_sensor_window, get_rul, query_sensor],
    system_prompt=(
        "You are the Equipment Agent in a bakery maintenance control room. "
        "Use the sensor tools to find which channels are anomalous and the predictive "
        "model's remaining-useful-life estimate. Be concise and specific: name the "
        "equipment, the leading channel, the % change, and the RUL window. Do not invent "
        "numbers — only use tool outputs."
    ),
    task="Assess the equipment health on the active line and state the likely failure mode.",
)
