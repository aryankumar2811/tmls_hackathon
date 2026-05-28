"""On-disk cache of a completed agent run, keyed by scenario.

The first time a scenario is triggered the real agents run and the captured trace +
report are saved here. Later triggers replay the cached trace — instant, free, and
deterministic, which is exactly what you want on a demo stage.
"""

from __future__ import annotations

import json
from pathlib import Path

CACHE_DIR = Path("./.run_cache")


def _path(scenario: str) -> Path:
    return CACHE_DIR / f"{scenario}.json"


def load(scenario: str) -> dict | None:
    p = _path(scenario)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except Exception:
        return None


def save(scenario: str, data: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    _path(scenario).write_text(json.dumps(data, indent=2, default=str))
