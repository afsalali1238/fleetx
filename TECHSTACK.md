# Kasper Fleet — Full Tech Stack

## Layer Map

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                        │
│  kasper_fleet_final.html                                 │
│  ├── SimulatorEngine (Phase 1: in-memory JS)            │
│  ├── Supabase JS client (Phase 2: realtime sub)         │
│  └── Render functions (unchanged from current)          │
└─────────────────┬───────────────────────────────────────┘
                  │ Phase 2: WebSocket (Supabase realtime)
                  │ Phase 3: REST (Traccar API)
┌─────────────────▼───────────────────────────────────────┐
│  Supabase (postgres.supabase.co)           FREE TIER     │
│  ├── telemetry_records table                            │
│  ├── events table                                       │
│  ├── Realtime publication                               │
│  └── Edge Functions (alert engine, Phase 4)             │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│  Node.js Simulator (Phase 2: runs 24/7)                 │
│  simulator-node/index.js                                │
│  └── SimulatorEngine (same class, server-side)         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Traccar (AWS Bahrain me-south-1)          Phase 3 only │
│  ├── TCP listener port 5027 (Teltonika protocol)        │
│  ├── PostgreSQL (stores decoded records)                │
│  └── REST API (/api/positions, /api/devices)            │
└─────────────────▲───────────────────────────────────────┘
                  │ TCP persistent socket (Codec 8E packets)
┌─────────────────┴───────────────────────────────────────┐
│  VirtualFMC130 (Node.js)                   Phase 3 only │
│  ├── 8 instances (one per simulated IMEI)               │
│  ├── Codec8E encoder + CRC-16/IBM                      │
│  └── Reconnect logic (5s retry on disconnect)           │
└─────────────────────────────────────────────────────────┘
```

## Technology Choices

### Runtime: JavaScript everywhere

**Why JS not Python?**
- Dashboard is JS — sharing SimulatorEngine class between browser and Node.js requires zero translation
- No serialization layer between simulator and UI in Phase 1
- Supabase JS client is first-class, well-documented
- `npm: teltonika-codec` exists for Codec 8E in Phase 3

**Browser Phase 1:** Vanilla JS, no bundler. Single file. Works as a local HTML file.

**Node.js Phase 2:** Node 20 LTS. ESM modules. No framework.

### Storage: Supabase

**Why Supabase not Firebase/PlanetScale/Neon?**
- Postgres — real SQL, time-series queries, PostGIS extension available later
- Realtime subscription built-in (no Socket.io server needed)
- Row-level security for vendor-specific data isolation (Phase 4)
- Free tier: 500MB storage, 2GB transfer, 50MB realtime — enough for 6 months of simulation
- Migration path: Supabase → TimescaleDB when data volume demands it

**Why not TimescaleDB directly?**
- Overkill for 8 simulated assets
- Supabase free tier eliminates hosting cost for the prototype phase
- TimescaleDB is the target for production (100+ devices)

### GPS Backend: Traccar (Phase 3 only)

**Why Traccar not Teltonika Telematics Server?**
- Teltonika TTS costs money. Traccar is free and open-source.
- Traccar natively supports FMC130/FMC920 protocol (Teltonika codec built-in)
- REST API is clean and well-documented
- Self-hosted on AWS Bahrain — lowest latency to UAE devices

**Why AWS Bahrain (me-south-1) not UAE North Azure?**
- Traccar on EC2 t3.small = $16/month vs Azure equivalent $20+
- AWS has better tooling (Parameter Store for secrets, CloudWatch for logs)
- Both have <10ms latency to Dubai — negligible difference

### Charts: Inline SVG (Phase 1) → D3.js lite (Phase 2)

**Why not Chart.js/Recharts/Plotly?**
- Current dashboard is a single HTML file. External library = CDN dependency.
- SVG gauges for RPM, coolant, pitch/roll are simpler to build from scratch than fighting chart library APIs
- D3 added in Phase 2 only for the heatmap (genuinely complex) — everything else stays SVG

**D3 import (if needed):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
```

### Alert Delivery: MSG91 WhatsApp (Phase 4)

**Why MSG91 not Twilio?**
- MSG91 UAE pricing: ~0.05 AED/message vs Twilio ~0.25 AED/message
- MSG91 has a UAE local number which improves deliverability
- Twilio is the fallback if MSG91 proves unreliable

### Hosting: Vercel (frontend) + Supabase (DB) + AWS (Traccar)

**Phase 1:** Local file. No hosting needed.  
**Phase 2:** Vercel free tier for the HTML dashboard. Supabase free for DB.  
**Phase 3:** + AWS Bahrain t3.small for Traccar ($16/month).

---

## File Structure

```
kasper-fleet/
├── kasper_fleet_final.html        ← dashboard (surgical edits only)
├── simulator-engine.js            ← SimulatorEngine class (Phase 1)
│
├── simulator-node/
│   ├── package.json
│   ├── index.js                   ← 24/7 runner (Phase 2)
│   └── engine.js                 ← imports SimulatorEngine
│
├── supabase/
│   ├── schema.sql                 ← telemetry_records + events tables
│   └── functions/
│       └── alert-engine/
│           └── index.ts           ← Deno edge function (Phase 4)
│
├── traccar/
│   ├── virtual-device.js          ← VirtualFMC130 TCP client (Phase 3)
│   └── codec8e.js                ← Codec 8E encoder + CRC-16/IBM
│
└── docs/
    ├── TECHSTACK.md               ← this file
    ├── AVL_FIELDS.md
    └── SIMULATION_MODELS.md
```

---

## Environment Variables

```bash
# Phase 2+
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...          # public (safe in browser)
SUPABASE_SERVICE_KEY=eyJ...       # private (server only, never in browser)

# Phase 3
TRACCAR_HOST=ec2-xxx.me-south-1.compute.amazonaws.com
TRACCAR_PORT=5027
TRACCAR_API_URL=http://host:8082
TRACCAR_USER=admin
TRACCAR_PASS=xxx

# Phase 4
MSG91_AUTH_KEY=xxx
MSG91_SENDER_ID=KASPER
ALERT_WHATSAPP_NUMBER=+971XXXXXXXXX
```

---

## Data Volume Estimates

| Phase | Rate | Daily records | Monthly | Supabase cost |
|-------|------|---------------|---------|---------------|
| Phase 1 | In-memory only | 0 stored | 0 | Free |
| Phase 2 | 8 assets × 6/min | 69,120/day | 2.1M | Free (500MB ≈ 18 months) |
| Phase 3 | Same + Traccar | Same + Traccar DB | 2.1M | Free |
| Production 100 devices | 100 × 6/min | 864,000/day | 26M/month | Supabase Pro $25/mo |

---

## Security Model

- **Phase 1:** No security needed. Local file.
- **Phase 2:** Supabase Row Level Security. Each vendor sees only their assets.
  ```sql
  CREATE POLICY vendor_isolation ON telemetry_records
    USING (asset_id IN (SELECT id FROM assets WHERE vendor_id = auth.uid()));
  ```
- **Phase 3:** Traccar behind VPC. Dashboard talks to Supabase, not Traccar directly.
- **Phase 4:** Supabase auth for multi-tenant dashboard. JWT tokens.

---

## When to migrate off Supabase

Trigger: data queries take > 2s, or Supabase free tier storage exceeds 400MB.

Migration: Supabase → TimescaleDB (Postgres extension, same SQL).  
Supabase exports to a .sql dump. TimescaleDB accepts it directly.  
Dashboard code change: update connection string only.
