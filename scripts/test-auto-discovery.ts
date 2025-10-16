#!/usr/bin/env tsx
/**
 * Test script for automatic discovery functionality
 * 
 * This script tests:
 * 1. Device discovery on startup
 * 2. Full device details fetching
 * 3. Device registry storage
 * 
 * Run with: npx tsx scripts/test-auto-discovery.ts
 */

import { SsdpClient } from '../src/discovery/ssdp-client.js';
import { DeviceRegistry } from '../src/discovery/device-registry.js';
import type { SonosDevice } from '../src/types/sonos.js';

/**
 * Fetch full device details from device_description.xml
 */
async function fetchDeviceDetails(device: SonosDevice): Promise<void> {
    try {
        const descriptionUrl = `http://${device.ip}:${device.port}/xml/device_description.xml`;
        console.log(`\n📡 Fetching details from: ${descriptionUrl}`);

        const response = await fetch(descriptionUrl);
        if (!response.ok) {
            console.warn(`❌ Failed to fetch device details for ${device.ip}:${device.port}`);
            return;
        }

        const xml = await response.text();

        // Extract device information
        const roomNameMatch = /<roomName>([^<]+)<\/roomName>/i.exec(xml);
        const modelNameMatch = /<modelName>([^<]+)<\/modelName>/i.exec(xml);
        const modelNumberMatch = /<modelNumber>([^<]+)<\/modelNumber>/i.exec(xml);
        const softwareVersionMatch = /<softwareVersion>([^<]+)<\/softwareVersion>/i.exec(xml);
        const displayNameMatch = /<displayName>([^<]+)<\/displayName>/i.exec(xml);

        // Update device with details
        if (roomNameMatch?.[1]) {
            device.name = roomNameMatch[1];
            console.log(`  🏠 Room Name: ${device.name}`);
        } else if (displayNameMatch?.[1]) {
            device.name = displayNameMatch[1];
            console.log(`  🏠 Display Name: ${device.name}`);
        }

        if (modelNameMatch?.[1]) {
            device.modelName = modelNameMatch[1];
            console.log(`  📦 Model: ${device.modelName}`);
        }

        if (modelNumberMatch?.[1]) {
            device.modelNumber = modelNumberMatch[1];
            console.log(`  🔢 Model Number: ${device.modelNumber}`);
        }

        if (softwareVersionMatch?.[1]) {
            device.softwareVersion = softwareVersionMatch[1];
            console.log(`  💿 Software Version: ${device.softwareVersion}`);
        }

        console.log(`  ✅ Device details fetched successfully`);
    } catch (error) {
        console.warn(`❌ Error fetching device details for ${device.ip}:${device.port}:`, error);
    }
}

async function main() {
    console.log('🚀 Starting Automatic Discovery Test\n');
    console.log('='.repeat(60));

    const registry = new DeviceRegistry();
    const client = new SsdpClient();

    console.log('\n🔍 Phase 1: SSDP Discovery');
    console.log('-'.repeat(60));

    try {
        const responses = await client.discover(5000);
        console.log(`\n✅ Discovery complete: Found ${responses.length} device(s)\n`);

        if (responses.length === 0) {
            console.log('⚠️  No devices found. Make sure:');
            console.log('   - Sonos devices are powered on');
            console.log('   - Devices are on the same network');
            console.log('   - Multicast is not blocked by firewall\n');
            return;
        }

        // Add devices to registry and fetch details
        console.log('\n🔍 Phase 2: Fetching Device Details');
        console.log('-'.repeat(60));

        for (const response of responses) {
            const device = registry.addFromDiscovery(response);
            if (device) {
                console.log(`\n📱 Device Found:`);
                console.log(`  UUID: ${device.uuid}`);
                console.log(`  IP: ${device.ip}:${device.port}`);
                console.log(`  Location: ${device.location}`);

                await fetchDeviceDetails(device);
                registry.updateDevice(device);
            }
        }

        // Display final registry
        console.log('\n\n📋 Phase 3: Device Registry Summary');
        console.log('='.repeat(60));

        const allDevices = registry.getAllDevices();
        console.log(`\nTotal devices in registry: ${allDevices.length}\n`);

        allDevices.forEach((device, index) => {
            console.log(`Device ${index + 1}:`);
            console.log(`  Name: ${device.name || 'Unknown'}`);
            console.log(`  UUID: ${device.uuid}`);
            console.log(`  IP: ${device.ip}:${device.port}`);
            console.log(`  Model: ${device.modelName || 'Unknown'}`);
            console.log(`  Model Number: ${device.modelNumber || 'Unknown'}`);
            console.log(`  Software: ${device.softwareVersion || 'Unknown'}`);
            console.log(`  Location: ${device.location}`);
            console.log('');
        });

        console.log('✅ Auto-discovery test completed successfully!\n');

    } catch (error) {
        console.error('❌ Error during discovery:', error);
        process.exit(1);
    }
}

main();
