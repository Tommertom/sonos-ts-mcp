/**
 * DIDL-Lite XML serializer
 * Converts DIDL objects to XML strings
 */

import { DidlObject } from './didl-object.js';
import { DidlItem } from './didl-item.js';
import { DidlContainer } from './didl-container.js';

/**
 * XML escape special characters
 */
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Property name to XML namespace mappings
 */
const NAMESPACE_MAP: Record<string, string> = {
    // Dublin Core elements
    'title': 'dc',
    'creator': 'dc',
    'date': 'dc',
    'description': 'dc',
    'publisher': 'dc',
    'contributor': 'dc',
    'relation': 'dc',
    'rights': 'dc',
    'language': 'dc',

    // UPnP elements
    'class': 'upnp',
    'artist': 'upnp',
    'album': 'upnp',
    'albumArtUri': 'upnp',
    'genre': 'upnp',
    'originalTrackNumber': 'upnp',
    'playlist': 'upnp',
    'longDescription': 'upnp',
    'storageMedium': 'upnp',
    'producer': 'upnp',
    'region': 'upnp',
    'radioCallSign': 'upnp',
    'radioStationId': 'upnp',
    'radioBand': 'upnp',
    'channelNr': 'upnp',
    'artistDiscographyUri': 'upnp',
    'toc': 'upnp',
    'searchable': 'upnp',
    'childCount': 'upnp',
    'createClass': 'upnp',

    // Rincon (Sonos-specific)
    'resourceMetaData': 'r',
};

/**
 * Convert property name to XML element name
 */
function propertyToXmlName(property: string): string {
    const namespace = NAMESPACE_MAP[property] || 'dc';
    return `${namespace}:${property}`;
}

/**
 * Convert a DIDL object to an XML element string
 */
export function didlObjectToXml(obj: DidlObject): string {
    const isItem = obj instanceof DidlItem;
    const tag = isItem ? 'item' : 'container';

    // Build attributes
    const attrs: string[] = [
        `id="${escapeXml(obj.id)}"`,
        `parentID="${escapeXml(obj.parentId)}"`,
        `restricted="${obj.restricted ? 'true' : 'false'}"`
    ];

    if (obj instanceof DidlContainer) {
        if (obj.searchable !== undefined) {
            attrs.push(`searchable="${obj.searchable ? 'true' : 'false'}"`);
        }
        if (obj.childCount !== undefined) {
            attrs.push(`childCount="${obj.childCount}"`);
        }
    }

    let xml = `<${tag} ${attrs.join(' ')}>`;

    // Add title
    xml += `<dc:title>${escapeXml(obj.title)}</dc:title>`;

    // Add upnp:class
    xml += `<upnp:class>${escapeXml(obj.upnpClass)}</upnp:class>`;

    // Add resources
    for (const resource of obj.resources) {
        const resAttrs: string[] = [
            `protocolInfo="${escapeXml(resource.protocolInfo)}"`
        ];

        if (resource.duration) resAttrs.push(`duration="${escapeXml(resource.duration)}"`);
        if (resource.size) resAttrs.push(`size="${resource.size}"`);
        if (resource.bitrate) resAttrs.push(`bitrate="${resource.bitrate}"`);
        if (resource.sampleFrequency) resAttrs.push(`sampleFrequency="${resource.sampleFrequency}"`);
        if (resource.nrAudioChannels) resAttrs.push(`nrAudioChannels="${resource.nrAudioChannels}"`);
        if (resource.resolution) resAttrs.push(`resolution="${escapeXml(resource.resolution)}"`);
        if (resource.colorDepth) resAttrs.push(`colorDepth="${resource.colorDepth}"`);
        if (resource.importUri) resAttrs.push(`importUri="${escapeXml(resource.importUri)}"`);

        xml += `<res ${resAttrs.join(' ')}>${escapeXml(resource.uri)}</res>`;
    }

    // Add other properties
    const skipProps = new Set(['id', 'parentId', 'title', 'restricted', 'resources', 'upnpClass', 'writeStatus', 'searchable', 'childCount']);
    const dict = obj.toDict();

    for (const [key, value] of Object.entries(dict)) {
        if (skipProps.has(key) || value === undefined) continue;

        const xmlName = propertyToXmlName(key);
        xml += `<${xmlName}>${escapeXml(String(value))}</${xmlName}>`;
    }

    // Add writeStatus if present
    if (obj.writeStatus) {
        xml += `<upnp:writeStatus>${escapeXml(obj.writeStatus)}</upnp:writeStatus>`;
    }

    xml += `</${tag}>`;
    return xml;
}

/**
 * Convert a DIDL object to a complete DIDL-Lite XML document
 */
export function toDidlString(obj: DidlObject | DidlObject[]): string {
    const objects = Array.isArray(obj) ? obj : [obj];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" ';
    xml += 'xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" ';
    xml += 'xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" ';
    xml += 'xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">';

    for (const didlObj of objects) {
        xml += didlObjectToXml(didlObj);
    }

    xml += '</DIDL-Lite>';
    return xml;
}
