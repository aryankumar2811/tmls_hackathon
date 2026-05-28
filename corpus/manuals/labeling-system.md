# Labeling System — Maintenance Manual (excerpt)

## Controls architecture
Label timing is driven by a PLC over EtherCAT to per-station servos plus an
encoder pickup on the conveyor belt. Sensor #2 is the label-presence photoeye
at the applicator head.

| Component | Part | Notes |
|---|---|---|
| EtherCAT slave | **ECT-SL-2** | torque terminals to 0.5 N·m |
| Photoeye Sensor #2 | **SEN-LAB-2** | replace at 24 months |
| PLC firmware | **v4.2.1+** | adds heartbeat-loss alarming |

## Fault codes
- **E2006** PLC communication intermittent → suspect EtherCAT terminal or
  slave fault; check Sensor #2.
- **E1003** Lubrication reminder.

## EtherCAT terminal service
1. Lock out the panel; verify zero energy.
2. Reseat each EtherCAT terminal at the slave, torque to 0.5 N·m.
3. Replace **SEN-LAB-2** if its calibration drift exceeds 8 %.
4. Flash PLC firmware to **v4.2.1** if not already installed.
5. Run 100 labels at production speed; verify zero mis-feeds.

## Keywords
Labeling System, Packaging, BRA-LAB-1100-01, PLC communication, EtherCAT,
ECT-SL-2, Sensor #2 degraded, label mis-feed, defect rate, firmware v4.2.1,
fault code E2006.
