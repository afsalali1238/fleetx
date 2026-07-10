# AVL Field Reference — FMC130 + ALL-CAN300 + EYE Sensor

All 24 fields the simulator must produce. AVL ID = Teltonika parameter ID in Codec 8E.

## GPS Fields (from GNSS module)

| Field | AVL ID | Type | Range | Simulator source |
|-------|--------|------|-------|-----------------|
| latitude | — | Float × 10⁻⁷ | −90 to +90 | GPSModel.lat |
| longitude | — | Float × 10⁻⁷ | −180 to +180 | GPSModel.lon |
| speed | — | UInt16 km/h | 0–200 | GPSModel.speed |
| heading | — | UInt16 degrees | 0–359 | derived from lat/lon delta |
| satellites | — | UInt8 | 0–20 | random 10–16, dips to 4 briefly |
| altitude | — | Int16 metres | 0–500 | fixed per asset zone |

## I/O Fields (digital/analog)

| Field | AVL ID | Type | Range | Simulator source |
|-------|--------|------|-------|-----------------|
| ignition | 239 | Boolean | 0/1 | WorkCycleSM.state ≠ OFF |
| battery_voltage | 67 | UInt16 mV | 0–36000 | 24000–28800mV when running |
| ibutton_id | 78 | UInt64 hex | any | from operator roster, null if no auth |

## CAN Fields via ALL-CAN300 (AVL IDs from Teltonika CAN param table)

| Field | AVL ID | Type | Range | Notes |
|-------|--------|------|-------|-------|
| engine_rpm | 12 | UInt16 | 0–4000 | 0 when ignition off |
| engine_hours | 253 | UInt32 × 0.1h | 0–999999 | baseline + elapsed |
| coolant_temp_c | 72 | Int8 °C | −40 to +210 | Newton cooling model |
| engine_load_pct | 525 | UInt8 % | 0–100 | correlated with RPM |
| fuel_level_pct | 68 | UInt8 % | 0–100 | FuelModel output |
| fuel_rate_lph | 181 | UInt16 × 0.1 L/h | 0–2000 | load × max_rate |
| fuel_total_litres | 182 | UInt32 × 0.1 L | 0–9999999 | running lifetime sum |
| oil_pressure_bar | 80 | UInt16 × 0.01 bar | 0–1000 | 250–450 when running |
| dtc_codes | 10493,10494 | String array | J1939 SPN/FMI | empty except fault events |

## BLE Fields from EYE Sensor (received via FMC130 Bluetooth 4.0)

| Field | AVL ID | Type | Range | Notes |
|-------|--------|------|-------|-------|
| ble_temp_c | EYE ID 1 | Int8 × 0.1°C | −200 to +600 | ambient + solar model |
| ble_humidity_pct | EYE ID 2 | UInt8 % | 0–100 | UAE range 40–75% |
| ble_pitch_deg | EYE ID 3 byte1 | Int8 | −90 to +90 | accelerometer, 2's complement |
| ble_roll_deg | EYE ID 3 bytes2-3 | Int16 | −180 to +180 | accelerometer, 2's complement |
| ble_movement | EYE ID 4 | Boolean | 0/1 | speed > 5km/h with lag |
| ble_magnet | EYE ID 5 | Boolean | 0/1 | fuel cap tamper detection |

## Derived/Computed Fields (not from device, computed server-side)

| Field | Derivation |
|-------|-----------|
| geofence_zone | point-in-polygon test vs zone boundaries |
| maintenance_due_h | (threshold_hours − engine_hours) |
| fuel_cost_aed | fuel_total_litres × 3.00 |
| idle_cost_aed | idle_minutes × (max_rate × 3.00 / 60) |

## Correlation constraints (must hold or data looks fake)

- `engine_rpm == 0` when `ignition == false`
- `fuel_rate_lph == 0` when `engine_rpm == 0`  
- `coolant_temp_c` approaches 88°C asymptotically when running, falls when off
- `engine_load_pct` correlated with RPM: load = (rpm − 800) / (max_rpm − 800) × 100
- `fuel_level_pct` decrements at rate = `fuel_rate_lph / cap_litres` per hour
- `ble_movement == true` requires `speed > 5` (with 30s lag)
- `battery_voltage` drops ~0.5V when engine off (no alternator)

## Derived tracking added 2026-07-10 (fix pass after expert telematics review)

| Field | Source | Notes |
|-------|--------|-------|
| `odoKm` | accumulated from GPS position delta each tick, trucks only (`baseKm!=null`) | KSP-004 baseline 87,240km, service threshold 90,000km via `maintThrKm` — mirrors the hours-based `engineHrs`/`maintThr` pattern used for equipment |
| `opScore` live adjustment | `_tickHarsh()` | Harsh braking/acceleration events (trucks only, probabilistic) nudge `s.c.opScore` down, floor 40. Synced to `a.opScore` in `_sync()` — previously opScore was static and never updated live |
| `backfilling` | fault injector `onl7`/`onl7b` | Cosmetic Phase-1 representation of Teltonika store-and-forward: device reconnect shows a "SYNCING BUFFERED DATA" chip for ~45s before settling. Real store-and-forward semantics (record-level `live` vs `backfilled` tagging) are a Phase 2/3 backend concern, not modeled here |
| `DTC_LIBRARY` | global const, top of script | SPN/FMI → plain-English lookup (`dtcText()`). Wired into detail panel and alert feed. Extend this table before scripting new DTC fault events instead of hardcoding untranslated strings |
| geofence exit severity | `checkGeofenceBreaches()` | Now checks UAE work hours (7–18) and escalates `GEOFENCE_EXIT` to `critical` outside those hours, matching the Alerts Center "out-of-hours geofence logic" spec |

## Asset-specific parameters

| Asset | Device | Cap (L) | Max Rate (L/h) | Max RPM | Base Hrs |
|-------|--------|---------|----------------|---------|----------|
| KSP-001 CAT 320 | FMC130+ALL-CAN | 450 | 18 | 2200 | 4821 |
| KSP-002 JCB 3CX | FMC130+ALL-CAN | 300 | 14 | 2400 | 2341 |
| KSP-003 Komatsu WA320 | FMC130+ALL-CAN | 400 | 12 | 2100 | 1890 |
| KSP-004 MAN TGX truck | FMC920+LV-CAN | 700 | 35 | 2500 | 87240km |
| KSP-005 Liebherr Crane | FMC130+ALL-CAN | 600 | 20 | 1800 | 3102 |
| KSP-006 Volvo EC220 | FMC130+ALL-CAN | 600 | 17 | 2200 | 5612 |
| KSP-007 CAT 950GC | FMC130+ALL-CAN | 600 | 14 | 2100 | 990 |
| KSP-008 XCMG XE215C | FMC130+ALL-CAN | 400 | 15 | 2000 | 712 |
