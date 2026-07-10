# Simulation Models — Exact Equations

## State Machine 1: WorkCycle

States: `OFF → COLD_START → WARMING → OPERATING → IDLE → OFF`

```js
// Transitions driven by UAE work schedule + random events
const WORK_SCHEDULE = {
  startHour: 7,   // 07:00 UAE time
  endHour: 18,    // 18:00 UAE time
  breakProb: 0.001  // per tick: random short break (idle)
}

function nextWorkState(asset, uaeHour, elapsed_s) {
  const { state, stateTimer } = asset.workCycle
  
  switch(state) {
    case 'OFF':
      if(uaeHour >= WORK_SCHEDULE.startHour && uaeHour < WORK_SCHEDULE.endHour)
        return { state: 'COLD_START', stateTimer: 0 }
      return { state: 'OFF', stateTimer: stateTimer + elapsed_s }
      
    case 'COLD_START':
      // 30s → WARMING
      if(stateTimer > 30) return { state: 'WARMING', stateTimer: 0 }
      return { state: 'COLD_START', stateTimer: stateTimer + elapsed_s }
      
    case 'WARMING':
      // 8 minutes → OPERATING
      if(stateTimer > 480) return { state: 'OPERATING', stateTimer: 0 }
      return { state: 'WARMING', stateTimer: stateTimer + elapsed_s }
      
    case 'OPERATING':
      if(uaeHour >= WORK_SCHEDULE.endHour) return { state: 'IDLE', stateTimer: 0 }
      if(Math.random() < WORK_SCHEDULE.breakProb) return { state: 'IDLE', stateTimer: 0 }
      return { state: 'OPERATING', stateTimer: stateTimer + elapsed_s }
      
    case 'IDLE':
      // Idle for 5–20 minutes randomly, then back to OPERATING or end of day → OFF
      if(stateTimer > 300 + Math.random() * 900) {
        if(uaeHour >= WORK_SCHEDULE.endHour) return { state: 'OFF', stateTimer: 0 }
        return { state: 'OPERATING', stateTimer: 0 }
      }
      return { state: 'IDLE', stateTimer: stateTimer + elapsed_s }
  }
}
```

**Derived booleans:**
- `ignition = state !== 'OFF'`
- `operating = state === 'OPERATING'`

---

## State Machine 2: FuelModel

```js
function tickFuel(asset, elapsed_s) {
  const { fuelPct, fuelL, cap, baseRate, state, faultActive } = asset
  
  // Fuel rate from engine load and state
  const loadFactor = state.workCycle === 'OPERATING' ? 0.6 + Math.random() * 0.4 : 
                     state.workCycle === 'WARMING'   ? 0.2 :
                     state.workCycle === 'IDLE'      ? 0.05 : 0
  
  const fuelRateLph = baseRate * loadFactor  // L/hour
  const consumed = fuelRateLph * (elapsed_s / 3600)
  
  let newFuelL = Math.max(0, fuelL - consumed)
  
  // Refuel event: morning chance or triggered when < 15%
  const shouldRefuel = (newFuelL / cap < 0.15) && state.workCycle === 'OFF' && Math.random() < 0.3
  if(shouldRefuel) {
    const refuelAmount = cap * (0.7 + Math.random() * 0.25) - newFuelL  // fill to 70–95%
    newFuelL = Math.min(cap, newFuelL + refuelAmount)
    // Emit REFUEL event
  }
  
  return {
    fuelL: Math.round(newFuelL),
    fuelPct: Math.round((newFuelL / cap) * 100),
    fuelRateLph: state.workCycle !== 'OFF' ? fuelRateLph : 0,
    totalFuelConsumed: asset.totalFuelConsumed + consumed
  }
}
```

**Theft scenario (scripted):**
```js
// Triggered by FaultInjector at T+10min
// Drop fuel 10–15% over 8 minutes with ignition=OFF
function injectTheft(asset) {
  asset.faultEvents.push({
    type: 'THEFT',
    startTime: Date.now(),
    drainRatePerSecond: (cap * 0.12) / 480  // 12% over 480s
  })
  asset.ble.magnet = false  // fuel cap opened
}
```

---

## State Machine 3: TemperatureModel

### Engine coolant (Newton's cooling)

```js
function tickCoolant(asset, elapsed_s) {
  const { coolant_c, workCycle } = asset
  
  // Target temperature depends on state
  const TARGET = {
    OFF: 35,         // ambient UAE
    COLD_START: 35,  // same as ambient initially
    WARMING: 88,     // warming up to operating temp
    OPERATING: 88,   // normal operating
    IDLE: 75         // slight cooling at idle
  }
  
  const target = TARGET[workCycle.state]
  const rate = workCycle.state === 'WARMING' ? 0.008 : 0.003  // faster warm-up
  
  // Newton's law: temp approaches target exponentially
  const newTemp = coolant_c + (target - coolant_c) * rate * elapsed_s
  
  return Math.round(newTemp + (Math.random() - 0.5) * 2)  // ±1°C noise
}

// Fault injection: coolant overtemp on KSP-006
function injectCoolantFault(asset) {
  asset.coolantFaultActive = true  // override: target becomes 108°C
}
```

### EYE Sensor temperature (ambient + solar)

```js
function bleTemp(uaeHour) {
  // UAE outdoor ambient: 28°C at night, 44°C midday peak
  const AMBIENT = 28 + 16 * Math.sin((uaeHour - 6) * Math.PI / 12)
  // Inside cab adds ~4°C
  return Math.round(AMBIENT + 4 + (Math.random() - 0.5) * 2)
}
```

---

## State Machine 4: GPSModel

### Heavy equipment — constrained random walk

```js
const ZONE_CENTERS = {
  'KSP-001': { lat: 25.115, lon: 55.196, radius: 0.0008 },  // ≈90m
  'KSP-002': { lat: 25.126, lon: 55.218, radius: 0.0008 },
  'KSP-003': { lat: 25.018, lon: 55.082, radius: 0.0010 },
  'KSP-004': { lat: 25.014, lon: 55.097, radius: 0.0015 },  // truck moves more
  // ... etc
}

function tickGPS(asset, elapsed_s) {
  const center = ZONE_CENTERS[asset.id]
  const isMoving = asset.workCycle.state === 'OPERATING'
  const maxDrift = isMoving ? 0.00015 : 0.00003  // ≈17m or ≈3m per tick
  
  let newLat = asset.lat + (Math.random() - 0.5) * maxDrift * (elapsed_s / 3)
  let newLon = asset.lon + (Math.random() - 0.5) * maxDrift * (elapsed_s / 3)
  
  // Constrain to zone radius
  const dLat = newLat - center.lat
  const dLon = newLon - center.lon
  const dist = Math.sqrt(dLat*dLat + dLon*dLon)
  if(dist > center.radius) {
    const scale = center.radius / dist * 0.95
    newLat = center.lat + dLat * scale
    newLon = center.lon + dLon * scale
  }
  
  return { lat: newLat, lon: newLon }
}
```

### Truck (KSP-004) — waypoint following

```js
const TRUCK_ROUTE = [
  { lat: 25.018, lon: 55.082 },  // Jebel Ali
  { lat: 25.072, lon: 55.148 },  // midpoint
  { lat: 25.115, lon: 55.196 },  // Al Quoz
  { lat: 25.190, lon: 55.315 },  // Creek Harbour
]

function tickTruckGPS(asset, elapsed_s) {
  // Interpolate between waypoints at 60km/h average
  const speed = asset.workCycle.state === 'OPERATING' ? 60 : 0  // km/h
  // advance along route...
}
```

---

## State Machine 5: MaintenanceCounter

```js
const MAINTENANCE_THRESHOLDS = {
  'KSP-001': [{ name: 'Engine Oil & Filter', threshold: 4850, lastDone: 4600 }],
  'KSP-006': [{ name: 'Engine Oil & Filter', threshold: 5600, lastDone: 5350 }],
  // etc
}

function tickMaintenance(asset, elapsed_s) {
  if(asset.ignition) {
    asset.engineHrs += elapsed_s / 3600  // real-time accumulation
  }
  
  // Check thresholds
  for(const item of MAINTENANCE_THRESHOLDS[asset.id] || []) {
    const remaining = item.threshold - asset.engineHrs
    if(remaining <= 0 && !item.alertFired) {
      item.alertFired = true
      asset.events.push({ type: 'MAINT_DUE', severity: 'warning', name: item.name })
    }
  }
}
```

---

## State Machine 6: FaultInjector

```js
class FaultInjector {
  constructor(startTime) {
    this.startTime = startTime
    this.fired = new Set()
  }
  
  tick(assets, now) {
    const elapsed = (now - this.startTime) / 1000  // seconds
    
    const EVENTS = [
      { at: 120,  assetId: 'KSP-002', type: 'LOW_FUEL',      fn: (a) => { a.fuelPct = 18 } },
      { at: 360,  assetId: 'KSP-006', type: 'DTC_FAULT',     fn: (a) => { a.dtcCodes = ['SPN:110/FMI:3']; a.coolantFaultActive = true } },
      { at: 600,  assetId: 'KSP-003', type: 'FUEL_THEFT',    fn: (a) => injectTheft(a) },
      { at: 840,  assetId: 'KSP-007', type: 'DEVICE_ONLINE', fn: (a) => { a.status = 'IDLE'; a.sats = 12 } },
      { at: 1080, assetId: 'KSP-001', type: 'MAINT_DUE',     fn: (a) => { a.maintAlert = true } },
    ]
    
    for(const ev of EVENTS) {
      if(elapsed >= ev.at && !this.fired.has(ev.type)) {
        this.fired.add(ev.type)
        const asset = assets.find(a => a.id === ev.assetId)
        if(asset) ev.fn(asset)
        GLOBAL_EVENTS.push({ ...ev, ts: new Date().toISOString() })
      }
    }
  }
}
```

---

## RPM + Load correlation

```js
// RPM model — sinusoidal work cycle with noise
function tickRPM(asset) {
  if(asset.workCycle.state !== 'OPERATING' && asset.workCycle.state !== 'WARMING') {
    if(asset.workCycle.state === 'IDLE') return 800 + Math.round(Math.random() * 100)
    return 0
  }
  
  const t = Date.now() / 1000
  // Slow work cycle: 45-second excavation rhythm
  const cycle = Math.sin(t * (2 * Math.PI / 45))
  const base = asset.specs.maxRPM * 0.65  // 65% average load
  const swing = asset.specs.maxRPM * 0.25  // ±25% swing
  const noise = (Math.random() - 0.5) * 60
  
  return Math.max(800, Math.round(base + cycle * swing + noise))
}

function rpmToLoad(rpm, maxRPM) {
  const idleRPM = 800
  return Math.max(0, Math.min(100, Math.round((rpm - idleRPM) / (maxRPM - idleRPM) * 100)))
}
```
