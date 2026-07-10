import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_KEY')!
);

const MSG91_KEY = Deno.env.get('MSG91_AUTH_KEY');
const ALERT_PHONE = Deno.env.get('ALERT_WHATSAPP_NUMBER');
const FUEL_AED = 3.00;

interface TelemetryRecord {
  asset_id: string;
  ts: string;
  ignition: boolean;
  fuel_pct: number;
  fuel_lph: number;
  coolant_c: number | null;
  engine_hrs: number | null;
  dtc_codes: string[];
  ble_magnet: boolean;
  lat: number;
  lon: number;
}

interface AlertEvent {
  asset_id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  payload: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  const body = await req.json();
  const record: TelemetryRecord = body.record;
  const alerts: AlertEvent[] = [];

  if(record.fuel_pct < 20 && record.ignition) {
    alerts.push({
      asset_id: record.asset_id,
      type: 'LOW_FUEL',
      severity: 'critical',
      payload: {
        fuel_pct: record.fuel_pct,
        detail: `Fuel ${record.fuel_pct}% - below 20% threshold`
      }
    });
  }

  if(record.coolant_c && record.coolant_c > 100) {
    alerts.push({
      asset_id: record.asset_id,
      type: 'OVERTEMP',
      severity: 'critical',
      payload: {
        coolant_c: record.coolant_c,
        detail: `Coolant ${record.coolant_c}C - engine overheating`
      }
    });
  }

  if(record.dtc_codes && record.dtc_codes.length > 0) {
    alerts.push({
      asset_id: record.asset_id,
      type: 'DTC_FAULT',
      severity: 'critical',
      payload: {
        codes: record.dtc_codes,
        detail: `DTC fault: ${record.dtc_codes.join(', ')}`
      }
    });
  }

  const { data: prev } = await supabase
    .from('telemetry_records')
    .select('fuel_pct, ignition, ts')
    .eq('asset_id', record.asset_id)
    .order('ts', { ascending: false })
    .range(1, 2);

  if(prev && prev[0] && !record.ignition) {
    const drop = prev[0].fuel_pct - record.fuel_pct;
    const elapsed =
      (new Date(record.ts).getTime() - new Date(prev[0].ts).getTime()) / 60000;

    if(drop > 8 && elapsed < 15) {
      const litresDrained = Math.round(drop / 100 * 400);
      alerts.push({
        asset_id: record.asset_id,
        type: 'FUEL_THEFT',
        severity: 'critical',
        payload: {
          drop_pct: drop,
          litres: litresDrained,
          cost_aed: Math.round(litresDrained * FUEL_AED),
          detail: `Fuel drain ${drop.toFixed(0)}% (~${litresDrained}L) in ` +
            `${elapsed.toFixed(0)}min, engine OFF`
        }
      });
    }
  }

  if(record.ble_magnet === false) {
    alerts.push({
      asset_id: record.asset_id,
      type: 'TAMPER',
      severity: 'warning',
      payload: { detail: 'Fuel cap magnet signal lost - possible tamper' }
    });
  }

  if(alerts.length > 0) {
    const { error } = await supabase.from('events').insert(alerts);
    if(error) console.error('Event insert error:', error);

    if(MSG91_KEY && ALERT_PHONE) {
      for(const alert of alerts.filter(a => a.severity === 'critical')) {
        await sendWhatsApp(alert.asset_id, String(alert.payload.detail));
      }
    }
  }

  return new Response(JSON.stringify({ processed: alerts.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

async function sendWhatsApp(assetId: string, message: string) {
  const body = {
    sender: 'KASPER',
    message: `[KASPER ALERT] ${assetId}: ${message}`,
    mobile: ALERT_PHONE!.replace('+', '')
  };

  const res = await fetch(
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      method: 'POST',
      headers: {
        authkey: MSG91_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  const result = await res.json();
  console.log(`[alert-engine] WhatsApp to ${ALERT_PHONE}: ${result.message || result.type}`);
}
