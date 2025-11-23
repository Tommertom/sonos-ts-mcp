import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { AVTransportService } from '../../services/av-transport.js';

/**
 * Handle sonos_play
 */
export async function handlePlay(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.play();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Playback started' : 'Failed to start playback',
            },
        ],
    };
}

/**
 * Handle sonos_pause
 */
export async function handlePause(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.pause();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Playback paused' : 'Failed to pause playback',
            },
        ],
    };
}

/**
 * Handle sonos_stop
 */
export async function handleStop(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.stop();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Playback stopped' : 'Failed to stop playback',
            },
        ],
    };
}

/**
 * Handle sonos_next
 */
export async function handleNext(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.next();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Skipped to next track' : 'Failed to skip track',
            },
        ],
    };
}

/**
 * Handle sonos_previous
 */
export async function handlePrevious(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const success = await service.previous();

    return {
        content: [
            {
                type: 'text',
                text: success ? 'Skipped to previous track' : 'Failed to skip track',
            },
        ],
    };
}

/**
 * Handle sonos_get_transport_info
 */
export async function handleGetTransportInfo(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const info = await service.getTransportInfo();

    return {
        content: [
            {
                type: 'text',
                text: info ? JSON.stringify(info, null, 2) : 'Failed to get transport info',
            },
        ],
    };
}

/**
 * Handle sonos_get_position_info
 */
export async function handleGetPositionInfo(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new AVTransportService(device);
    const info = await service.getPositionInfo();

    return {
        content: [
            {
                type: 'text',
                text: info ? JSON.stringify(info, null, 2) : 'Failed to get position info',
            },
        ],
    };
}
