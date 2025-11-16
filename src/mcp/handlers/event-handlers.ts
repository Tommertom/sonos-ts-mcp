import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { getDefaultManager } from '../../events/subscription-manager.js';

/**
 * Helper to convert endpoint to service name
 */
function endpointToServiceName(endpoint: string): string {
    if (endpoint.includes('AVTransport')) return 'AVTransport';
    if (endpoint.includes('RenderingControl')) return 'RenderingControl';
    if (endpoint.includes('Queue')) return 'Queue';
    if (endpoint.includes('ZoneGroupTopology')) return 'ZoneGroupTopology';
    if (endpoint.includes('AlarmClock')) return 'AlarmClock';
    return 'Unknown';
}

/**
 * Handle sonos_subscribe_events
 */
export async function handleSubscribeEvents(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, service, timeout = 1800 } = args as {
        deviceId: string;
        service: string;
        timeout?: number;
    };
    const device = context.resolver.resolve(deviceId);
    const manager = getDefaultManager();

    // Map service names to endpoints
    const serviceEndpoints: Record<string, string> = {
        'AVTransport': '/MediaRenderer/AVTransport/Event',
        'RenderingControl': '/MediaRenderer/RenderingControl/Event',
        'Queue': '/MediaRenderer/Queue/Event',
        'ZoneGroupTopology': '/ZoneGroupTopology/Event',
        'AlarmClock': '/AlarmClock/Event',
    };

    const endpoint = serviceEndpoints[service];
    if (!endpoint) {
        throw new Error(`Unknown service: ${service}. Valid services: ${Object.keys(serviceEndpoints).join(', ')}`);
    }

    // Subscribe to events
    const subscriptionId = await manager.subscribe(device, endpoint, { timeout });

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    subscriptionId,
                    service,
                    endpoint,
                    timeout,
                    message: `Subscribed to ${service} events`,
                }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_unsubscribe_events
 */
export async function handleUnsubscribeEvents(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, subscriptionId } = args as {
        deviceId: string;
        subscriptionId: string;
    };
    const device = context.resolver.resolve(deviceId);
    const manager = getDefaultManager();

    await manager.unsubscribe(device, subscriptionId);

    return {
        content: [
            {
                type: 'text',
                text: `Unsubscribed from subscription: ${subscriptionId}`,
            },
        ],
    };
}

/**
 * Handle sonos_unsubscribe_all
 */
export async function handleUnsubscribeAll(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const manager = getDefaultManager();

    await manager.unsubscribeDevice(device);

    return {
        content: [
            {
                type: 'text',
                text: `Unsubscribed from all events for device: ${device.name || deviceId}`,
            },
        ],
    };
}

/**
 * Handle sonos_list_subscriptions
 */
export async function handleListSubscriptions(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const manager = getDefaultManager();

    const deviceIdKey = device.uuid || device.ip;
    const subscriptions = manager.getDeviceSubscriptions(deviceIdKey);

    const subscriptionList = subscriptions.map(sub => ({
        subscriptionId: sub.sid,
        endpoint: sub.endpoint,
        service: endpointToServiceName(sub.endpoint),
        timeout: sub.timeout,
        renewAt: sub.renewAt,
    }));

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    deviceId: deviceIdKey,
                    subscriptions: subscriptionList,
                    count: subscriptions.length,
                }, null, 2),
            },
        ],
    };
}
