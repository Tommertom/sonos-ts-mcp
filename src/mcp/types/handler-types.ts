import type { DeviceRegistry } from '../../discovery/device-registry.js';
import type { DeviceResolver } from '../device-resolver.js';
import type { SonosDevice } from '../../types/sonos.js';

/**
 * Server context shared across all handlers
 */
export interface ServerContext {
    registry: DeviceRegistry;
    resolver: DeviceResolver;
    resolveDevice(identifier: string): Promise<SonosDevice>;
    fetchDeviceDetails(device: SonosDevice): Promise<void>;
    performAutoDiscovery(): Promise<void>;
    startPeriodicDiscovery(): void;
    stopPeriodicDiscovery(): void;
    shutdown(): void;
}

/**
 * Standard MCP tool response
 */
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
    [key: string]: unknown;
}

/**
 * Handler function signature
 */
export type ToolHandler = (args: unknown, context: ServerContext) => Promise<ToolResponse>;

/**
 * Tool handler map
 */
export type ToolHandlerMap = Record<string, ToolHandler>;
