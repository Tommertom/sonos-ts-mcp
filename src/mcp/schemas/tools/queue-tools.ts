import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const queueTools: Tool[] = [
    {
        name: 'sonos_get_queue',
        description: 'Retrieve the current playback queue with track information. Supports pagination for large queues.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (0-based)',
                    default: 0,
                },
                count: {
                    type: 'number',
                    description: 'Number of tracks to retrieve',
                    default: 100,
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_add_to_queue',
        description: 'Add a track URI to the playback queue. Supports music library URIs and streaming service URIs. Optional metadata in DIDL-Lite XML format.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                uri: {
                    type: 'string',
                    description: 'Track URI (e.g., x-file-cifs://..., x-sonos-spotify:...)',
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
                    description: 'Add as next track to play',
                    default: false,
                },
            },
            required: ['deviceId', 'uri'],
        },
    },
    {
        name: 'sonos_remove_from_queue',
        description: 'Remove a track from the queue at the specified position.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Remove all tracks from the queue. Does not stop current playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_play_from_queue',
        description: 'Start playing from the queue at a specific position.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Save the current queue as a Sonos playlist with the specified title.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable shuffle mode for queue playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                shuffle: {
                    type: 'boolean',
                    description: 'True to enable shuffle, false to disable',
                },
            },
            required: ['deviceId', 'shuffle'],
        },
    },
    {
        name: 'sonos_set_repeat',
        description: 'Set repeat mode for queue playback. Options: off (no repeat), all (repeat entire queue), one (repeat current track).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable crossfade between tracks. Crossfade creates smooth transitions between songs.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable crossfade, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_get_playback_state',
        description: 'Get current playback settings including shuffle, repeat, crossfade, transport state, and speed.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
];
