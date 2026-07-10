# Kasper Fleet — Antigravity Agent Context

> This file is loaded automatically at the start of every Antigravity session.
> Read it fully before touching any file. Do not skip sections.

---

## What this project is

**Kasper Technologies FZ-LLC** — UAE-based B2B construction equipment GPS-as-a-Service platform. Asset-light, 150+ vendor network, incubated by in5/TECOM Group Dubai.

This repo is the **Kasper Fleet telematics dashboard** — a single-file HTML app that simulates FMC130 + ALL-CAN300 + EYE Sensor telemetry from Teltonika hardware and visualises it in real time.

**Revenue model:** AED 80–150/device/month GPS subscription. The dashboard is what vendors and buyers see.

---

## Project state — read before every session

| Item | Status |
|------|--------|
| `kasper_fleet_final.html` | ✅ Live — full SimulatorEngine integrated, rebranded to Dozr 2026-07-10 (see `dashboard-rules.md`) |
| `SimulatorEngine` class | ✅ Built — 6 state machines, 24 AVL fields, 5 fault events |
| New viz panels | ✅ Built — RPM gauge, coolant sparkline, pitch/roll indicator |
| Demo control panel | ✅ Built — `Ctrl+Shift+D` triggers any fault manually |
| Supabase backend | ⬜ Phase 2 — not started |
| Node.js 24/7 simulator | ⬜ Phase 2 — not started |
| Traccar + Codec 8E | ⬜ Phase 3 — not started |
| Alert rule engine | ⬜ Phase 4 — not started |

---

## File map — every file and its purpose

```
kasper-fleet-antigravity/
│
├── AGENTS.md                          ← YOU ARE HERE — load first, always
│
├── kasper_fleet_final.html            ← THE DASHBOARD — primary deliverable
│   └── Contains: SimulatorEngine class + all 7 screens + viz panels
│
├── src/
│   └── simulator-engine.js            ← Standalone SimulatorEngine (Phase 2 Node.js)
│
├── docs/
│   ├── TECHSTACK.md                   ← Full tech stack decisions and rationale
│   ├── AVL_FIELDS.md                  ← All 24 AVL fields, IDs, simulation models
│   ├── SIMULATION_MODELS.md           ← Exact equations for all 6 state machines
│   ├── HARDWARE.md                    ← FMC130, FMC920, ALL-CAN300, LV-CAN200, EYE Sensor
│   └── IMPLEMENTATION_PLAN.md        ← 4-phase plan with effort estimates
│
└── .agents/
    └── rules/
        ├── code-style.md              ← JS/HTML coding standards (loaded for every task)
        ├── dashboard-rules.md         ← Dashboard-specific constraints (loaded for UI tasks)
        └── data-rules.md             ← Simulator data contracts (loaded for data tasks)
```

---

## Architecture — understand this before writing code

### The data flow (Phase 1 — current)

```
SimulatorEngine.tick() every 3s
    → 6 state machines update 8 AssetState objects
    → _sync() writes to global ASSETS[] array
    → simulate() calls renderDetail(), renderSidebar(), renderMarkers(), renderAlerts()
    → All render functions read from ASSETS[] — unchanged from original
```

### The 6 state machines (all in `kasper_fleet_final.html`)

| Machine | Method | What it controls |
|---------|---------|-----------------|
| WorkCycle | `_tickWC()` | OFF→COLD_START→WARMING→OPERATING→IDLE→OFF |
| Fuel | `_tickFuel()` | drain rate, refuel events, theft drain |
| Coolant | `_tickCoolant()` | Newton's cooling, fault overtemp |
| GPS | `_tickGPS()` | constrained random walk within zone radius |
| BLE/EYE Sensor | `_tickBLE()` | temperature, humidity, pitch/roll, magnet |
| Maintenance | `_tickMaint()` | engine hours accumulation, threshold alerts |

### Fault injector (scripted demo timeline)

| T+ | Asset | Event | UI effect |
|----|-------|-------|-----------|
| 2min | KSP-002 | LOW_FUEL | Sidebar turns red, alert fires |
| 6min | KSP-006 | DTC_FAULT + coolant spike | Critical alert, coolant chart spikes |
| 10min | KSP-003 | FUEL_THEFT | Magnet gone, 48L drain event |
| 14min | KSP-007 | DEVICE_ONLINE | Dot goes green |
| 18min | KSP-001 | MAINT_DUE | Maintenance overdue alert |

### Key global variables

```js
ASSETS[]     // 8 asset objects — the single source of truth for all render functions
ZONES[]      // 4 geofence zones — used by map renderer
SIM          // SimulatorEngine instance — call SIM.tick(), SIM.getEvents(), SIM.triggerFault(key)
selectedAsset // int — index of currently selected asset, null if none
```

### Key functions (do not rename or restructure signatures)

```js
renderDetail(asset, idx)   // renders right detail panel — reads a.bleTemp, a.rpmHist etc
renderSidebar()            // renders left asset list
renderMarkers()            // renders SVG map dots
renderAlerts()             // renders bottom alert/event tabs — reads SIM.getEvents()
renderFuelCards()          // renders fuel screen cards
renderROI()                // renders cost & ROI screen
showScreen(name)           // switches between 7 nav tabs
selectAsset(idx)           // selects an asset, calls renderDetail
simulate()                 // called every 3s — calls SIM.tick() then all renders
SIM.triggerFault(key)      // keys: 'lf','dtc','theft','online','maint'
```

---

## Asset data shape — MUST match exactly

Every object in ASSETS[] has these fields. Adding new fields is fine. Renaming breaks renders.

```js
{
  // Identity (static)
  id, name, make, atype, device, site, op, opScore, opInit, opColor, plan, maint,

  // Position (updated by engine)
  lat, lon,

  // Status (updated by engine)
  status,           // 'OPERATING' | 'IDLE' | 'ALERT' | 'OFFLINE'

  // Fuel (updated by engine)
  fuel,             // percent 0-100
  fuelL,            // litres
  cap,              // capacity litres
  fuelRate,         // L/h current
  todayFuel,        // litres today
  totalFuel,        // lifetime litres

  // Engine (updated by engine)
  rpm, load, coolant, hours, batt, faults, sats,

  // EYE Sensor BLE (added by engine — NEW fields)
  bleTemp,          // °C
  bleHum,           // %
  blePitch,         // degrees -90 to +90
  bleRoll,          // degrees -180 to +180
  bleMag,           // boolean — fuel cap intact

  // History ring buffers (30 readings — NEW fields)
  rpmHist,          // int[] — for RPM sparkline
  coolHist,         // int[] — for coolant sparkline
  fuelHist,         // int[] — for fuel trend

  // Operator
  opHours, opScore,
}
```

---

## The 4 phases — what's built, what's next

### Phase 1 ✅ COMPLETE — In-browser simulator
- SimulatorEngine runs in main thread, no backend
- All data in memory, resets on refresh
- Demo-ready

### Phase 2 ⬜ NEXT — Supabase backend
When asked to build Phase 2:
1. Read `docs/TECHSTACK.md` for schema design
2. Build `src/simulator-node/index.js` — Node.js runner that inserts to Supabase every 10s
3. Modify dashboard to subscribe to Supabase realtime instead of setInterval
4. Schema: `telemetry_records` + `events` tables (in `docs/TECHSTACK.md`)

### Phase 3 ⬜ Traccar + Codec 8E
When asked to build Phase 3:
1. Read `docs/TECHSTACK.md` for Codec 8E packet structure
2. Read `docs/AVL_FIELDS.md` for AVL parameter IDs
3. Build `src/traccar/codec8e.js` — CRC-16/IBM encoder
4. Build `src/traccar/virtual-device.js` — TCP client per IMEI
5. **Warning:** CRC-16/IBM checksum failure = silent Traccar drop. Test with known vectors first.

### Phase 4 ⬜ Intelligence layer
Alert rule engine in Supabase Edge Functions. MSG91 WhatsApp delivery.

---

## What to do when unsure

1. Read `docs/TECHSTACK.md` for any tech decision
2. Read `docs/AVL_FIELDS.md` for any data field question
3. Read `docs/SIMULATION_MODELS.md` for any state machine equation
4. If asked to modify the dashboard: make surgical changes only — match existing code style, don't restructure working code
5. If asked to add a feature: state your assumptions, name what you'll touch, confirm before proceeding
