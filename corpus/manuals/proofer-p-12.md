# Proofer P-12 — Maintenance Manual (excerpt)

## Humidity & steam
Chamber humidity is held at setpoint (default 82% RH) by a steam injector under
closed-loop control from the chamber humidity probe.

| Component | Part | Nominal |
|---|---|---|
| Humidity probe | **HS-P12-RH** | 82% RH |
| Steam injector nozzle | SIN-P12 | 1.4 bar |
| Controller | CTRL-P12 | — |

## Fault codes
- **P-05** Humidity reading drift vs steam-flow model → suspect probe drift.
- **P-06** Steam pressure < 1.1 bar → injector clog or supply fault.

## Humidity probe replacement
1. Lock out / tag out; vent chamber steam.
2. Replace probe **HS-P12-RH**; descale the **SIN-P12** nozzle.
3. Recalibrate controller setpoint to 82% RH.
4. Run a proof test batch; confirm steady 82 ± 2% RH and steam pressure 1.4 bar.

## Recommended intervals
- Probe calibration: quarterly.
- Injector descale: monthly.

## Keywords
proofer, P-12, HS-P12-RH, humidity probe drift, steam pressure, steam injector,
fermentation, setpoint.
