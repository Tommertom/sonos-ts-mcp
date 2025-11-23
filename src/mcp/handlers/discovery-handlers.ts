import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { SsdpClient } from '../../discovery/ssdp-client.js';
import { SoapClient } from '../../soap/client.js';
import { RequestBuilder } from '../../soap/request-builder.js';

/**
 * Handle sonos_discover - Discover Sonos devices on the network
 */
export async function handleDiscover(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const timeout = typeof args === 'object' && args !== null && 'timeout' in args
        ? (args.timeout as number)
        : 5000;

    const client = new SsdpClient();
    const responses = await client.discover(timeout);

    for (const response of responses) {
        const device = context.registry.addFromDiscovery(response);
        if (device) {
            // Fetch full device details
            await context.fetchDeviceDetails(device);
        }
    }

    const devices = context.registry.getAllDevices();

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    message: `Discovered ${responses.length} Sonos device(s)`,
                    devices: devices,
                }, null, 2),
            },
        ],
    };
}

/**
 * Handle sonos_add_device - Manually add a device by IP
 */
export async function handleAddDevice(args: unknown, context: ServerContext): Promise<ToolResponse> {
    if (typeof args !== 'object' || args === null || !('ip' in args)) {
        throw new Error('IP address is required');
    }

    const ip = args.ip as string;
    const port = 'port' in args ? (args.port as number) : 1400;
    const name = 'name' in args ? (args.name as string) : undefined;

    const soapClient = new SoapClient();
    const body = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
    const response = await soapClient.call({
        ip,
        port,
        endpoint: '/MediaRenderer/AVTransport/Control',
        service: 'urn:schemas-upnp-org:service:AVTransport:1',
        action: 'GetTransportInfo',
        body,
    });

    if (!response.success) {
        throw new Error(`Cannot reach Sonos device at ${ip}:${port}`);
    }

    // Fetch the device description to get the real UUID
    let deviceUuid: string | undefined;
    try {
        const descriptionUrl = `http://${ip}:${port}/xml/device_description.xml`;
        const descResponse = await fetch(descriptionUrl);
        if (descResponse.ok) {
            const xml = await descResponse.text();
            // Extract UUID from <UDN>uuid:RINCON_xxxxx</UDN>
            const udnMatch = /<UDN>uuid:([^<]+)<\/UDN>/i.exec(xml);
            if (udnMatch) {
                deviceUuid = udnMatch[1];
            }
        }
    } catch (error) {
        // If we can't fetch the UUID, we'll use a fallback
        console.warn(`Could not fetch device UUID for ${ip}:${port}`, error);
    }

    context.registry.addManualDevice(ip, port, name, deviceUuid);

    return {
        content: [
            {
                type: 'text',
                text: `Successfully added Sonos device at ${ip}${deviceUuid ? ` (UUID: ${deviceUuid})` : ''}`,
            },
        ],
    };
}

/**
 * Handle sonos_list_devices - List all registered devices
 */
export function handleListDevices(_args: unknown, context: ServerContext): Promise<ToolResponse> {
    const devices = context.registry.getAllDevices();

    return Promise.resolve({
        content: [
            {
                type: 'text',
                text: JSON.stringify(devices, null, 2),
            },
        ],
    });
}
