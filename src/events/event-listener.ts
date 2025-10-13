/**
 * Event Listener - HTTP server for receiving UPnP GENA NOTIFY callbacks
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { EventEmitter } from 'events';
import { networkInterfaces } from 'os';
import type { SubscriptionId, ParsedUpnpEvent } from '../types/events.js';

/**
 * Get the local IP address for event callbacks
 * Prefers public IPv4 addresses over private ones
 */
function getLocalIpAddress(): string {
    const envAddress = process.env.SONOS_LISTENER_IP;
    if (envAddress) {
        return envAddress;
    }

    const nets = networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(nets)) {
        const netInfo = nets[name];
        if (!netInfo) continue;

        for (const net of netInfo) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                addresses.push(net.address);
            }
        }
    }

    // Prefer non-192.168 addresses (public IPs)
    const publicIp = addresses.find(addr => !addr.startsWith('192.168.') && !addr.startsWith('10.'));
    return publicIp || addresses[0] || '127.0.0.1';
}

/**
 * Parse UPnP event XML from NOTIFY request body
 * Format: <?xml version="1.0"?><e:propertyset xmlns:e="urn:schemas-upnp-org:event-1-0"><e:property>...</e:property></e:propertyset>
 */
async function parseEventXml(xml: string): Promise<ParsedUpnpEvent> {
    // Simple XML parsing without external dependencies
    // Extract property values between tags
    const properties: Record<string, string> = {};

    // Match <e:property> blocks
    const propertyRegex = /<e:property>(.*?)<\/e:property>/gs;
    const matches = xml.matchAll(propertyRegex);

    for (const match of matches) {
        const propertyContent = match[1];
        if (!propertyContent) continue;

        // Extract tag name and value: <TagName>value</TagName>
        const tagRegex = /<(\w+)>(.*?)<\/\1>/s;
        const tagMatch = propertyContent.match(tagRegex);

        if (tagMatch && tagMatch[1]) {
            const tagName = tagMatch[1];
            const value = tagMatch[2] || '';
            properties[tagName] = value;
        }
    }

    return {
        properties,
        rawXml: xml,
    };
}

/**
 * Event Listener - HTTP server that receives NOTIFY callbacks from Sonos devices
 */
export class EventListener extends EventEmitter {
    private server: Server | null = null;
    private port: number;
    private ipAddress: string;
    private listening = false;

    constructor(port?: number) {
        super();
        this.port = port || parseInt(process.env.SONOS_LISTENER_PORT || '4000', 10);
        this.ipAddress = getLocalIpAddress();
    }

    /**
     * Get the callback URL that should be used for subscriptions
     */
    getCallbackUrl(): string {
        return `http://${this.ipAddress}:${this.port}/notify`;
    }

    /**
     * Get the listening port
     */
    getPort(): number {
        return this.port;
    }

    /**
     * Get the IP address being used
     */
    getIpAddress(): string {
        return this.ipAddress;
    }

    /**
     * Check if the server is currently listening
     */
    isListening(): boolean {
        return this.listening;
    }

    /**
     * Start the HTTP server to listen for NOTIFY requests
     */
    async start(): Promise<void> {
        if (this.listening) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.server = createServer(this.handleRequest.bind(this));

            this.server.on('error', (err) => {
                this.emit('error', err);
                reject(err);
            });

            this.server.listen(this.port, () => {
                this.listening = true;
                this.emit('listening', { port: this.port, address: this.ipAddress });
                resolve();
            });
        });
    }

    /**
     * Stop the HTTP server
     */
    async stop(): Promise<void> {
        if (!this.listening || !this.server) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.server!.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.listening = false;
                    this.server = null;
                    this.emit('stopped');
                    resolve();
                }
            });
        });
    }

    /**
     * Handle incoming HTTP requests
     */
    private handleRequest(req: IncomingMessage, res: ServerResponse): void {
        const { method, url, headers } = req;

        // Only accept NOTIFY requests to /notify
        if (method !== 'NOTIFY' || url !== '/notify') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        // Extract SID from headers
        const sid = headers.sid as SubscriptionId | undefined;
        if (!sid) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('400 Bad Request - Missing SID header');
            return;
        }

        // Read the request body
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        req.on('end', async () => {
            try {
                const body = Buffer.concat(chunks).toString('utf-8');

                // Parse the event XML
                const parsedEvent = await parseEventXml(body);

                // Emit event with SID and parsed data
                this.emit('notification', {
                    sid,
                    ...parsedEvent,
                });

                // Send success response
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            } catch (error) {
                console.error('Error parsing event XML:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
        });

        req.on('error', (err) => {
            console.error('Request error:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        });
    }
}

// Export a singleton instance
let defaultListener: EventListener | null = null;

/**
 * Get the default event listener instance
 */
export function getDefaultListener(port?: number): EventListener {
    if (!defaultListener) {
        defaultListener = new EventListener(port);
    }
    return defaultListener;
}
