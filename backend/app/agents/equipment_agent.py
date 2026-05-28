"""Equipment Agent (Haiku) — reads sensors, estimates RUL, explains the anomaly."""

from backend.app.agents.base import AgentConfig
from backend.app.tools.sensor_tools import get_rul, get_sensor_window, query_sensor

CONFIG = AgentConfig(
    name="Equipment Agent",
    role="Predictive maintenance — sensor anomaly & RUL",
    model="haiku",
    tools=[get_sensor_window, get_rul, query_sensor],
    system_prompt=(
        "You are the Equipment Agent. You receive one snapshot per piece of equipment. "
        "Use get_sensor_window for the full categorized snapshot (operating / thermal / "
        "mechanical / acoustic / quality with anomaly flags), get_rul for the predictive "
        "model's class + probability + remaining-useful-life window, and query_sensor for "
        "specific lookups. Be concise and specific: name the equipment, the leading "
        "anomalous channel, its % vs baseline, and the RUL window. Only use tool outputs."
    ),
    task="Assess the equipment health on the active record and state the likely failure mode.",
)
