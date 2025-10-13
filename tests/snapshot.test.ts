import { describe, it, expect } from 'vitest';
import { SnapshotService } from '../src/services/snapshot.js';
import type { SonosDevice } from '../src/types/sonos.js';

describe('SnapshotService', () => {
    const mockDevice: SonosDevice = {
        uuid: 'RINCON_TEST123',
        ip: '192.168.1.100',
        port: 1400,
        location: 'http://192.168.1.100:1400/xml/device_description.xml',
    };

    it('should create snapshot service instance', () => {
        const service = new SnapshotService(mockDevice);
        expect(service).toBeDefined();
    });

    it('should have snapshot method', () => {
        const service = new SnapshotService(mockDevice);
        expect(typeof service.snapshot).toBe('function');
    });

    it('should have restore method', () => {
        const service = new SnapshotService(mockDevice);
        expect(typeof service.restore).toBe('function');
    });

    it('should have withSnapshot method', () => {
        const service = new SnapshotService(mockDevice);
        expect(typeof service.withSnapshot).toBe('function');
    });
});
