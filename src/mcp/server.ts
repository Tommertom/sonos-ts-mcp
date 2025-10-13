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
                {
                    name: 'sonos_get_queue',
                    description: 'Get the current playback queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (0-based, default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of tracks to retrieve (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_add_to_queue',
                    description: 'Add a URI to the playback queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            uri: {
                                type: 'string',
                                description: 'URI to add to queue (e.g., x-file-cifs://..., x-sonos-spotify:...)',
                            },
                            metadata: {
                                type: 'string',
                                description: 'Optional DIDL-Lite metadata XML',
                            },
                            position: {
                                type: 'number',
                                description: 'Insert at specific position (1-based), or append if not specified',
                            },
                            playNext: {
                                type: 'boolean',
                                description: 'Play this track next',
                                default: false,
                            },
                        },
                        required: ['deviceId', 'uri'],
                    },
                },
                {
                    name: 'sonos_remove_from_queue',
                    description: 'Remove a track from the queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            position: {
                                type: 'number',
                                description: 'Track position to remove (1-based)',
                            },
                        },
                        required: ['deviceId', 'position'],
                    },
                },
                {
                    name: 'sonos_clear_queue',
                    description: 'Remove all tracks from the queue',
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
                    name: 'sonos_play_from_queue',
                    description: 'Play from the queue starting at a specific position',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            position: {
                                type: 'number',
                                description: 'Track position to start playing from (1-based)',
                            },
                        },
                        required: ['deviceId', 'position'],
                    },
                },
                {
                    name: 'sonos_save_queue',
                    description: 'Save the current queue as a Sonos playlist',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            title: {
                                type: 'string',
                                description: 'Playlist title',
                            },
                        },
                        required: ['deviceId', 'title'],
                    },
                },
                {
                    name: 'sonos_set_shuffle',
                    description: 'Enable or disable shuffle mode',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            shuffle: {
                                type: 'boolean',
                                description: 'Enable shuffle',
                            },
                        },
                        required: ['deviceId', 'shuffle'],
                    },
                },
                {
                    name: 'sonos_set_repeat',
                    description: 'Set repeat mode',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            mode: {
                                type: 'string',
                                description: 'Repeat mode',
                                enum: ['off', 'all', 'one'],
                            },
                        },
                        required: ['deviceId', 'mode'],
                    },
                },
                {
                    name: 'sonos_set_crossfade',
                    description: 'Enable or disable crossfade',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable crossfade',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_get_playback_state',
                    description: 'Get current playback state including shuffle, repeat, and crossfade',
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
                case 'sonos_get_queue':
                    return await this.handleGetQueue(args);
                case 'sonos_add_to_queue':
                    return await this.handleAddToQueue(args);
                case 'sonos_remove_from_queue':
                    return await this.handleRemoveFromQueue(args);
                case 'sonos_clear_queue':
                    return await this.handleClearQueue(args);
                case 'sonos_play_from_queue':
                    return await this.handlePlayFromQueue(args);
                case 'sonos_save_queue':
                    return await this.handleSaveQueue(args);
                case 'sonos_set_shuffle':
                    return await this.handleSetShuffle(args);
                case 'sonos_set_repeat':
                    return await this.handleSetRepeat(args);
                case 'sonos_set_crossfade':
                    return await this.handleSetCrossfade(args);
                case 'sonos_get_playback_state':
                    return await this.handleGetPlaybackState(args);
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

    private async handleGetQueue(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const queue = await service.getQueue(startIndex, count);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(queue, null, 2),
                },
            ],
        };
    }

    private async handleAddToQueue(args: unknown) {
        const { deviceId, uri, metadata, position, playNext = false } = args as {
            deviceId: string;
            uri: string;
            metadata?: string;
            position?: number;
            playNext?: boolean;
        };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const trackNumber = await service.addToQueue({ uri, metadata, position, playNext });

        return {
            content: [
                {
                    type: 'text',
                    text: `Added to queue at position ${trackNumber}`,
                },
            ],
        };
    }

    private async handleRemoveFromQueue(args: unknown) {
        const { deviceId, position } = args as { deviceId: string; position: number };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.removeFromQueue(position);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Removed track at position ${position}`
                        : 'Failed to remove track from queue',
                },
            ],
        };
    }

    private async handleClearQueue(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.removeAllTracksFromQueue();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Queue cleared' : 'Failed to clear queue',
                },
            ],
        };
    }

    private async handlePlayFromQueue(args: unknown) {
        const { deviceId, position } = args as { deviceId: string; position: number };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.playFromQueue(position);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Playing from queue position ${position}`
                        : 'Failed to play from queue',
                },
            ],
        };
    }

    private async handleSaveQueue(args: unknown) {
        const { deviceId, title } = args as { deviceId: string; title: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const playlistId = await service.saveQueue(title);

        return {
            content: [
                {
                    type: 'text',
                    text: `Queue saved as playlist "${title}" (ID: ${playlistId})`,
                },
            ],
        };
    }

    private async handleSetShuffle(args: unknown) {
        const { deviceId, shuffle } = args as { deviceId: string; shuffle: boolean };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setShuffle(shuffle);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Shuffle ${shuffle ? 'enabled' : 'disabled'}`
                        : 'Failed to set shuffle',
                },
            ],
        };
    }

    private async handleSetRepeat(args: unknown) {
        const { deviceId, mode } = args as { deviceId: string; mode: 'off' | 'all' | 'one' };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setRepeat(mode);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Repeat set to: ${mode}` : 'Failed to set repeat mode',
                },
            ],
        };
    }

    private async handleSetCrossfade(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setCrossFade(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Crossfade ${enabled ? 'enabled' : 'disabled'}`
                        : 'Failed to set crossfade',
                },
            ],
        };
    }

    private async handleGetPlaybackState(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);

        const [shuffle, repeat, crossfade, transportInfo] = await Promise.all([
            service.getShuffle(),
            service.getRepeat(),
            service.getCrossFade(),
            service.getTransportInfo(),
        ]);

        const state = {
            shuffle,
            repeat,
            crossfade,
            playbackState: transportInfo?.state,
            speed: transportInfo?.speed,
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(state, null, 2),
                },
            ],
        };
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
