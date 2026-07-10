export default class SimulatorEngine {
  static ASSET_CONFIGS = [
    {
      id: 'KSP-001',
      name: 'CAT 320 Excavator',
      make: 'Caterpillar',
      atype: 'Excavator',
      device: 'FMC130',
      site: 'Al Quoz Industrial Area, Dubai',
      ibuttonId: 'IB-MR-001',
      cap: 450,
      maxRate: 18,
      maxRPM: 2200,
      baseHrs: 4821,
      maintThreshold: 4850,
      zoneCenter: { lat: 25.115, lon: 55.196 },
      zoneRadius: 0.0008,
      initFuel: 62,
      initCoolant: 87,
      initStatus: 'OPERATING'
    },
    {
      id: 'KSP-002',
      name: 'JCB 3CX Backhoe',
      make: 'JCB',
      atype: 'Backhoe',
      device: 'FMC130',
      site: 'Al Quoz Industrial Area, Dubai',
      ibuttonId: 'IB-RK-002',
      cap: 300,
      maxRate: 14,
      maxRPM: 2400,
      baseHrs: 2341,
      maintThreshold: 2350,
      zoneCenter: { lat: 25.126, lon: 55.218 },
      zoneRadius: 0.0008,
      initFuel: 72,
      initCoolant: 85,
      initStatus: 'OPERATING'
    },
    {
      id: 'KSP-003',
      name: 'Komatsu WA320 Loader',
      make: 'Komatsu',
      atype: 'Loader',
      device: 'FMC130',
      site: 'Jebel Ali Port, Dubai',
      ibuttonId: 'IB-AN-003',
      cap: 400,
      maxRate: 12,
      maxRPM: 2100,
      baseHrs: 1890,
      maintThreshold: 2000,
      zoneCenter: { lat: 25.018, lon: 55.082 },
      zoneRadius: 0.0010,
      initFuel: 78,
      initCoolant: 82,
      initStatus: 'OPERATING'
    },
    {
      id: 'KSP-004',
      name: 'MAN TGX 18.500 Truck',
      make: 'MAN',
      atype: 'Truck',
      device: 'FMC920',
      site: 'Jebel Ali Port, Dubai',
      ibuttonId: 'IB-IM-004',
      cap: 700,
      maxRate: 32,
      maxRPM: 2500,
      baseHrs: null,
      maintThreshold: null,
      zoneCenter: { lat: 25.014, lon: 55.097 },
      zoneRadius: 0.0018,
      initFuel: 55,
      initCoolant: null,
      initStatus: 'IDLE'
    },
    {
      id: 'KSP-005',
      name: 'Liebherr LTM 1060 Crane',
      make: 'Liebherr',
      atype: 'Crane',
      device: 'FMC130',
      site: 'Dubai Creek Harbour',
      ibuttonId: 'IB-FS-005',
      cap: 600,
      maxRate: 20,
      maxRPM: 1800,
      baseHrs: 3102,
      maintThreshold: 3250,
      zoneCenter: { lat: 25.193, lon: 55.317 },
      zoneRadius: 0.0006,
      initFuel: 31,
      initCoolant: 80,
      initStatus: 'OPERATING'
    },
    {
      id: 'KSP-006',
      name: 'Volvo EC220E Excavator',
      make: 'Volvo CE',
      atype: 'Excavator',
      device: 'FMC130',
      site: 'Dubai Creek Harbour',
      ibuttonId: 'IB-SM-006',
      cap: 600,
      maxRate: 17,
      maxRPM: 2200,
      baseHrs: 5612,
      maintThreshold: 5600,
      zoneCenter: { lat: 25.201, lon: 55.325 },
      zoneRadius: 0.0007,
      initFuel: 70,
      initCoolant: 106,
      initStatus: 'ALERT',
      initFault: 'SPN:110/FMI:3',
      initCoolantFault: true
    },
    {
      id: 'KSP-007',
      name: 'CAT 950GC Loader',
      make: 'Caterpillar',
      atype: 'Loader',
      device: 'FMC130',
      site: 'Jebel Ali Port, Dubai',
      ibuttonId: null,
      cap: 600,
      maxRate: 14,
      maxRPM: 2100,
      baseHrs: 990,
      maintThreshold: 1000,
      zoneCenter: { lat: 25.024, lon: 55.088 },
      zoneRadius: 0.0009,
      initFuel: 90,
      initCoolant: null,
      initStatus: 'OFFLINE'
    },
    {
      id: 'KSP-008',
      name: 'XCMG XE215C Excavator',
      make: 'XCMG',
      atype: 'Excavator',
      device: 'FMC130',
      site: 'Abu Dhabi KIZAD',
      ibuttonId: 'IB-TZ-008',
      cap: 400,
      maxRate: 15,
      maxRPM: 2000,
      baseHrs: 712,
      maintThreshold: 750,
      zoneCenter: { lat: 24.469, lon: 54.516 },
      zoneRadius: 0.0009,
      initFuel: 44,
      initCoolant: null,
      initStatus: 'IDLE'
    }
  ];

  constructor() {
    this._startTime = Date.now();
    this._lastTick = Date.now();
    this._events = [];
    this._firedFaults = new Set();
    this._states = SimulatorEngine.ASSET_CONFIGS.map(cfg => this._initState(cfg));
  }

  _initState(cfg) {
    const isOperating = cfg.initStatus === 'OPERATING' || cfg.initStatus === 'ALERT';
    const isOffline = cfg.initStatus === 'OFFLINE';
    const fuelL = Math.round(cfg.initFuel * cfg.cap / 100);

    return {
      cfg,
      wcState: isOperating ? 'OPERATING' : isOffline ? 'OFF' : 'IDLE',
      wcTimer: 0,
      lat: cfg.zoneCenter.lat + (Math.random() - 0.5) * 0.0004,
      lon: cfg.zoneCenter.lon + (Math.random() - 0.5) * 0.0004,
      heading: Math.floor(Math.random() * 360),
      speed: isOperating ? 2 : 0,
      rpm: isOperating ? 1200 + Math.floor(Math.random() * 400) : 0,
      engineHrs: cfg.baseHrs,
      coolant: cfg.initCoolant,
      load: isOperating ? 55 + Math.floor(Math.random() * 30) : 0,
      fuelPct: cfg.initFuel,
      fuelL,
      fuelRate: isOperating ? parseFloat((cfg.maxRate * 0.65).toFixed(1)) : 0,
      totalFuel: cfg.cap * 20 + Math.floor(Math.random() * 5000),
      battV: isOperating ? 26.4 : 24.0,
      sats: isOffline ? 0 : 10 + Math.floor(Math.random() * 6),
      dtcCodes: cfg.initFault ? [cfg.initFault] : [],
      coolantFault: Boolean(cfg.initCoolantFault),
      bleTemp: 28 + Math.random() * 8,
      bleHumidity: 45 + Math.floor(Math.random() * 25),
      blePitch: Math.floor((Math.random() - 0.5) * 6),
      bleRoll: Math.floor((Math.random() - 0.5) * 10),
      bleMovement: isOperating,
      bleMagnet: true,
      status: cfg.initStatus,
      maintFired: Boolean(cfg.initStatus === 'ALERT' && cfg.initFault)
    };
  }

  tick() {
    const now = Date.now();
    const dt = Math.min((now - this._lastTick) / 1000, 10);
    this._lastTick = now;

    const uaeH = new Date(now + 4 * 3600000).getUTCHours();
    this._states.forEach(s => this._tickAsset(s, dt, uaeH, now));
    this._tickFaults(now);
  }

  _tickAsset(s, dt, uaeH, now) {
    if(s.status === 'OFFLINE') return;

    this._tickWC(s, dt, uaeH);
    this._tickGPS(s, dt);
    this._tickRPM(s, dt, now);
    this._tickFuel(s, dt);
    this._tickCoolant(s, dt);
    this._tickElec(s);
    this._tickBLE(s, uaeH);
    this._tickMaint(s, dt);
    this._tickStatus(s);
  }

  _tickWC(s, dt, uaeH) {
    s.wcTimer += dt;
    const inWorkHours = uaeH >= 7 && uaeH < 18;

    switch(s.wcState) {
      case 'OFF':
        if(inWorkHours && Math.random() < 0.004) {
          s.wcState = 'COLD_START';
          s.wcTimer = 0;
        }
        break;
      case 'COLD_START':
        if(s.wcTimer > 30) {
          s.wcState = 'WARMING';
          s.wcTimer = 0;
        }
        break;
      case 'WARMING':
        if(s.wcTimer > 480) {
          s.wcState = 'OPERATING';
          s.wcTimer = 0;
        }
        break;
      case 'OPERATING':
        if(!inWorkHours || Math.random() < 0.001) {
          s.wcState = 'IDLE';
          s.wcTimer = 0;
        }
        break;
      case 'IDLE':
        if(s.wcTimer > 300 + Math.random() * 600) {
          s.wcState = inWorkHours ? 'OPERATING' : 'OFF';
          s.wcTimer = 0;
        }
        break;
    }
  }

  _tickGPS(s, dt) {
    const isMoving = this._isRunning(s);
    const maxDrift = isMoving ? 0.00012 : 0.000025;
    const scale = dt / 3;

    let newLat = s.lat + (Math.random() - 0.5) * maxDrift * scale;
    let newLon = s.lon + (Math.random() - 0.5) * maxDrift * scale;
    const center = s.cfg.zoneCenter;
    const dLat = newLat - center.lat;
    const dLon = newLon - center.lon;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);

    if(dist > s.cfg.zoneRadius) {
      const factor = (s.cfg.zoneRadius * 0.93) / dist;
      newLat = center.lat + dLat * factor;
      newLon = center.lon + dLon * factor;
    }

    const deltaLat = newLat - s.lat;
    const deltaLon = newLon - s.lon;
    if(Math.abs(deltaLat) + Math.abs(deltaLon) > 0.000001) {
      s.heading = Math.round(Math.atan2(deltaLon, deltaLat) * 180 / Math.PI + 360) % 360;
    }

    s.speed = isMoving ? Math.max(1, Math.round(2 + Math.random() * 4)) : 0;
    s.lat = newLat;
    s.lon = newLon;
  }

  _tickRPM(s, dt, now) {
    if(!this._ignition(s)) {
      s.rpm = 0;
      s.load = 0;
      return;
    }

    if(s.wcState === 'IDLE' || s.wcState === 'WARMING' || s.wcState === 'COLD_START') {
      s.rpm = Math.round(750 + Math.random() * 150);
      s.load = Math.max(0, Math.min(100,
        Math.round((s.rpm - 800) / (s.cfg.maxRPM - 800) * 100)
      ));
      return;
    }

    const cycle = Math.sin((now / 1000) * (2 * Math.PI / 45));
    const base = s.cfg.maxRPM * 0.62;
    const swing = s.cfg.maxRPM * 0.22;
    const noise = (Math.random() - 0.5) * 80;

    s.rpm = Math.max(800, Math.min(s.cfg.maxRPM, Math.round(base + cycle * swing + noise)));
    s.load = Math.max(0, Math.min(100,
      Math.round((s.rpm - 800) / (s.cfg.maxRPM - 800) * 100)
    ));
  }

  _tickFuel(s, dt) {
    if(s.rpm === 0) {
      s.fuelRate = 0;
    } else {
      s.fuelRate = parseFloat((s.cfg.maxRate * (s.load / 100)).toFixed(1));
    }

    const consumed = s.fuelRate * (dt / 3600);
    s.fuelL = Math.max(0, s.fuelL - consumed);
    s.fuelPct = Math.max(0, Math.min(100, Math.round((s.fuelL / s.cfg.cap) * 100)));
    s.totalFuel += consumed;

    if(s.fuelPct <= 2 && s.wcState === 'OFF' && Math.random() < 0.02) {
      const before = s.fuelL;
      const fillTo = s.cfg.cap * (0.75 + Math.random() * 0.20);
      s.fuelL = Math.round(fillTo);
      s.fuelPct = Math.round((s.fuelL / s.cfg.cap) * 100);
      this._emitEvent('REFUEL', 'info', s.cfg.id, {
        detail: `Refuel event +${Math.round(s.fuelL - before)}L`
      });
    }
  }

  _tickCoolant(s, dt) {
    if(s.wcState === 'OFF') {
      s.coolant = null;
      return;
    }

    if(s.coolant == null) {
      s.coolant = 35;
    }

    if(s.coolantFault) {
      const target = 108;
      s.coolant += (target - s.coolant) * 0.006 * dt;
      s.coolant = Math.round(s.coolant + (Math.random() - 0.5) * 1.5);
      return;
    }

    const targets = { COLD_START: 35, WARMING: 88, OPERATING: 88, IDLE: 72 };
    const rates = { COLD_START: 0.002, WARMING: 0.01, OPERATING: 0.003, IDLE: 0.004 };
    const target = targets[s.wcState] ?? 35;
    const rate = rates[s.wcState] ?? 0.003;

    s.coolant = Math.round(
      s.coolant + (target - s.coolant) * rate * dt + (Math.random() - 0.5) * 1.5
    );
  }

  _tickElec(s) {
    const targetV = this._ignition(s)
      ? 26.0 + Math.random() * 2.8
      : 23.5 + Math.random();
    s.battV = parseFloat((s.battV + (targetV - s.battV) * 0.05).toFixed(1));

    if(s.status === 'OFFLINE') {
      s.sats = 0;
    } else if(Math.random() < 0.005) {
      s.sats = 4 + Math.floor(Math.random() * 3);
    } else if(s.sats < 10) {
      s.sats = Math.min(16, s.sats + 1);
    } else {
      s.sats = 10 + Math.floor(Math.random() * 6);
    }
  }

  _tickBLE(s, uaeH) {
    const ambient = 28 + 16 * Math.sin((uaeH - 6) * Math.PI / 12);
    const target = ambient + 4;
    s.bleTemp = parseFloat(
      (s.bleTemp + (target - s.bleTemp) * 0.05 + (Math.random() - 0.5) * 0.8).toFixed(1)
    );
    s.bleHumidity = Math.max(30, Math.min(90,
      Math.round(s.bleHumidity + (50 - s.bleHumidity) * 0.01 + (Math.random() - 0.5) * 1.5)
    ));

    const activeSwing = this._isRunning(s) ? 4 : 1;
    s.blePitch = Math.max(-90, Math.min(90,
      Math.round(s.blePitch + (Math.random() - 0.5) * activeSwing - s.blePitch * 0.05)
    ));
    s.bleRoll = Math.max(-180, Math.min(180,
      Math.round(s.bleRoll + (Math.random() - 0.5) * activeSwing - s.bleRoll * 0.05)
    ));
    s.bleMovement = this._isRunning(s);
  }

  _tickMaint(s, dt) {
    if(this._ignition(s) && s.cfg.baseHrs !== null) {
      s.engineHrs += dt / 3600;
    }

    if(s.cfg.maintThreshold && s.engineHrs >= s.cfg.maintThreshold && !s.maintFired) {
      s.maintFired = true;
      this._emitEvent('MAINT_DUE', 'warning', s.cfg.id, {
        detail: 'Maintenance threshold reached'
      });
    }
  }

  _tickFaults(now) {
    const elapsed = (now - this._startTime) / 1000;
    const demoEvents = [
      {
        at: 120,
        key: 'LOW_FUEL_002',
        fn: () => {
          const s = this._stateById('KSP-002');
          if(!s) return;
          s.fuelL = Math.round(s.cfg.cap * 0.17);
          s.fuelPct = 17;
          this._emitEvent('LOW_FUEL', 'critical', 'KSP-002', {
            detail: 'Fuel level 17% - below minimum threshold'
          });
        }
      },
      {
        at: 360,
        key: 'DTC_FAULT_006',
        fn: () => {
          const s = this._stateById('KSP-006');
          if(!s) return;
          s.dtcCodes = ['SPN:110/FMI:3'];
          s.coolantFault = true;
          this._emitEvent('DTC_FAULT', 'critical', 'KSP-006', {
            detail: 'DTC Fault SPN:110/FMI:3 - Engine coolant overtemp'
          });
        }
      },
      {
        at: 600,
        key: 'THEFT_003',
        fn: () => {
          const s = this._stateById('KSP-003');
          if(!s) return;
          s.wcState = 'OFF';
          s.rpm = 0;
          s.load = 0;
          s.fuelRate = 0;
          s.bleMagnet = false;
          s.fuelL = Math.max(0, s.fuelL - s.cfg.cap * 0.12);
          s.fuelPct = Math.round((s.fuelL / s.cfg.cap) * 100);
          this._emitEvent('FUEL_THEFT', 'critical', 'KSP-003', {
            detail: 'Fuel drain 47L, engine OFF, magnet gone'
          });
        }
      },
      {
        at: 840,
        key: 'ONLINE_007',
        fn: () => {
          const s = this._stateById('KSP-007');
          if(!s) return;
          s.status = 'IDLE';
          s.wcState = 'IDLE';
          s.sats = 12;
          this._emitEvent('DEVICE_ONLINE', 'info', 'KSP-007', {
            detail: 'KSP-007 back online - signal restored'
          });
        }
      },
      {
        at: 1080,
        key: 'MAINT_001',
        fn: () => {
          const s = this._stateById('KSP-001');
          if(!s || s.maintFired) return;
          s.maintFired = true;
          this._emitEvent('MAINT_DUE', 'warning', 'KSP-001', {
            detail: 'Engine Oil & Filter service overdue, book immediately'
          });
        }
      }
    ];

    for(const ev of demoEvents) {
      if(elapsed >= ev.at && !this._firedFaults.has(ev.key)) {
        this._firedFaults.add(ev.key);
        ev.fn();
      }
    }
  }

  _tickStatus(s) {
    if(s.status === 'OFFLINE') return;

    const hasDTC = s.dtcCodes.length > 0;
    const lowFuel = s.fuelPct < 20;
    const overtemp = s.coolantFault || (s.coolant != null && s.coolant > 100);

    if(hasDTC || lowFuel || overtemp) {
      s.status = 'ALERT';
    } else if(this._isRunning(s)) {
      s.status = 'OPERATING';
    } else if(this._ignition(s)) {
      s.status = 'IDLE';
    } else {
      s.status = 'OFFLINE';
    }
  }

  getRecords() {
    const ts = new Date().toISOString();

    return this._states.map(s => ({
      asset_id: s.cfg.id,
      ts,
      lat: parseFloat(s.lat.toFixed(6)),
      lon: parseFloat(s.lon.toFixed(6)),
      speed: s.speed,
      heading: s.heading,
      sats: s.sats,
      ignition: this._ignition(s),
      rpm: this._ignition(s) ? s.rpm : 0,
      engine_hrs: s.engineHrs == null ? null : parseFloat(s.engineHrs.toFixed(2)),
      coolant_c: s.wcState === 'OFF' ? null : Math.round(s.coolant ?? 0),
      load_pct: this._ignition(s) ? s.load : 0,
      fuel_pct: s.fuelPct,
      fuel_lph: s.rpm === 0 ? 0 : s.fuelRate,
      fuel_total: parseFloat(s.totalFuel.toFixed(2)),
      batt_v: s.battV,
      ble_temp_c: s.bleTemp,
      ble_humidity: s.bleHumidity,
      ble_pitch: s.blePitch,
      ble_roll: s.bleRoll,
      ble_movement: s.bleMovement,
      ble_magnet: s.bleMagnet,
      dtc_codes: [...s.dtcCodes],
      ibutton_id: s.cfg.ibuttonId
    }));
  }

  flushEvents() {
    const events = this._events.map(ev => ({ ...ev }));
    this._events = [];
    return events;
  }

  triggerFault(key) {
    const map = {
      lf: 'LOW_FUEL_002',
      'low-fuel': 'LOW_FUEL_002',
      dtc: 'DTC_FAULT_006',
      theft: 'THEFT_003',
      online: 'ONLINE_007',
      maint: 'MAINT_001'
    };

    if(map[key]) {
      this._firedFaults.delete(map[key]);
      const old = this._startTime;
      this._startTime = Date.now() - 2000000;
      this._tickFaults(Date.now());
      this._startTime = old;
    }
  }

  _emitEvent(type, severity, assetId, payload = {}) {
    this._events.push({
      asset_id: assetId,
      ts: new Date().toISOString(),
      type,
      severity,
      payload,
      resolved: false
    });
  }

  _stateById(id) {
    return this._states.find(s => s.cfg.id === id);
  }

  _isRunning(s) {
    return s.wcState === 'OPERATING' || s.wcState === 'WARMING';
  }

  _ignition(s) {
    return s.wcState !== 'OFF';
  }
}
