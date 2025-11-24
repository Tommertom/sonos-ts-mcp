import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const snapshotTools: Tool[] = [
    {
        name: 'sonos_snapshot',
        description: 'Take a snapshot of current device state including playback, volume, and EQ settings. Returns snapshot data for later restoration.',
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
        name: 'sonos_restore_snapshot',
        description: 'Restore a previously saved snapshot to return device to its captured state. Optionally fade in volume.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
];
