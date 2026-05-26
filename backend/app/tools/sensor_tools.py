"""Sensor tools — read from the drift simulator's rolling buffer.

TODO (Tue): decorate with @tool and read from the simulator's shared state.
"""


def query_sensor(line: str, channel: str) -> dict:
    """Latest reading for a channel on a line (e.g. 'TO-3', 'zone2_current_draw')."""
    raise NotImplementedError("TODO (Tue): query_sensor")


def get_rul(equipment_id: str) -> dict:
    """Estimate remaining useful life (hours) for a piece of equipment."""
    raise NotImplementedError("TODO (Tue): get_rul")


def get_sensor_window(line: str, start: float, end: float) -> list[dict]:
    """All sensor readings on a line within a time window."""
    raise NotImplementedError("TODO (Tue): get_sensor_window")
