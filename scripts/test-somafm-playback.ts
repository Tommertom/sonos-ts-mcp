#!/usr/bin/env tsx
import 'dotenv/config';
import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { MusicServiceRegistry } from '../src/discovery/music-service-registry.js';
import { SMAPIClient } from '../src/services/smapi-client.js';
import { AVTransportService } from '../src/services/av-transport.js';

async function testSomaFMPlayback() {
    console.log('Testing SomaFM Radio playback...\n');

    // Setup device registry
    const registry = new DeviceRegistry();
    await registry.loadPersistedDevices();

    const devices = registry.getAllDevices();
    if (devices.length === 0) {
        console.error('No Sonos devices found');
        return;
    }

    const device = devices[0];
    console.log(`Using device: ${device!.name} (${device!.ip})\n`);

    // Get music services
    const musicServiceRegistry = new MusicServiceRegistry(device);
    const services = await musicServiceRegistry.discoverServices(true);
    console.log(`Found ${services.length} music services\n`);

    // Find SomaFM
    const somaFM = services.find(s => s.name === 'SomaFM Radio');
    if (!somaFM) {
        console.error('SomaFM Radio not found');
        return;
    }

    console.log(`SomaFM Service:`, {
        id: somaFM.id,
        name: somaFM.name,
        uri: somaFM.uri,
        secureUri: somaFM.secureUri,
        version: somaFM.version,
        authType: somaFM.authType
    });
    console.log('');

    // Browse root
    const client = new SMAPIClient(somaFM);
    console.log('Browsing SomaFM root...');
    const rootBrowse = await client.getMetadata('root', 0, 10);
    console.log(`Found ${rootBrowse.items.length} items at root`);

    rootBrowse.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.title} (${item.id}) - type: ${item.itemType}, canPlay: ${'canPlay' in item ? item.canPlay : 'N/A'}, canEnumerate: ${'canEnumerate' in item ? item.canEnumerate : 'N/A'}`);
    });
    console.log('');

    // Try browsing "by_popularity" container
    const popularContainer = rootBrowse.items.find(item => item.id === 'by_popularity');
    if (popularContainer && 'canEnumerate' in popularContainer && popularContainer.canEnumerate) {
        console.log(`Browsing "by_popularity" container...`);
        const popularBrowse = await client.getMetadata('by_popularity', 0, 10);
        console.log(`Found ${popularBrowse.items.length} stations`);

        popularBrowse.items.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.title} (${item.id}) - type: ${item.itemType}, canPlay: ${'canPlay' in item ? item.canPlay : 'N/A'}`);
        });
        console.log('');

        // Pick the first station
        if (popularBrowse.items.length > 0) {
            const station = popularBrowse.items[0];
            console.log(`\nTesting playback of: ${station.title} (${station.id})`);

            // Try getExtendedMetadata
            console.log(`\nGetting extended metadata for ${station.id}...`);
            const extendedMeta = await client.getExtendedMetadata(station.id);
            if (extendedMeta) {
                console.log('Extended metadata:', JSON.stringify(extendedMeta, null, 2));
            } else {
                console.log('No extended metadata returned');
            }

            // Try getMediaURI
            console.log(`\nGetting media URI for ${station.id}...`);
            const uri = await client.getMediaURI(station.id);

            if (uri) {
                console.log(`Got URI: ${uri}`);

                // Try to play it
                const didl = `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
                    <item id="${station.id}" parentID="" restricted="true">
                        <dc:title>${station.title.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</dc:title>
                        <upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
                        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${somaFM.id}_</desc>
                    </item>
                </DIDL-Lite>`;

                console.log('\nAttempting to play...');
                const avTransport = new AVTransportService(device);
                await avTransport.setAVTransportURI(uri, didl);
                await avTransport.play();
                console.log('✓ Playback started successfully!');
            } else {
                console.log('✗ Failed to get media URI');

                // Let's try to see what the raw SOAP response is
                console.log('\nDebugging: Let me check the raw SOAP response...');
                const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getMediaURI xmlns="http://www.sonos.com/Services/1.1">
            <id>${station.id}</id>
        </getMediaURI>
    </s:Body>
</s:Envelope>`;

                const endpoint = somaFM.secureUri || somaFM.uri;
                console.log(`Endpoint: ${endpoint}`);
                console.log(`Request body:`, soapBody);

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/xml; charset=utf-8',
                            'SOAPAction': '"http://www.sonos.com/Services/1.1#getMediaURI"',
                        },
                        body: soapBody,
                    });

                    console.log(`Response status: ${response.status} ${response.statusText}`);
                    const responseText = await response.text();
                    console.log(`Response body:`, responseText);
                } catch (error) {
                    console.error('Error making request:', error);
                }
            }
        }
    }
}

testSomaFMPlayback().catch(console.error);
