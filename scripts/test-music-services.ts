/**
 * Test script for music service functionality
 * Tests: Service discovery, browsing, searching, and playback
 */

import { SsdpClient } from '../src/discovery/ssdp-client.js';
import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { MusicServicesService } from '../src/services/music-services.js';
import { MusicServiceRegistry } from '../src/discovery/music-service-registry.js';
import { SMAPIClient } from '../src/services/smapi-client.js';
import { AVTransportService } from '../src/services/av-transport.js';

async function testMusicServices() {
    console.log('🎵 Testing Music Services\n');

    // Setup
    const ssdpClient = new SsdpClient();
    const registry = new DeviceRegistry();

    console.log('Discovering Sonos devices...');
    const responses = await ssdpClient.discover(3000);

    if (responses.length === 0) {
        console.error('❌ No devices found. Please ensure Sonos devices are on the network.');
        return;
    }

    const device = registry.addFromDiscovery(responses[0]);
    if (!device) {
        console.error('❌ Failed to add device from discovery response.');
        return;
    }

    console.log(`✅ Using device: ${device.name || 'Unknown'} (${device.ip})\n`);

    // Test 1: List available music services
    console.log('Test 1: List Available Music Services');
    console.log('─'.repeat(60));
    try {
        const musicService = new MusicServicesService(device);
        const services = await musicService.listAvailableServices();

        console.log(`Found ${services.length} music services:`);
        for (const service of services) {
            console.log(`  - ${service.name} (ID: ${service.id}, Auth: ${service.authType})`);
        }
        console.log('✅ Service listing successful\n');
    } catch (error) {
        console.error('❌ Service listing failed:', error);
        console.log();
    }

    // Test 2: Use Music Service Registry
    console.log('Test 2: Music Service Registry');
    console.log('─'.repeat(60));
    try {
        const serviceRegistry = new MusicServiceRegistry(device);
        const services = await serviceRegistry.discoverServices();

        console.log(`Registry cached ${services.length} services`);

        // Test lookup by name
        const sonosRadio = await serviceRegistry.getServiceByName('Sonos Radio');
        if (sonosRadio) {
            console.log(`✅ Found Sonos Radio: ID ${sonosRadio.id}, URI: ${sonosRadio.secureUri || sonosRadio.uri}`);
        } else {
            console.log('⚠️  Sonos Radio not found');
        }

        const tuneIn = await serviceRegistry.getServiceByName('TuneIn');
        if (tuneIn) {
            console.log(`✅ Found TuneIn: ID ${tuneIn.id}, URI: ${tuneIn.secureUri || tuneIn.uri}`);
        } else {
            console.log('⚠️  TuneIn not found');
        }
        console.log();
    } catch (error) {
        console.error('❌ Registry test failed:', error);
        console.log();
    }

    // Test 3: Browse Sonos Radio
    console.log('Test 3: Browse Sonos Radio (root)');
    console.log('─'.repeat(60));
    try {
        const serviceRegistry = new MusicServiceRegistry(device);
        const sonosRadio = await serviceRegistry.getServiceByName('Sonos Radio');

        if (sonosRadio) {
            const client = new SMAPIClient(sonosRadio);
            const response = await client.getMetadata('root', 0, 10);

            console.log(`Total items: ${response.total}`);
            console.log(`Returned: ${response.count} items\n`);

            for (const item of response.items) {
                if ('canEnumerate' in item) {
                    console.log(`  📁 ${item.title} (ID: ${item.id}, Type: ${item.itemType})`);
                } else {
                    console.log(`  🎵 ${item.title} (ID: ${item.id}, Type: ${item.itemType})`);
                }
            }
            console.log('✅ Browse successful\n');
        } else {
            console.log('⚠️  Sonos Radio not available, skipping browse test\n');
        }
    } catch (error) {
        console.error('❌ Browse failed:', error);
        console.log();
    }

    // Test 4: Search TuneIn
    console.log('Test 4: Search TuneIn for "BBC"');
    console.log('─'.repeat(60));
    try {
        const serviceRegistry = new MusicServiceRegistry(device);
        const tuneIn = await serviceRegistry.getServiceByName('TuneIn');

        if (tuneIn) {
            const client = new SMAPIClient(tuneIn);
            const response = await client.search('BBC', 0, 5);

            console.log(`Total results: ${response.total}`);
            console.log(`Returned: ${response.count} items\n`);

            for (const item of response.items) {
                if ('artist' in item && item.artist) {
                    console.log(`  🎵 ${item.title} - ${item.artist} (ID: ${item.id})`);
                } else {
                    console.log(`  🎵 ${item.title} (ID: ${item.id})`);
                }
            }
            console.log('✅ Search successful\n');
        } else {
            console.log('⚠️  TuneIn not available, skipping search test\n');
        }
    } catch (error) {
        console.error('❌ Search failed:', error);
        console.log();
    }

    // Test 5: Get Media URI
    console.log('Test 5: Get Media URI (if search found results)');
    console.log('─'.repeat(60));
    try {
        const serviceRegistry = new MusicServiceRegistry(device);
        const tuneIn = await serviceRegistry.getServiceByName('TuneIn');

        if (tuneIn) {
            const client = new SMAPIClient(tuneIn);
            const response = await client.search('BBC Radio 1', 0, 1);

            if (response.items.length > 0) {
                const firstItem = response.items[0];
                console.log(`Getting URI for: ${firstItem.title} (ID: ${firstItem.id})`);

                const uri = await client.getMediaURI(firstItem.id);
                if (uri) {
                    console.log(`✅ Media URI: ${uri}\n`);
                } else {
                    console.log('⚠️  No URI returned\n');
                }
            } else {
                console.log('⚠️  No search results to get URI from\n');
            }
        } else {
            console.log('⚠️  TuneIn not available, skipping URI test\n');
        }
    } catch (error) {
        console.error('❌ Get URI failed:', error);
        console.log();
    }

    // Test 6: End-to-end playback test (optional, commented out by default)
    console.log('Test 6: End-to-End Playback (SKIPPED)');
    console.log('─'.repeat(60));
    console.log('⚠️  Playback test is commented out to avoid unexpected audio playback');
    console.log('   Uncomment the code in test-music-services.ts to enable\n');

    /*
    try {
        const serviceRegistry = new MusicServiceRegistry(device);
        const tuneIn = await serviceRegistry.getServiceByName('TuneIn');
        
        if (tuneIn) {
            const client = new SMAPIClient(tuneIn);
            const response = await client.search('BBC Radio 1', 0, 1);
            
            if (response.items.length > 0) {
                const firstItem = response.items[0];
                const uri = await client.getMediaURI(firstItem.id);
                
                if (uri) {
                    const avTransport = new AVTransportService(device);
                    
                    // Build DIDL metadata
                    const didl = `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
                        <item id="${firstItem.id}" parentID="" restricted="true">
                            <dc:title>${firstItem.title}</dc:title>
                            <upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
                            <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${tuneIn.id}_</desc>
                        </item>
                    </DIDL-Lite>`;
                    
                    await avTransport.setAVTransportURI(uri, didl);
                    await avTransport.play();
                    
                    console.log(`✅ Now playing: ${firstItem.title}`);
                    console.log('   Stopping in 5 seconds...');
                    
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await avTransport.stop();
                    
                    console.log('✅ Playback test successful\n');
                }
            }
        }
    } catch (error) {
        console.error('❌ Playback test failed:', error);
        console.log();
    }
    */

    console.log('═'.repeat(60));
    console.log('🎵 Music Services Testing Complete');
    console.log('═'.repeat(60));
}

// Run tests
testMusicServices().catch(console.error);
