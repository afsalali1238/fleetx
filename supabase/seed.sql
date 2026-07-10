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

INSERT INTO telemetry_records (
  asset_id, lat, lon, speed, heading, sats, ignition, rpm, engine_hrs,
  coolant_c, load_pct, fuel_pct, fuel_lph, fuel_total, batt_v,
  ble_temp_c, ble_humidity, ble_pitch, ble_roll, ble_movement, ble_magnet,
  dtc_codes, ibutton_id
) VALUES
  ('KSP-001',25.115,55.196,3,92,13,true,1450,4821.2,87,62,62,11.2,9300,26.4,34.2,52,2,-4,true,true,ARRAY[]::TEXT[],'IB-MR-001'),
  ('KSP-002',25.126,55.218,3,118,12,true,1380,2341.4,85,58,72,8.1,6500,26.2,33.8,54,1,3,true,true,ARRAY[]::TEXT[],'IB-RK-002'),
  ('KSP-003',25.018,55.082,2,74,14,true,1290,1890.7,82,51,78,6.1,8200,26.1,35.0,49,-1,2,true,true,ARRAY[]::TEXT[],'IB-AN-003'),
  ('KSP-004',25.014,55.097,0,180,11,false,0,NULL,NULL,0,55,0,16000,24.1,38.4,44,0,0,false,true,ARRAY[]::TEXT[],'IB-IM-004'),
  ('KSP-005',25.193,55.317,1,30,13,true,1120,3102.5,80,44,31,8.8,12600,26.0,36.1,47,3,-6,true,true,ARRAY[]::TEXT[],'IB-FS-005'),
  ('KSP-006',25.201,55.325,2,270,12,true,1580,5612.2,106,71,70,12.1,13500,26.3,41.2,43,-2,4,true,true,ARRAY['SPN:110/FMI:3'],'IB-SM-006'),
  ('KSP-007',25.024,55.088,0,0,0,false,0,990.0,NULL,0,90,0,11100,23.8,32.4,57,0,1,false,true,ARRAY[]::TEXT[],NULL),
  ('KSP-008',24.469,54.516,0,0,10,false,0,712.0,NULL,0,44,0,7900,23.9,31.8,59,-1,0,false,true,ARRAY[]::TEXT[],'IB-TZ-008');
