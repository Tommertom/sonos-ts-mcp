import type { ServerContext, ToolResponse } from '../types/handler-types.js';
import { ZoneGroupTopologyService } from '../../services/zone-topology.js';

/**
 * Handle sonos_get_zone_groups
 */
export async function handleGetZoneGroups(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new ZoneGroupTopologyService(device);
    const groups = await service.getZoneGroupState();

    return {
        content: [
            {
                type: 'text',
                text: groups ? JSON.stringify(groups, null, 2) : 'Failed to get zone groups',
            },
        ],
    };
}

/**
 * Handle sonos_join_group
 */
export async function handleJoinGroup(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId, masterDeviceId } = args as { deviceId: string; masterDeviceId: string };
    const device = await context.resolveDevice(deviceId);
    const masterDevice = await context.resolveDevice(masterDeviceId);

    const service = new ZoneGroupTopologyService(device);
    const success = await service.join(masterDevice.uuid);

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Device ${device.name || device.ip} joined group with ${masterDevice.name || masterDevice.ip}`
                    : 'Failed to join group',
            },
        ],
    };
}

/**
 * Handle sonos_unjoin
 */
export async function handleUnjoin(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const deviceId = (args as { deviceId: string }).deviceId;
    const device = await context.resolveDevice(deviceId);
    const service = new ZoneGroupTopologyService(device);
    const success = await service.unjoin();

    return {
        content: [
            {
                type: 'text',
                text: success
                    ? `Device ${device.name || device.ip} removed from group`
                    : 'Failed to unjoin from group',
            },
        ],
    };
}

/**
 * Handle sonos_party_mode
 */
export async function handlePartyMode(args: unknown, context: ServerContext): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = await context.resolveDevice(deviceId);
    const topologyService = new ZoneGroupTopologyService(device);

    // Get all groups and join all other devices to this one
    const groups = await topologyService.getZoneGroupState();
    if (!groups) {
        throw new Error('Failed to get zone groups');
    }

    const thisDeviceUuid = device.uuid;
    const joinedDevices: string[] = [];

    // Find all devices that are not already in this device's group
    const thisGroup = groups.find(g => g.members.includes(thisDeviceUuid));
    const currentMembers = thisGroup?.members ?? [thisDeviceUuid];

    // Collect all other devices and join them
    for (const group of groups) {
        for (const memberUuid of group.members) {
            if (!currentMembers.includes(memberUuid) && memberUuid !== thisDeviceUuid) {
                try {
                    // Get the device from registry
                    const memberDevice = context.registry.getDevice(memberUuid);
                    if (memberDevice) {
                        const memberTopology = new ZoneGroupTopologyService(memberDevice);
                        await memberTopology.join(thisDeviceUuid);
                        joinedDevices.push(memberUuid);
                    }
                } catch (error) {
                    console.error(`Failed to join device ${memberUuid}:`, error);
                }
            }
        }
    }

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ success: true, joinedDevices }, null, 2),
            },
        ],
    };
}
