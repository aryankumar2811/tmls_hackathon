"""Load committed scenario fixtures (the mocked ML output the agents reason over)."""

import json
from functools import lru_cache
from pathlib import Path

SCENARIO_DIR = Path(__file__).resolve().parent / "scenarios"


@lru_cache(maxsize=8)
def load_fixture(scenario: str) -> dict:
    path = SCENARIO_DIR / f"{scenario}.json"
    if not path.exists():
        raise KeyError(f"unknown scenario {scenario!r} (run `make fixtures`)")
    return json.loads(path.read_text())


def list_scenarios() -> list[dict]:
    """Return the `meta` block of every available scenario, for the trigger UI."""
    out = []
    for path in sorted(SCENARIO_DIR.glob("*.json")):
        out.append(json.loads(path.read_text())["meta"])
    return out
