import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { ContentDirectoryService } from '../../services/content-directory.js';

/**
 * Handle sonos_browse_artists
 */
export async function handleBrowseArtists(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = await context.resolveDevice(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getArtists({ startIndex, count });

    const artists = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: artists,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_browse_albums
 */
export async function handleBrowseAlbums(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = await context.resolveDevice(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getAlbums({ startIndex, count });

    const albums = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.getProperty('artist'),
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: albums,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_browse_tracks
 */
export async function handleBrowseTracks(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getTracks({ startIndex, count });

    const tracks = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.getProperty('artist'),
        album: item.getProperty('album'),
        uri: item.resources[0]?.uri,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: tracks,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_browse_genres
 */
export async function handleBrowseGenres(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getGenres({ startIndex, count });

    const genres = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: genres,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_browse_playlists
 */
export async function handleBrowsePlaylists(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getSonosPlaylists({ startIndex, count });

    const playlists = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: playlists,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_get_favorite_radio_stations
 */
export async function handleGetFavoriteRadioStations(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.getFavoriteRadioStations({ startIndex, count });

    const stations = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        uri: item.resources[0]?.uri,
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items: stations,
                    total: result.total,
                    returned: result.returned,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_search_library
 */
export async function handleSearchLibrary(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, searchType, searchTerm, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        searchType: 'artists' | 'albums' | 'tracks' | 'genres';
        searchTerm: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.search(searchType, searchTerm, { startIndex, count });

    const items = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.getProperty('artist'),
        album: item.getProperty('album'),
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items,
                    total: result.total,
                    returned: result.returned,
                    searchTerm,
                    searchType,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_browse_item
 */
export async function handleBrowseItem(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, objectId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        objectId: string;
        startIndex?: number;
        count?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const result = await service.browse(objectId, { startIndex, count });

    const items = result.items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.getProperty('artist'),
        album: item.getProperty('album'),
        uri: item.resources[0]?.uri,
        type: item.upnpClass,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    items,
                    total: result.total,
                    returned: result.returned,
                    objectId,
                }),
            },
        ],
    };
}
