#!/usr/bin/env node
import { SoapClient } from './src/soap/client.js';
import { RequestBuilder } from './src/soap/request-builder.js';
import { XmlParser } from './src/soap/response-parser.js';

async function testDirectConnection() {
    console.log('Testing direct Sonos connection...\n');
    console.log('Please enter the IP address of your Sonos device (Kitchen):');

    // Try common Sonos IP ranges
    const commonIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
        '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.103',
    ];

    const client = new SoapClient();

    for (const ip of commonIPs) {
        try {
            console.log(`\nTrying ${ip}...`);

            const body = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
            const response = await client.call({
                ip,
                port: 1400,
                endpoint: '/MediaRenderer/AVTransport/Control',
                service: 'urn:schemas-upnp-org:service:AVTransport:1',
                action: 'GetTransportInfo',
                body,
            });

            if (response.success && response.body) {
                console.log(`✓ Found Sonos device at ${ip}!`);

                const state = XmlParser.extractValue(response.body, 'CurrentTransportState');
                console.log(`  Transport State: ${state}`);

                if (state === 'PLAYING') {
                    const posBody = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
                    const posResponse = await client.call({
                        ip,
                        port: 1400,
                        endpoint: '/MediaRenderer/AVTransport/Control',
                        service: 'urn:schemas-upnp-org:service:AVTransport:1',
                        action: 'GetPositionInfo',
                        body: posBody,
                    });

                    if (posResponse.success && posResponse.body) {
                        const trackMetadata = XmlParser.extractValue(posResponse.body, 'TrackMetaData') ?? '';
                        const unescapedMetadata = XmlParser.unescapeXml(trackMetadata);

                        const title = XmlParser.extractValue(unescapedMetadata, 'dc:title');
                        const artist = XmlParser.extractValue(unescapedMetadata, 'dc:creator');
                        const album = XmlParser.extractValue(unescapedMetadata, 'upnp:album');

                        console.log(`\n  Now Playing:`);
                        console.log(`    Title: ${title || 'Unknown'}`);
                        console.log(`    Artist: ${artist || 'Unknown'}`);
                        console.log(`    Album: ${album || 'Unknown'}`);
                    }
                }

                return; // Found it, exit
            }
        } catch (error) {
            // Ignore errors, try next IP
        }
    }

    console.log('\nNo Sonos devices found at common IP addresses.');
    console.log('Please provide the IP address of your Kitchen Sonos device.');
}

testDirectConnection().catch(console.error);
