/**
 * DIDL-Lite module - Digital Item Declaration Language
 * 
 * This module provides TypeScript classes for handling DIDL-Lite metadata,
 * the XML schema used by Sonos for carrying metadata about tracks, albums,
 * playlists, artists, and other music library items.
 * 
 * Based on UPnP ContentDirectory specification and SoCo implementation.
 */

// Core classes
export { DidlObject, type DidlObjectOptions } from './didl-object.js';
export { DidlResource, type DidlResourceOptions } from './didl-resource.js';

// Item classes
export {
    DidlItem,
    DidlAudioItem,
    DidlMusicTrack,
    DidlAudioBook,
    DidlAudioBroadcast,
    DidlAudioLineIn,
    DidlRecentShow,
    DidlAudioBroadcastFavorite,
    DidlFavorite,
} from './didl-item.js';

// Container classes
export {
    DidlContainer,
    DidlAlbum,
    DidlMusicAlbum,
    DidlMusicAlbumFavorite,
    DidlMusicAlbumCompilation,
    DidlPerson,
    DidlComposer,
    DidlMusicArtist,
    DidlAlbumList,
    DidlPlaylistContainer,
    DidlSameArtist,
    DidlPlaylistContainerFavorite,
    DidlPlaylistContainerTracklist,
    DidlGenre,
    DidlMusicGenre,
    DidlRadioShow,
} from './didl-container.js';

// Utilities
export { toDidlString, didlObjectToXml } from './didl-serializer.js';
export { fromDidlString } from './didl-parser.js';
