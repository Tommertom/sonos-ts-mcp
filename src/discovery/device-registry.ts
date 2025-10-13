import type { SonosDevice, SonosDiscoveryResponse } from '../types/sonos.js';

export class DeviceRegistry {
    private devices = new Map<string, SonosDevice>();

    addManualDevice(ip: string, port = 1400, name?: string): SonosDevice {
        const uuid = `MANUAL_${ip.replace(/\./g, '_')}`;
        const device: SonosDevice = {
            uuid,
            ip,
            port,
            location: `http://${ip}:${port}/xml/device_description.xml`,
            name: name || `Sonos at ${ip}`,
        };
        this.devices.set(uuid, device);
        return device;
    }

    addFromDiscovery(response: SonosDiscoveryResponse): SonosDevice | null {
        const urlMatch = /^https?:\/\/([^:]+):(\d+)/.exec(response.location);
        if (!urlMatch) {
            return null;
        }

        const ip = urlMatch[1];
        const port = parseInt(urlMatch[2] ?? '1400', 10);
        const uuidMatch = /uuid:([^:]+)/.exec(response.usn);
        const uuid = uuidMatch?.[1] ?? `${ip}:${port}`;

        const device: SonosDevice = {
            uuid,
            ip: ip ?? '',
            port,
            location: response.location,
        };

        this.devices.set(uuid, device);
        return device;
    }

    getDevice(uuid: string): SonosDevice | undefined {
        return this.devices.get(uuid);
    }

    getDeviceByIp(ip: string): SonosDevice | undefined {
        return Array.from(this.devices.values()).find((d) => d.ip === ip);
    }

    getAllDevices(): SonosDevice[] {
        return Array.from(this.devices.values());
    }

    removeDevice(uuid: string): boolean {
        return this.devices.delete(uuid);
    }

    clear(): void {
        this.devices.clear();
    }

    get size(): number {
        return this.devices.size;
    }
}
