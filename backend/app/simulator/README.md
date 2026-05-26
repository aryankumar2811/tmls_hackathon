# simulator/

The demo control surface. A `numpy` drift simulator emits 8 sensor channels @ 2 Hz
over SSE so the dashboard feels alive. **Labeled honestly as "simulated scenario"
— that beats "fake it."**

- `drift_simulator.py` — baseline → linear drift → step change at failure time +
  Gaussian noise. Run standalone with `make sim`.
- `scenarios.py` — the 4 Trigger Scenario presets:
  - `oven_zone2_element_degradation` (the main demo: drift current draw + thermocouple variance)
  - `mixer_bearing_wear`
  - `conveyor_belt_drift`
  - `proofer_humidity_loss`

Failure modes & sensor distributions are grounded in OXMaint / iFactory references
and UCI AI4I 2020 (see `data/`).
