import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const volumeTools: Tool[] = [
    {
        name: 'sonos_set_volume',
        description: 'Set volume level on a Sonos device. Range: 0 (silent) to 100 (maximum). Affects entire group if device is grouped.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                volume: {
                    type: 'number',
                    description: 'Volume level (0-100)',
                    minimum: 0,
                    maximum: 100,
                },
            },
            required: ['deviceId', 'volume'],
        },
    },
    {
        name: 'sonos_get_volume',
        description: 'Get current volume level from a Sonos device.',
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
        name: 'sonos_set_mute',
        description: 'Mute or unmute a Sonos device. Mute preserves volume level for quick unmute.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                mute: {
                    type: 'boolean',
                    description: 'True to mute, false to unmute',
                },
            },
            required: ['deviceId', 'mute'],
        },
    },
    {
        name: 'sonos_set_bass',
        description: 'Set bass EQ level. Range: -10 (reduced bass) to +10 (enhanced bass).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Set treble EQ level. Range: -10 (reduced treble) to +10 (enhanced treble).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable loudness compensation. Loudness boosts bass and treble at low volumes for better sound quality.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable loudness, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_get_eq',
        description: 'Get current EQ settings including bass, treble, and loudness.',
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
        name: 'sonos_set_night_mode',
        description: 'Set night mode for home theater devices. Reduces loud sounds and enhances quiet sounds for late-night viewing.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable night mode, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_set_dialog_mode',
        description: 'Set dialog enhancement for home theater devices. Enhances speech clarity in movies and TV shows.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable dialog enhancement, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
];
