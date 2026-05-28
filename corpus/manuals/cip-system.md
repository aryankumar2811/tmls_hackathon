# CIP System — Maintenance Manual (excerpt)

## Electrical assembly
The Clean-in-Place recirculation pump is driven through a VFD and a heavy-duty
contactor bank. Loop pressure is held at 100–110 PSI during caustic and rinse
cycles.

| Component | Part | Notes |
|---|---|---|
| Pump contactor | **CTR-CIP-7700** | rated 30 A, replace at first arcing |
| Recirc pump motor | **MTR-CIP-7700** | 5 kW nominal, 22 kW failure flag |
| Sensor harness | **HRN-CIP-7700** | quarterly insulation check |

## Fault codes
- **E3009** Power draw > 18 kW with intermittent dropouts → **Electrical fault,
  arc flash risk**, LOTO immediately.
- **E2007** Pressure < 80 PSI during caustic stage → suspect pump or contactor.
- **E1003** Lubrication reminder.

## Contactor + harness service
1. Lock out the cabinet; verify zero energy with a meter.
2. Replace **CTR-CIP-7700**; megger-test the affected sensor harness, replace
   the harness if insulation < 100 MΩ.
3. Replace pump motor windings if the unit shorted under load.
4. Dry-cycle test before returning to caustic rinse.

## Keywords
CIP System, Sanitation, BRA-CIP-7700-01, contactor failure, arc flash, electrical
fault, multiple sensors offline, pressure drop, recirculation pump, fault codes
E3009 / E2007.
