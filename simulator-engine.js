// ═══════════════════════════════════════════════════════════════════
// KASPER FLEET — SimulatorEngine v1.0
// Phase 1: In-browser. No backend required.
//
// Replaces the static ASSETS array and trivial simulate() with
// realistic FMC130 + ALL-CAN300 + EYE Sensor telemetry.
//
// Drop-in: the engine produces objects with the exact same shape
// as the original ASSETS array, so all render functions work unchanged.
// ═══════════════════════════════════════════════════════════════════

class SimulatorEngine {

  // ─── Static configuration ───────────────────────────────────────
  // Each entry matches original ASSETS shape plus internal sim state
  static ASSET_CONFIGS = [
    {
      // ── Identity (never changes) ──
      id:'KSP-001', name:'CAT 320 Excavator', make:'Caterpillar', atype:'Excavator',
      device:'FMC130', site:'Al Quoz Industrial Area, Dubai',
      op:'Mohammed Al Rashidi', opScore:91, opInit:'MR', opColor:'#2563eb', plan:'120',
      maint:[{name:'Engine Oil & Filter',due:'4,850h',rem:'29h',st:'warn'},
             {name:'Hydraulic Filter',done:'4,750h',st:'ok'},
             {name:'Track Tension',done:'3 days ago',st:'ok'}],
      // ── Simulator specs ──
      cap:450, maxRate:18, maxRPM:2200,
      baseHrs:4821, baseHrsLabel:'4,821',
      maintThreshold:4850,
      zoneCenter:{ lat:25.115, lon:55.196 }, zoneRadius:0.0008,
      // ── Initial state ──
      initFuel:62, initCoolant:87, initStatus:'OPERATING',
    },
    {
      id:'KSP-002', name:'JCB 3CX Backhoe', make:'JCB', atype:'Backhoe',
      device:'FMC130', site:'Al Quoz Industrial Area, Dubai',
      op:'Rashid Khalifa', opScore:78, opInit:'RK', opColor:'#7c3aed', plan:'80',
      maint:[{name:'Hydraulic Filter',due:'2,350h',rem:'9h',st:'warn'},
             {name:'Engine Oil',done:'2,100h',st:'ok'}],
      cap:300, maxRate:14, maxRPM:2400,
      baseHrs:2341, baseHrsLabel:'2,341',
      maintThreshold:2350,
      zoneCenter:{ lat:25.126, lon:55.218 }, zoneRadius:0.0008,
      initFuel:72, initCoolant:85, initStatus:'OPERATING',
    },
    {
      id:'KSP-003', name:'Komatsu WA320 Loader', make:'Komatsu', atype:'Loader',
      device:'FMC130', site:'Jebel Ali Port, Dubai',
      op:'Abdul Aziz Nasser', opScore:88, opInit:'AN', opColor:'#16a34a', plan:'120',
      maint:[{name:'Engine Oil',due:'2,000h',rem:'110h',st:'ok'},
             {name:'Air Filter',done:'1,700h',st:'ok'}],
      cap:400, maxRate:12, maxRPM:2100,
      baseHrs:1890, baseHrsLabel:'1,890',
      maintThreshold:2000,
      zoneCenter:{ lat:25.018, lon:55.082 }, zoneRadius:0.0010,
      initFuel:78, initCoolant:82, initStatus:'OPERATING',
    },
    {
      id:'KSP-004', name:'MAN TGX 18.500 Truck', make:'MAN', atype:'Truck',
      device:'FMC920', site:'Jebel Ali Port, Dubai',
      op:'Ibrahim Al Mansoori', opScore:84, opInit:'IM', opColor:'#f59e0b', plan:'80',
      maint:[{name:'Oil Change',due:'90,000km',rem:'2,760km',st:'warn'},
             {name:'Brake Check',done:'85,000km',st:'ok'}],
      cap:700, maxRate:32, maxRPM:2500,
      baseHrs:null, baseHrsLabel:'87,240km',   // truck uses km not hours
      maintThreshold:null,
      zoneCenter:{ lat:25.014, lon:55.097 }, zoneRadius:0.0018, // trucks move more
      initFuel:55, initCoolant:0, initStatus:'IDLE',
    },
    {
      id:'KSP-005', name:'Liebherr LTM 1060 Crane', make:'Liebherr', atype:'Crane',
      device:'FMC130', site:'Dubai Creek Harbour',
      op:'Faisal Al Suwaidi', opScore:92, opInit:'FS', opColor:'#06b6d4', plan:'150',
      maint:[{name:'Annual Crane Inspection',due:'Apr 2026',rem:'Schedule',st:'warn'},
             {name:'Hydraulic Oil',done:'3,000h',st:'ok'}],
      cap:600, maxRate:20, maxRPM:1800,
      baseHrs:3102, baseHrsLabel:'3,102',
      maintThreshold:3250,
      zoneCenter:{ lat:25.193, lon:55.317 }, zoneRadius:0.0006, // crane barely moves
      initFuel:31, initCoolant:80, initStatus:'OPERATING',
    },
    {
      id:'KSP-006', name:'Volvo EC220E Excavator', make:'Volvo CE', atype:'Excavator',
      device:'FMC130', site:'Dubai Creek Harbour',
      op:'Saeed Mohammed', opScore:71, opInit:'SM', opColor:'#dc2626', plan:'150',
      maint:[{name:'Engine Oil & Filter',due:'5,600h',rem:'-12h OVERDUE',st:'due'},
             {name:'Coolant Check',due:'IMMEDIATE',rem:'FAULT ACTIVE',st:'due'}],
      cap:600, maxRate:17, maxRPM:2200,
      baseHrs:5612, baseHrsLabel:'5,612',
      maintThreshold:5600, // already overdue
      zoneCenter:{ lat:25.201, lon:55.325 }, zoneRadius:0.0007,
      initFuel:70, initCoolant:106, initStatus:'ALERT',
      initFault:'SPN:110/FMI:3', initCoolantFault:true,
    },
    {
      id:'KSP-007', name:'CAT 950GC Loader', make:'Caterpillar', atype:'Loader',
      device:'FMC130', site:'Jebel Ali Port, Dubai',
      op:'—', opScore:null, opInit:'??', opColor:'#94a3b8', plan:'80',
      maint:[{name:'Engine Oil',due:'1,000h',rem:'10h',st:'warn'}],
      cap:600, maxRate:14, maxRPM:2100,
      baseHrs:990, baseHrsLabel:'990',
      maintThreshold:1000,
      zoneCenter:{ lat:25.024, lon:55.088 }, zoneRadius:0.0009,
      initFuel:90, initCoolant:0, initStatus:'OFFLINE',
    },
    {
      id:'KSP-008', name:'XCMG XE215C Excavator', make:'XCMG', atype:'Excavator',
      device:'FMC130', site:'Abu Dhabi KIZAD',
      op:'Tariq Al Zaabi', opScore:80, opInit:'TZ', opColor:'#8b5cf6', plan:'120',
      maint:[{name:'Engine Oil',due:'750h',rem:'38h',st:'ok'},
             {name:'Air Filter',done:'500h',st:'ok'}],
      cap:400, maxRate:15, maxRPM:2000,
      baseHrs:712, baseHrsLabel:'712',
      maintThreshold:750,
      zoneCenter:{ lat:24.469, lon:54.516 }, zoneRadius:0.0009,
      initFuel:44, initCoolant:72, initStatus:'IDLE',
    },
  ];

  // ─── Constructor ────────────────────────────────────────────────
  constructor() {
    this._startTime = Date.now();
    this._lastTick  = Date.now();
    this._events    = [];      // event queue → renderAlerts() reads this
    this._demoMode  = false;
    this._firedFaults = new Set();

    // Build per-asset live state from configs
    this._states = SimulatorEngine.ASSET_CONFIGS.map(cfg => this._initState(cfg));
  }

  // ─── Per-asset state initialisation ─────────────────────────────
  _initState(cfg) {
    const isOperating = cfg.initStatus === 'OPERATING';
    const isOffline   = cfg.initStatus === 'OFFLINE';

    return {
      cfg,
      // WorkCycle
      wcState:     isOperating ? 'OPERATING' : isOffline ? 'OFF' : 'IDLE',
      wcTimer:     0,
      // GPS
      lat: cfg.zoneCenter.lat + (Math.random()-0.5)*0.0004,
      lon: cfg.zoneCenter.lon + (Math.random()-0.5)*0.0004,
      heading: Math.floor(Math.random()*360),
      // Engine
      rpm:         isOperating ? 1200 + Math.floor(Math.random()*400) : 0,
      engineHrs:   cfg.baseHrs || 0,
      coolant:     cfg.initCoolant || (isOperating ? 88 : 35),
      load:        isOperating ? 55 + Math.floor(Math.random()*30) : 0,
      // Fuel
      fuelPct:     cfg.initFuel,
      fuelL:       Math.round(cfg.initFuel * cfg.cap / 100),
      fuelRate:    isOperating ? cfg.maxRate * 0.65 : 0,
      totalFuel:   cfg.cap * 20 + Math.floor(Math.random()*5000), // realistic lifetime
      todayFuel:   isOperating ? 40 + Math.floor(Math.random()*80) : 0,
      // Electrical
      battV:       isOperating ? 26.4 : 24.0,
      sats:        isOffline ? 0 : 10 + Math.floor(Math.random()*6),
      // Fault state
      dtcCodes:    cfg.initFault || 'None',
      coolantFault:cfg.initCoolantFault || false,
      // EYE Sensor
      bleTemp:     28 + Math.floor(Math.random()*8),
      bleHumidity: 45 + Math.floor(Math.random()*25),
      blePitch:    Math.floor((Math.random()-0.5)*6),
      bleRoll:     Math.floor((Math.random()-0.5)*10),
      bleMovement: isOperating,
      bleMagnet:   true, // fuel cap intact
      // Status
      status:      cfg.initStatus,
      // History ring buffers (last 20 readings for sparklines)
      rpmHistory:     Array(20).fill(isOperating ? 1400 : 0),
      coolantHistory: Array(20).fill(cfg.initCoolant || 35),
      fuelHistory:    Array(20).fill(cfg.initFuel),
      // Maintenance fired flag
      maintFired: cfg.initStatus === 'ALERT' && cfg.initFault,
    };
  }

  // ─── Main tick — called every 3 seconds ─────────────────────────
  tick() {
    const now     = Date.now();
    const elapsed = Math.min((now - this._lastTick) / 1000, 10); // clamp to 10s max
    this._lastTick = now;

    const uaeHour = new Date(now + 4*3600*1000).getUTCHours(); // UAE = UTC+4

    // Advance each asset
    this._states.forEach(s => this._tickAsset(s, elapsed, uaeHour, now));

    // Run fault injector
    this._tickFaults(now);

    // Push updated state to global ASSETS array
    this._syncToASSETS();
  }

  // ─── Per-asset tick ──────────────────────────────────────────────
  _tickAsset(s, elapsed, uaeHour, now) {
    if(s.status === 'OFFLINE') {
      // Offline assets still accumulate position age — no other updates
      return;
    }

    this._tickWorkCycle(s, elapsed, uaeHour);
    this._tickGPS(s, elapsed);
    this._tickRPM(s, elapsed, now);
    this._tickFuel(s, elapsed);
    this._tickCoolant(s, elapsed, uaeHour);
    this._tickElectrical(s);
    this._tickBLE(s, uaeHour);
    this._tickMaintenance(s, elapsed);
    this._tickStatus(s);
    this._pushHistory(s);
  }

  // ─── WorkCycle state machine ─────────────────────────────────────
  _tickWorkCycle(s, elapsed, uaeHour) {
    s.wcTimer += elapsed;
    const inWorkHours = uaeHour >= 7 && uaeHour < 18;

    switch(s.wcState) {
      case 'OFF':
        if(inWorkHours && Math.random() < 0.005) {
          s.wcState = 'COLD_START'; s.wcTimer = 0;
        }
        break;
      case 'COLD_START':
        if(s.wcTimer > 30) { s.wcState = 'WARMING'; s.wcTimer = 0; }
        break;
      case 'WARMING':
        if(s.wcTimer > 480) { s.wcState = 'OPERATING'; s.wcTimer = 0; }
        break;
      case 'OPERATING':
        if(!inWorkHours) { s.wcState = 'IDLE'; s.wcTimer = 0; break; }
        if(Math.random() < 0.001) { s.wcState = 'IDLE'; s.wcTimer = 0; } // short break
        break;
      case 'IDLE':
        if(s.wcTimer > 300 + Math.random()*600) {
          s.wcState = inWorkHours ? 'OPERATING' : 'OFF';
          s.wcTimer = 0;
        }
        break;
    }
  }

  _isRunning(s) { return s.wcState === 'OPERATING' || s.wcState === 'WARMING'; }
  _ignition(s)  { return s.wcState !== 'OFF'; }

  // ─── GPS random walk ─────────────────────────────────────────────
  _tickGPS(s, elapsed) {
    const isMoving = this._isRunning(s);
    const maxDrift = isMoving ? 0.00012 : 0.000025;
    const scale    = elapsed / 3;

    let newLat = s.lat + (Math.random()-0.5) * maxDrift * scale;
    let newLon = s.lon + (Math.random()-0.5) * maxDrift * scale;

    // Constrain within zone radius
    const c  = s.cfg.zoneCenter;
    const r  = s.cfg.zoneRadius;
    const dL = newLat - c.lat;
    const dN = newLon - c.lon;
    const d  = Math.sqrt(dL*dL + dN*dN);
    if(d > r) {
      const f = (r * 0.93) / d;
      newLat = c.lat + dL * f;
      newLon = c.lon + dN * f;
    }

    // Derive heading from movement delta
    const dlat = newLat - s.lat;
    const dlon = newLon - s.lon;
    if(Math.abs(dlat) + Math.abs(dlon) > 0.000001) {
      s.heading = Math.round(Math.atan2(dlon, dlat) * 180/Math.PI + 360) % 360;
    }

    s.lat = newLat;
    s.lon = newLon;
  }

  // ─── RPM model ───────────────────────────────────────────────────
  _tickRPM(s, elapsed, now) {
    const { maxRPM } = s.cfg;

    if(!this._ignition(s)) {
      s.rpm  = 0;
      s.load = 0;
      return;
    }

    if(s.wcState === 'IDLE' || s.wcState === 'WARMING' || s.wcState === 'COLD_START') {
      s.rpm  = Math.round(750 + Math.random()*150);
      s.load = Math.round(5  + Math.random()*10);
      return;
    }

    // OPERATING: sinusoidal work cycle (45s excavation rhythm) + noise
    const t     = now / 1000;
    const cycle = Math.sin(t * (2*Math.PI / 45));
    const base  = maxRPM * 0.62;
    const swing = maxRPM * 0.22;
    const noise = (Math.random()-0.5) * 80;

    s.rpm  = Math.max(800, Math.min(maxRPM, Math.round(base + cycle*swing + noise)));
    s.load = Math.max(0, Math.min(100, Math.round((s.rpm - 800) / (maxRPM - 800) * 100)));
  }

  // ─── Fuel model ──────────────────────────────────────────────────
  _tickFuel(s, elapsed) {
    const { cap, maxRate } = s.cfg;

    // fuel rate from load
    const loadFactor = s.load / 100;
    s.fuelRate = this._isRunning(s) ? parseFloat((maxRate * Math.max(0.08, loadFactor)).toFixed(1)) : 0;

    const consumed = s.fuelRate * (elapsed / 3600);
    s.fuelL = Math.max(0, s.fuelL - consumed);
    s.fuelPct = Math.round((s.fuelL / cap) * 100);
    s.totalFuel += consumed;
    if(this._isRunning(s)) s.todayFuel += consumed;

    // Auto-refuel when empty and parked overnight
    if(s.fuelPct <= 2 && s.wcState === 'OFF' && Math.random() < 0.02) {
      const fillTo = cap * (0.75 + Math.random()*0.20);
      s.fuelL  = Math.round(fillTo);
      s.fuelPct = Math.round((s.fuelL / cap) * 100);
      this._emitEvent({
        type:'REFUEL', severity:'info', assetId: s.cfg.id,
        msg:`Refuel event — +${Math.round(fillTo - s.fuelL)}L`, time:this._now()
      });
    }
  }

  // ─── Coolant temperature (Newton's cooling) ───────────────────────
  _tickCoolant(s, elapsed, uaeHour) {
    if(s.coolantFault) {
      // Fault: climbs toward 108°C
      const target = 108;
      s.coolant += (target - s.coolant) * 0.006 * elapsed;
      s.coolant = Math.round(s.coolant + (Math.random()-0.5)*1.5);
      return;
    }

    const targets = { OFF:35, COLD_START:35, WARMING:88, OPERATING:88, IDLE:72 };
    const rates   = { OFF:0.002, COLD_START:0.002, WARMING:0.01, OPERATING:0.003, IDLE:0.004 };

    const target = targets[s.wcState] ?? 35;
    const rate   = rates[s.wcState]   ?? 0.003;

    if(s.wcState === 'OFF') { s.coolant = null; return; }

    s.coolant = Math.round(s.coolant + (target - s.coolant) * rate * elapsed + (Math.random()-0.5)*1.5);
  }

  // ─── Electrical ──────────────────────────────────────────────────
  _tickElectrical(s) {
    // Battery voltage: alternator charges when running
    const targetV = this._ignition(s) ? 26.2 + Math.random()*0.8 : 23.8 + Math.random()*0.4;
    s.battV = parseFloat((s.battV + (targetV - s.battV) * 0.05).toFixed(1));

    // GPS satellite count: dip occasionally
    if(Math.random() < 0.005) {
      s.sats = 4 + Math.floor(Math.random()*3);   // brief dip
    } else if(s.sats < 10) {
      s.sats = Math.min(16, s.sats + 1);           // recover
    } else {
      s.sats = 10 + Math.floor(Math.random()*6);   // normal range
    }
  }

  // ─── EYE Sensor BLE payload ───────────────────────────────────────
  _tickBLE(s, uaeHour) {
    // Temperature: ambient + solar gain model (UAE midday peak)
    const ambient = 28 + 16 * Math.sin((uaeHour - 6) * Math.PI / 12);
    const target  = ambient + 4; // inside cab
    s.bleTemp = Math.round(s.bleTemp + (target - s.bleTemp) * 0.05 + (Math.random()-0.5)*0.8);

    // Humidity: inverse of temperature roughly
    s.bleHumidity = Math.max(30, Math.min(90,
      Math.round(s.bleHumidity + (50 - s.bleHumidity)*0.01 + (Math.random()-0.5)*1.5)
    ));

    // Pitch/Roll: noise around 0, active when working
    const activeSwing = this._isRunning(s) ? 4 : 1;
    s.blePitch = Math.max(-90, Math.min(90,
      Math.round(s.blePitch + (Math.random()-0.5)*activeSwing - s.blePitch*0.05)
    ));
    s.bleRoll  = Math.max(-180, Math.min(180,
      Math.round(s.bleRoll  + (Math.random()-0.5)*activeSwing - s.bleRoll *0.05)
    ));

    // Movement follows ignition with 30s lag (approximated by state)
    s.bleMovement = this._isRunning(s);
  }

  // ─── Maintenance counter ──────────────────────────────────────────
  _tickMaintenance(s, elapsed) {
    if(this._ignition(s) && s.cfg.baseHrs !== null) {
      s.engineHrs += elapsed / 3600;
    }

    // Check threshold
    const thr = s.cfg.maintThreshold;
    if(thr && s.engineHrs >= thr && !s.maintFired) {
      s.maintFired = true;
      // Update maint array
      const item = s.cfg.maint[0];
      if(item) {
        item.st  = 'due';
        item.rem = 'OVERDUE';
      }
      this._emitEvent({
        type:'MAINT_DUE', severity:'warning', assetId: s.cfg.id,
        msg:`Maintenance due — ${s.cfg.maint[0]?.name} threshold reached`,
        time: this._now()
      });
    }
  }

  // ─── Derive dashboard status string ──────────────────────────────
  _tickStatus(s) {
    if(s.status === 'OFFLINE') return; // fault injector controls offline→online

    const hasDTC   = s.dtcCodes !== 'None' && s.dtcCodes !== '—';
    const lowFuel  = s.fuelPct < 20;
    const overtemp = s.coolantFault || (s.coolant && s.coolant > 100);

    if(hasDTC || overtemp || lowFuel) {
      s.status = 'ALERT';
    } else if(this._isRunning(s)) {
      s.status = 'OPERATING';
    } else if(this._ignition(s)) {
      s.status = 'IDLE';
    } else {
      s.status = 'OFFLINE';
    }
  }

  // ─── Push to ring buffers ─────────────────────────────────────────
  _pushHistory(s) {
    s.rpmHistory.push(s.rpm);
    s.rpmHistory.shift();
    s.coolantHistory.push(s.coolant ?? 0);
    s.coolantHistory.shift();
    s.fuelHistory.push(s.fuelPct);
    s.fuelHistory.shift();
  }

  // ─── Fault injector — scripted demo timeline ──────────────────────
  _tickFaults(now) {
    const elapsed = (now - this._startTime) / 1000; // seconds since start

    const DEMO_EVENTS = [
      {
        at: 120, key:'LOW_FUEL_002',
        fn: () => {
          const s = this._stateById('KSP-002');
          if(!s) return;
          s.fuelL   = Math.round(s.cfg.cap * 0.17);
          s.fuelPct = 17;
          this._emitEvent({
            type:'LOW_FUEL', severity:'critical', assetId:'KSP-002',
            msg:'Fuel level 17% — below minimum threshold',
            time: this._now()
          });
        }
      },
      {
        at: 360, key:'DTC_FAULT_006',
        fn: () => {
          const s = this._stateById('KSP-006');
          if(!s) return;
          s.dtcCodes    = 'SPN:110/FMI:3';
          s.coolantFault = true;
          this._emitEvent({
            type:'DTC_FAULT', severity:'critical', assetId:'KSP-006',
            msg:'DTC Fault SPN:110/FMI:3 — Engine coolant overtemp',
            time: this._now()
          });
        }
      },
      {
        at: 600, key:'THEFT_003',
        fn: () => {
          const s = this._stateById('KSP-003');
          if(!s) return;
          s.bleMagnet = false; // fuel cap opened
          // Drain 12% over next ticks (injected directly here)
          s.fuelL   = Math.max(0, s.fuelL - s.cfg.cap * 0.12);
          s.fuelPct = Math.round((s.fuelL / s.cfg.cap) * 100);
          this._emitEvent({
            type:'FUEL_THEFT', severity:'critical', assetId:'KSP-003',
            msg:'Suspected fuel drain — engine OFF, 47L removed, magnet signal lost',
            time: this._now()
          });
        }
      },
      {
        at: 840, key:'ONLINE_007',
        fn: () => {
          const s = this._stateById('KSP-007');
          if(!s) return;
          s.status  = 'IDLE';
          s.wcState = 'IDLE';
          s.sats    = 12;
          this._emitEvent({
            type:'DEVICE_ONLINE', severity:'info', assetId:'KSP-007',
            msg:'KSP-007 back online — signal restored',
            time: this._now()
          });
        }
      },
      {
        at: 1080, key:'MAINT_001',
        fn: () => {
          const s = this._stateById('KSP-001');
          if(!s || s.maintFired) return;
          s.maintFired = true;
          s.cfg.maint[0].st  = 'due';
          s.cfg.maint[0].rem = 'OVERDUE';
          this._emitEvent({
            type:'MAINT_DUE', severity:'warning', assetId:'KSP-001',
            msg:'Engine Oil & Filter — service overdue, book immediately',
            time: this._now()
          });
        }
      },
    ];

    for(const ev of DEMO_EVENTS) {
      if(elapsed >= ev.at && !this._firedFaults.has(ev.key)) {
        this._firedFaults.add(ev.key);
        ev.fn();
      }
    }
  }

  // ─── Manual trigger (Demo Control Panel) ─────────────────────────
  triggerFault(key) {
    // Force a specific fault regardless of timeline
    const MAP = {
      'low-fuel': 'LOW_FUEL_002',
      'dtc':      'DTC_FAULT_006',
      'theft':    'THEFT_003',
      'online':   'ONLINE_007',
      'maint':    'MAINT_001',
    };
    if(MAP[key]) {
      // Remove from fired set so it can be re-triggered
      this._firedFaults.delete(MAP[key]);
      // Temporarily advance startTime so event fires immediately
      const old = this._startTime;
      this._startTime = Date.now() - 2000000; // far in the past
      this._tickFaults(Date.now());
      this._startTime = old;
    }
  }

  // ─── Sync internal state → global ASSETS array ───────────────────
  _syncToASSETS() {
    this._states.forEach((s, i) => {
      const a   = ASSETS[i];
      const cfg = s.cfg;

      a.lat       = s.lat;
      a.lon       = s.lon;
      a.status    = s.status;
      a.fuel      = s.fuelPct;
      a.fuelL     = Math.round(s.fuelL);
      a.fuelRate  = s.fuelRate;
      a.todayFuel = Math.round(s.todayFuel);
      a.totalFuel = Math.round(s.totalFuel);
      a.rpm       = s.rpm;
      a.load      = s.load;
      a.coolant   = s.coolant != null
                      ? (s.coolantFault ? `${Math.round(s.coolant)}°C ⚠` : `${Math.round(s.coolant)}°C`)
                      : '—';
      a.batt      = `${s.battV.toFixed(1)}V`;
      a.sats      = s.sats;
      a.faults    = s.dtcCodes;
      a.maint     = cfg.maint;

      // hours label
      if(cfg.baseHrs !== null) {
        a.hours = `${Math.round(s.engineHrs).toLocaleString()}`;
      }

      // EYE Sensor — stored as extra fields the detail render can use
      a.bleTemp     = s.bleTemp;
      a.bleHumidity = s.bleHumidity;
      a.blePitch    = s.blePitch;
      a.bleRoll     = s.bleRoll;
      a.bleMovement = s.bleMovement;
      a.bleMagnet   = s.bleMagnet;

      // History for sparklines
      a.rpmHistory     = s.rpmHistory;
      a.coolantHistory = s.coolantHistory;
      a.fuelHistory    = s.fuelHistory;

      // Operator hours (increments when operating)
      if(s.wcState === 'OPERATING') {
        const hrs = parseFloat(a.opHours) || 0;
        a.opHours = (hrs + 3/3600).toFixed(1) + 'h';
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  _stateById(id) { return this._states.find(s => s.cfg.id === id); }
  _now()         { return new Date().toISOString(); }

  _emitEvent(ev) {
    this._events.unshift(ev); // newest first
    if(this._events.length > 100) this._events.pop();
  }

  // Return events since last call — renderAlerts() calls this
  flushEvents() {
    const evs = [...this._events];
    // Don't clear — dashboard needs persistent event log
    return evs;
  }

  getEvents() { return this._events; }
}

// ─── Web Worker wrapper (prevents tab-backgrounding throttle) ────────
// In Phase 1 we run in main thread for simplicity.
// To enable Worker: move SimulatorEngine to simulator-engine.js,
// post messages to main thread with updated ASSETS on each tick.
