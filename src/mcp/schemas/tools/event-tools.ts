import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const eventTools: Tool[] = [
    {
        name: 'sonos_subscribe_events',
        description: 'Subscribe to real-time events from a Sonos device service to receive automatic notifications of state changes.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Unsubscribe from a specific event subscription to stop receiving notifications.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Unsubscribe from all active event subscriptions for a specific device.',
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
        name: 'sonos_list_subscriptions',
        description: 'List all active event subscriptions for a device including subscription IDs and services.',
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
