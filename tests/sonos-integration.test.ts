import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Sonos Integration Tests', () => {
    it('should list all sonos devices', async () => {
        const { stdout } = await execAsync('npm run agent -- "list all sonos devices"');
        expect(stdout).toBeTruthy();
        expect(stdout.length).toBeGreaterThan(0);
    }, 30000);

    it('should check if Kitchen device is present', async () => {
        const { stdout } = await execAsync('npm run agent -- "list all sonos devices" --skip-build');
        expect(stdout).toContain('Kitchen');
    }, 30000);

    it('should check if nothing is playing', async () => {
        const { stdout } = await execAsync('npm run agent -- "check if Kitchen is playing anything" --skip-build');
        expect(stdout.toLowerCase()).toMatch(/not playing|stopped|paused/);
    }, 30000);

    it('should set Kitchen volume to 10', async () => {
        const { stdout } = await execAsync('npm run agent -- "set Kitchen volume to 10" --skip-build');
        expect(stdout).toBeTruthy();
    }, 30000);

    it('should verify Kitchen volume is 10', async () => {
        const { stdout } = await execAsync('npm run agent -- "get Kitchen volume" --skip-build');
        expect(stdout).toContain('10');
    }, 30000);

    it('should set Kitchen volume back to 0', async () => {
        const { stdout } = await execAsync('npm run agent -- "set Kitchen volume to 0" --skip-build');
        expect(stdout).toBeTruthy();
    }, 30000);
});
