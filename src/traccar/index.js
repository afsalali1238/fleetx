import SimulatorEngine from '../simulator-node/engine.js';
import VirtualFMC130 from './virtual-device.js';

const TRACCAR_HOST = process.env.TRACCAR_HOST;
const TRACCAR_PORT = parseInt(process.env.TRACCAR_PORT || '5027', 10);
const INTERVAL_MS = parseInt(process.env.SIM_INTERVAL_MS || '10000', 10);

if(!TRACCAR_HOST) {
  throw new Error('Missing TRACCAR_HOST');
}

const IMEIS = {
  'KSP-001': '352094081234001',
  'KSP-002': '352094081234002',
  'KSP-003': '352094081234003',
  'KSP-004': '352094081234004',
  'KSP-005': '352094081234005',
  'KSP-006': '352094081234006',
  'KSP-007': '352094081234007',
  'KSP-008': '352094081234008'
};

const engine = new SimulatorEngine();
const devices = {};

Object.entries(IMEIS).forEach(([assetId, imei]) => {
  devices[assetId] = new VirtualFMC130(imei, TRACCAR_HOST, TRACCAR_PORT);
});

console.log(
  `[traccar-sim] Started. ${Object.keys(devices).length} virtual devices connecting to ` +
  `${TRACCAR_HOST}:${TRACCAR_PORT}`
);

setInterval(() => {
  engine.tick();
  const records = engine.getRecords();

  records.forEach(rec => {
    const dev = devices[rec.asset_id];
    if(dev && dev.isReady) {
      dev.sendRecord(rec);
    }
  });
}, INTERVAL_MS);
