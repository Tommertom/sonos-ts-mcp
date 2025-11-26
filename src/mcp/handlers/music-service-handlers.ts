import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { MusicServiceRegistry } from '../../discovery/music-service-registry.js';
import { SMAPIClient } from '../../services/smapi-client.js';
import { MusicServicesService } from '../../services/music-services.js';
import { AVTransportService } from '../../services/av-transport.js';
import type { MusicServiceItem, MusicServiceContainer } from '../../types/music-services.js';

// Global registries per device (cached)
const registries = new Map<string, MusicServiceRegistry>();

/**
 * Get or create a music service registry for a device
 */
function getRegistry(context: ServerContext, deviceId: string): MusicServiceRegistry {
    const key = deviceId;

    if (!registries.has(key)) {
        const device = context.resolver.resolve(deviceId);
        registries.set(key, new MusicServiceRegistry(device));
    }

    return registries.get(key)!;
}

/**
 * Handle sonos_list_music_services
 */
export async function handleListMusicServices(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };

    try {
        const registry = getRegistry(context, deviceId);
        const services = await registry.discoverServices(true); // Force refresh

        const serviceList = services.map((service) => ({
            id: service.id,
            name: service.name,
            type: service.containerType,
            authType: service.authType,
            version: service.version,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        services: serviceList,
                        total: serviceList.length,
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to list music services',
                        services: [],
                        total: 0,
                    }),
                },
            ],
            isError: true,
        };
    }
}

/**
 * Handle sonos_browse_music_service
 */
export async function handleBrowseMusicService(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const {
        deviceId,
        serviceName,
        containerId = 'root',
        startIndex = 0,
        count = 100,
    } = args as {
        deviceId: string;
        serviceName: string;
        containerId?: string;
        startIndex?: number;
        count?: number;
    };

    try {
        const registry = getRegistry(context, deviceId);
        const serviceDescriptor = await registry.getServiceByName(serviceName);

        if (!serviceDescriptor) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: `Music service "${serviceName}" not found. Use sonos_list_music_services to see available services.`,
                            items: [],
                            total: 0,
                        }),
                    },
                ],
                isError: true,
            };
        }

        const client = new SMAPIClient(serviceDescriptor);
        const response = await client.getMetadata(containerId, startIndex, count);

        const items = response.items.map((item) => {
            if ('canEnumerate' in item) {
                // Container
                const container = item as MusicServiceContainer;
                return {
                    id: container.id,
                    title: container.title,
                    type: 'container',
                    itemType: container.itemType,
                    canPlay: container.canPlay || false,
                    canEnumerate: container.canEnumerate,
                    albumArtUri: container.albumArtUri,
                };
            } else {
                // Item
                const musicItem = item as MusicServiceItem;
                return {
                    id: musicItem.id,
                    title: musicItem.title,
                    type: 'item',
                    itemType: musicItem.itemType,
                    artist: musicItem.artist,
                    album: musicItem.album,
                    albumArtUri: musicItem.albumArtUri,
                    duration: musicItem.duration,
                    canPlay: musicItem.canPlay,
                };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        serviceName,
                        serviceId: serviceDescriptor.id,
                        containerId,
                        items,
                        total: response.total,
                        index: response.index,
                        count: response.count,
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to browse music service',
                        items: [],
                        total: 0,
                    }),
                },
            ],
            isError: true,
        };
    }
}

/**
 * Handle sonos_search_music_service
 */
export async function handleSearchMusicService(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const {
        deviceId,
        serviceName,
        query,
        startIndex = 0,
        count = 100,
    } = args as {
        deviceId: string;
        serviceName: string;
        query: string;
        startIndex?: number;
        count?: number;
    };

    try {
        const registry = getRegistry(context, deviceId);
        const serviceDescriptor = await registry.getServiceByName(serviceName);

        if (!serviceDescriptor) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: `Music service "${serviceName}" not found`,
                            items: [],
                            total: 0,
                        }),
                    },
                ],
                isError: true,
            };
        }

        const client = new SMAPIClient(serviceDescriptor);
        const response = await client.search(query, startIndex, count);

        const items = response.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: 'canEnumerate' in item ? 'container' : 'item',
            itemType: item.itemType,
            artist: 'artist' in item ? item.artist : undefined,
            album: 'album' in item ? item.album : undefined,
            albumArtUri: 'albumArtUri' in item ? item.albumArtUri : undefined,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        serviceName,
                        query,
                        items,
                        total: response.total,
                        index: response.index,
                        count: response.count,
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to search music service',
                        items: [],
                        total: 0,
                    }),
                },
            ],
            isError: true,
        };
    }
}

/**
 * Handle sonos_play_music_service_item
 */
export async function handlePlayMusicServiceItem(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const {
        deviceId,
        serviceName,
        itemId,
        itemTitle = 'Music Service Item',
    } = args as {
        deviceId: string;
        serviceName: string;
        itemId: string;
        itemTitle?: string;
    };

    try {
        const device = context.resolver.resolve(deviceId);
        const registry = getRegistry(context, deviceId);
        const serviceDescriptor = await registry.getServiceByName(serviceName);

        if (!serviceDescriptor) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: `Music service "${serviceName}" not found`,
                        }),
                    },
                ],
                isError: true,
            };
        }

        const client = new SMAPIClient(serviceDescriptor);
        const uri = await client.getMediaURI(itemId);

        if (!uri) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Failed to get media URI for item',
                            itemId,
                        }),
                    },
                ],
                isError: true,
            };
        }

        // Build DIDL metadata for the item
        const didl = `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
            <item id="${itemId}" parentID="" restricted="true">
                <dc:title>${itemTitle.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</dc:title>
                <upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
                <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${serviceDescriptor.id}_</desc>
            </item>
        </DIDL-Lite>`;

        const avTransport = new AVTransportService(device);
        await avTransport.setAVTransportURI(uri, didl);
        await avTransport.play();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: `Now playing: ${itemTitle}`,
                        serviceName,
                        itemId,
                        uri,
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to play music service item',
                    }),
                },
            ],
            isError: true,
        };
    }
}

/**
 * Handle sonos_get_music_service_item_uri
 */
export async function handleGetMusicServiceItemUri(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const {
        deviceId,
        serviceName,
        itemId,
    } = args as {
        deviceId: string;
        serviceName: string;
        itemId: string;
    };

    try {
        const registry = getRegistry(context, deviceId);
        const serviceDescriptor = await registry.getServiceByName(serviceName);

        if (!serviceDescriptor) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: `Music service "${serviceName}" not found`,
                        }),
                    },
                ],
                isError: true,
            };
        }

        const client = new SMAPIClient(serviceDescriptor);
        const uri = await client.getMediaURI(itemId);

        if (!uri) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Failed to get media URI for item',
                            itemId,
                        }),
                    },
                ],
                isError: true,
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        serviceName,
                        itemId,
                        uri,
                    }),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to get media URI',
                    }),
                },
            ],
            isError: true,
        };
    }
}
