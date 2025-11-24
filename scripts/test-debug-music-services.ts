/**
 * Debug script to understand why music service browsing fails
 * 
 * This script:
 * 1. Lists all available music services
 * 2. Tries to browse Sonos Radio
 * 3. Tries to browse TuneIn with different container IDs
 * 4. Captures raw SOAP responses to understand the issue
 */

import { SonosDevice } from '../src/types/sonos.js';
import { MusicServicesService } from '../src/services/music-services.js';
import { MusicServiceRegistry } from '../src/discovery/music-service-registry.js';
import { SMAPIClient } from '../src/services/smapi-client.js';

async function debugMusicServices() {
    console.log('🔍 Debugging Music Services\n');

    const deviceIp = process.env.SONOS_DEVICE_IP || '192.168.178.149';
    const devicePort = parseInt(process.env.SONOS_DEVICE_PORT || '1400');

    const device: SonosDevice = {
        uuid: 'TEST_DEVICE',
        ip: deviceIp,
        port: devicePort,
        location: `http://${deviceIp}:${devicePort}/xml/device_description.xml`,
        name: 'Test Device',
    };

    console.log(`Using device: ${device.ip}:${device.port}\n`);

    try {
        // Step 1: List all available services
        console.log('═'.repeat(60));
        console.log('STEP 1: List All Available Music Services');
        console.log('═'.repeat(60));

        const musicService = new MusicServicesService(device);
        const services = await musicService.listAvailableServices();

        console.log(`\nFound ${services.length} music services:\n`);
        services.forEach((service, idx) => {
            console.log(`${idx + 1}. ${service.name}`);
            console.log(`   ID: ${service.id}`);
            console.log(`   Type: ${service.containerType}`);
            console.log(`   Auth: ${service.authType}`);
            console.log(`   URI: ${service.uri}`);
            console.log(`   Secure URI: ${service.secureUri || 'N/A'}`);
            console.log(`   Version: ${service.version}`);
            console.log('');
        });

        // Step 2: Try browsing Sonos Radio
        console.log('═'.repeat(60));
        console.log('STEP 2: Browse Sonos Radio');
        console.log('═'.repeat(60));

        const registry = new MusicServiceRegistry(device);
        await registry.discoverServices();

        const sonosRadio = await registry.getServiceByName('Sonos Radio');

        if (sonosRadio) {
            console.log(`\n✅ Found Sonos Radio (ID: ${sonosRadio.id})`);
            console.log(`   URI: ${sonosRadio.secureUri || sonosRadio.uri}`);
            console.log(`   Auth Type: ${sonosRadio.authType}`);
            console.log(`   Container Type: ${sonosRadio.containerType}\n`);

            const client = new SMAPIClient(sonosRadio);

            console.log('Trying getMetadata("root", 0, 10)...');
            const rootResponse = await client.getMetadata('root', 0, 10);
            console.log(`  Total: ${rootResponse.total}`);
            console.log(`  Count: ${rootResponse.count}`);
            console.log(`  Items: ${rootResponse.items.length}`);

            if (rootResponse.items.length > 0) {
                console.log('\n  Items returned:');
                rootResponse.items.forEach((item, idx) => {
                    console.log(`    ${idx + 1}. ${item.title} (ID: ${item.id})`);
                });
            } else {
                console.log('\n  ⚠️  No items returned from root');

                // Try some alternative container IDs
                const alternativeIds = ['', 'home', 'browse', 'stations', 'featured'];

                for (const containerId of alternativeIds) {
                    console.log(`\n  Trying containerId="${containerId}"...`);
                    try {
                        const altResponse = await client.getMetadata(containerId, 0, 10);
                        console.log(`    Total: ${altResponse.total}, Items: ${altResponse.items.length}`);
                        if (altResponse.items.length > 0) {
                            console.log('    ✅ Got results!');
                            altResponse.items.slice(0, 3).forEach((item, idx) => {
                                console.log(`      ${idx + 1}. ${item.title} (ID: ${item.id})`);
                            });
                        }
                    } catch (error) {
                        console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
        } else {
            console.log('\n❌ Sonos Radio not found in service list');
        }

        // Step 3: Try browsing TuneIn
        console.log('\n' + '═'.repeat(60));
        console.log('STEP 3: Browse TuneIn');
        console.log('═'.repeat(60));

        const tuneIn = await registry.getServiceByName('TuneIn');

        if (tuneIn) {
            console.log(`\n✅ Found TuneIn (ID: ${tuneIn.id})`);
            console.log(`   URI: ${tuneIn.secureUri || tuneIn.uri}`);
            console.log(`   Auth Type: ${tuneIn.authType}\n`);

            const client = new SMAPIClient(tuneIn);

            console.log('Trying getMetadata("root", 0, 10)...');
            const rootResponse = await client.getMetadata('root', 0, 10);
            console.log(`  Total: ${rootResponse.total}`);
            console.log(`  Count: ${rootResponse.count}`);
            console.log(`  Items: ${rootResponse.items.length}`);

            if (rootResponse.items.length > 0) {
                console.log('\n  ✅ Items returned from root:');
                rootResponse.items.forEach((item, idx) => {
                    const canPlay = 'canPlay' in item ? item.canPlay : false;
                    const canEnumerate = 'canEnumerate' in item ? item.canEnumerate : false;
                    console.log(`    ${idx + 1}. ${item.title}`);
                    console.log(`       ID: ${item.id}`);
                    console.log(`       Type: ${item.itemType}`);
                    console.log(`       Can Play: ${canPlay}, Can Enumerate: ${canEnumerate}`);
                });
            } else {
                console.log('\n  ⚠️  No items returned from root');
            }

            // Try search
            console.log('\n  Trying search("BBC")...');
            try {
                const searchResponse = await client.search('BBC', 0, 5);
                console.log(`    Total: ${searchResponse.total}, Items: ${searchResponse.items.length}`);
                if (searchResponse.items.length > 0) {
                    console.log('    ✅ Search results:');
                    searchResponse.items.forEach((item, idx) => {
                        console.log(`      ${idx + 1}. ${item.title} (ID: ${item.id})`);
                    });
                }
            } catch (error) {
                console.log(`    ❌ Search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } else {
            console.log('\n❌ TuneIn not found in service list');
        }

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        if (error instanceof Error && error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('Debug Complete');
    console.log('═'.repeat(60));
}

debugMusicServices();
