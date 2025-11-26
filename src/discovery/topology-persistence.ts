import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SonosDevice } from '../types/sonos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TopologyData {
    version: string;
    lastUpdated: string;
    devices: SonosDevice[];
}

export class TopologyPersistence {
    private readonly persistencePath: string;
    private readonly defaultData: TopologyData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        devices: [],
    };

    constructor(persistencePath?: string) {
        this.persistencePath = persistencePath ?? join(__dirname, '..', '..', 'mcp_data', 'sonos_topology.json');
    }

    async ensureDirectoryExists(): Promise<void> {
        const dir = dirname(this.persistencePath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async load(): Promise<SonosDevice[]> {
        try {
            await this.ensureDirectoryExists();
            const data = await fs.readFile(this.persistencePath, 'utf-8');
            const topology: TopologyData = JSON.parse(data);
            console.error(`[Persistence] Loaded ${topology.devices.length} device(s) from ${this.persistencePath}`);
            console.error(`[Persistence] Last updated: ${topology.lastUpdated}`);
            return topology.devices;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                console.error(`[Persistence] No existing topology found at ${this.persistencePath}`);
                return [];
            }
            console.error(`[Persistence] Error loading topology:`, error);
            return [];
        }
    }

    async save(devices: SonosDevice[]): Promise<void> {
        try {
            await this.ensureDirectoryExists();
            const topology: TopologyData = {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                devices,
            };
            await fs.writeFile(this.persistencePath, JSON.stringify(topology, null, 2), 'utf-8');
            console.error(`[Persistence] Saved ${devices.length} device(s) to ${this.persistencePath}`);
        } catch (error) {
            console.error(`[Persistence] Error saving topology:`, error);
        }
    }

    getPersistencePath(): string {
        return this.persistencePath;
    }
}
