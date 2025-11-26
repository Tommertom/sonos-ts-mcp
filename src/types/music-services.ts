/**
 * Music service type definitions for SMAPI (Sonos Music API) integration
 */

/**
 * Music service descriptor from MusicServices.ListAvailableServices()
 */
export interface MusicServiceDescriptor {
    /** Service ID (e.g., 254 for TuneIn, 52 for Sonos Radio) */
    id: number;
    /** Service display name */
    name: string;
    /** API version */
    version: string;
    /** Service endpoint URI */
    uri: string;
    /** Secure HTTPS endpoint */
    secureUri: string;
    /** Container type (usually "MService") */
    containerType: string;
    /** Capabilities bitfield */
    capabilities: number;
    /** Authentication type */
    authType: 'Anonymous' | 'DeviceLink' | 'UserId' | 'AppLink';
    /** Poll interval in seconds */
    pollInterval: number;
    /** Presentation map URI for UI customization */
    presentationMapUri?: string;
    /** Strings URI for localization */
    stringsUri?: string;
    /** Service type identifier for metadata */
    serviceType?: string;
}

/**
 * Music service item (track, stream, show, etc.)
 */
export interface MusicServiceItem {
    /** Service-specific item ID */
    id: string;
    /** Display title */
    title: string;
    /** Item type */
    itemType: 'track' | 'stream' | 'album' | 'artist' | 'playlist' | 'show' | 'station' | 'program';
    /** Can this item be played */
    canPlay: boolean;
    /** Can skip to next item */
    canSkip?: boolean;
    /** Can add to favorites */
    canAddToFavorites?: boolean;
    /** Artist ID */
    artistId?: string;
    /** Artist name */
    artist?: string;
    /** Album ID */
    albumId?: string;
    /** Album name */
    album?: string;
    /** Album art URI */
    albumArtUri?: string;
    /** Duration in seconds */
    duration?: number;
    /** Streaming URI */
    uri?: string;
    /** MIME type */
    mimeType?: string;
    /** Track number */
    trackNumber?: number;
}

/**
 * Music service container (collection, playlist, etc.)
 */
export interface MusicServiceContainer {
    /** Container ID */
    id: string;
    /** Display title */
    title: string;
    /** Item type */
    itemType: 'container' | 'collection' | 'favorites' | 'album' | 'playlist' | 'artistTrackList' | 'genre';
    /** Can enumerate children */
    canEnumerate: boolean;
    /** Can play container directly */
    canPlay?: boolean;
    /** Can cache for offline */
    canCache?: boolean;
    /** Number of children */
    childCount?: number;
    /** Album art URI */
    albumArtUri?: string;
    /** Artist name (for albums) */
    artist?: string;
}

/**
 * Union type for music service items and containers
 */
export type MusicServiceResult = MusicServiceItem | MusicServiceContainer;

/**
 * SMAPI response structure
 */
export interface SMAPIResponse {
    /** Array of items and/or containers */
    items: MusicServiceResult[];
    /** Total number of matches */
    total: number;
    /** Number of items returned */
    count: number;
    /** Starting index */
    index: number;
}

/**
 * SMAPI search categories
 */
export type SMAPISearchCategory =
    | 'all'
    | 'artists'
    | 'albums'
    | 'tracks'
    | 'playlists'
    | 'genres'
    | 'stations'
    | 'shows'
    | 'tags';

/**
 * Check if a result is a container
 */
export function isMusicServiceContainer(item: MusicServiceResult): item is MusicServiceContainer {
    return (item as MusicServiceContainer).canEnumerate !== undefined;
}

/**
 * Check if a result is an item
 */
export function isMusicServiceItem(item: MusicServiceResult): item is MusicServiceItem {
    return (item as MusicServiceItem).canPlay !== undefined;
}
