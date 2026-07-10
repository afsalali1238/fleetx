CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  make TEXT,
  asset_type TEXT,
  device_model TEXT,
  site TEXT,
  operator_name TEXT,
  fuel_cap_litres INT,
  plan_aed INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telemetry_records (
  id BIGSERIAL PRIMARY KEY,
  asset_id TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat FLOAT8,
  lon FLOAT8,
  speed INT,
  heading INT,
  sats INT,
  ignition BOOLEAN,
  rpm INT,
  engine_hrs FLOAT8,
  coolant_c INT,
  load_pct INT,
  fuel_pct INT,
  fuel_lph FLOAT8,
  fuel_total FLOAT8,
  batt_v FLOAT8,
  ble_temp_c FLOAT8,
  ble_humidity INT,
  ble_pitch INT,
  ble_roll INT,
  ble_movement BOOLEAN,
  ble_magnet BOOLEAN,
  dtc_codes TEXT[],
  ibutton_id TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  asset_id TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  payload JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_telemetry_asset_ts
  ON telemetry_records (asset_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_ts
  ON telemetry_records (ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_asset_ts
  ON events (asset_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_type
  ON events (type, resolved);

ALTER TABLE telemetry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_telemetry ON telemetry_records;
CREATE POLICY anon_read_telemetry
  ON telemetry_records FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS anon_read_events ON events;
CREATE POLICY anon_read_events
  ON events FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS anon_read_assets ON assets;
CREATE POLICY anon_read_assets
  ON assets FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS service_write_telemetry ON telemetry_records;
CREATE POLICY service_write_telemetry
  ON telemetry_records FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS service_write_events ON events;
CREATE POLICY service_write_events
  ON events FOR INSERT TO service_role WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_records;
ALTER PUBLICATION supabase_realtime ADD TABLE events;

INSERT INTO assets (
  id, name, make, asset_type, device_model, site, operator_name, fuel_cap_litres, plan_aed
) VALUES
  ('KSP-001','CAT 320 Excavator','Caterpillar','Excavator','FMC130','Al Quoz Industrial Area, Dubai','Mohammed Al Rashidi',450,120),
  ('KSP-002','JCB 3CX Backhoe','JCB','Backhoe','FMC130','Al Quoz Industrial Area, Dubai','Rashid Khalifa',300,80),
  ('KSP-003','Komatsu WA320 Loader','Komatsu','Loader','FMC130','Jebel Ali Port, Dubai','Abdul Aziz Nasser',400,120),
  ('KSP-004','MAN TGX 18.500 Truck','MAN','Truck','FMC920','Jebel Ali Port, Dubai','Ibrahim Al Mansoori',700,80),
  ('KSP-005','Liebherr LTM 1060 Crane','Liebherr','Crane','FMC130','Dubai Creek Harbour','Faisal Al Suwaidi',600,150),
  ('KSP-006','Volvo EC220E Excavator','Volvo CE','Excavator','FMC130','Dubai Creek Harbour','Saeed Mohammed',600,150),
  ('KSP-007','CAT 950GC Loader','Caterpillar','Loader','FMC130','Jebel Ali Port, Dubai',NULL,600,80),
  ('KSP-008','XCMG XE215C Excavator','XCMG','Excavator','FMC130','Abu Dhabi KIZAD','Tariq Al Zaabi',400,120)
ON CONFLICT (id) DO NOTHING;
