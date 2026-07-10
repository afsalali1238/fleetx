# Alert Engine - Supabase Edge Function

## Deploy

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy: `supabase functions deploy alert-engine`
5. Set secrets:
   `supabase secrets set MSG91_AUTH_KEY=your_key`
   `supabase secrets set ALERT_WHATSAPP_NUMBER=+971XXXXXXXXX`

## Wire to database webhook

In Supabase dashboard:

Database -> Webhooks -> Create webhook

Table: `telemetry_records`

Events: `INSERT`

Endpoint: `https://your-project.supabase.co/functions/v1/alert-engine`

HTTP Headers: `Authorization: Bearer your_service_key`

## Test

Insert a test row with `fuel_pct = 10`:

```sql
INSERT INTO telemetry_records (asset_id, ts, ignition, fuel_pct, fuel_lph, batt_v)
VALUES ('KSP-TEST', now(), true, 10, 5.2, 26.1);
```

Check the `events` table for a `LOW_FUEL` entry.
Check Supabase function logs for execution.

## Alert Rules Active

| Rule | Trigger | Severity |
|------|---------|----------|
| LOW_FUEL | fuel_pct < 20 AND ignition = true | critical |
| OVERTEMP | coolant_c > 100 | critical |
| DTC_FAULT | dtc_codes array not empty | critical |
| FUEL_THEFT | fuel drop >8% in <15min with engine off | critical |
| TAMPER | ble_magnet = false | warning |

## MSG91 WhatsApp Pricing

AED 0.05/message vs Twilio AED 0.25. Use MSG91 for UAE numbers.
