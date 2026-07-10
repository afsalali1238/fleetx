# Kasper Fleet — Antigravity Prompts

Copy these verbatim into Antigravity's Manager view. The AGENTS.md + .agents/rules/ files
give the agent everything else it needs. Do not paraphrase — precision matters for agentic tasks.

---

## HOW TO USE ANTIGRAVITY FOR THIS PROJECT

1. Open `kasper-fleet-antigravity/` as your workspace in Antigravity
2. AGENTS.md loads automatically — the agent has full project context
3. Use **Manager view** for each task below (not Editor chat)
4. Use **Claude Opus 4.6** as your model — complex multi-file reasoning, worth it
5. Use **browser sub-agent** to verify UI changes after each task

---

## PHASE 1 PROMPTS — Dashboard features (single file, no backend)

### P1-A: Verify the simulation is running correctly
```
Open kasper_fleet_final.html in the browser sub-agent. 
Wait 3 minutes and observe:
1. Do asset statuses change over time?
2. Do the RPM gauge and coolant sparkline update in the detail panel?
3. Do alerts appear in the bottom panel as the simulation progresses?
4. Does Ctrl+Shift+D open the demo control panel?
Report what you see. Flag anything that looks broken or unrealistic.
```

### P1-B: Add 7-day fuel history chart to Fuel screen
```
Read AGENTS.md and .agents/rules/dashboard-rules.md first.

In kasper_fleet_final.html, find the renderFuelCards() function and the fuel screen HTML.
Add a 7-day fuel history bar chart to each fuel card.
Use the existing fuelHist[] ring buffer (30 readings) as a proxy — label days Mon-Sun.
Build the chart as inline SVG inside each fuel card, below the existing fuel bar.
Match the visual style of the existing coolant sparkline in the detail panel.
Do not change renderFuelCards() signature or any other function.
```

### P1-C: Add route trail (GPS polyline) on map
```
Read AGENTS.md and .agents/rules/dashboard-rules.md first.

In kasper_fleet_final.html:
1. Add a posHist[] ring buffer (20 entries of {lat, lon}) to each asset state in SimulatorEngine._init()
2. In SimulatorEngine._tickGPS(), push the new position to posHist and shift if length > 20
3. In SimulatorEngine._sync(), copy posHist to ASSETS[i].posHist
4. In renderMarkers(), draw a <polyline> connecting the posHist coordinates for the selected asset
   Convert lat/lon to SVG coordinates using the same formula as existing markers.
   Style: stroke var(--accent), stroke-width 1.2, opacity 0.5, no fill

Do not change any render function signatures. Surgical changes only.
```

### P1-D: Add predictive maintenance countdown
```
Read AGENTS.md and .agents/rules/data-rules.md first.

In kasper_fleet_final.html, find the renderDetail() function.
In the MAINTENANCE d-section, add a line below each maintenance item that shows:
"At current rate: due in X hours (approx DATE)"

Logic:
- If asset has a maintThr (see AGENTS.md asset table) and is currently operating:
  hoursRemaining = maintThr - engineHrs
  daysRemaining = hoursRemaining / 8 (8h workday)
  projectedDate = today + daysRemaining days
- If already overdue: show "OVERDUE — schedule immediately"
- If engineHrs is null (truck): skip

Format: font-family var(--mono), font-size 10px, color var(--dim)
```

### P1-E: Add cost accumulator live ticker to ROI screen
```
Read AGENTS.md and .agents/rules/dashboard-rules.md first.

In kasper_fleet_final.html, find renderROI().
Add a "Live Cost Today" row to the ROI hero section that shows:
- Fuel cost today: sum of (a.todayFuel × 3.00) across all assets
- Idle cost today: approximated as sum of (IDLE time × 0 — placeholder for now)
- Total AED spent today (running number)

The number should update every time renderROI() is called (which happens on screen switch).
Format: large monospace number, var(--accent) color, "AED X,XXX" format.
```

---

## PHASE 2 PROMPTS — Supabase backend

### P2-A: Create Supabase schema
```
Read AGENTS.md and .agents/rules/data-rules.md first.
Read the Supabase schema in docs/TECHSTACK.md.

Create the file supabase/schema.sql with the exact SQL from TECHSTACK.md.
Add these indexes (not in TECHSTACK.md, add them):
  CREATE INDEX ON telemetry_records (asset_id, ts DESC);
  CREATE INDEX ON events (asset_id, ts DESC);

Also create supabase/seed.sql that inserts one test record for KSP-001
to verify the schema works when run in Supabase dashboard.
```

### P2-B: Build Node.js simulator runner
```
Read AGENTS.md, docs/TECHSTACK.md, and src/simulator-engine.js first.

Create src/simulator-node/package.json:
  name: kasper-simulator-node
  type: module
  dependencies: @supabase/supabase-js ^2.0.0
  scripts.start: node index.js

Create src/simulator-node/index.js:
- Import SimulatorEngine from ../simulator-engine.js
- Create Supabase client from env vars SUPABASE_URL and SUPABASE_SERVICE_KEY
- Call engine.tick() every 10 seconds
- After each tick, read ASSETS from engine._states and map to telemetry_records rows
- Insert all 8 rows in one supabase.from('telemetry_records').insert(rows) call
- Flush SIM.getEvents() and insert to events table if non-empty
- Log to console: timestamp, asset count, any Supabase errors

Create .env.example with the required env vars (no real values).
```

### P2-C: Connect dashboard to Supabase realtime
```
Read AGENTS.md and .agents/rules/dashboard-rules.md first.
Read the Supabase subscription code in docs/TECHSTACK.md.

In kasper_fleet_final.html:
1. Add Supabase JS CDN script tag before the closing </head>
   Use: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js

2. Add two const at top of <script>:
   const SUPABASE_URL = ''  // user fills in
   const SUPABASE_ANON_KEY = ''  // user fills in

3. Add function connectSupabase() that:
   - If SUPABASE_URL is empty, logs "Running in offline/simulation mode" and returns
   - Otherwise creates supabase client and subscribes to telemetry_records INSERT events
   - On INSERT: finds the matching asset by asset_id and updates its ASSETS[] fields
   - On events INSERT: calls SIM._ev() to add to the event log

4. Call connectSupabase() in the init block (after initMapInteraction())
5. Add a small indicator in the nav: "● LIVE" (green) or "● SIM" (orange) depending on mode

Do not break the existing setInterval(simulate, 3000) — it still runs in simulation mode.
```

---

## PHASE 3 PROMPTS — Traccar + Codec 8E

### P3-A: Build Codec 8E encoder
```
Read AGENTS.md and .agents/rules/data-rules.md first.
Read the Codec 8E packet structure in docs/TECHSTACK.md.

Create src/traccar/codec8e.js that exports:
  encodeCodec8E(avlRecords, imei) → Buffer
  crc16ibm(buffer) → number

The CRC-16/IBM function is in data-rules.md. Copy it exactly.

For encodeCodec8E:
- Build the binary packet per the Teltonika Codec 8 Extended spec
- Include: preamble (4B zeros), data length (4B), codec ID (0x8E), record count (1B),
  AVL record, record count again (1B), CRC-16/IBM of everything between preamble and CRC (4B)
- Each AVL record includes: timestamp (8B unix ms), priority (1B = 0), 
  longitude (4B × 10⁻⁷), latitude (4B × 10⁻⁷), altitude (2B), angle (2B),
  satellites (1B), speed (2B), IO block (see AVL_FIELDS.md for IDs to include)

Write a test function at the bottom of the file that encodes one sample record
and logs the hex output so it can be manually verified.
```

### P3-B: Build virtual device TCP client
```
Read AGENTS.md and src/traccar/codec8e.js first.

Create src/traccar/virtual-device.js that exports class VirtualFMC130.

The class must:
- Accept: imei, traccarHost, traccarPort (default 5027)
- Open a persistent TCP socket on construction using Node.js net module
- On connect: send IMEI handshake (2B length big-endian + IMEI as ASCII)
- On data (Traccar ACK = 0x01): log "IMEI accepted, sending records"
- On data (Traccar ACK = 0x00): log "ERROR: IMEI rejected" and close
- Expose sendRecord(avlData) that calls encodeCodec8E and writes to socket
- On close: reconnect after 5000ms
- On error: log error, do not throw

Create src/traccar/index.js that:
- Imports VirtualFMC130 and SimulatorEngine
- Creates 8 VirtualFMC130 instances with IMEIs matching KSP-001 through KSP-008
  Use fictional IMEIs: 352094081234001 through 352094081234008
- Calls engine.tick() every 10s and sends one record per virtual device

Read TRACCAR_HOST, TRACCAR_PORT from env vars.
```

---

## PARALLEL AGENT STRATEGY (use Antigravity Manager view)

For Phase 2, run 3 parallel agents:
- **Agent A**: schema.sql + seed.sql
- **Agent B**: simulator-node/index.js 
- **Agent C**: dashboard Supabase subscription

Merge in order: A → run in Supabase dashboard to verify → B → C.

For Phase 1 features, run 2 parallel agents:
- **Agent A**: P1-B (fuel chart) + P1-C (GPS trail) — both modify renderFuelCards and renderMarkers
- **Agent B**: P1-D (maintenance) + P1-E (ROI ticker) — both modify renderDetail and renderROI

**Warning**: Agents A and B must not touch the same functions. Review diffs before merging.

---

## BROWSER VERIFICATION PROMPTS (after any UI change)

```
Open kasper_fleet_final.html in the browser sub-agent.
Take a screenshot of the Fleet Map screen with KSP-005 selected.
Take a screenshot of the Fuel Management screen.
Take a screenshot of the Cost & ROI screen.
Verify:
1. RPM gauge shows a non-zero value for an OPERATING asset
2. Coolant sparkline has data points
3. Pitch/roll indicator is visible
4. Fuel screen shows 8 cards
5. ROI screen shows AED values
Report any visual issues.
```

---

## COMMON DEBUGGING PROMPTS

### If simulation stops updating:
```
Open kasper_fleet_final.html in the browser sub-agent.
Open the browser console (F12).
Wait 10 seconds and look for errors.
Check specifically: does simulate() throw? Does SIM.tick() complete?
Report the exact error message and line number.
```

### If an asset shows wrong data:
```
In kasper_fleet_final.html, find SimulatorEngine.CONFIGS.
Find the entry for [ASSET_ID].
Cross-reference with docs/AVL_FIELDS.md asset spec table.
Identify which field is wrong and trace it through:
  CONFIGS → _init() → _tickXXX() → _sync() → ASSETS[i].field
Report which step produces the wrong value.
```

### If Supabase inserts fail:
```
In src/simulator-node/index.js, add a console.log of the insert payload before the supabase call.
Run the simulator for one tick.
Paste the logged payload into the Supabase table editor to test manually.
Report the exact Supabase error object.
```
