import dgram from 'node:dgram';
import { EventEmitter } from 'node:events';
import type { SonosDiscoveryResponse } from '../types/sonos.js';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SEARCH_TARGET = 'urn:schemas-upnp-org:device:ZonePlayer:1';
const SEARCH_MX = 1;

export class SsdpClient extends EventEmitter {
    private socket: dgram.Socket | null = null;
    private readonly searchMessage: string;

    constructor() {
        super();
        this.searchMessage = [
            'M-SEARCH * HTTP/1.1',
            `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
            'MAN: "ssdp:discover"',
            `MX: ${SEARCH_MX}`,
            `ST: ${SEARCH_TARGET}`,
            '',
            '',
        ].join('\r\n');
    }

    async discover(timeout = 5000): Promise<SonosDiscoveryResponse[]> {
        return new Promise((resolve, reject) => {
            const devices = new Map<string, SonosDiscoveryResponse>();

            this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

            this.socket.on('error', (err) => {
                this.cleanup();
                reject(err);
            });

            this.socket.on('message', (msg) => {
                const response = this.parseResponse(msg.toString());
                if (response && response.location) {
                    devices.set(response.location, response);
                    this.emit('device', response);
                }
            });

            this.socket.bind(() => {
                this.socket?.setBroadcast(true);
                this.socket?.setMulticastTTL(4);
                this.socket?.addMembership(SSDP_ADDRESS);

                const message = Buffer.from(this.searchMessage, 'utf-8');
                this.socket?.send(message, 0, message.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
                    if (err) {
                        this.cleanup();
                        reject(err);
                    }
                });

                setTimeout(() => {
                    this.cleanup();
                    resolve(Array.from(devices.values()));
                }, timeout);
            });
        });
    }

    private parseResponse(response: string): SonosDiscoveryResponse | null {
        const lines = response.split('\r\n');
        if (!lines[0]?.includes('HTTP/1.1 200 OK')) {
            return null;
        }

        const headers: Record<string, string> = {};
        for (const line of lines.slice(1)) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim().toLowerCase();
                const value = line.slice(colonIndex + 1).trim();
                headers[key] = value;
            }
        }

        if (!headers.location || !headers.st?.includes('ZonePlayer')) {
            return null;
        }

        return {
            location: headers.location,
            server: headers.server || '',
            usn: headers.usn || '',
            st: headers.st,
            ext: headers.ext,
            cacheControl: headers['cache-control'],
        };
    }

    private cleanup(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
