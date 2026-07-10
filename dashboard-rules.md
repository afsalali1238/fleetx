# Dashboard Rules — Kasper Fleet

Loaded for any task that touches `kasper_fleet_final.html`.

## The 11 screens

```
map       → Fleet Map (default) — SVG map, asset markers, detail panel
fuel      → Fuel Management — 8 fuel cards with bars
maint     → Maintenance — per-asset schedule cards
geo       → Geofences — zone polygons, entry/exit log
util      → Utilisation — hours by asset and zone
roi       → Cost & ROI — AED savings, per-asset cost bars
reports   → Reports — export options
history   → Trip History & Playback — static mockup, route polyline + scrubber (not wired to SIM)
alerts    → Alerts Center — static mockup, severity feed + WhatsApp routing rules (not wired to SIM)
client    → Client Tracking Link — static mockup, phone-frame ETA view (not wired to SIM)
timesheet → Timesheet — static mockup, driver hours table (not wired to SIM)
```

`history`, `alerts`, `client`, `timesheet` are visual mockups added from `kasper-gps-platform-tour.html` — they use existing CSS classes (`sc`, `panel-box`, `badge`, `tbl`, `alert-item` family) but render static demo data, not `ASSETS[]`. If asked to make them live, wire into `renderDetail`/`SIM` per the Phase 2+ data flow, not from scratch.

Screen switch: `showScreen('map')` — pass the exact string above.

## CSS variables (must use — do NOT hardcode hex values)

Rebranded 2026-07-10 from Kasper to **Dozr**, per `Dozr_Brand_Guidelines.html`. Kasper's orange/rainbow identity is retired — do not reintroduce `#ea6c0a` or the old blue/purple/green/red hexes anywhere, including inline SVG `fill`/`stroke`.

```css
--accent      /* Signal Yellow #FFC400 — primary action / mark only, never body text or decoration */
--green       /* Verified Green #1F9A6D */
--red         /* Error Red #D64545 */
--yellow      /* Yellow Dark #E6AF00 — used for IDLE/warning status, kept distinct from --accent so Signal Yellow stays reserved for actions */
--blue        /* #3D6E96 — muted, NOT a Dozr brand color; used only for zone/info differentiation (Dozr palette has no blue) */
--purple      /* #6E6398 — muted, NOT a Dozr brand color; used only for zone differentiation (Dozr palette has no purple) */
--ink / --text /* Ink #141518 — near-black, default text */
--dim         /* Slate #5B5F66 — secondary text */
--muted       /* Muted #9A9CA1 — tertiary text/labels */
--surface     /* Surface #FFFFFF */
--surface2    /* Canvas #F6F6F3 */
--border      /* Line #E8E8E3 */
--border2     /* #D8D8D2 */
--mono        /* Space Mono — data values, uppercase eyebrow labels */
--sans        /* Hanken Grotesk — body text */
--display     /* Space Grotesk — headings/wordmark (.logo, .d-name, .rep-name, .modal-title) */
```

Wordmark rule: "dozr" is always set in Ink, never in Signal Yellow (brand guideline: "Don't set the wordmark in yellow"). Only the icon mark (dozer-blade path in `.logo-mark`) is yellow-on-ink.

Inline SVG `font-family` attributes are set as literal strings (not CSS) and do NOT inherit `--mono` — if you change the mono font again, grep for the literal font name across the file, not just the `:root` var.

## Multi-tenant / PWA affordances (2026-07-10)

- `#vendor-switch` in the topnav is a display-only vendor switcher (3 demo vendors) — signals multi-tenant structure for vendor demos. Not wired to real data isolation; that's Phase 4 (Supabase RLS, per `TECHSTACK.md`).
- `<link rel="manifest">` is an inline base64 data URI (keeps single-file architecture) — installable PWA icon reuses the `.logo-mark` dozer-blade SVG. Regenerate the base64 if the icon or manifest fields change (see AGENTS.md session notes for the generation script).

## Detail panel sections

Structure inside `detail-panel` innerHTML:
```
d-header         → asset ID, name, device, status chips
metrics-2        → 4 metric cards (hours, RPM, fuel rate, load)
d-section × N   → collapsible sections with d-sec-title header
coords-bar       → GPS coordinates at bottom
```

Adding a new section: append a `<div class="d-section">` before `coords-bar`.

## Map constraints

- SVG viewBox: `0 0 720 460`
- UAE bounding box: lat 24.15→25.65, lon 54.2→55.85
- Lat→Y: `(LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * 460`
- Lon→X: `(lon - LON_MIN) / (LON_MAX - LON_MIN) * 720`
- Do NOT change the geofence zone positions — they are coordinate-accurate

## Asset status colours

```
OPERATING → --green
IDLE      → --yellow
ALERT     → --red
OFFLINE   → --muted (grey)
```

Status dot classes: `dot-g`, `dot-y`, `dot-r`, `dot-x` (offline)

## Bottom tabs

Three tabs with IDs: `btv-alerts`, `btv-events`, `btv-fuel-ev`
Toggle via: `switchBottomTab(el, 'alerts'|'events'|'fuel-ev')`

## ⌘K command palette

Triggered by: `openCmdK()` or `Ctrl+K`
Do NOT break this. It reads ASSETS[] directly.

## Pan+zoom

`mapVB` object controls the SVG viewBox. Functions:
- `mapZoom(factor)` — zoom in/out
- `mapReset()` — reset to full UAE view
- `initMapInteraction()` — sets up wheel/drag/touch listeners

Always call `initMapInteraction()` after page init. Do NOT call it twice.

## Demo control panel

Hidden panel at `id="demo-panel"`. Toggle with `Ctrl+Shift+D`.
Buttons call `SIM.triggerFault(key)` then `renderAlerts()`.
Do NOT remove or break this — it's essential for live demos.

## Performance rules

- Do NOT call `renderDetail()` inside a loop
- Do NOT call `renderMarkers()` more than once per simulate() tick
- History arrays (`rpmHist`, `coolHist`, `fuelHist`) are fixed-size 30 — push+shift only
- SVG gauge functions (`rpmGaugeSVG`, `coolantSparkSVG`, `pitchRollSVG`) are called inside template literals — they must be synchronous and return a string
