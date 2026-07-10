import net from 'net';
import { buildIMEIHandshake, encodeCodec8E } from './codec8e.js';

export default class VirtualFMC130 {
  constructor(imei, host, port = 5027) {
    this.imei = imei;
    this.host = host;
    this.port = port;
    this.state = 'disconnected';
    this.socket = null;
    this._reconnectTimer = null;
    this.reconnect();
  }

  sendRecord(telemetryRecord) {
    if(!this.isReady) return;

    const packet = encodeCodec8E([telemetryRecord], this.imei);
    this.socket.write(packet);
    console.log(
      `[${this.imei}] sent record - fuel:${telemetryRecord.fuel_pct}% rpm:${telemetryRecord.rpm}`
    );
  }

  reconnect() {
    if(this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if(this.socket) {
      this.socket.destroy();
    }

    this.state = 'disconnected';
    console.log(`[${this.imei}] Reconnecting...`);
    this.socket = net.createConnection(this.port, this.host);
    this._bindHandlers();
  }

  get isReady() {
    return this.state === 'authenticated';
  }

  _bindHandlers() {
    this.socket.on('connect', () => {
      this.state = 'connected';
      console.log(`[${this.imei}] TCP connected, sending IMEI handshake`);
      this.socket.write(buildIMEIHandshake(this.imei));
    });

    this.socket.on('data', response => {
      if(this.state === 'connected') {
        if(response[0] === 0x01) {
          this.state = 'authenticated';
          console.log(`[${this.imei}] Authenticated`);
        } else if(response[0] === 0x00) {
          console.log(`[${this.imei}] REJECTED - check IMEI in Traccar`);
          this.socket.end();
        }
        return;
      }

      if(this.state === 'authenticated' && response.length >= 4) {
        const ackCount = response.readUInt32BE(0);
        console.log(`[${this.imei}] ACK ${ackCount} records`);
      }
    });

    this.socket.on('close', () => {
      this.state = 'disconnected';
      console.log(`[${this.imei}] Disconnected. Reconnecting in 5s`);
      this._reconnectTimer = setTimeout(() => this.reconnect(), 5000);
    });

    this.socket.on('error', err => {
      console.error(`[${this.imei}] ${err.message}`);
    });
  }
}
