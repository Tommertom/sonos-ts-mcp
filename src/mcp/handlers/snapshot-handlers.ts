import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { SnapshotService } from '../../services/snapshot.js';

/**
 * Handle sonos_snapshot
 */
export async function handleSnapshot(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new SnapshotService(device);
    const snapshot = await service.snapshot();

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ snapshot }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_restore_snapshot
 */
export async function handleRestoreSnapshot(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, snapshot: snapshotJson, fade = false } = args as {
        deviceId: string;
        snapshot: string;
        fade?: boolean;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new SnapshotService(device);
    const snapshot = JSON.parse(snapshotJson);
    await service.restore(snapshot, fade);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true }, null, 2),
            },
        ],
    };
}
