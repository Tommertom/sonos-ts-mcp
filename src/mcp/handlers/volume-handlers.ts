import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { RenderingControlService } from '../../services/rendering-control.js';

/**
 * Handle sonos_set_volume
 */
export async function handleSetVolume(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, volume } = args as { deviceId: string; volume: number };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    const success = await service.setVolume(volume);

    return {
        content: [
            {
                type: 'text',
                text: success ? `Volume set to ${volume}` : 'Failed to set volume',
            },
        ],
    };
}

/**
 * Handle sonos_get_volume
 */
export async function handleGetVolume(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    const volume = await service.getVolume();

    return {
        content: [
            {
                type: 'text',
                text: volume !== null ? `Volume: ${volume}` : 'Failed to get volume',
            },
        ],
    };
}

/**
 * Handle sonos_set_mute
 */
export async function handleSetMute(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, mute } = args as { deviceId: string; mute: boolean };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    const success = await service.setMute(mute);

    return {
        content: [
            {
                type: 'text',
                text: success ? `Mute ${mute ? 'enabled' : 'disabled'}` : 'Failed to set mute',
            },
        ],
    };
}

/**
 * Handle sonos_set_bass
 */
export async function handleSetBass(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, bass } = args as { deviceId: string; bass: number };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    await service.setBass(bass);

    return {
        content: [
            {
                type: 'text',
                text: `Set bass to ${bass}`,
            },
        ],
    };
}

/**
 * Handle sonos_set_treble
 */
export async function handleSetTreble(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, treble } = args as { deviceId: string; treble: number };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    await service.setTreble(treble);

    return {
        content: [
            {
                type: 'text',
                text: `Set treble to ${treble}`,
            },
        ],
    };
}

/**
 * Handle sonos_set_loudness
 */
export async function handleSetLoudness(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    await service.setLoudness(enabled);

    return {
        content: [
            {
                type: 'text',
                text: `Loudness ${enabled ? 'enabled' : 'disabled'}`,
            },
        ],
    };
}

/**
 * Handle sonos_get_eq
 */
export async function handleGetEQ(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);

    const bass = await service.getBass();
    const treble = await service.getTreble();
    const loudness = await service.getLoudness();

    return {
        content: [
            {
                type: 'text',
                text: `EQ Settings:\nBass: ${bass}\nTreble: ${treble}\nLoudness: ${loudness ? 'enabled' : 'disabled'}`,
            },
        ],
    };
}

/**
 * Handle sonos_set_night_mode
 */
export async function handleSetNightMode(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    await service.setNightMode(enabled);

    return {
        content: [
            {
                type: 'text',
                text: `Night mode ${enabled ? 'enabled' : 'disabled'}`,
            },
        ],
    };
}

/**
 * Handle sonos_set_dialog_mode
 */
export async function handleSetDialogMode(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
    const device = context.resolver.resolve(deviceId);
    const service = new RenderingControlService(device);
    await service.setDialogLevel(enabled);

    return {
        content: [
            {
                type: 'text',
                text: `Dialog enhancement ${enabled ? 'enabled' : 'disabled'}`,
            },
        ],
    };
}
