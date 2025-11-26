import { MusicServicesService } from '../src/services/music-services.js';
import type { SonosDevice } from '../src/types/sonos.js';

const device: SonosDevice = {
    uuid: 'RINCON_949F3E725CD601400',
    name: 'Kitchen',
    ip: '192.168.178.149',
    port: 1400,
    location: 'http://192.168.178.149:1400/xml/device_description.xml'
};

async function testHtmlDecoding() {
    console.log('🔍 Testing HTML entity decoding in service names\n');

    try {
        // Get raw response
        const service = new MusicServicesService(device);
        const action = 'ListAvailableServices';
        const body = '';

        // Make the SOAP call directly
        const response = await (service as any).callAction(action, body);

        // Extract the descriptor list
        const descriptorMatch = response.match(/<AvailableServiceDescriptorList>([\s\S]*?)<\/AvailableServiceDescriptorList>/);

        if (descriptorMatch) {
            const rawXml = descriptorMatch[1] || '';
            console.log('📄 Raw XML (first 500 chars):');
            console.log(rawXml.substring(0, 500));
            console.log('\n');

            // Find CBC in raw XML
            const cbcIndex = rawXml.indexOf('CBC');
            if (cbcIndex !== -1) {
                console.log('📍 CBC section in raw XML:');
                console.log(rawXml.substring(cbcIndex - 50, cbcIndex + 200));
                console.log('\n');
            }

            // Decode HTML entities
            const decoded = rawXml
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&amp;/g, '&');

            console.log('📄 Decoded XML (first 500 chars):');
            console.log(decoded.substring(0, 500));
            console.log('\n');

            // Find CBC in decoded XML
            const cbcIndexDecoded = decoded.indexOf('CBC');
            if (cbcIndexDecoded !== -1) {
                console.log('📍 CBC section in decoded XML:');
                console.log(decoded.substring(cbcIndexDecoded - 50, cbcIndexDecoded + 200));
                console.log('\n');
            }
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

testHtmlDecoding();
