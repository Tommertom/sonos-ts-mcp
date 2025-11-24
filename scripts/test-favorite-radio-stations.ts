/**
 * Test script for favorite radio stations feature
 * 
 * This script demonstrates how to use the sonos_get_favorite_radio_stations tool
 * to retrieve and display saved radio stations from Sonos favorites.
 * 
 * Usage:
 *   tsx scripts/test-favorite-radio-stations.ts
 */

import { SonosDevice } from '../src/types/sonos.js';
import { ContentDirectoryService } from '../src/services/content-directory.js';

async function testFavoriteRadioStations() {
    console.log('=== Testing Favorite Radio Stations Feature ===\n');

    // Check if a device IP is provided via environment variable
    const deviceIp = process.env.SONOS_DEVICE_IP || '192.168.178.149';
    const devicePort = parseInt(process.env.SONOS_DEVICE_PORT || '1400');

    console.log(`Using Sonos device at ${deviceIp}:${devicePort}\n`);

    // Create a test device
    const device: SonosDevice = {
        uuid: 'TEST_DEVICE',
        ip: deviceIp,
        port: devicePort,
        location: `http://${deviceIp}:${devicePort}/xml/device_description.xml`,
        name: 'Test Device',
    };

    try {
        // Test the ContentDirectoryService
        const service = new ContentDirectoryService(device);

        console.log('Fetching favorite radio stations...\n');
        const result = await service.getFavoriteRadioStations({ startIndex: 0, count: 100 });

        console.log(`Total stations found: ${result.total}`);
        console.log(`Stations returned: ${result.returned}\n`);

        if (result.items.length === 0) {
            console.log('ℹ️  No favorite radio stations found.');
            console.log('   To test this feature with data:');
            console.log('   1. Open the Sonos app');
            console.log('   2. Navigate to Browse > Radio');
            console.log('   3. Find a station and add it to "My Sonos"');
            console.log('   4. Run this test again\n');
        } else {
            console.log('📻 Favorite Radio Stations:\n');
            result.items.forEach((station, index) => {
                console.log(`${index + 1}. ${station.title}`);
                console.log(`   ID: ${station.id}`);
                console.log(`   URI: ${station.resources[0]?.uri || 'N/A'}`);
                console.log(`   Type: ${station.upnpClass}`);
                console.log('');
            });

            // Example: How to play a radio station
            if (result.items.length > 0) {
                console.log('💡 Example: To play the first station, you would:\n');
                console.log('   1. Call sonos_add_to_queue with:');
                console.log(`      - uri: "${result.items[0].resources[0]?.uri}"`);
                console.log('      - position: "next"');
                console.log('   2. Call sonos_next to skip to it');
                console.log('   3. Call sonos_play to start playback\n');
            }
        }

        console.log('✅ Test completed successfully!\n');
    } catch (error) {
        console.error('❌ Error testing favorite radio stations:');
        if (error instanceof Error) {
            console.error(`   ${error.message}`);
            if (error.stack) {
                console.error('\nStack trace:');
                console.error(error.stack);
            }
        } else {
            console.error('   Unknown error occurred');
        }
        process.exit(1);
    }
}

// Run the test
testFavoriteRadioStations().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
