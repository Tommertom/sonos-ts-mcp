import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { AlarmClockService } from '../../services/alarm-clock.js';
import { AVTransportService } from '../../services/av-transport.js';

/**
 * Handle sonos_list_alarms
 */
export async function handleListAlarms(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new AlarmClockService(device);
    const alarms = await service.listAlarms();

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ alarms }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_create_alarm
 */
export async function handleCreateAlarm(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, startTime, recurrence, enabled = true, volume = 25, duration = '02:00:00' } = args as {
        deviceId: string;
        startTime: string;
        recurrence: string;
        enabled?: boolean;
        volume?: number;
        duration?: string;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new AlarmClockService(device);
    const alarmId = await service.createAlarm({
        startTime,
        recurrence,
        enabled,
        volume,
        duration,
    });

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ alarmId }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_update_alarm
 */
export async function handleUpdateAlarm(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, alarmId, ...updates } = args as {
        deviceId: string;
        alarmId: string;
        startTime?: string;
        recurrence?: string;
        enabled?: boolean;
        volume?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const service = new AlarmClockService(device);
    await service.updateAlarm(alarmId, updates);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, alarmId }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_delete_alarm
 */
export async function handleDeleteAlarm(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, alarmId } = args as { deviceId: string; alarmId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new AlarmClockService(device);
    await service.destroyAlarm(alarmId);

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, alarmId }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_set_sleep_timer
 */
export async function handleSetSleepTimer(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, duration } = args as { deviceId: string; duration: string };
    const device = context.resolver.resolve(deviceId);
    const service = new AVTransportService(device);
    await service.configureSleepTimer(duration);

    return {
        content: [
            {
                type: 'text',
                text: `Sleep timer set to ${duration}`,
            },
        ],
    };
}

/**
 * Handle sonos_get_sleep_timer
 */
export async function handleGetSleepTimer(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new AVTransportService(device);
    const remaining = await service.getSleepTimerRemaining();

    return {
        content: [
            {
                type: 'text',
                text: remaining ? `Sleep timer: ${remaining} remaining` : 'No sleep timer active',
            },
        ],
    };
}

/**
 * Handle sonos_cancel_sleep_timer
 */
export async function handleCancelSleepTimer(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new AVTransportService(device);
    await service.cancelSleepTimer();

    return {
        content: [
            {
                type: 'text',
                text: 'Sleep timer cancelled',
            },
        ],
    };
}
