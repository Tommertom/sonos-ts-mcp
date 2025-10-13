import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    type CallToolRequest,
    type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { SsdpClient } from '../discovery/ssdp-client.js';
import { DeviceRegistry } from '../discovery/device-registry.js';
import { AVTransportService } from '../services/av-transport.js';
import { RenderingControlService } from '../services/rendering-control.js';
import { ZoneGroupTopologyService } from '../services/zone-topology.js';
import { SoapClient } from '../soap/client.js';
import { RequestBuilder } from '../soap/request-builder.js';

export class SonosMcpServer {
    private server: Server;
    private registry: DeviceRegistry;

    constructor() {
        this.server = new Server(
            {
                name: 'sonos-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.registry = new DeviceRegistry();
        this.setupHandlers();
    }

    private setupHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
            tools: [
                {
                    name: 'sonos_discover',
                    description: 'Discover Sonos devices on the network using SSDP',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            timeout: {
                                type: 'number',
                                description: 'Discovery timeout in milliseconds (default: 5000)',
                                default: 5000,
                            },
                        },
                    },
                },
                {
                    name: 'sonos_add_device',
                    description: 'Manually add a Sonos device by IP address (useful when SSDP discovery fails)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            ip: {
                                type: 'string',
                                description: 'IP address of the Sonos device',
                            },
                            port: {
                                type: 'number',
                                description: 'Port number (default: 1400)',
                                default: 1400,
                            },
                            name: {
                                type: 'string',
                                description: 'Optional name for the device',
                            },
                        },
                        required: ['ip'],
                    },
                },
                {
                    name: 'sonos_list_devices',
                    description: 'List all discovered Sonos devices',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'sonos_play',
                    description: 'Start playback on a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_pause',
                    description: 'Pause playback on a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_stop',
                    description: 'Stop playback on a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_next',
                    description: 'Skip to next track',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_previous',
                    description: 'Skip to previous track',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_set_volume',
                    description: 'Set volume on a Sonos device (0-100)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            volume: {
                                type: 'number',
                                description: 'Volume level 0-100',
                                minimum: 0,
                                maximum: 100,
                            },
                        },
                        required: ['deviceId', 'volume'],
                    },
                },
                {
                    name: 'sonos_get_volume',
                    description: 'Get current volume from a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_set_mute',
                    description: 'Mute or unmute a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            mute: {
                                type: 'boolean',
                                description: 'Mute state',
                            },
                        },
                        required: ['deviceId', 'mute'],
                    },
                },
                {
                    name: 'sonos_get_transport_info',
                    description: 'Get current transport state (playing/paused/stopped)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_get_position_info',
                    description: 'Get current track and position information',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_get_zone_groups',
                    description: 'Get zone group topology',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request: CallToolRequest) => this.handleToolCall(request)
        );
    }

    private async handleToolCall(request: CallToolRequest) {
        const { name, arguments: args } = request.params;

        try {
            switch (name) {
                case 'sonos_discover':
                    return await this.handleDiscover(args);
                case 'sonos_add_device':
                    return await this.handleAddDevice(args);
                case 'sonos_list_devices':
                    return this.handleListDevices();
                case 'sonos_play':
                    return await this.handlePlay(args);
                case 'sonos_pause':
                    return await this.handlePause(args);
                case 'sonos_stop':
                    return await this.handleStop(args);
                case 'sonos_next':
                    return await this.handleNext(args);
                case 'sonos_previous':
                    return await this.handlePrevious(args);
                case 'sonos_set_volume':
                    return await this.handleSetVolume(args);
                case 'sonos_get_volume':
                    return await this.handleGetVolume(args);
                case 'sonos_set_mute':
                    return await this.handleSetMute(args);
                case 'sonos_get_transport_info':
                    return await this.handleGetTransportInfo(args);
                case 'sonos_get_position_info':
                    return await this.handleGetPositionInfo(args);
                case 'sonos_get_zone_groups':
                    return await this.handleGetZoneGroups(args);
                default:
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Unknown tool: ${name}`,
                            },
                        ],
                    };
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    private async handleDiscover(args: unknown) {
        const timeout = typeof args === 'object' && args !== null && 'timeout' in args
            ? (args.timeout as number)
            : 5000;

        const client = new SsdpClient();
        const responses = await client.discover(timeout);

        for (const response of responses) {
            this.registry.addFromDiscovery(response);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Discovered ${responses.length} Sonos device(s)`,
                },
            ],
        };
    }

    private async handleAddDevice(args: unknown) {
        if (typeof args !== 'object' || args === null || !('ip' in args)) {
            throw new Error('IP address is required');
        }

        const ip = args.ip as string;
        const port = 'port' in args ? (args.port as number) : 1400;
        const name = 'name' in args ? (args.name as string) : undefined;

        const soapClient = new SoapClient();
        const body = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
        const response = await soapClient.call({
            ip,
            port,
            endpoint: '/MediaRenderer/AVTransport/Control',
            service: 'urn:schemas-upnp-org:service:AVTransport:1',
            action: 'GetTransportInfo',
            body,
        });

        if (!response.success) {
            throw new Error(`Cannot reach Sonos device at ${ip}:${port}`);
        }

        this.registry.addManualDevice(ip, port, name);

        return {
            content: [
                {
                    type: 'text',
                    text: `Successfully added Sonos device at ${ip}`,
                },
            ],
        };
    }

    private handleListDevices() {
        const devices = this.registry.getAllDevices();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(devices, null, 2),
                },
            ],
        };
    }

    private getDevice(deviceId: string) {
        let device = this.registry.getDevice(deviceId);
        if (!device) {
            device = this.registry.getDeviceByIp(deviceId);
        }
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        return device;
    }

    private async handlePlay(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.play();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback started' : 'Failed to start playback',
                },
            ],
        };
    }

    private async handlePause(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.pause();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback paused' : 'Failed to pause playback',
                },
            ],
        };
    }

    private async handleStop(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.stop();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback stopped' : 'Failed to stop playback',
                },
            ],
        };
    }

    private async handleNext(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.next();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Skipped to next track' : 'Failed to skip track',
                },
            ],
        };
    }

    private async handlePrevious(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.previous();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Skipped to previous track' : 'Failed to skip track',
                },
            ],
        };
    }

    private async handleSetVolume(args: unknown) {
        const { deviceId, volume } = args as { deviceId: string; volume: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const success = await service.setVolume(volume);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Volume set to ${volume}` : 'Failed to set volume',
                },
            ],
        };
    }

    private async handleGetVolume(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const volume = await service.getVolume();

        return {
            content: [
                {
                    type: 'text',
                    text: volume !== null ? `Volume: ${volume}` : 'Failed to get volume',
                },
            ],
        };
    }

    private async handleSetMute(args: unknown) {
        const { deviceId, mute } = args as { deviceId: string; mute: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const success = await service.setMute(mute);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Mute ${mute ? 'enabled' : 'disabled'}` : 'Failed to set mute',
                },
            ],
        };
    }

    private async handleGetTransportInfo(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const info = await service.getTransportInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: info ? JSON.stringify(info, null, 2) : 'Failed to get transport info',
                },
            ],
        };
    }

    private async handleGetPositionInfo(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const info = await service.getPositionInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: info ? JSON.stringify(info, null, 2) : 'Failed to get position info',
                },
            ],
        };
    }

    private async handleGetZoneGroups(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new ZoneGroupTopologyService(device);
        const groups = await service.getZoneGroupState();

        return {
            content: [
                {
                    type: 'text',
                    text: groups ? JSON.stringify(groups, null, 2) : 'Failed to get zone groups',
                },
            ],
        };
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
