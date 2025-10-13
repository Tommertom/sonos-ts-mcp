import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceRegistry } from '../src/discovery/device-registry';
import type { SonosDiscoveryResponse } from '../src/types/sonos';

describe('DeviceRegistry', () => {
    let registry: DeviceRegistry;

    beforeEach(() => {
        registry = new DeviceRegistry();
    });

    describe('addFromDiscovery', () => {
        it('should add device from discovery response', () => {
            const response: SonosDiscoveryResponse = {
                location: 'http://192.168.1.100:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_000E58C3897E01400::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            const device = registry.addFromDiscovery(response);

            expect(device).toBeDefined();
            expect(device?.ip).toBe('192.168.1.100');
            expect(device?.port).toBe(1400);
            expect(device?.uuid).toContain('RINCON_');
        });

        it('should return null for invalid location', () => {
            const response: SonosDiscoveryResponse = {
                location: 'invalid-url',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:test',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            const device = registry.addFromDiscovery(response);
            expect(device).toBeNull();
        });
    });

    describe('getDevice', () => {
        it('should retrieve device by uuid', () => {
            const response: SonosDiscoveryResponse = {
                location: 'http://192.168.1.100:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_TEST01400::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            registry.addFromDiscovery(response);
            const device = registry.getDevice('RINCON_TEST01400');

            expect(device).toBeDefined();
            expect(device?.uuid).toBe('RINCON_TEST01400');
        });
    });

    describe('getDeviceByIp', () => {
        it('should retrieve device by IP address', () => {
            const response: SonosDiscoveryResponse = {
                location: 'http://192.168.1.100:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_TEST01400::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            registry.addFromDiscovery(response);
            const device = registry.getDeviceByIp('192.168.1.100');

            expect(device).toBeDefined();
            expect(device?.ip).toBe('192.168.1.100');
        });
    });

    describe('getAllDevices', () => {
        it('should return all registered devices', () => {
            const response1: SonosDiscoveryResponse = {
                location: 'http://192.168.1.100:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_TEST01400::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            const response2: SonosDiscoveryResponse = {
                location: 'http://192.168.1.101:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_TEST01401::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            registry.addFromDiscovery(response1);
            registry.addFromDiscovery(response2);

            const devices = registry.getAllDevices();
            expect(devices).toHaveLength(2);
        });
    });

    describe('clear', () => {
        it('should remove all devices', () => {
            const response: SonosDiscoveryResponse = {
                location: 'http://192.168.1.100:1400/xml/device_description.xml',
                server: 'Linux UPnP/1.0 Sonos/1.0',
                usn: 'uuid:RINCON_TEST01400::urn:schemas-upnp-org:service:ZonePlayer:1',
                st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
            };

            registry.addFromDiscovery(response);
            expect(registry.size).toBe(1);

            registry.clear();
            expect(registry.size).toBe(0);
        });
    });
});
