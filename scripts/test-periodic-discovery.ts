#!/usr/bin/env tsx
/**
 * Test script for periodic discovery functionality
 * 
 * This script simulates the automatic discovery behavior by:
 * 1. Running initial discovery
 * 2. Simulating periodic discovery at intervals
 * 3. Monitoring device registry changes
 * 
 * Run with: npx tsx scripts/test-periodic-discovery.ts
 */

import { SsdpClient } from '../src/discovery/ssdp-client.js';
import { DeviceRegistry } from '../src/discovery/device-registry.js';
import type { SonosDevice } from '../src/types/sonos.js';

const DISCOVERY_INTERVAL_MS = 10 * 1000; // 10 seconds for testing (production is 5 minutes)
const TEST_DURATION_MS = 35 * 1000; // Run for 35 seconds (should do 3-4 discoveries)

/**
 * Fetch full device details from device_description.xml
 */
async function fetchDeviceDetails(device: SonosDevice): Promise<void> {
    try {
        const descriptionUrl = `http://${device.ip}:${device.port}/xml/device_description.xml`;
        const response = await fetch(descriptionUrl);
        if (!response.ok) {
            console.warn(`⚠️  Failed to fetch device details for ${device.ip}:${device.port}`);
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
        } else if (displayNameMatch?.[1]) {
            device.name = displayNameMatch[1];
        }

        if (modelNameMatch?.[1]) {
            device.modelName = modelNameMatch[1];
        }

        if (modelNumberMatch?.[1]) {
            device.modelNumber = modelNumberMatch[1];
        }

        if (softwareVersionMatch?.[1]) {
            device.softwareVersion = softwareVersionMatch[1];
        }
    } catch (error) {
        console.warn(`⚠️  Error fetching device details for ${device.ip}:${device.port}`);
    }
}

/**
 * Perform automatic discovery
 */
async function performAutoDiscovery(registry: DeviceRegistry, discoveryCount: number): Promise<void> {
    try {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] 🔍 Discovery #${discoveryCount} starting...`);

        const client = new SsdpClient();
        const responses = await client.discover(5000);

        for (const response of responses) {
            const device = registry.addFromDiscovery(response);
            if (device) {
                await fetchDeviceDetails(device);
                registry.updateDevice(device);
            }
        }

        const devices = registry.getAllDevices();
        console.log(`[${timestamp}] ✅ Discovery #${discoveryCount} complete: Found ${responses.length} device(s), total registered: ${devices.length}`);

        // Show brief device summary
        devices.forEach((device) => {
            console.log(`   📱 ${device.name || 'Unknown'} (${device.ip}) - ${device.modelName || 'Unknown model'}`);
        });
    } catch (error) {
        console.error(`❌ Error during discovery #${discoveryCount}:`, error);
    }
}

async function main() {
    console.log('🚀 Starting Periodic Discovery Test');
    console.log('='.repeat(70));
    console.log(`⏱️  Discovery Interval: ${DISCOVERY_INTERVAL_MS / 1000} seconds`);
    console.log(`⏱️  Test Duration: ${TEST_DURATION_MS / 1000} seconds`);
    console.log('='.repeat(70));

    const registry = new DeviceRegistry();
    let discoveryCount = 0;

    // Perform initial discovery
    discoveryCount++;
    await performAutoDiscovery(registry, discoveryCount);

    // Set up periodic discovery
    const intervalId = setInterval(async () => {
        discoveryCount++;
        await performAutoDiscovery(registry, discoveryCount);
    }, DISCOVERY_INTERVAL_MS);

    console.log(`\n⏰ Periodic discovery started (every ${DISCOVERY_INTERVAL_MS / 1000}s)`);
    console.log(`⏰ Test will run for ${TEST_DURATION_MS / 1000}s and then stop...\n`);

    // Run for the test duration
    setTimeout(() => {
        clearInterval(intervalId);

        console.log('\n' + '='.repeat(70));
        console.log('🏁 Test Complete - Summary');
        console.log('='.repeat(70));
        console.log(`Total discoveries performed: ${discoveryCount}`);
        console.log(`Total devices in registry: ${registry.size}`);

        console.log('\n📋 Final Device Registry:\n');
        const allDevices = registry.getAllDevices();
        allDevices.forEach((device, index) => {
            console.log(`Device ${index + 1}:`);
            console.log(`  Name: ${device.name || 'Unknown'}`);
            console.log(`  UUID: ${device.uuid}`);
            console.log(`  IP: ${device.ip}:${device.port}`);
            console.log(`  Model: ${device.modelName || 'Unknown'}`);
            console.log(`  Software: ${device.softwareVersion || 'Unknown'}`);
            console.log('');
        });

        console.log('✅ Periodic discovery test completed successfully!');
        process.exit(0);
    }, TEST_DURATION_MS);
}

main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
