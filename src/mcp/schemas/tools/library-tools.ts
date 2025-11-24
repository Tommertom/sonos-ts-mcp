import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const libraryTools: Tool[] = [
    {
        name: 'sonos_browse_artists',
        description: 'Browse artists in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse albums in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse all tracks in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse music genres in the library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse Sonos playlists. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Search the music library by artist, album, track, or genre. Returns matching items.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                searchType: {
                    type: 'string',
                    description: 'Type of content to search',
                    enum: ['artists', 'albums', 'tracks', 'genres'],
                },
                searchTerm: {
                    type: 'string',
                    description: 'Search term',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse a specific library item to get its children. For example, get albums for an artist or tracks for an album.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                objectId: {
                    type: 'string',
                    description: 'Object ID from a previous browse or search result',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
];
