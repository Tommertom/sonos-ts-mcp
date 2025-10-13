#!/usr/bin/env node
import { SoapClient } from './src/soap/client.js';
import { RequestBuilder } from './src/soap/request-builder.js';
import { XmlParser } from './src/soap/response-parser.js';

async function scanSubnet(subnet: string, start: number, end: number) {
    console.log(`Scanning ${subnet}.${start}-${end} for Sonos devices...\n`);

    const client = new SoapClient();
    const promises: Promise<string | null>[] = [];

    for (let i = start; i <= end; i++) {
        const ip = `${subnet}.${i}`;

        const promise = (async () => {
            try {
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
                    return ip;
                }
            } catch {
                // Ignore errors
            }
            return null;
        })();

        promises.push(promise);

        // Batch requests to avoid overwhelming the network
        if (promises.length >= 10) {
            const results = await Promise.all(promises);
            const found = results.filter(r => r !== null);

            for (const ip of found) {
                console.log(`✓ Found Sonos device at ${ip}`);
                await getDeviceInfo(client, ip!);
            }

            promises.length = 0;
            await setTimeout(100); // Small delay between batches
        }
    }

    // Process remaining
    if (promises.length > 0) {
        const results = await Promise.all(promises);
        const found = results.filter(r => r !== null);

        for (const ip of found) {
            console.log(`✓ Found Sonos device at ${ip}`);
            await getDeviceInfo(client, ip!);
        }
    }
}

async function getDeviceInfo(client: SoapClient, ip: string) {
    try {
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

                    console.log(`  Now Playing:`);
                    console.log(`    Title: ${title || 'Unknown'}`);
                    console.log(`    Artist: ${artist || 'Unknown'}`);
                    console.log(`    Album: ${album || 'Unknown'}`);
                }
            }
        }
    } catch (error) {
        console.error(`  Error getting info: ${error}`);
    }
    console.log();
}

scanSubnet('192.168.178', 1, 254).catch(console.error);
