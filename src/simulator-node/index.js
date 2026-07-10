import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import SimulatorEngine from './engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv(join(__dirname, '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const INTERVAL_MS = parseInt(process.env.SIM_INTERVAL_MS || '10000', 10);
const RUN_ONCE = process.env.SIM_ONCE === 'true';

if(!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL');
}

if(!SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY');
}

const engine = new SimulatorEngine();

console.log(`[kasper-sim] Starting. Writing to Supabase every ${INTERVAL_MS}ms`);
console.log(`[kasper-sim] URL: ${SUPABASE_URL}`);

async function loop() {
  const t0 = Date.now();
  engine.tick();

  const records = engine.getRecords();
  const events = engine.flushEvents();

  const recErr = await insertRows('telemetry_records', records);

  if(recErr) {
    console.error('[kasper-sim] telemetry insert error:', recErr.message);
  } else {
    const elapsed = Date.now() - t0;
    console.log(
      `[kasper-sim] ${new Date().toISOString()} - inserted ${records.length} records (${elapsed}ms)`
    );
  }

  if(events.length) {
    const evErr = await insertRows('events', events);

    if(evErr) {
      console.error('[kasper-sim] event insert error:', evErr.message);
    } else {
      console.log(
        `[kasper-sim] inserted ${events.length} events:`,
        events.map(e => e.type).join(', ')
      );
    }
  }
}

await loop();

if(RUN_ONCE) {
  await new Promise(resolve => setTimeout(resolve, 250));
  process.exit(0);
}

setInterval(loop, INTERVAL_MS);

process.on('SIGINT', () => {
  console.log('\n[kasper-sim] Stopped.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[kasper-sim] Stopped.');
  process.exit(0);
});

function loadEnv(path) {
  if(!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for(const line of lines) {
    const trimmed = line.trim();
    if(!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if(idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if(key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

async function insertRows(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(rows)
  });

  if(res.ok) return null;

  let message = `${res.status} ${res.statusText}`;
  try {
    const body = await res.json();
    message = body.message || body.error || message;
  } catch {
    message = await res.text();
  }

  return { message };
}
