#!/usr/bin/env tsx
import { SsdpClient } from '../src/discovery/ssdp-client.js';

console.log('Testing isolated SSDP discovery...\n');

const client = new SsdpClient();

console.log('Starting discovery (8 second timeout)...');
const devices = await client.discover(8000);

console.log(`\nFound ${devices.length} device(s):`);
devices.forEach((device, idx) => {
    console.log(`\n${idx + 1}. ${device.location}`);
    console.log(`   USN: ${device.usn}`);
    console.log(`   Server: ${device.server}`);
});

if (devices.length === 0) {
    console.log('\nNo devices found!');
}
