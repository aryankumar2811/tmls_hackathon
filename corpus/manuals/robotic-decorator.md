# Robotic Decorator — Maintenance Manual (excerpt)

## Drive train
The 6-axis decorator robot is driven through harmonic gearboxes at each joint
and a central hydraulic positioning assist.

| Component | Part | Service |
|---|---|---|
| Drive-end bearing | **BRG-DEC-3300** | replace at 5,000 hrs |
| Hydraulic positioning fluid | HYF-DEC-A | flush yearly |
| Harmonic gearbox grease | GR-DEC-2 | top up every 1,000 hrs |

## Fault codes
- **E2002** Vibration RMS > 4 mm/s → suspect bearing or joint wear; alert.
- **E3002** Vibration RMS > 12 mm/s OR motor temp > 95 °C → **Catastrophic
  bearing seizure**, emergency stop, do not restart.
- **E1003** Lubrication reminder (interval-based).

## Drive-end bearing replacement (BRG-DEC-3300)
1. Lock out / tag out the controller and the hydraulic pack.
2. Bleed hydraulic pressure to zero, drain the line.
3. Remove the J1 housing cover, support the arm, pull **BRG-DEC-3300** with a
   bearing puller.
4. Press in the new bearing, replace housing seals, refill hydraulic fluid,
   re-grease with food-grade NLGI-2.
5. Run unloaded 15 min; verify vibration ≤ 1.5 mm/s and hydraulic fluid temp
   ≤ 55 °C.

## Keywords
Robotic Decorator, Decorating, BRG-DEC-3300, harmonic gearbox, hydraulic
positioning, bearing seizure, vibration RMS, motor temperature, hydraulic fluid
temperature, fault codes E2002 / E3002.
