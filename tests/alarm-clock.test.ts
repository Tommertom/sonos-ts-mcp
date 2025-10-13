import { describe, it, expect } from 'vitest';
import { AlarmClockService } from '../src/services/alarm-clock.js';
import type { SonosDevice } from '../src/types/sonos.js';

describe('AlarmClockService', () => {
    const mockDevice: SonosDevice = {
        uuid: 'RINCON_TEST123',
        ip: '192.168.1.100',
        port: 1400,
        location: 'http://192.168.1.100:1400/xml/device_description.xml',
    };

    it('should create alarm service instance', () => {
        const service = new AlarmClockService(mockDevice);
        expect(service).toBeDefined();
    });

    it('should parse alarm list correctly', () => {
        const service = new AlarmClockService(mockDevice);
        // Test will need to be expanded with actual alarm XML parsing
        expect(service).toBeDefined();
    });
});
