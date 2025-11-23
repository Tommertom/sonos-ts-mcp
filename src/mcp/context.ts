import { setInterval, clearInterval } from 'node:timers';
import { DeviceRegistry } from '../discovery/device-registry.js';
import { DeviceResolver } from './device-resolver.js';
import { SsdpClient } from '../discovery/ssdp-client.js';
import type { SonosDevice } from '../types/sonos.js';

/**
 * Server context managing shared state and lifecycle
 */
export class ServerContext {
    public readonly registry: DeviceRegistry;
    public readonly resolver: DeviceResolver;
    private discoveryInterval: NodeJS.Timeout | null = null;
    private readonly DISCOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.registry = new DeviceRegistry();
        this.resolver = new DeviceResolver(this.registry);
    }

    /**
     * Resolve a device identifier to a SonosDevice, triggering discovery if needed
     */
    async resolveDevice(identifier: string): Promise<SonosDevice> {
        try {
            return this.resolver.resolve(identifier);
        } catch (error) {
            // If not found, try discovery once
            console.error(`[DeviceResolver] Device "${identifier}" not found, attempting discovery...`);
            await this.performAutoDiscovery();
            // Try resolving again
            return this.resolver.resolve(identifier);
        }
    }

    /**
     * Fetch full device details from device_description.xml
     */
    async fetchDeviceDetails(device: SonosDevice): Promise<void> {
        try {
            const descriptionUrl = `http://${device.ip}:${device.port}/xml/device_description.xml`;
            const response = await fetch(descriptionUrl);
            if (!response.ok) {
                console.warn(`Failed to fetch device details for ${device.ip}:${device.port}`);
                return;
            }

            const xml = await response.text();

            // Extract device information
            const roomNameMatch = /<roomName>([^<]+)<\/roomName>/i.exec(xml);
            const modelNameMatch = /<modelName>([^<]+)<\/modelName>/i.exec(xml);
            const modelNumberMatch = /<modelNumber>([^<]+)<\/modelNumber>/i.exec(xml);
            const softwareVersionMatch = /<softwareVersion>([^<]+)<\/softwareVersion>/i.exec(xml);
            const displayNameMatch = /<displayName>([^<]+)<\/displayName>/i.exec(xml);

            // Update device with details
            if (roomNameMatch?.[1]) {
                device.name = roomNameMatch[1];
            } else if (displayNameMatch?.[1]) {
                device.name = displayNameMatch[1];
            }

            if (modelNameMatch?.[1]) {
                device.modelName = modelNameMatch[1];
            }

            if (modelNumberMatch?.[1]) {
                device.modelNumber = modelNumberMatch[1];
            }

            if (softwareVersionMatch?.[1]) {
                device.softwareVersion = softwareVersionMatch[1];
            }

            this.registry.updateDevice(device);
        } catch (error) {
            console.warn(`Error fetching device details for ${device.ip}:${device.port}:`, error);
        }
    }

    /**
     * Perform automatic discovery
     */
    async performAutoDiscovery(): Promise<void> {
        try {
            console.error('[Auto-Discovery] Starting device discovery...');
            const client = new SsdpClient();
            const responses = await client.discover(5000);

            for (const response of responses) {
                const device = this.registry.addFromDiscovery(response);
                if (device) {
                    await this.fetchDeviceDetails(device);
                }
            }

            const devices = this.registry.getAllDevices();
            console.error(`[Auto-Discovery] Found ${responses.length} device(s), total registered: ${devices.length}`);
        } catch (error) {
            console.error('[Auto-Discovery] Error during discovery:', error);
        }
    }

    /**
     * Start periodic discovery
     */
    startPeriodicDiscovery(): void {
        // Perform initial discovery
        this.performAutoDiscovery().catch((error) => {
            console.error('[Auto-Discovery] Initial discovery failed:', error);
        });

        // Set up periodic discovery every 5 minutes
        this.discoveryInterval = setInterval(() => {
            this.performAutoDiscovery().catch((error) => {
                console.error('[Auto-Discovery] Periodic discovery failed:', error);
            });
        }, this.DISCOVERY_INTERVAL_MS);

        console.error(`[Auto-Discovery] Periodic discovery started (every ${this.DISCOVERY_INTERVAL_MS / 1000}s)`);
    }

    /**
     * Stop periodic discovery
     */
    stopPeriodicDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
            console.error('[Auto-Discovery] Periodic discovery stopped');
        }
    }

    /**
     * Shutdown context and cleanup resources
     */
    shutdown(): void {
        this.stopPeriodicDiscovery();
    }
}
