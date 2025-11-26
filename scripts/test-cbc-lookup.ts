import { MusicServicesService } from '../src/services/music-services.js';
import { MusicServiceRegistry } from '../src/discovery/music-service-registry.js';
import type { SonosDevice } from '../src/types/sonos.js';

const device: SonosDevice = {
    uuid: 'RINCON_949F3E725CD601400',
    name: 'Kitchen',
    ip: '192.168.178.149',
    port: 1400,
    location: 'http://192.168.178.149:1400/xml/device_description.xml'
};

async function testCBCLookup() {
    console.log('🔍 Testing CBC Radio service lookup\n');

    try {
        // Test direct service listing
        const service = new MusicServicesService(device);
        const services = await service.listAvailableServices();
        const cbc = services.find(s => s.name.includes('CBC'));

        if (cbc) {
            console.log('✅ Found CBC in service list:');
            console.log(`   Name: "${cbc.name}"`);
            console.log(`   Name (lowercase): "${cbc.name.toLowerCase()}"`);
            console.log(`   ID: ${cbc.id}`);
            console.log(`   Name length: ${cbc.name.length} chars`);
            console.log(`   Name bytes:`, Buffer.from(cbc.name).toString('hex'));
            console.log('');
        }

        // Test registry lookup
        const registry = new MusicServiceRegistry(device);
        await registry.discoverServices();

        console.log('Testing registry lookups:\n');

        const tests = [
            'CBC Radio & Music',
            'CBC Radio &amp; Music',
            'cbc radio & music',
            'cbc radio &amp; music',
        ];

        for (const testName of tests) {
            const result = await registry.getServiceByName(testName);
            console.log(`Lookup "${testName}": ${result ? '✅ FOUND' : '❌ NOT FOUND'}`);
            if (result) {
                console.log(`  → Actual name: "${result.name}"`);
            }
        }

        // Show all services with CBC
        console.log('\n📋 All services with "CBC" in name:');
        const allServices = registry.getAllServices();
        for (const s of allServices) {
            if (s.name.toLowerCase().includes('cbc')) {
                console.log(`  - "${s.name}" (ID: ${s.id})`);
            }
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testCBCLookup();
