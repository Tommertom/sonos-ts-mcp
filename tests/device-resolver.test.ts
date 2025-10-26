import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { DeviceResolver } from '../src/mcp/device-resolver.js';

describe('DeviceResolver', () => {
    let registry: DeviceRegistry;
    let resolver: DeviceResolver;

    beforeEach(() => {
        registry = new DeviceRegistry();
        resolver = new DeviceResolver(registry);

        // Add some test devices
        registry.addManualDevice('192.168.1.10', 1400, 'Kitchen', 'RINCON_000001');
        registry.addManualDevice('192.168.1.11', 1400, 'Living Room', 'RINCON_000002');
        registry.addManualDevice('192.168.1.12', 1400, 'Bedroom', 'RINCON_000003');
        registry.addManualDevice('192.168.1.13', 1400, 'Bedroom 2', 'RINCON_000004');
    });

    describe('resolve', () => {
        it('should resolve by exact UUID', () => {
            const device = resolver.resolve('RINCON_000001');
            expect(device.uuid).toBe('RINCON_000001');
            expect(device.name).toBe('Kitchen');
        });

        it('should resolve by IP address', () => {
            const device = resolver.resolve('192.168.1.11');
            expect(device.uuid).toBe('RINCON_000002');
            expect(device.name).toBe('Living Room');
        });

        it('should resolve by exact name (case-insensitive)', () => {
            const device = resolver.resolve('kitchen');
            expect(device.uuid).toBe('RINCON_000001');
            expect(device.name).toBe('Kitchen');
        });

        it('should resolve by exact name with different case', () => {
            const device = resolver.resolve('LIVING ROOM');
            expect(device.uuid).toBe('RINCON_000002');
            expect(device.name).toBe('Living Room');
        });

        it('should resolve by partial name match', () => {
            const device = resolver.resolve('Living');
            expect(device.uuid).toBe('RINCON_000002');
            expect(device.name).toBe('Living Room');
        });

        it('should throw error for ambiguous partial matches', () => {
            // "Bedroom" should match both "Bedroom" and "Bedroom 2"
            // But since "Bedroom" is an exact match, it should resolve to that one
            const device = resolver.resolve('Bedroom');
            expect(device.uuid).toBe('RINCON_000003');
        });

        it('should throw error for truly ambiguous partial matches', () => {
            // "Bed" should match both "Bedroom" and "Bedroom 2" without exact match
            expect(() => resolver.resolve('Bed')).toThrow(/Multiple devices found/);
        });

        it('should throw error for ambiguous exact matches', () => {
            // Add another device with same name
            registry.addManualDevice('192.168.1.14', 1400, 'Kitchen', 'RINCON_000005');
            
            expect(() => resolver.resolve('Kitchen')).toThrow(/Multiple devices found/);
        });

        it('should throw error for non-existent device', () => {
            expect(() => resolver.resolve('Garage')).toThrow(/Device not found/);
        });

        it('should throw error for empty identifier', () => {
            expect(() => resolver.resolve('')).toThrow(/cannot be empty/);
        });

        it('should handle whitespace in identifiers', () => {
            const device = resolver.resolve('  Kitchen  ');
            expect(device.uuid).toBe('RINCON_000001');
        });
    });

    describe('getDeviceDescription', () => {
        it('should return device name when available', () => {
            const device = registry.getDevice('RINCON_000001');
            expect(device).toBeDefined();
            if (device) {
                const description = resolver.getDeviceDescription(device);
                expect(description).toBe('Kitchen');
            }
        });

        it('should return IP when name not available', () => {
            const device = registry.addManualDevice('192.168.1.99', 1400, undefined, 'RINCON_000099');
            const description = resolver.getDeviceDescription(device);
            // addManualDevice sets a default name "Sonos at {ip}" when no name provided
            expect(description).toBe('Sonos at 192.168.1.99');
        });
    });

    describe('listAvailableDevices', () => {
        it('should list all devices with their identifiers', () => {
            const list = resolver.listAvailableDevices();
            expect(list).toContain('Kitchen');
            expect(list).toContain('RINCON_000001');
            expect(list).toContain('192.168.1.10');
            expect(list).toContain('Living Room');
        });

        it('should return helpful message when no devices', () => {
            const emptyRegistry = new DeviceRegistry();
            const emptyResolver = new DeviceResolver(emptyRegistry);
            const list = emptyResolver.listAvailableDevices();
            expect(list).toContain('No devices discovered');
        });
    });
});
