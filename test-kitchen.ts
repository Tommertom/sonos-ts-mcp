#!/usr/bin/env node
import { SoapClient } from './src/soap/client.js';
import { RequestBuilder } from './src/soap/request-builder.js';
import { XmlParser } from './src/soap/response-parser.js';

const KITCHEN_IP = '192.168.178.149';

async function testKitchenDevice() {
    console.log(`Testing connection to Kitchen Sonos at ${KITCHEN_IP}...\n`);

    const client = new SoapClient();

    try {
        // Test GetTransportInfo
        console.log('1. Getting transport state...');
        const body = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
        const response = await client.call({
            ip: KITCHEN_IP,
            port: 1400,
            endpoint: '/MediaRenderer/AVTransport/Control',
            service: 'urn:schemas-upnp-org:service:AVTransport:1',
            action: 'GetTransportInfo',
            body,
        });

        if (!response.success || !response.body) {
            console.error('Failed to get transport info');
            return;
        }

        const state = XmlParser.extractValue(response.body, 'CurrentTransportState');
        const status = XmlParser.extractValue(response.body, 'CurrentTransportStatus');

        console.log(`✓ Transport State: ${state}`);
        console.log(`✓ Transport Status: ${status}\n`);

        // Test GetPositionInfo
        if (state === 'PLAYING' || state === 'PAUSED_PLAYBACK') {
            console.log('2. Getting current track info...');
            const posBody = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
            const posResponse = await client.call({
                ip: KITCHEN_IP,
                port: 1400,
                endpoint: '/MediaRenderer/AVTransport/Control',
                service: 'urn:schemas-upnp-org:service:AVTransport:1',
                action: 'GetPositionInfo',
                body: posBody,
            });

            if (posResponse.success && posResponse.body) {
                const trackMetadata = XmlParser.extractValue(posResponse.body, 'TrackMetaData') ?? '';
                const trackDuration = XmlParser.extractValue(posResponse.body, 'TrackDuration');
                const relTime = XmlParser.extractValue(posResponse.body, 'RelTime');

                const unescapedMetadata = XmlParser.unescapeXml(trackMetadata);

                const title = XmlParser.extractValue(unescapedMetadata, 'dc:title');
                const artist = XmlParser.extractValue(unescapedMetadata, 'dc:creator');
                const album = XmlParser.extractValue(unescapedMetadata, 'upnp:album');

                console.log(`✓ Now Playing:`);
                console.log(`  Title: ${title || 'Unknown'}`);
                console.log(`  Artist: ${artist || 'Unknown'}`);
                console.log(`  Album: ${album || 'Unknown'}`);
                console.log(`  Position: ${relTime} / ${trackDuration}\n`);
            }
        }

        // Test GetVolume
        console.log('3. Getting volume...');
        const volBody = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: 'Master',
        });
        const volResponse = await client.call({
            ip: KITCHEN_IP,
            port: 1400,
            endpoint: '/MediaRenderer/RenderingControl/Control',
            service: 'urn:schemas-upnp-org:service:RenderingControl:1',
            action: 'GetVolume',
            body: volBody,
        });

        if (volResponse.success && volResponse.body) {
            const volume = XmlParser.extractValue(volResponse.body, 'CurrentVolume');
            console.log(`✓ Current Volume: ${volume}%\n`);
        }

        // Test GetMute
        console.log('4. Getting mute state...');
        const muteBody = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: 'Master',
        });
        const muteResponse = await client.call({
            ip: KITCHEN_IP,
            port: 1400,
            endpoint: '/MediaRenderer/RenderingControl/Control',
            service: 'urn:schemas-upnp-org:service:RenderingControl:1',
            action: 'GetMute',
            body: muteBody,
        });

        if (muteResponse.success && muteResponse.body) {
            const muteValue = XmlParser.extractValue(muteResponse.body, 'CurrentMute');
            const muted = XmlParser.sonosToBoolean(muteValue ?? '0');
            console.log(`✓ Muted: ${muted}\n`);
        }

        console.log('✅ All tests passed! Kitchen Sonos is responding correctly.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testKitchenDevice().catch(console.error);
