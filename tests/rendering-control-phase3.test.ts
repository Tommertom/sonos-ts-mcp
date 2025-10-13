import { describe, it, expect } from 'vitest';
import { RenderingControlService } from '../src/services/rendering-control.js';
import type { SonosDevice } from '../src/types/sonos.js';

describe('RenderingControlService - Phase 3 EQ Features', () => {
    const mockDevice: SonosDevice = {
        uuid: 'RINCON_TEST123',
        ip: '192.168.1.100',
        port: 1400,
        location: 'http://192.168.1.100:1400/xml/device_description.xml',
    };

    it('should have loudness methods', () => {
        const service = new RenderingControlService(mockDevice);
        expect(typeof service.getLoudness).toBe('function');
        expect(typeof service.setLoudness).toBe('function');
    });

    it('should have night mode methods', () => {
        const service = new RenderingControlService(mockDevice);
        expect(typeof service.getNightMode).toBe('function');
        expect(typeof service.setNightMode).toBe('function');
    });

    it('should have dialog level methods', () => {
        const service = new RenderingControlService(mockDevice);
        expect(typeof service.getDialogLevel).toBe('function');
        expect(typeof service.setDialogLevel).toBe('function');
    });

    it('should have subwoofer control methods', () => {
        const service = new RenderingControlService(mockDevice);
        expect(typeof service.getSubGain).toBe('function');
        expect(typeof service.setSubGain).toBe('function');
        expect(typeof service.getSubEnabled).toBe('function');
        expect(typeof service.setSubEnabled).toBe('function');
    });

    it('should have rampToVolume method', () => {
        const service = new RenderingControlService(mockDevice);
        expect(typeof service.rampToVolume).toBe('function');
    });
});
