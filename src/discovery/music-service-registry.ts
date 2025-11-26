import { MusicServicesService } from '../services/music-services.js';
import type { MusicServiceDescriptor } from '../types/music-services.js';
import type { SonosDevice } from '../types/sonos.js';

/**
 * Registry for caching and managing music service descriptors
 * Handles service discovery and lookup by name or ID
 */
export class MusicServiceRegistry {
    private services: Map<number, MusicServiceDescriptor> = new Map();
    private servicesByName: Map<string, MusicServiceDescriptor> = new Map();
    private lastDiscovery: number = 0;
    private discoveryInterval: number = 3600000; // 1 hour
    private device: SonosDevice;

    constructor(device: SonosDevice) {
        this.device = device;
    }

    /**
     * Discover and cache available music services
     * @param force Force rediscovery even if cache is valid
     * @returns Array of service descriptors
     */
    async discoverServices(force: boolean = false): Promise<MusicServiceDescriptor[]> {
        const now = Date.now();

        // Return cached services if recent
        if (!force && this.services.size > 0 && (now - this.lastDiscovery) < this.discoveryInterval) {
            return Array.from(this.services.values());
        }

        try {
            const musicService = new MusicServicesService(this.device);
            const services = await musicService.listAvailableServices();

            // Update cache
            this.services.clear();
            this.servicesByName.clear();

            for (const service of services) {
                this.services.set(service.id, service);
                this.servicesByName.set(service.name.toLowerCase(), service);
            }

            this.lastDiscovery = now;
            return services;
        } catch (error) {
            console.error('Error discovering music services:', error);
            return Array.from(this.services.values()); // Return cached if discovery fails
        }
    }

    /**
     * Get service by ID
     * @param id Service ID (e.g., 52 for Sonos Radio, 254 for TuneIn)
     * @returns Service descriptor or null
     */
    async getServiceById(id: number): Promise<MusicServiceDescriptor | null> {
        // Try cache first
        if (this.services.has(id)) {
            return this.services.get(id)!;
        }

        // Discover if not cached
        await this.discoverServices();
        return this.services.get(id) || null;
    }

    /**
     * Get service by name (case-insensitive)
     * @param name Service name (e.g., 'Sonos Radio', 'TuneIn', 'Spotify')
     * @returns Service descriptor or null
     */
    async getServiceByName(name: string): Promise<MusicServiceDescriptor | null> {
        const normalizedName = name.toLowerCase();

        // Try cache first
        if (this.servicesByName.has(normalizedName)) {
            return this.servicesByName.get(normalizedName)!;
        }

        // Discover if not cached
        await this.discoverServices();
        return this.servicesByName.get(normalizedName) || null;
    }

    /**
     * Search for services by partial name match
     * @param query Search query (case-insensitive)
     * @returns Array of matching service descriptors
     */
    async searchServices(query: string): Promise<MusicServiceDescriptor[]> {
        const normalizedQuery = query.toLowerCase();

        // Ensure we have services cached
        if (this.services.size === 0) {
            await this.discoverServices();
        }

        const matches: MusicServiceDescriptor[] = [];

        for (const service of this.services.values()) {
            if (service.name.toLowerCase().includes(normalizedQuery)) {
                matches.push(service);
            }
        }

        return matches;
    }

    /**
     * Get all cached services
     * @returns Array of all service descriptors
     */
    getAllServices(): MusicServiceDescriptor[] {
        return Array.from(this.services.values());
    }

    /**
     * Check if a specific service is available
     * @param nameOrId Service name or ID
     * @returns True if service is available
     */
    async isServiceAvailable(nameOrId: string | number): Promise<boolean> {
        if (typeof nameOrId === 'number') {
            const service = await this.getServiceById(nameOrId);
            return service !== null;
        } else {
            const service = await this.getServiceByName(nameOrId);
            return service !== null;
        }
    }

    /**
     * Clear the service cache
     */
    clearCache(): void {
        this.services.clear();
        this.servicesByName.clear();
        this.lastDiscovery = 0;
    }

    /**
     * Set discovery interval
     * @param ms Interval in milliseconds
     */
    setDiscoveryInterval(ms: number): void {
        this.discoveryInterval = ms;
    }
}
