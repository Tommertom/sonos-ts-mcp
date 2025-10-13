#!/usr/bin/env node
import { SsdpClient } from './src/discovery/ssdp-client.js';
import { DeviceRegistry } from './src/discovery/device-registry.js';
import { AVTransportService } from './src/services/av-transport.js';

async function testDiscovery() {
    console.log('Starting Sonos device discovery...\n');

    const client = new SsdpClient();
    const registry = new DeviceRegistry();

    // Add event listener to see if we're receiving any responses
    client.on('device', (response) => {
        console.log('Device response received:', response);
    });

    try {
        console.log('Sending SSDP M-SEARCH multicast...');
        const responses = await client.discover(5000);
        console.log(`Discovery complete. Found ${responses.length} device(s)\n`);

        for (const response of responses) {
            const device = registry.addFromDiscovery(response);
            if (device) {
                console.log('Device discovered:');
                console.log(`  UUID: ${device.uuid}`);
                console.log(`  IP: ${device.ip}`);
                console.log(`  Port: ${device.port}`);
                console.log(`  Location: ${device.location}\n`);

                // Try to get transport info
                const transportService = new AVTransportService(device);
                const transportInfo = await transportService.getTransportInfo();

                if (transportInfo) {
                    console.log('  Transport State:', transportInfo.state);
                    console.log('  Transport Status:', transportInfo.status);

                    if (transportInfo.state === 'PLAYING') {
                        const positionInfo = await transportService.getPositionInfo();
                        if (positionInfo?.track) {
                            console.log('\n  Currently Playing:');
                            console.log(`    Title: ${positionInfo.track.title}`);
                            console.log(`    Artist: ${positionInfo.track.artist}`);
                            console.log(`    Album: ${positionInfo.track.album}`);
                            console.log(`    Position: ${positionInfo.position || 'N/A'}`);
                            console.log(`    Duration: ${positionInfo.track.duration}`);
                        }
                    }
                }
                console.log('\n---\n');
            }
        }

        if (responses.length === 0) {
            console.log('No Sonos devices found. Make sure:');
            console.log('  - Sonos devices are powered on');
            console.log('  - You are on the same network');
            console.log('  - Multicast is enabled on your network');
        }
    } catch (error) {
        console.error('Discovery failed:', error);
    }
}

testDiscovery().catch(console.error);
