import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const discoveryTools: Tool[] = [
    {
        name: 'sonos_discover',
        description: 'Actively scan the network for Sonos devices using SSDP. Always call this when the sonos_list_devices tool returns empty or you are missing a device. Returns device UUID, IP address, room name, model, and firmware version. Use room name to communicate with the user.',
        inputSchema: {
            type: 'object',
            properties: {
                timeout: {
                    type: 'number',
                    description: 'Discovery timeout in milliseconds (5000-10000 recommended)',
                    default: 5000,
                },
            },
        },
    },
    {
        name: 'sonos_add_device',
        description: 'Manually add a Sonos device by IP address. Use when SSDP discovery fails due to network restrictions or firewall rules. Device must be network-accessible on port 1400.',
        inputSchema: {
            type: 'object',
            properties: {
                ip: {
                    type: 'string',
                    description: 'IP address of the Sonos device (e.g., "192.168.1.150")',
                },
                port: {
                    type: 'number',
                    description: 'Port number (default: 1400)',
                    default: 1400,
                },
                name: {
                    type: 'string',
                    description: 'Optional friendly name for the device',
                },
            },
            required: ['ip'],
        },
    },
    {
        name: 'sonos_list_devices',
        description: 'List devices currently in the registry. Note: Call sonos_discover first to populate the registry if a device is not found in the current registry. Returns UUID, IP address, room name, model, and software version of registered devices. Use room name to communicate with the user.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];
