import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { AVTransportService } from '../../services/av-transport.js';
import { DidlObject } from '../../didl/didl-object.js';

/**
 * Handle sonos_get_queue
 */
export async function handleGetQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startIndex = 0, count = 100 } = args as {
        deviceId: string;
        startIndex?: number;
        count?: number;
    };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const queue = await service.getQueue(startIndex, count);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(queue, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_add_to_queue
 */
export async function handleAddToQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, uri, metadata, position, playNext = false } = args as {
        deviceId: string;
        uri: string;
        metadata?: unknown;
        position?: number;
        playNext?: boolean;
    };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const trackNumber = await service.addToQueue({
        uri,
        metadata: metadata as string | DidlObject | undefined,
        position,
        playNext
    });

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    position: trackNumber,
                    message: `Added to queue at position ${trackNumber}`,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_remove_from_queue
 */
export async function handleRemoveFromQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, position } = args as { deviceId: string; position: number };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.removeFromQueue(position);

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Removed track at position ${position}`
                    : 'Failed to remove track from queue',
            },
        ],
    };
}

/**
 * Handle sonos_clear_queue
 */
export async function handleClearQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.removeAllTracksFromQueue();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Queue cleared' : 'Failed to clear queue',
            },
        ],
    };
}

/**
 * Handle sonos_play_from_queue
 */
export async function handlePlayFromQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, position } = args as { deviceId: string; position: number };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.playFromQueue(position);

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Playing from queue position ${position}`
                    : 'Failed to play from queue',
            },
        ],
    };
}

/**
 * Handle sonos_save_queue
 */
export async function handleSaveQueue(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, title } = args as { deviceId: string; title: string };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const playlistId = await service.saveQueue(title);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    objectId: playlistId,
                    title,
                    message: `Queue saved as playlist "${title}" (ID: ${playlistId})`,
                }),
            },
        ],
    };
}

/**
 * Handle sonos_set_shuffle
 */
export async function handleSetShuffle(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, shuffle } = args as { deviceId: string; shuffle: boolean };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.setShuffle(shuffle);

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Shuffle ${shuffle ? 'enabled' : 'disabled'}`
                    : 'Failed to set shuffle',
            },
        ],
    };
}

/**
 * Handle sonos_set_repeat
 */
export async function handleSetRepeat(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, mode } = args as { deviceId: string; mode: 'off' | 'all' | 'one' };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.setRepeat(mode);

    return {
        content: [
            {
                type: 'text',
                text: success ? `Repeat set to: ${mode}` : 'Failed to set repeat mode',
            },
        ],
    };
}

/**
 * Handle sonos_set_crossfade
 */
export async function handleSetCrossfade(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.setCrossFade(enabled);

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Crossfade ${enabled ? 'enabled' : 'disabled'}`
                    : 'Failed to set crossfade',
            },
        ],
    };
}

/**
 * Handle sonos_get_playback_state
 */
export async function handleGetPlaybackState(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);

    const [shuffle, repeat, crossfade, transportInfo] = await Promise.all([
        service.getShuffle(),
        service.getRepeat(),
        service.getCrossFade(),
        service.getTransportInfo(),
    ]);

    const state = {
        shuffle,
        repeat,
        crossfade,
        playbackState: transportInfo?.state,
        speed: transportInfo?.speed,
    };

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(state, null, 2),
            },
        ],
    };
}
