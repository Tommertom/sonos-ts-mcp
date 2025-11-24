import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const alarmTools: Tool[] = [
    {
        name: 'sonos_list_alarms',
        description: 'List all configured alarms including their schedule, enabled status, and room assignments.',
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
        name: 'sonos_create_alarm',
        description: 'Create a new alarm with specified time, days, music source, and settings. Returns the alarm ID.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Update an existing alarm. Only specified fields will be changed.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Delete an existing alarm permanently.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                alarmId: {
                    type: 'string',
                    description: 'Alarm ID to delete',
                },
            },
            required: ['deviceId', 'alarmId'],
        },
    },
    {
        name: 'sonos_set_sleep_timer',
        description: 'Set a sleep timer to automatically stop playback after the specified duration. Format: HH:MM:SS (e.g., "00:30:00" for 30 minutes).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Get remaining sleep timer duration. Returns empty if no timer is active.',
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
        name: 'sonos_cancel_sleep_timer',
        description: 'Cancel the active sleep timer.',
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
