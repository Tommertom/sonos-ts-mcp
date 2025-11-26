import dgram from 'node:dgram';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import type { SonosDiscoveryResponse } from '../types/sonos.js';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SEARCH_TARGET = 'urn:schemas-upnp-org:device:ZonePlayer:1';
const SEARCH_MX = 3;

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
                console.error('[SSDP Client] Received message:', msg.toString().substring(0, 200));
                const response = this.parseResponse(msg.toString());
                if (response && response.location) {
                    console.error('[SSDP Client] Valid Sonos device found:', response.location);
                    devices.set(response.location, response);
                    this.emit('device', response);
                } else {
                    console.error('[SSDP Client] Message did not parse as Sonos device');
                }
            });

            this.socket.bind(() => {
                console.error('[SSDP Client] Socket bound, configuring multicast...');
                this.socket?.setBroadcast(true);
                this.socket?.setMulticastTTL(4);

                // Try to join multicast on all active interfaces
                const interfaces = os.networkInterfaces();
                for (const [name, addrs] of Object.entries(interfaces)) {
                    const ipv4 = addrs?.filter(addr => addr.family === 'IPv4' && !addr.internal);
                    if (ipv4 && ipv4.length > 0) {
                        for (const addr of ipv4) {
                            try {
                                this.socket?.addMembership(SSDP_ADDRESS, addr.address);
                                console.error(`[SSDP Client] Joined multicast on ${name} (${addr.address})`);
                            } catch (err) {
                                console.error(`[SSDP Client] Failed to join multicast on ${name}:`, err);
                            }
                        }
                    }
                }
                console.error('[SSDP Client] Multicast configured, sending M-SEARCH...');

                const message = Buffer.from(this.searchMessage, 'utf-8');
                this.socket?.send(message, 0, message.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
                    if (err) {
                        console.error('[SSDP Client] Send error:', err);
                        this.cleanup();
                        reject(err);
                    } else {
                        console.error(`[SSDP Client] M-SEARCH sent, waiting ${timeout}ms for responses...`);
                    }
                });

                setTimeout(() => {
                    console.error(`[SSDP Client] Timeout reached, found ${devices.size} device(s)`);
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
