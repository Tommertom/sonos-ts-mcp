import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const groupTools: Tool[] = [
    {
        name: 'sonos_get_zone_groups',
        description: 'Get zone group topology showing which devices are grouped together and their coordinator.',
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
        name: 'sonos_join_group',
        description: 'Join a device to another device\'s group for synchronized multi-room playback. The device will follow the master\'s playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device to join from (room name, UUID, or IP)',
                },
                masterDeviceId: {
                    type: 'string',
                    description: 'Master/coordinator device (room name, UUID, or IP)',
                },
            },
            required: ['deviceId', 'masterDeviceId'],
        },
    },
    {
        name: 'sonos_unjoin',
        description: 'Remove a device from its current group, making it a standalone player.',
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
        name: 'sonos_party_mode',
        description: 'Join all discovered devices to the specified device to create a whole-house audio experience.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address (will become group coordinator)',
                },
            },
            required: ['deviceId'],
        },
    },
];
