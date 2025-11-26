import type { SonosDevice, SonosDiscoveryResponse } from '../types/sonos.js';
import { TopologyPersistence } from './topology-persistence.js';

export class DeviceRegistry {
    private devices = new Map<string, SonosDevice>();
    private persistence: TopologyPersistence;

    constructor(persistencePath?: string) {
        this.persistence = new TopologyPersistence(persistencePath);
    }

    async loadPersistedDevices(): Promise<void> {
        const devices = await this.persistence.load();
        for (const device of devices) {
            this.devices.set(device.uuid, device);
        }
    }

    async saveTopology(): Promise<void> {
        const devices = this.getAllDevices();
        await this.persistence.save(devices);
    }

    addManualDevice(ip: string, port = 1400, name?: string, uuid?: string): SonosDevice {
        // Use provided UUID if available, otherwise create a fallback UUID
        const deviceUuid = uuid ?? `MANUAL_${ip.replace(/\./g, '_')}`;
        const device: SonosDevice = {
            uuid: deviceUuid,
            ip,
            port,
            location: `http://${ip}:${port}/xml/device_description.xml`,
            name: name || `Sonos at ${ip}`,
        };
        this.devices.set(deviceUuid, device);
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

        // Check if device already exists to preserve details
        const existingDevice = this.devices.get(uuid);
        if (existingDevice) {
            // Update location and network info, but keep other details
            existingDevice.ip = ip ?? '';
            existingDevice.port = port;
            existingDevice.location = response.location;
            return existingDevice;
        }

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

    updateDevice(device: SonosDevice): void {
        if (this.devices.has(device.uuid)) {
            this.devices.set(device.uuid, device);
        }
    }

    clear(): void {
        this.devices.clear();
    }

    get size(): number {
        return this.devices.size;
    }

    getPersistencePath(): string {
        return this.persistence.getPersistencePath();
    }
}
