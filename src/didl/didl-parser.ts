/**
 * DIDL-Lite XML parser
 * Converts XML strings to DIDL objects
 */

import { parseString } from 'xml2js';
import { DidlObject, type DidlObjectOptions } from './didl-object.js';
import {
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
import {
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
import type { DidlResourceOptions } from './didl-resource.js';

/**
 * Unescape XML entities
 */
function unescapeXml(text: string): string {
    return text
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

/**
 * Class registry - maps UPnP class strings to constructor functions
 */
const CLASS_REGISTRY: Record<string, new (options: DidlObjectOptions) => DidlObject> = {
    // Items
    'object.item': DidlItem,
    'object.item.audioItem': DidlAudioItem,
    'object.item.audioItem.musicTrack': DidlMusicTrack,
    'object.item.audioItem.audioBook': DidlAudioBook,
    'object.item.audioItem.audioBroadcast': DidlAudioBroadcast,
    'object.item.audioItem.audioLineIn': DidlAudioLineIn,
    'object.item.audioItem.recentShow': DidlRecentShow,
    'object.item.audioItem.audioBroadcast#FAVORITE': DidlAudioBroadcastFavorite,
    'object.itemobject.item.sonos-favorite': DidlFavorite,

    // Containers
    'object.container': DidlContainer,
    'object.container.album': DidlAlbum,
    'object.container.album.musicAlbum': DidlMusicAlbum,
    'object.container.album.musicAlbum#FAVORITE': DidlMusicAlbumFavorite,
    'object.container.album.musicAlbum#COMPILATION': DidlMusicAlbumCompilation,
    'object.container.person': DidlPerson,
    'object.container.person.musicArtist#composer': DidlComposer,
    'object.container.person.musicArtist': DidlMusicArtist,
    'object.container.albumlist': DidlAlbumList,
    'object.container.playlistContainer': DidlPlaylistContainer,
    'object.container.playlistContainer.sameArtist': DidlSameArtist,
    'object.container.playlistContainer#FAVORITE': DidlPlaylistContainerFavorite,
    'object.container.playlistContainer#TRACKLIST': DidlPlaylistContainerTracklist,
    'object.container.genre': DidlGenre,
    'object.container.genre.musicGenre': DidlMusicGenre,
    'object.container.radioShow': DidlRadioShow,
};

/**
 * XML element name to property name mapping
 */
const XML_TO_PROPERTY: Record<string, string> = {
    // Dublin Core
    'dc:title': 'title',
    'dc:creator': 'creator',
    'dc:date': 'date',
    'dc:description': 'description',
    'dc:publisher': 'publisher',
    'dc:contributor': 'contributor',
    'dc:relation': 'relation',
    'dc:rights': 'rights',
    'dc:language': 'language',

    // UPnP
    'upnp:class': 'upnpClass',
    'upnp:artist': 'artist',
    'upnp:album': 'album',
    'upnp:albumArtURI': 'albumArtUri',
    'upnp:genre': 'genre',
    'upnp:originalTrackNumber': 'originalTrackNumber',
    'upnp:playlist': 'playlist',
    'upnp:longDescription': 'longDescription',
    'upnp:storageMedium': 'storageMedium',
    'upnp:producer': 'producer',
    'upnp:region': 'region',
    'upnp:radioCallSign': 'radioCallSign',
    'upnp:radioStationID': 'radioStationId',
    'upnp:radioBand': 'radioBand',
    'upnp:channelNr': 'channelNr',
    'upnp:artistDiscographyURI': 'artistDiscographyUri',
    'upnp:toc': 'toc',
    'upnp:writeStatus': 'writeStatus',

    // Rincon (Sonos)
    'r:resourceMetaData': 'resourceMetaData',
};

/**
 * Parse a DIDL-Lite XML string
 */
export async function fromDidlString(xml: string): Promise<DidlObject[]> {
    return new Promise((resolve, reject) => {
        parseString(xml, { trim: true, explicitArray: false }, (err: Error | null, result: Record<string, unknown>) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                const didlLite = (result['DIDL-Lite'] || result) as Record<string, unknown>;
                const items: DidlObject[] = [];

                // Handle items
                if (didlLite.item) {
                    const itemArray = Array.isArray(didlLite.item) ? didlLite.item : [didlLite.item];
                    for (const itemData of itemArray) {
                        items.push(parseDidlElement(itemData, 'item'));
                    }
                }

                // Handle containers
                if (didlLite.container) {
                    const containerArray = Array.isArray(didlLite.container) ? didlLite.container : [didlLite.container];
                    for (const containerData of containerArray) {
                        items.push(parseDidlElement(containerData, 'container'));
                    }
                }

                resolve(items);
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
}

/**
 * Parse a single DIDL element (item or container)
 */
function parseDidlElement(data: Record<string, unknown>, elementType: 'item' | 'container'): DidlObject {
    // Extract attributes
    const $ = (data.$ as Record<string, string>) || {};
    const options: DidlObjectOptions = {
        id: $.id || '',
        parentId: $.parentID || '',
        title: '',
        restricted: $.restricted === 'true',
    };

    // Parse resources
    const resources: DidlResourceOptions[] = [];
    if (data.res) {
        const resArray = Array.isArray(data.res) ? data.res : [data.res];
        for (const res of resArray) {
            const resAttrs = (res as Record<string, unknown>).$ as Record<string, string> | undefined;
            const resText = typeof res === 'string' ? res : ((res as Record<string, unknown>)._ as string || res);

            const resData: DidlResourceOptions = {
                uri: unescapeXml(resText as string),
                protocolInfo: resAttrs?.protocolInfo || '',
            };

            if (resAttrs?.duration) resData.duration = resAttrs.duration;
            if (resAttrs?.size) resData.size = parseInt(resAttrs.size);
            if (resAttrs?.bitrate) resData.bitrate = parseInt(resAttrs.bitrate);
            if (resAttrs?.sampleFrequency) resData.sampleFrequency = parseInt(resAttrs.sampleFrequency);
            if (resAttrs?.nrAudioChannels) resData.nrAudioChannels = parseInt(resAttrs.nrAudioChannels);
            if (resAttrs?.resolution) resData.resolution = resAttrs.resolution;
            if (resAttrs?.colorDepth) resData.colorDepth = parseInt(resAttrs.colorDepth);
            if (resAttrs?.importUri) resData.importUri = resAttrs.importUri;

            resources.push(resData);
        }
    }
    options.resources = resources;

    // Parse all other elements
    let upnpClass = '';
    for (const [key, value] of Object.entries(data)) {
        if (key === '$' || key === 'res') continue;

        const propertyName = XML_TO_PROPERTY[key] || key;
        const textValue = (typeof value === 'object' && value !== null && '_' in value) ? (value as Record<string, unknown>)._ : value;
        const cleanValue = typeof textValue === 'string' ? unescapeXml(textValue) : textValue;

        if (propertyName === 'upnpClass') {
            upnpClass = cleanValue as string;
        } else {
            options[propertyName] = cleanValue;
        }
    }

    // Get the appropriate class constructor
    const ClassConstructor = CLASS_REGISTRY[upnpClass] || (elementType === 'item' ? DidlItem : DidlContainer);

    return new ClassConstructor(options);
}
