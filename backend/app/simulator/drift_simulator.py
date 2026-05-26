"""numpy drift simulator: baseline + linear drift + Gaussian noise + failure step.

Emits SensorReading frames for the active scenario @ 2 Hz. Used by the SSE sensor
stream and runnable standalone for debugging (`make sim`).

TODO (Tue): implement the generator; 60s baseline -> 30s drift -> step change.
"""

from collections.abc import Iterator

from backend.app.schemas.models import SensorReading

SAMPLE_HZ = 2.0


def simulate(scenario: str) -> Iterator[SensorReading]:
    """Yield sensor readings for the given scenario at SAMPLE_HZ."""
    raise NotImplementedError("TODO (Tue): baseline + drift + noise + step generator")


if __name__ == "__main__":
    # quick standalone smoke test (prints frames)
    for reading in simulate("oven_zone2_element_degradation"):
        print(reading)
