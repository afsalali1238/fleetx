/*
BLOCK A - Add after the </style> closing tag, before <script>:

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
*/

/*
BLOCK B - Add at the top of the <script> block, before any variable declarations:

const SUPABASE_URL = ''
const SUPABASE_ANON_KEY = ''
let _supabaseMode = false
*/

/*
BLOCK C - Add as new functions, before the // init comment:

function connectSupabase() {
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('[kasper] No Supabase config - running in local simulation mode')
    updateConnectionBadge(false)
    return
  }

  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  _supabaseMode = true
  updateConnectionBadge(true)
  console.log('[kasper] Connected to Supabase realtime')

  sb.channel('telemetry')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'telemetry_records' },
      payload => updateAssetFromRecord(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'events' },
      payload => handleLiveEvent(payload.new)
    )
    .subscribe()
}

function updateAssetFromRecord(rec) {
  const idx = ASSETS.findIndex(a => a.id === rec.asset_id)
  if(idx === -1) return

  const a = ASSETS[idx]
  a.lat = rec.lat
  a.lon = rec.lon
  a.status = rec.ignition ? (rec.load_pct > 10 ? 'OPERATING' : 'IDLE') : 'OFFLINE'
  a.fuel = rec.fuel_pct
  a.fuelL = Math.round(rec.fuel_pct * a.cap / 100)
  a.fuelRate = rec.fuel_lph
  a.totalFuel = Math.round(rec.fuel_total || a.totalFuel || 0)
  a.rpm = rec.rpm
  a.load = rec.load_pct
  a.coolant = rec.coolant_c != null ? rec.coolant_c + '°C' : '—'
  a.batt = rec.batt_v?.toFixed(1) + 'V'
  a.sats = rec.sats
  a.faults = rec.dtc_codes?.length ? rec.dtc_codes.join(', ') : 'None'
  a.bleTemp = rec.ble_temp_c
  a.bleHum = rec.ble_humidity
  a.bleHumidity = rec.ble_humidity
  a.blePitch = rec.ble_pitch
  a.bleRoll = rec.ble_roll
  a.bleMag = rec.ble_magnet
  a.bleMagnet = rec.ble_magnet
  a.bleMovement = rec.ble_movement

  if(a.posHist) {
    a.posHist.push({ lat: rec.lat, lon: rec.lon })
    a.posHist.shift()
  }
  if(a.rpmHist) {
    a.rpmHist.push(rec.rpm || 0)
    a.rpmHist.shift()
  }
  if(a.rpmHistory) {
    a.rpmHistory.push(rec.rpm || 0)
    a.rpmHistory.shift()
  }
  if(a.coolHist) {
    a.coolHist.push(rec.coolant_c || 0)
    a.coolHist.shift()
  }
  if(a.coolantHistory) {
    a.coolantHistory.push(rec.coolant_c || 0)
    a.coolantHistory.shift()
  }
  if(a.fuelHist) {
    a.fuelHist.push(rec.fuel_pct || 0)
    a.fuelHist.shift()
  }
  if(a.fuelHistory) {
    a.fuelHistory.push(rec.fuel_pct || 0)
    a.fuelHistory.shift()
  }

  if(selectedAsset === idx) renderDetail(a, idx)
  renderSidebar()
  renderMarkers()
  if(typeof renderMapStats === 'function') renderMapStats()
}

function handleLiveEvent(ev) {
  SIM._ev(ev.type, ev.severity, ev.asset_id, ev.payload?.detail || ev.type)
  renderAlerts()
  showToast(`${ev.asset_id}: ${ev.type}`)
}

function updateConnectionBadge(connected) {
  const pill = document.querySelector('.live-pill')
  if(!pill) return
  pill.innerHTML = connected
    ? `<div class="live-dot"></div><span>LIVE · Supabase</span>`
    : `<div class="live-dot" style="background:var(--accent)"></div><span>SIM · Local</span>`
}
*/

/*
BLOCK D - Add inside the init block, after initMapInteraction():

connectSupabase()

When SUPABASE_URL is empty, the dashboard keeps running in local simulation mode.
Supabase realtime is an additional data path, not a replacement for simulate().
*/
