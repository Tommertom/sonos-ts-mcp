/**
 * Debug test with full SOAP logging
 */

import type { SonosDevice } from '../src/types/sonos.js';
import { SoapClient } from '../src/soap/client.js';

async function testMusicServicesSOAP() {
    console.log('🔍 Testing MusicServices SOAP Request with Full Logging\n');

    const device: SonosDevice = {
        uuid: 'RINCON_949F3E725CD601400',
        ip: '192.168.178.149',
        port: 1400,
        location: 'http://192.168.178.149:1400/xml/device_description.xml',
        name: 'Kitchen'
    };

    console.log(`Device: ${device.name} (${device.ip}:${device.port})\n`);

    // Build the SOAP request
    const action = 'ListAvailableServices';
    const serviceType = 'urn:schemas-upnp-org:service:MusicServices:1';
    const endpoint = '/MusicServices/Control';
    const body = `<u:${action} xmlns:u="${serviceType}"></u:${action}>`;

    console.log('SOAP Request Details:');
    console.log(`  Endpoint: http://${device.ip}:${device.port}${endpoint}`);
    console.log(`  Action: ${action}`);
    console.log(`  Service Type: ${serviceType}`);
    console.log(`  Body: ${body}\n`);

    try {
        const soapClient = new SoapClient();
        const response = await soapClient.call({
            ip: device.ip,
            port: device.port,
            endpoint,
            service: serviceType,
            action,
            body
        });

        console.log('SOAP Response:');
        console.log(`  Success: ${response.success}`);

        if (response.error) {
            console.log(`  Error Code: ${response.error.code}`);
            console.log(`  Error Message: ${response.error.message}`);
        }

        if (response.body) {
            console.log(`\nResponse Body (first 2000 chars):`);
            console.log(response.body.substring(0, 2000));

            // Try to extract the descriptor list
            const descriptorMatch = response.body.match(/<AvailableServiceDescriptorList>([\s\S]*?)<\/AvailableServiceDescriptorList>/);
            if (descriptorMatch) {
                console.log('\n✅ Found AvailableServiceDescriptorList');
                console.log('Length:', descriptorMatch[1].length, 'chars');
                console.log('Content preview:', descriptorMatch[1].substring(0, 500));
            } else {
                console.log('\n❌ No AvailableServiceDescriptorList found in response');
            }
        } else {
            console.log('  No response body');
        }
    } catch (error) {
        console.error('\n❌ Error during SOAP call:');
        console.error(error);
    }
}

testMusicServicesSOAP().catch(console.error);
