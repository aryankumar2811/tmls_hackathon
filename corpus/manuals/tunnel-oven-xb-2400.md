# Tunnel Oven XB-2400 — Maintenance Manual (excerpt)

## Heating zones
The XB-2400 has 4 independently controlled radiant zones. Each zone has a top and
bottom heating element pair driven through a contactor bank.

| Zone | Top element | Bottom element | Nominal current |
|---|---|---|---|
| 1 | HE-2400-Z1 | HE-2400-Z1B | 40 A |
| 2 | **HE-2400-Z2** | HE-2400-Z2B | **42 A** |
| 3 | HE-2400-Z3 | HE-2400-Z3B | 42 A |
| 4 | HE-2400-Z4 | HE-2400-Z4B | 40 A |

## Fault codes
- **E-21** Zone 2 current draw > 110% nominal for > 5 min → suspect element degradation.
- **E-22** Thermocouple variance > 6 °C² → recalibrate or replace TC pair (TC-2400-Z2).
- **E-30** Belt under-speed.

## Element replacement (Zone 2 top)
1. Lock out / tag out; allow chamber to cool below 60 °C.
2. Remove the Zone 2 access panel (4× M6).
3. Disconnect bus-bar terminals; replace **HE-2400-Z2**, torque terminals to **18 N·m**.
4. Recalibrate thermocouple pair **TC-2400-Z2**.
5. Run a 30-minute soak; verify current draw 42 ± 0.5 A and TC variance < 3 °C².

## Recommended intervals
- Element inspection: every 2,000 runtime hours.
- Thermocouple calibration: quarterly.

## Keywords
tunnel oven, XB-2400, zone 2, HE-2400-Z2, heating element, thermocouple, current
draw, fault code E-21, E-22.
