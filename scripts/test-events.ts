/**
 * Test script for event subscriptions
 * Usage: tsx scripts/test-events.ts [device-ip]
 */

import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { SsdpClient } from '../src/discovery/ssdp-client.js';
import { AVTransportService } from '../src/services/av-transport.js';
import { RenderingControlService } from '../src/services/rendering-control.js';
import { getDefaultManager } from '../src/events/subscription-manager.js';
import type { PlayStateEvent, VolumeEvent, MuteEvent, CurrentTrackEvent, AVTransportEvent, RenderingControlEvent } from '../src/types/events.js';

const deviceIp = process.argv[2];
const registry = new DeviceRegistry();

async function main() {
    console.log('=== Sonos Event Subscription Test ===\n');

    // Get device
    let device;
    if (deviceIp) {
        console.log(`Using device at ${deviceIp}`);
        device = registry.addManualDevice(deviceIp, 1400);
    } else {
        console.log('Discovering devices...');
        const ssdp = new SsdpClient();
        const responses = await ssdp.discover(3000);

        for (const response of responses) {
            registry.addFromDiscovery(response);
        }

        const devices = registry.getAllDevices();

        if (devices.length === 0) {
            console.error('No devices found. Specify an IP address as argument.');
            process.exit(1);
        }

        device = devices[0];
        console.log(`Using device: ${device.uuid || device.ip}`);
    }

    console.log('');

    // Create services
    const avTransport = new AVTransportService(device);
    const renderingControl = new RenderingControlService(device);
    const manager = getDefaultManager();

    // Register event handlers with proper types
    console.log('Registering event handlers...\n');

    manager.on<PlayStateEvent>('PlayState', (event) => {
        console.log(`[PlayState] State: ${event.state}`);
    });

    manager.on<VolumeEvent>('Volume', (event) => {
        console.log(`[Volume] Volume: ${event.volume}`);
    });

    manager.on<MuteEvent>('Mute', (event) => {
        console.log(`[Mute] Muted: ${event.mute}`);
    });

    manager.on<CurrentTrackEvent>('CurrentTrack', (event) => {
        console.log(`[CurrentTrack] ${event.artist || 'Unknown'} - ${event.title || 'Unknown'}`);
    });

    manager.on<AVTransportEvent>('AVTransport', (event) => {
        console.log(`[AVTransport] State: ${event.transportState || 'unknown'}`);
    });

    manager.on<RenderingControlEvent>('RenderingControl', (event) => {
        console.log(`[RenderingControl] Volume: ${event.volume}, Mute: ${event.mute}`);
    });

    // Subscribe to events
    console.log('Subscribing to events...\n');

    try {
        const avTransportSid = await avTransport.subscribe();
        console.log(`✓ Subscribed to AVTransport events (SID: ${avTransportSid})`);

        const renderingControlSid = await renderingControl.subscribe();
        console.log(`✓ Subscribed to RenderingControl events (SID: ${renderingControlSid})`);
    } catch (error) {
        console.error('Error subscribing to events:', error);
        process.exit(1);
    }

    console.log('\nListening for events... (Press Ctrl+C to stop)\n');
    console.log('Try changing volume, playback state, or tracks on your Sonos device.\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\nShutting down...');

        try {
            await manager.unsubscribeAll();
            console.log('✓ Unsubscribed from all events');
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }

        process.exit(0);
    });

    // Keep the script running
    await new Promise(() => { }); // Wait forever
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
