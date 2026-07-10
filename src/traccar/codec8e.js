const CODEC_ID = 0x8E;

export function crc16ibm(buffer) {
  let crc = 0x0000;
  for(const byte of buffer) {
    crc ^= byte;
    for(let i = 0; i < 8; i++)
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
  }
  return crc;
}

export function buildIMEIHandshake(imei) {
  const imeiBytes = Buffer.from(String(imei), 'ascii');
  const out = Buffer.alloc(2 + imeiBytes.length);
  out.writeUInt16BE(imeiBytes.length, 0);
  imeiBytes.copy(out, 2);
  return out;
}

export function encodeCodec8E(records, imei) {
  if(!Array.isArray(records) || records.length === 0) {
    throw new Error('encodeCodec8E requires at least one telemetry record');
  }

  if(records.length > 255) {
    throw new Error('Codec 8E packet supports up to 255 records');
  }

  if(!imei) {
    throw new Error('IMEI is required');
  }

  const avlRecords = records.map(record => buildAvlRecord(record));
  const data = Buffer.concat([
    Buffer.from([CODEC_ID, records.length]),
    ...avlRecords,
    Buffer.from([records.length])
  ]);

  const packet = Buffer.alloc(8 + data.length + 4);
  packet.writeUInt32BE(0, 0);
  packet.writeUInt32BE(data.length, 4);
  data.copy(packet, 8);
  packet.writeUInt32BE(crc16ibm(data), 8 + data.length);
  return packet;
}

function buildAvlRecord(record) {
  const gps = Buffer.alloc(15);
  gps.writeInt32BE(Math.round((record.lon || 0) * 10000000), 0);
  gps.writeInt32BE(Math.round((record.lat || 0) * 10000000), 4);
  gps.writeInt16BE(record.altitude ?? 15, 8);
  gps.writeUInt16BE(clampInt(record.heading, 0, 359), 10);
  gps.writeUInt8(clampInt(record.sats, 0, 255), 12);
  gps.writeUInt16BE(clampInt(record.speed, 0, 65535), 13);

  const io1 = [
    [239, record.ignition ? 1 : 0],
    [68, clampInt(record.fuel_pct, 0, 100)],
    [72, clampInt(record.coolant_c ?? 0, 0, 255)],
    [80, 35]
  ];
  const io2 = [
    [12, clampInt(record.rpm, 0, 65535)],
    [67, clampInt(Math.round((record.batt_v || 0) * 1000), 0, 65535)]
  ];
  const io4 = [
    [253, clampInt(Math.round((record.engine_hrs || 0) * 10), 0, 0xFFFFFFFF)],
    [181, clampInt(Math.round((record.fuel_lph || 0) * 10), 0, 0xFFFFFFFF)],
    [182, clampInt(Math.round((record.fuel_total || 0) * 10), 0, 0xFFFFFFFF)],
    [525, clampInt(record.load_pct, 0, 100)]
  ];

  const io = Buffer.concat([
    u16(0),
    u16(io1.length + io2.length + io4.length),
    buildIoGroup(io1, 1),
    buildIoGroup(io2, 2),
    buildIoGroup(io4, 4),
    u16(0)
  ]);

  const header = Buffer.alloc(9);
  header.writeBigInt64BE(BigInt(new Date(record.ts || Date.now()).getTime()), 0);
  header.writeUInt8(0, 8);

  return Buffer.concat([header, gps, io]);
}

function buildIoGroup(items, bytes) {
  const out = Buffer.alloc(2 + items.length * (2 + bytes));
  out.writeUInt16BE(items.length, 0);

  items.forEach(([id, value], index) => {
    const offset = 2 + index * (2 + bytes);
    out.writeUInt16BE(id, offset);
    if(bytes === 1) out.writeUInt8(value, offset + 2);
    if(bytes === 2) out.writeUInt16BE(value, offset + 2);
    if(bytes === 4) out.writeUInt32BE(value, offset + 2);
  });

  return out;
}

function u16(value) {
  const out = Buffer.alloc(2);
  out.writeUInt16BE(value, 0);
  return out;
}

function clampInt(value, min, max) {
  const n = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, n));
}

function selfTest() {
  const vector = crc16ibm(Buffer.from([0x08, 0x01]));
  if(vector !== 0x00C6) {
    throw new Error(`CRC-16/IBM self-test failed: expected 0x00C6, got 0x${vector.toString(16)}`);
  }

  const sample = encodeCodec8E([{
    asset_id: 'KSP-001',
    ts: '2026-05-18T10:00:00.000Z',
    lat: 25.115,
    lon: 55.196,
    speed: 3,
    heading: 92,
    sats: 13,
    ignition: true,
    rpm: 1450,
    engine_hrs: 4821.2,
    coolant_c: 87,
    load_pct: 62,
    fuel_pct: 62,
    fuel_lph: 11.2,
    fuel_total: 9300,
    batt_v: 26.4
  }], '352094081234001');
  const crc = sample.readUInt32BE(sample.length - 4);

  if(crc === 0) {
    throw new Error('Codec 8E self-test failed: CRC is zero');
  }

  console.log(`[codec8e] self-test sample: ${sample.toString('hex')}`);
}

selfTest();
