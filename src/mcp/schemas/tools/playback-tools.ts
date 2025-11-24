import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const playbackTools: Tool[] = [
    {
        name: 'sonos_play',
        description: 'Start or resume playback on a Sonos device. Continues from current queue position and respects volume settings. If device is in a group, affects entire group.',
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
        name: 'sonos_pause',
        description: 'Pause playback on a Sonos device. Maintains current position in track and queue for quick resume. If device is in a group, affects entire group.',
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
        name: 'sonos_stop',
        description: 'Stop playback on a Sonos device. Clears playback state, unlike pause which maintains position.',
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
        name: 'sonos_next',
        description: 'Skip to next track in the queue.',
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
        name: 'sonos_previous',
        description: 'Skip to previous track or restart current track if played more than a few seconds.',
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
        name: 'sonos_get_transport_info',
        description: 'Get current transport state (playing, paused, stopped) and playback speed.',
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
        name: 'sonos_get_position_info',
        description: 'Get current track information, position, and duration. Includes track metadata like title, artist, album.',
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
