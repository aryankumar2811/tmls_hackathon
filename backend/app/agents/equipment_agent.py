"""Equipment Agent (Claude Haiku 4.5).

Reads sensor data, estimates remaining useful life (RUL), and explains why an
anomaly is happening. Tools: query_sensor, get_rul, get_sensor_window, query_rag,
log_action.

TODO (Tue): create_react_agent bound to sensor + rag + audit tools.
"""

from backend.app.config import settings


def build_equipment_agent():
    raise NotImplementedError("TODO (Tue): build Equipment agent (Haiku)")
