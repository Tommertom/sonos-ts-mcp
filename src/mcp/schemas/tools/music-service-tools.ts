import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const musicServiceTools: Tool[] = [
    {
        name: 'sonos_list_music_services',
        description: 'List all available music services (Sonos Radio, TuneIn, Spotify, etc.) registered with the Sonos system. Returns service details including name, ID, and authentication type. IMPORTANT: Most services require authentication (authType: DeviceLink or AppLink) and will not work unless the user has linked their account through the Sonos app. Only "Anonymous" services work without authentication.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device ID to query for available services',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_browse_music_service',
        description: 'Browse content from a music service. WARNING: Most services (especially Sonos Radio, Spotify, Apple Music) require authentication and will return empty results or errors if not authenticated. Check authType from sonos_list_music_services first. Only "Anonymous" services (like SomaFM Radio) are guaranteed to work. Use sonos_get_favorite_radio_stations instead for pre-configured radio stations.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device ID to use for browsing',
                },
                serviceName: {
                    type: 'string',
                    description: 'Name of the music service (e.g., "Sonos Radio", "TuneIn", "Spotify")',
                },
                containerId: {
                    type: 'string',
                    description: 'Container ID to browse. Use "root" to start from the top level, or use an ID returned from a previous browse call.',
                    default: 'root',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination',
                    default: 0,
                },
                count: {
                    type: 'number',
                    description: 'Maximum number of items to return',
                    default: 100,
                },
            },
            required: ['deviceId', 'serviceName'],
        },
    },
    {
        name: 'sonos_search_music_service',
        description: 'Search for content within a music service. WARNING: Requires authentication for most services. Will return errors if the service requires DeviceLink or AppLink authentication and the user has not linked their account in the Sonos app. Prefer sonos_get_favorite_radio_stations for radio content.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device ID to use for searching',
                },
                serviceName: {
                    type: 'string',
                    description: 'Name of the music service to search (e.g., "Sonos Radio", "TuneIn")',
                },
                query: {
                    type: 'string',
                    description: 'Search query (e.g., "BBC Radio 1", "rock music", "jazz")',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination',
                    default: 0,
                },
                count: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                    default: 100,
                },
            },
            required: ['deviceId', 'serviceName', 'query'],
        },
    },
    {
        name: 'sonos_play_music_service_item',
        description: 'Play a specific item from a music service such as a radio station, track, album, or playlist. Use the item ID from browse or search results.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device ID where playback should start',
                },
                serviceName: {
                    type: 'string',
                    description: 'Name of the music service (e.g., "Sonos Radio", "TuneIn")',
                },
                itemId: {
                    type: 'string',
                    description: 'Item ID to play (from browse or search results)',
                },
                itemTitle: {
                    type: 'string',
                    description: 'Optional title of the item for metadata',
                },
            },
            required: ['deviceId', 'serviceName', 'itemId'],
        },
    },
    {
        name: 'sonos_get_music_service_item_uri',
        description: 'Get the playable streaming URI for a specific music service item. This is useful for debugging or inspecting the actual stream URL.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device ID to use for the request',
                },
                serviceName: {
                    type: 'string',
                    description: 'Name of the music service',
                },
                itemId: {
                    type: 'string',
                    description: 'Item ID to get the URI for',
                },
            },
            required: ['deviceId', 'serviceName', 'itemId'],
        },
    },
];

