"""Trigger Scenario presets — the demo control surface.

Each preset defines, per channel: baseline, drift slope, noise sigma, and the
failure step. TODO (Tue): fill realistic values grounded in OXMaint failure modes.
"""

SCENARIOS: dict[str, dict] = {
    "oven_zone2_element_degradation": {
        "equipment_id": "TO-3",
        "line": "Line 3",
        "description": "Zone 2 heating element degradation -> uneven top-surface browning",
        "channels": ["zone2_current_draw", "thermocouple_variance"],
        # TODO (Tue): baseline / drift / step params + CV defect injection timing
    },
    "mixer_bearing_wear": {
        "equipment_id": "SM-600",
        "line": "Line 1",
        "description": "Spiral mixer bearing wear -> texture defect",
        "channels": ["vibration_rms", "mixer_load"],
    },
    "conveyor_belt_drift": {
        "equipment_id": "C-Series",
        "line": "Line 2",
        "description": "Conveyor belt tracking drift -> uneven baking",
        "channels": ["belt_speed", "belt_alignment"],
    },
    "proofer_humidity_loss": {
        "equipment_id": "P-12",
        "line": "Line 4",
        "description": "Proofer humidity sensor drift -> inconsistent rise",
        "channels": ["humidity", "chamber_temp"],
    },
}


def get_scenario(name: str) -> dict:
    if name not in SCENARIOS:
        raise KeyError(f"unknown scenario: {name!r}. options: {list(SCENARIOS)}")
    return SCENARIOS[name]
