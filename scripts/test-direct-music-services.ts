/**
 * Direct test of MusicServices UPnP service
 */

import { MusicServicesService } from '../src/services/music-services.js';
import type { SonosDevice } from '../src/types/sonos.js';

async function testDirectMusicServices() {
    console.log('🔍 Testing MusicServices UPnP Service Directly\n');

    // Use the persisted Kitchen device
    const device: SonosDevice = {
        uuid: 'RINCON_949F3E725CD601400',
        ip: '192.168.178.149',
        port: 1400,
        location: 'http://192.168.178.149:1400/xml/device_description.xml',
        name: 'Kitchen'
    };

    console.log(`Testing with device: ${device.name} (${device.ip})\n`);

    try {
        const service = new MusicServicesService(device);
        console.log('Created MusicServicesService instance');

        console.log('Calling listAvailableServices()...');
        const services = await service.listAvailableServices();

        console.log(`\n✅ Success! Found ${services.length} services:\n`);

        if (services.length === 0) {
            console.log('⚠️  No services returned. This could mean:');
            console.log('   - The device has no music services configured');
            console.log('   - The SOAP request failed silently');
            console.log('   - The response parsing failed');
        } else {
            for (const svc of services) {
                console.log(`Service: ${svc.name}`);
                console.log(`  ID: ${svc.id}`);
                console.log(`  URI: ${svc.secureUri || svc.uri}`);
                console.log(`  Auth: ${svc.authType}`);
                console.log(`  Version: ${svc.version}`);
                console.log();
            }
        }
    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

testDirectMusicServices().catch(console.error);
