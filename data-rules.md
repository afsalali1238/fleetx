# Data Rules — Kasper Fleet Simulator

Loaded for any task touching SimulatorEngine, state machines, or data fields.

## The non-negotiable correlations

Break any of these and the data looks fake to anyone with construction equipment experience:

```
rpm == 0            when ignition == false (wc === 'OFF')
fuelRate == 0       when rpm == 0
coolant → null      when wc === 'OFF' (display as '—')
load derived from   (rpm - 800) / (maxRPM - 800) × 100
fuelRate derived    maxRate × (load / 100)
bleMovement         follows ignition state with ~30s lag
battV               higher when running (alternator charges) — drops 0.5V when off
```

## State machine transitions

```
WorkCycle:
  OFF → COLD_START    when UAE hour >= 7 (random trigger, prob 0.004/tick)
  COLD_START → WARMING  after 30s
  WARMING → OPERATING   after 480s (8 minutes)
  OPERATING → IDLE      when UAE hour >= 18 OR random break (prob 0.001/tick)
  IDLE → OPERATING      after 300–900s if still work hours
  IDLE → OFF            after 300–900s if after 18:00
```

## UAE time

Always compute UAE hour as: `new Date(Date.now() + 4*3600000).getUTCHours()`
UAE is UTC+4. Do NOT use `new Date().getHours()` — user's local timezone will be wrong.

## AVL field IDs (for Phase 3 Codec 8E)

| Field | AVL ID |
|-------|--------|
| ignition | 239 |
| battery_voltage | 67 |
| engine_rpm | 12 |
| engine_hours | 253 |
| coolant_temp | 72 |
| engine_load | 525 |
| fuel_level_pct | 68 |
| fuel_rate | 181 |
| fuel_total | 182 |
| oil_pressure | 80 |
| dtc_codes | 10493/10494 |
| ibutton_id | 78 |

EYE Sensor fields use Teltonika's BLE parameter IDs, not standard AVL IDs.

## Asset specs (do not change these values)

| Asset | Cap (L) | maxRate (L/h) | maxRPM | baseHrs |
|-------|---------|---------------|--------|---------|
| KSP-001 CAT 320 | 450 | 18 | 2200 | 4821 |
| KSP-002 JCB 3CX | 300 | 14 | 2400 | 2341 |
| KSP-003 Komatsu WA320 | 400 | 12 | 2100 | 1890 |
| KSP-004 MAN TGX | 700 | 32 | 2500 | null (km) |
| KSP-005 Liebherr Crane | 600 | 20 | 1800 | 3102 |
| KSP-006 Volvo EC220 | 600 | 17 | 2200 | 5612 |
| KSP-007 CAT 950GC | 600 | 14 | 2100 | 990 |
| KSP-008 XCMG XE215C | 400 | 15 | 2000 | 712 |

## Zone boundaries (lat/lon centres + radius)

| Asset | Zone centre lat | Zone centre lon | Radius (°) |
|-------|----------------|----------------|-----------|
| KSP-001 | 25.115 | 55.196 | 0.0008 |
| KSP-002 | 25.126 | 55.218 | 0.0008 |
| KSP-003 | 25.018 | 55.082 | 0.0010 |
| KSP-004 | 25.014 | 55.097 | 0.0018 |
| KSP-005 | 25.193 | 55.317 | 0.0006 |
| KSP-006 | 25.201 | 55.325 | 0.0007 |
| KSP-007 | 25.024 | 55.088 | 0.0009 |
| KSP-008 | 24.469 | 54.516 | 0.0009 |

Assets must stay within their radius. GPS random walk must be clamped.

## Supabase schema (Phase 2)

```sql
CREATE TABLE telemetry_records (
  id BIGSERIAL PRIMARY KEY, asset_id TEXT NOT NULL, ts TIMESTAMPTZ NOT NULL,
  lat FLOAT8, lon FLOAT8, speed INT, heading INT, sats INT, ignition BOOLEAN,
  rpm INT, engine_hrs FLOAT8, coolant_c INT, load_pct INT,
  fuel_pct INT, fuel_lph FLOAT8, fuel_total FLOAT8, batt_v FLOAT8,
  temp_c FLOAT8, humidity INT, pitch_deg INT, roll_deg INT,
  dtc_codes TEXT[], ibutton_id TEXT
);

CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY, asset_id TEXT NOT NULL, ts TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL, severity TEXT NOT NULL, payload JSONB, resolved BOOLEAN DEFAULT FALSE
);

ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_records;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
```

## CRC-16/IBM (Phase 3 — Codec 8E)

```js
function crc16ibm(buffer) {
  let crc = 0x0000;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++)
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
  }
  return crc;
}
```

Test vector: `Buffer.from([0x00,0x00,0x00,0x00])` → `0x0000`.
One wrong byte → Traccar drops packet silently. Always test before connecting to Traccar.
