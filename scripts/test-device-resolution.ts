#!/usr/bin/env tsx
/**
 * Test script for device name resolution
 * 
 * This script demonstrates the device resolution feature that allows
 * controlling Sonos devices using friendly names instead of UUIDs.
 * 
 * Usage:
 *   tsx scripts/test-device-resolution.ts
 */

import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { DeviceResolver } from '../src/mcp/device-resolver.js';
import { SsdpClient } from '../src/discovery/ssdp-client.js';

async function main() {
    console.log('🎵 Sonos Device Resolution Test\n');

    const registry = new DeviceRegistry();
    const resolver = new DeviceResolver(registry);

    // Discover devices
    console.log('📡 Discovering Sonos devices...');
    const client = new SsdpClient();
    const responses = await client.discover(5000);

    if (responses.length === 0) {
        console.log('❌ No devices found via SSDP discovery');
        console.log('\n💡 You can manually add a device for testing:');
        console.log('   registry.addManualDevice("192.168.1.100", 1400, "Kitchen");');
        return;
    }

    console.log(`✅ Found ${responses.length} device(s)\n`);

    // Add discovered devices to registry
    for (const response of responses) {
        registry.addFromDiscovery(response);
    }

    // Fetch device names
    console.log('📋 Fetching device details...');
    const devices = registry.getAllDevices();
    
    for (const device of devices) {
        try {
            const descriptionUrl = `http://${device.ip}:${device.port}/xml/device_description.xml`;
            const response = await fetch(descriptionUrl);
            if (response.ok) {
                const xml = await response.text();
                const roomNameMatch = /<roomName>([^<]+)<\/roomName>/i.exec(xml);
                if (roomNameMatch?.[1]) {
                    device.name = roomNameMatch[1];
                    registry.updateDevice(device);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Could not fetch name for ${device.ip}`);
        }
    }

    console.log('\n📱 Available devices:');
    console.log(resolver.listAvailableDevices());

    // Test resolution
    console.log('\n🔍 Testing device resolution:\n');

    const testCases: Array<{ input: string; description: string }> = [];

    // Add test cases based on discovered devices
    if (devices.length > 0) {
        const firstDevice = devices[0];
        
        if (firstDevice) {
            // Test UUID resolution
            testCases.push({
                input: firstDevice.uuid,
                description: 'Exact UUID match'
            });

            // Test IP resolution
            testCases.push({
                input: firstDevice.ip,
                description: 'IP address match'
            });

            // Test name resolution if available
            if (firstDevice.name) {
                testCases.push({
                    input: firstDevice.name,
                    description: 'Exact name match'
                });

                testCases.push({
                    input: firstDevice.name.toLowerCase(),
                    description: 'Case-insensitive name match'
                });

                // Test partial match if name is long enough
                if (firstDevice.name.length > 3) {
                    testCases.push({
                        input: firstDevice.name.substring(0, 3),
                        description: 'Partial name match'
                    });
                }
            }
        }
    }

    // Test error cases
    testCases.push({
        input: 'NonExistentDevice',
        description: 'Non-existent device (should fail)'
    });

    testCases.push({
        input: '',
        description: 'Empty identifier (should fail)'
    });

    for (const testCase of testCases) {
        try {
            const resolved = resolver.resolve(testCase.input);
            console.log(`✅ ${testCase.description}`);
            console.log(`   Input: "${testCase.input}"`);
            console.log(`   Resolved: ${resolved.name || resolved.ip} (${resolved.uuid})\n`);
        } catch (error) {
            if (error instanceof Error) {
                console.log(`❌ ${testCase.description}`);
                console.log(`   Input: "${testCase.input}"`);
                console.log(`   Error: ${error.message}\n`);
            }
        }
    }

    // Example usage
    console.log('💡 Example usage in MCP tools:\n');
    console.log('Instead of:');
    console.log('  sonos_set_volume({ deviceId: "RINCON_xxx", volume: 50 })');
    console.log('\nYou can now use:');
    if (devices[0]?.name) {
        console.log(`  sonos_set_volume({ deviceId: "${devices[0].name}", volume: 50 })`);
    } else {
        console.log('  sonos_set_volume({ deviceId: "Kitchen", volume: 50 })');
    }
    console.log('\nThe MCP server automatically resolves the name to the correct device! 🎉');
}

main().catch(console.error);
