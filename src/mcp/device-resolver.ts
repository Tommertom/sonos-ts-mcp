import type { DeviceRegistry } from '../discovery/device-registry.js';
import type { SonosDevice } from '../types/sonos.js';

/**
 * Helper class to resolve device identifiers (names, UUIDs, IPs) to actual devices
 */
export class DeviceResolver {
    constructor(private registry: DeviceRegistry) {}

    /**
     * Resolve a device identifier to a SonosDevice
     * Accepts:
     * - UUID (e.g., "RINCON_...")
     * - IP address (e.g., "192.168.1.100")
     * - Device name (e.g., "Kitchen", "Living Room")
     * 
     * @param identifier Device UUID, IP address, or friendly name
     * @returns SonosDevice if found
     * @throws Error if device not found or ambiguous
     */
    resolve(identifier: string): SonosDevice {
        if (!identifier || identifier.trim() === '') {
            throw new Error('Device identifier cannot be empty');
        }

        const normalizedId = identifier.trim();

        // Try exact UUID match first
        let device = this.registry.getDevice(normalizedId);
        if (device) {
            return device;
        }

        // Try IP address match
        device = this.registry.getDeviceByIp(normalizedId);
        if (device) {
            return device;
        }

        // Try case-insensitive name match
        const allDevices = this.registry.getAllDevices();
        const normalizedSearch = normalizedId.toLowerCase();

        // First try exact name match (case-insensitive)
        const exactMatches = allDevices.filter(d => 
            d.name?.toLowerCase() === normalizedSearch
        );

        if (exactMatches.length === 1) {
            const device = exactMatches[0];
            if (device) {
                return device;
            }
        }

        if (exactMatches.length > 1) {
            throw new Error(
                `Multiple devices found with name "${identifier}": ${exactMatches.map(d => `${d.name} (${d.uuid})`).join(', ')}. Please use UUID or IP address instead.`
            );
        }

        // Try partial name match
        const partialMatches = allDevices.filter(d => 
            d.name?.toLowerCase().includes(normalizedSearch)
        );

        if (partialMatches.length === 1) {
            const device = partialMatches[0];
            if (device) {
                return device;
            }
        }

        if (partialMatches.length > 1) {
            throw new Error(
                `Multiple devices found matching "${identifier}": ${partialMatches.map(d => `${d.name} (${d.uuid})`).join(', ')}. Please be more specific.`
            );
        }

        // No matches found
        const availableDevices = allDevices
            .map(d => `- ${d.name || 'Unknown'} (UUID: ${d.uuid}, IP: ${d.ip})`)
            .join('\n');

        throw new Error(
            `Device not found: "${identifier}"\n\nAvailable devices:\n${availableDevices || '(none discovered yet - try running sonos_discover first)'}`
        );
    }

    /**
     * Get a friendly description of a device for response messages
     */
    getDeviceDescription(device: SonosDevice): string {
        return device.name || device.ip || device.uuid;
    }

    /**
     * List all available devices with their identifiers
     */
    listAvailableDevices(): string {
        const devices = this.registry.getAllDevices();
        
        if (devices.length === 0) {
            return 'No devices discovered yet. Run sonos_discover first.';
        }

        return devices
            .map(d => `- ${d.name || 'Unknown'} (UUID: ${d.uuid}, IP: ${d.ip})`)
            .join('\n');
    }
}
