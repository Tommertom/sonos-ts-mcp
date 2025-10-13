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
import { ContentDirectoryService } from '../services/content-directory.js';
import { AlarmClockService } from '../services/alarm-clock.js';
import { SnapshotService } from '../services/snapshot.js';
import { SoapClient } from '../soap/client.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { DidlObject } from '../didl/didl-object.js';
import { getDefaultManager } from '../events/subscription-manager.js';

export class SonosMcpServer {
    private server: Server;
    private registry: DeviceRegistry;

    constructor() {
        this.server = new Server(
            {
                name: 'sonos-mcp-server',
                version: '1.3.0',
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
                // Group Management Tools
                {
                    name: 'sonos_join_group',
                    description: 'Join this device to another device\'s group',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address to join from',
                            },
                            masterDeviceId: {
                                type: 'string',
                                description: 'Master/coordinator device UUID or IP address to join to',
                            },
                        },
                        required: ['deviceId', 'masterDeviceId'],
                    },
                },
                {
                    name: 'sonos_unjoin',
                    description: 'Remove this device from its current group (make it standalone)',
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
                // Music Library Browsing Tools
                {
                    name: 'sonos_browse_artists',
                    description: 'Browse artists in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_albums',
                    description: 'Browse albums in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_tracks',
                    description: 'Browse tracks in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_genres',
                    description: 'Browse genres in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_playlists',
                    description: 'Browse Sonos playlists',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_search_library',
                    description: 'Search the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            searchType: {
                                type: 'string',
                                description: 'Type of search',
                                enum: ['artists', 'albums', 'tracks', 'genres'],
                            },
                            searchTerm: {
                                type: 'string',
                                description: 'Search term',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId', 'searchType', 'searchTerm'],
                    },
                },
                {
                    name: 'sonos_browse_item',
                    description: 'Browse a specific music library item (e.g., get albums for an artist, tracks for an album)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            objectId: {
                                type: 'string',
                                description: 'Object ID to browse (from a previous browse or search result)',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId', 'objectId'],
                    },
                },
                // Phase 3 Features - EQ Controls
                {
                    name: 'sonos_set_bass',
                    description: 'Set bass level (-10 to 10)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            bass: {
                                type: 'number',
                                description: 'Bass level (-10 to 10)',
                                minimum: -10,
                                maximum: 10,
                            },
                        },
                        required: ['deviceId', 'bass'],
                    },
                },
                {
                    name: 'sonos_set_treble',
                    description: 'Set treble level (-10 to 10)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            treble: {
                                type: 'number',
                                description: 'Treble level (-10 to 10)',
                                minimum: -10,
                                maximum: 10,
                            },
                        },
                        required: ['deviceId', 'treble'],
                    },
                },
                {
                    name: 'sonos_set_loudness',
                    description: 'Enable or disable loudness compensation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable loudness',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_get_eq',
                    description: 'Get current EQ settings (bass, treble, loudness)',
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
                    name: 'sonos_set_night_mode',
                    description: 'Set night mode for home theater devices (reduces loud sounds)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable night mode',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_set_dialog_mode',
                    description: 'Set dialog enhancement for home theater devices (enhances speech clarity)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable dialog enhancement',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                // Phase 3 Features - Sleep Timer
                {
                    name: 'sonos_set_sleep_timer',
                    description: 'Set sleep timer to automatically stop playback after a duration',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            duration: {
                                type: 'string',
                                description: 'Duration in HH:MM:SS format (e.g., "00:30:00" for 30 minutes)',
                            },
                        },
                        required: ['deviceId', 'duration'],
                    },
                },
                {
                    name: 'sonos_get_sleep_timer',
                    description: 'Get remaining sleep timer duration',
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
                    name: 'sonos_cancel_sleep_timer',
                    description: 'Cancel the sleep timer',
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
                // Phase 3 Features - Alarms
                {
                    name: 'sonos_list_alarms',
                    description: 'List all configured alarms',
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
                    name: 'sonos_create_alarm',
                    description: 'Create a new alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            startTime: {
                                type: 'string',
                                description: 'Start time in HH:MM:SS format (e.g., "07:00:00")',
                            },
                            recurrence: {
                                type: 'string',
                                description: 'DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456 (0=Sunday)',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable alarm (default: true)',
                                default: true,
                            },
                            volume: {
                                type: 'number',
                                description: 'Alarm volume (0-100, default: 25)',
                                minimum: 0,
                                maximum: 100,
                                default: 25,
                            },
                            duration: {
                                type: 'string',
                                description: 'Duration in HH:MM:SS (default: 02:00:00)',
                                default: '02:00:00',
                            },
                        },
                        required: ['deviceId', 'startTime', 'recurrence'],
                    },
                },
                {
                    name: 'sonos_update_alarm',
                    description: 'Update an existing alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            alarmId: {
                                type: 'string',
                                description: 'Alarm ID to update',
                            },
                            startTime: {
                                type: 'string',
                                description: 'Start time in HH:MM:SS format',
                            },
                            recurrence: {
                                type: 'string',
                                description: 'DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable/disable alarm',
                            },
                            volume: {
                                type: 'number',
                                description: 'Alarm volume (0-100)',
                                minimum: 0,
                                maximum: 100,
                            },
                        },
                        required: ['deviceId', 'alarmId'],
                    },
                },
                {
                    name: 'sonos_delete_alarm',
                    description: 'Delete an alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            alarmId: {
                                type: 'string',
                                description: 'Alarm ID to delete',
                            },
                        },
                        required: ['deviceId', 'alarmId'],
                    },
                },
                // Phase 3 Features - Snapshot/Restore
                {
                    name: 'sonos_snapshot',
                    description: 'Take a snapshot of current device state (playback, volume, EQ)',
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
                    name: 'sonos_restore_snapshot',
                    description: 'Restore a previously saved snapshot',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            snapshot: {
                                type: 'string',
                                description: 'JSON string of the snapshot to restore',
                            },
                            fade: {
                                type: 'boolean',
                                description: 'Fade volume up on restore (default: false)',
                                default: false,
                            },
                        },
                        required: ['deviceId', 'snapshot'],
                    },
                },
                // Phase 3 Features - Party Mode
                {
                    name: 'sonos_party_mode',
                    description: 'Join all devices to this device (party mode)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address (coordinator)',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                // Phase 4 Features - Event Subscriptions
                {
                    name: 'sonos_subscribe_events',
                    description: 'Subscribe to real-time events from a Sonos device service (AVTransport, RenderingControl, etc.)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            service: {
                                type: 'string',
                                description: 'Service name to subscribe to',
                                enum: ['AVTransport', 'RenderingControl', 'Queue', 'ZoneGroupTopology', 'AlarmClock'],
                            },
                            timeout: {
                                type: 'number',
                                description: 'Subscription timeout in seconds (default: 1800 = 30 minutes)',
                                default: 1800,
                            },
                        },
                        required: ['deviceId', 'service'],
                    },
                },
                {
                    name: 'sonos_unsubscribe_events',
                    description: 'Unsubscribe from a specific event subscription',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device UUID or IP address',
                            },
                            subscriptionId: {
                                type: 'string',
                                description: 'Subscription ID (SID) to unsubscribe from',
                            },
                        },
                        required: ['deviceId', 'subscriptionId'],
                    },
                },
                {
                    name: 'sonos_unsubscribe_all',
                    description: 'Unsubscribe from all event subscriptions for a specific device',
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
                    name: 'sonos_list_subscriptions',
                    description: 'List all active event subscriptions for a device',
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
                case 'sonos_join_group':
                    return await this.handleJoinGroup(args);
                case 'sonos_unjoin':
                    return await this.handleUnjoin(args);
                case 'sonos_browse_artists':
                    return await this.handleBrowseArtists(args);
                case 'sonos_browse_albums':
                    return await this.handleBrowseAlbums(args);
                case 'sonos_browse_tracks':
                    return await this.handleBrowseTracks(args);
                case 'sonos_browse_genres':
                    return await this.handleBrowseGenres(args);
                case 'sonos_browse_playlists':
                    return await this.handleBrowsePlaylists(args);
                case 'sonos_search_library':
                    return await this.handleSearchLibrary(args);
                case 'sonos_browse_item':
                    return await this.handleBrowseItem(args);
                // Phase 3 - EQ Controls
                case 'sonos_set_bass':
                    return await this.handleSetBass(args);
                case 'sonos_set_treble':
                    return await this.handleSetTreble(args);
                case 'sonos_set_loudness':
                    return await this.handleSetLoudness(args);
                case 'sonos_get_eq':
                    return await this.handleGetEQ(args);
                case 'sonos_set_night_mode':
                    return await this.handleSetNightMode(args);
                case 'sonos_set_dialog_mode':
                    return await this.handleSetDialogMode(args);
                // Phase 3 - Sleep Timer
                case 'sonos_set_sleep_timer':
                    return await this.handleSetSleepTimer(args);
                case 'sonos_get_sleep_timer':
                    return await this.handleGetSleepTimer(args);
                case 'sonos_cancel_sleep_timer':
                    return await this.handleCancelSleepTimer(args);
                // Phase 3 - Alarms
                case 'sonos_list_alarms':
                    return await this.handleListAlarms(args);
                case 'sonos_create_alarm':
                    return await this.handleCreateAlarm(args);
                case 'sonos_update_alarm':
                    return await this.handleUpdateAlarm(args);
                case 'sonos_delete_alarm':
                    return await this.handleDeleteAlarm(args);
                // Phase 3 - Snapshot/Restore
                case 'sonos_snapshot':
                    return await this.handleSnapshot(args);
                case 'sonos_restore_snapshot':
                    return await this.handleRestoreSnapshot(args);
                // Phase 3 - Party Mode
                case 'sonos_party_mode':
                    return await this.handlePartyMode(args);
                // Phase 4 - Event Subscriptions
                case 'sonos_subscribe_events':
                    return await this.handleSubscribeEvents(args);
                case 'sonos_unsubscribe_events':
                    return await this.handleUnsubscribeEvents(args);
                case 'sonos_unsubscribe_all':
                    return await this.handleUnsubscribeAll(args);
                case 'sonos_list_subscriptions':
                    return await this.handleListSubscriptions(args);
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

        const devices = this.registry.getAllDevices();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: `Discovered ${responses.length} Sonos device(s)`,
                        devices: devices,
                    }, null, 2),
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
            metadata?: unknown;
            position?: number;
            playNext?: boolean;
        };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        // metadata can be a plain object, string, or DidlObject - the service handles all cases
        const trackNumber = await service.addToQueue({
            uri,
            metadata: metadata as string | DidlObject | undefined,
            position,
            playNext
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        position: trackNumber,
                        message: `Added to queue at position ${trackNumber}`,
                    }),
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
                    text: JSON.stringify({
                        objectId: playlistId,
                        title,
                        message: `Queue saved as playlist "${title}" (ID: ${playlistId})`,
                    }),
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

    // Group Management Handlers
    private async handleJoinGroup(args: unknown) {
        const { deviceId, masterDeviceId } = args as { deviceId: string; masterDeviceId: string };
        const device = this.getDevice(deviceId);
        const masterDevice = this.getDevice(masterDeviceId);

        const service = new ZoneGroupTopologyService(device);
        const success = await service.join(masterDevice.uuid);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Device ${device.name || device.ip} joined group with ${masterDevice.name || masterDevice.ip}`
                        : 'Failed to join group',
                },
            ],
        };
    }

    private async handleUnjoin(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new ZoneGroupTopologyService(device);
        const success = await service.unjoin();

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Device ${device.name || device.ip} removed from group`
                        : 'Failed to unjoin from group',
                },
            ],
        };
    }

    // Music Library Browsing Handlers
    private async handleBrowseArtists(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getArtists({ startIndex, count });

        const artists = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${result.total} artists (showing ${result.returned}):\n\n${JSON.stringify(artists, null, 2)}`,
                },
            ],
        };
    }

    private async handleBrowseAlbums(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getAlbums({ startIndex, count });

        const albums = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${result.total} albums (showing ${result.returned}):\n\n${JSON.stringify(albums, null, 2)}`,
                },
            ],
        };
    }

    private async handleBrowseTracks(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getTracks({ startIndex, count });

        const tracks = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            uri: item.resources[0]?.uri,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${result.total} tracks (showing ${result.returned}):\n\n${JSON.stringify(tracks, null, 2)}`,
                },
            ],
        };
    }

    private async handleBrowseGenres(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getGenres({ startIndex, count });

        const genres = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${result.total} genres (showing ${result.returned}):\n\n${JSON.stringify(genres, null, 2)}`,
                },
            ],
        };
    }

    private async handleBrowsePlaylists(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getSonosPlaylists({ startIndex, count });

        const playlists = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Found ${result.total} playlists (showing ${result.returned}):\n\n${JSON.stringify(playlists, null, 2)}`,
                },
            ],
        };
    }

    private async handleSearchLibrary(args: unknown) {
        const { deviceId, searchType, searchTerm, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            searchType: 'artists' | 'albums' | 'tracks' | 'genres';
            searchTerm: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.search(searchType, searchTerm, { startIndex, count });

        const items = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Search for "${searchTerm}" in ${searchType} found ${result.total} results (showing ${result.returned}):\n\n${JSON.stringify(items, null, 2)}`,
                },
            ],
        };
    }

    private async handleBrowseItem(args: unknown) {
        const { deviceId, objectId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            objectId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.browse(objectId, { startIndex, count });

        const items = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            uri: item.resources[0]?.uri,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Browsing ${objectId} found ${result.total} items (showing ${result.returned}):\n\n${JSON.stringify(items, null, 2)}`,
                },
            ],
        };
    }

    // Phase 3 Handlers - EQ Controls
    private async handleSetBass(args: unknown) {
        const { deviceId, bass } = args as { deviceId: string; bass: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setBass(bass);

        return {
            content: [
                {
                    type: 'text',
                    text: `Set bass to ${bass}`,
                },
            ],
        };
    }

    private async handleSetTreble(args: unknown) {
        const { deviceId, treble } = args as { deviceId: string; treble: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setTreble(treble);

        return {
            content: [
                {
                    type: 'text',
                    text: `Set treble to ${treble}`,
                },
            ],
        };
    }

    private async handleSetLoudness(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setLoudness(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Loudness ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleGetEQ(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);

        const bass = await service.getBass();
        const treble = await service.getTreble();
        const loudness = await service.getLoudness();

        return {
            content: [
                {
                    type: 'text',
                    text: `EQ Settings:\nBass: ${bass}\nTreble: ${treble}\nLoudness: ${loudness ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleSetNightMode(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setNightMode(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Night mode ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleSetDialogMode(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setDialogLevel(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Dialog enhancement ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    // Phase 3 Handlers - Sleep Timer
    private async handleSetSleepTimer(args: unknown) {
        const { deviceId, duration } = args as { deviceId: string; duration: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        await service.configureSleepTimer(duration);

        return {
            content: [
                {
                    type: 'text',
                    text: `Sleep timer set to ${duration}`,
                },
            ],
        };
    }

    private async handleGetSleepTimer(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const remaining = await service.getSleepTimerRemaining();

        return {
            content: [
                {
                    type: 'text',
                    text: remaining ? `Sleep timer: ${remaining} remaining` : 'No sleep timer active',
                },
            ],
        };
    }

    private async handleCancelSleepTimer(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        await service.cancelSleepTimer();

        return {
            content: [
                {
                    type: 'text',
                    text: 'Sleep timer cancelled',
                },
            ],
        };
    }

    // Phase 3 Handlers - Alarms
    private async handleListAlarms(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        const alarms = await service.listAlarms();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ alarms }, null, 2),
                },
            ],
        };
    }

    private async handleCreateAlarm(args: unknown) {
        const { deviceId, startTime, recurrence, enabled = true, volume = 25, duration = '02:00:00' } = args as {
            deviceId: string;
            startTime: string;
            recurrence: string;
            enabled?: boolean;
            volume?: number;
            duration?: string;
        };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        const alarmId = await service.createAlarm({
            startTime,
            recurrence,
            enabled,
            volume,
            duration,
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ alarmId }, null, 2),
                },
            ],
        };
    }

    private async handleUpdateAlarm(args: unknown) {
        const { deviceId, alarmId, ...updates } = args as {
            deviceId: string;
            alarmId: string;
            startTime?: string;
            recurrence?: string;
            enabled?: boolean;
            volume?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        await service.updateAlarm(alarmId, updates);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, alarmId }, null, 2),
                },
            ],
        };
    }

    private async handleDeleteAlarm(args: unknown) {
        const { deviceId, alarmId } = args as { deviceId: string; alarmId: string };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        await service.destroyAlarm(alarmId);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, alarmId }, null, 2),
                },
            ],
        };
    }

    // Phase 3 Handlers - Snapshot/Restore
    private async handleSnapshot(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new SnapshotService(device);
        const snapshot = await service.snapshot();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ snapshot }, null, 2),
                },
            ],
        };
    }

    private async handleRestoreSnapshot(args: unknown) {
        const { deviceId, snapshot: snapshotJson, fade = false } = args as {
            deviceId: string;
            snapshot: string;
            fade?: boolean;
        };
        const device = this.getDevice(deviceId);
        const service = new SnapshotService(device);
        const snapshot = JSON.parse(snapshotJson);
        await service.restore(snapshot, fade);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true }, null, 2),
                },
            ],
        };
    }

    // Phase 3 Handlers - Party Mode
    private async handlePartyMode(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const topologyService = new ZoneGroupTopologyService(device);

        // Get all groups and join all other devices to this one
        const groups = await topologyService.getZoneGroupState();
        if (!groups) {
            throw new Error('Failed to get zone groups');
        }

        const thisDeviceUuid = device.uuid;
        const joinedDevices: string[] = [];

        // Find all devices that are not already in this device's group
        const thisGroup = groups.find(g => g.members.includes(thisDeviceUuid));
        const currentMembers = thisGroup?.members ?? [thisDeviceUuid];

        // Collect all other devices and join them
        for (const group of groups) {
            for (const memberUuid of group.members) {
                if (!currentMembers.includes(memberUuid) && memberUuid !== thisDeviceUuid) {
                    try {
                        // Get the device from registry
                        const memberDevice = this.registry.getDevice(memberUuid);
                        if (memberDevice) {
                            const memberTopology = new ZoneGroupTopologyService(memberDevice);
                            await memberTopology.join(thisDeviceUuid);
                            joinedDevices.push(memberUuid);
                        }
                    } catch (error) {
                        console.error(`Failed to join device ${memberUuid}:`, error);
                    }
                }
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, joinedDevices }, null, 2),
                },
            ],
        };
    }

    // Phase 4 Handlers - Event Subscriptions
    private async handleSubscribeEvents(args: unknown) {
        const { deviceId, service, timeout = 1800 } = args as {
            deviceId: string;
            service: string;
            timeout?: number;
        };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        // Map service names to endpoints
        const serviceEndpoints: Record<string, string> = {
            'AVTransport': '/MediaRenderer/AVTransport/Event',
            'RenderingControl': '/MediaRenderer/RenderingControl/Event',
            'Queue': '/MediaRenderer/Queue/Event',
            'ZoneGroupTopology': '/ZoneGroupTopology/Event',
            'AlarmClock': '/AlarmClock/Event',
        };

        const endpoint = serviceEndpoints[service];
        if (!endpoint) {
            throw new Error(`Unknown service: ${service}. Valid services: ${Object.keys(serviceEndpoints).join(', ')}`);
        }

        // Subscribe to events
        const subscriptionId = await manager.subscribe(device, endpoint, { timeout });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        subscriptionId,
                        service,
                        endpoint,
                        timeout,
                        message: `Subscribed to ${service} events`,
                    }, null, 2),
                },
            ],
        };
    }

    private async handleUnsubscribeEvents(args: unknown) {
        const { deviceId, subscriptionId } = args as {
            deviceId: string;
            subscriptionId: string;
        };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        await manager.unsubscribe(device, subscriptionId);

        return {
            content: [
                {
                    type: 'text',
                    text: `Unsubscribed from subscription: ${subscriptionId}`,
                },
            ],
        };
    }

    private async handleUnsubscribeAll(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        await manager.unsubscribeDevice(device);

        return {
            content: [
                {
                    type: 'text',
                    text: `Unsubscribed from all events for device: ${device.name || deviceId}`,
                },
            ],
        };
    }

    private async handleListSubscriptions(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        const deviceIdKey = device.uuid || device.ip;
        const subscriptions = manager.getDeviceSubscriptions(deviceIdKey);

        const subscriptionList = subscriptions.map(sub => ({
            subscriptionId: sub.sid,
            endpoint: sub.endpoint,
            service: this.endpointToServiceName(sub.endpoint),
            timeout: sub.timeout,
            renewAt: sub.renewAt,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        deviceId: deviceIdKey,
                        subscriptions: subscriptionList,
                        count: subscriptions.length,
                    }, null, 2),
                },
            ],
        };
    }

    /**
     * Helper to convert endpoint to service name
     */
    private endpointToServiceName(endpoint: string): string {
        if (endpoint.includes('AVTransport')) return 'AVTransport';
        if (endpoint.includes('RenderingControl')) return 'RenderingControl';
        if (endpoint.includes('Queue')) return 'Queue';
        if (endpoint.includes('ZoneGroupTopology')) return 'ZoneGroupTopology';
        if (endpoint.includes('AlarmClock')) return 'AlarmClock';
        return 'Unknown';
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
