import { MusicServicesService } from '../src/services/music-services.js';
import { SMAPIClient } from '../src/services/smapi-client.js';
import type { SonosDevice } from '../src/types/sonos.js';

const device: SonosDevice = {
    uuid: 'RINCON_949F3E725CD601400',
    name: 'Kitchen',
    ip: '192.168.178.149',
    port: 1400,
    location: 'http://192.168.178.149:1400/xml/device_description.xml'
};
const serviceName = 'SomaFM Radio';

async function testSMAPIBrowse() {
    console.log('🔍 Testing SMAPI Browse for SomaFM Radio\n');

    try {
        // Get service list
        const service = new MusicServicesService(device);
        const services = await service.listAvailableServices();
        const sonosRadio = services.find(s => s.name === serviceName);

        if (!sonosRadio) {
            console.error(`❌ ${serviceName} not found`);
            return;
        }

        console.log(`✅ Found ${serviceName}:`);
        console.log(`   ID: ${sonosRadio.id}`);
        console.log(`   URI: ${sonosRadio.uri}`);
        console.log(`   Auth: ${sonosRadio.authType}\n`);

        // Create SMAPI client
        const smapi = new SMAPIClient(sonosRadio);

        // Try browsing root
        console.log('📡 Calling getMetadata(root, 0, 10)...\n');
        const result = await smapi.getMetadata('root', 0, 10);

        console.log('Response:');
        console.log(`  Total: ${result.total}`);
        console.log(`  Index: ${result.index}`);
        console.log(`  Count: ${result.count}`);
        console.log(`  Items: ${result.items.length}\n`);

        if (result.items.length > 0) {
            console.log('Items:');
            result.items.forEach((item, i) => {
                console.log(`\n${i + 1}. ${item.title}`);
                console.log(`   ID: ${item.id}`);
                console.log(`   Type: ${item.itemType}`);
                if ('canPlay' in item) {
                    console.log(`   Can Play: ${item.canPlay}`);
                }
            });
        } else {
            console.log('❌ No items returned');
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testSMAPIBrowse();
