# data/

Owner: **CV / Data lead**.

Predictive-maintenance baseline data. Strategy: load **UCI AI4I 2020** (10,000 rows,
CC BY 4.0) and **relabel the columns** as bakery equivalents to get real
distributions and real failure-label correlations for free.

| AI4I column | OvenMind alias |
|---|---|
| `air_temperature` | `oven_chamber_temp` |
| `process_temperature` | `proofer_temp` |
| `rotational_speed` | `mixer_rpm` |
| `torque` | `mixer_load` |
| `tool_wear` | `element_runtime_hours` |
| `machine_failure` | `equipment_failure` |

- `relabel_ai4i.py` — download / load AI4I, remap columns, write to `processed/`.
- `raw/` — original AI4I CSV (gitignored).
- `processed/` — relabeled parquet/CSV (gitignored).

> ⚠️ All demo data is synthetic. The live demo stream comes from the `numpy` drift
> simulator (`backend/app/simulator/`); AI4I provides realistic baseline distributions.

Dataset: <https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset>
