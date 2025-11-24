#!/usr/bin/env node
/**
 * Integration test for device persistence with discovery
 * 
 * This test simulates the full lifecycle:
 * 1. Server starts and loads persisted topology
 * 2. New devices are discovered
 * 3. Topology is saved
 * 4. Server restarts and loads the updated topology
 */

import { DeviceRegistry } from '../src/discovery/device-registry.js';
import type { SonosDiscoveryResponse } from '../src/types/sonos.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const TEST_PERSISTENCE_PATH = join(process.cwd(), 'mcp_data', 'integration-test-topology.json');

async function cleanupTestFile() {
    try {
        await fs.unlink(TEST_PERSISTENCE_PATH);
    } catch {
        // File doesn't exist, that's fine
    }
}

async function testIntegration() {
    console.log('=== Integration Test: Discovery + Persistence ===\n');

    await cleanupTestFile();

    // Simulate first server start with no persisted data
    console.log('Step 1: Initial server start (no persisted data)');
    const registry1 = new DeviceRegistry(TEST_PERSISTENCE_PATH);
    await registry1.loadPersistedDevices();
    console.log(`✓ Loaded ${registry1.size} device(s) - Expected: 0`);
    
    if (registry1.size !== 0) {
        console.error('✗ Expected empty registry on first start');
        return false;
    }

    // Simulate discovery of 2 devices
    console.log('\nStep 2: Simulating device discovery...');
    const discovery1: SonosDiscoveryResponse = {
        location: 'http://192.168.1.100:1400/xml/device_description.xml',
        server: 'Linux UPnP/1.0 Sonos/1.0',
        usn: 'uuid:RINCON_LIVING_ROOM::urn:schemas-upnp-org:service:ZonePlayer:1',
        st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
    };

    const discovery2: SonosDiscoveryResponse = {
        location: 'http://192.168.1.101:1400/xml/device_description.xml',
        server: 'Linux UPnP/1.0 Sonos/1.0',
        usn: 'uuid:RINCON_KITCHEN::urn:schemas-upnp-org:service:ZonePlayer:1',
        st: 'urn:schemas-upnp-org:device:ZonePlayer:1',
    };

    const device1 = registry1.addFromDiscovery(discovery1);
    const device2 = registry1.addFromDiscovery(discovery2);

    if (device1) device1.name = 'Living Room';
    if (device2) device2.name = 'Kitchen';

    if (device1) registry1.updateDevice(device1);
    if (device2) registry1.updateDevice(device2);

    console.log(`✓ Discovered ${registry1.size} device(s)`);

    // Save topology
    console.log('\nStep 3: Saving topology...');
    await registry1.saveTopology();
    console.log('✓ Topology saved');

    // Simulate server restart
    console.log('\nStep 4: Simulating server restart...');
    const registry2 = new DeviceRegistry(TEST_PERSISTENCE_PATH);
    await registry2.loadPersistedDevices();
    console.log(`✓ Loaded ${registry2.size} device(s) from persistence`);

    if (registry2.size !== 2) {
        console.error(`✗ Expected 2 devices, got ${registry2.size}`);
        return false;
    }

    // Verify devices are correct
    const livingRoom = registry2.getDevice('RINCON_LIVING_ROOM');
    const kitchen = registry2.getDevice('RINCON_KITCHEN');

    if (!livingRoom || livingRoom.name !== 'Living Room' || livingRoom.ip !== '192.168.1.100') {
        console.error('✗ Living Room device data incorrect');
        return false;
    }

    if (!kitchen || kitchen.name !== 'Kitchen' || kitchen.ip !== '192.168.1.101') {
        console.error('✗ Kitchen device data incorrect');
        return false;
    }

    console.log('✓ All device data verified');

    // Add a third device manually
    console.log('\nStep 5: Adding manual device...');
    registry2.addManualDevice('192.168.1.102', 1400, 'Bedroom', 'RINCON_BEDROOM');
    await registry2.saveTopology();
    console.log('✓ Manual device added and saved');

    // Simulate another restart
    console.log('\nStep 6: Another server restart...');
    const registry3 = new DeviceRegistry(TEST_PERSISTENCE_PATH);
    await registry3.loadPersistedDevices();
    console.log(`✓ Loaded ${registry3.size} device(s)`);

    if (registry3.size !== 3) {
        console.error(`✗ Expected 3 devices, got ${registry3.size}`);
        return false;
    }

    const bedroom = registry3.getDevice('RINCON_BEDROOM');
    if (!bedroom || bedroom.name !== 'Bedroom') {
        console.error('✗ Bedroom device not found or incorrect');
        return false;
    }

    console.log('✓ Manual device persisted correctly');

    // Cleanup
    console.log('\nCleaning up...');
    await cleanupTestFile();

    console.log('\n=== ✓ Integration Test Passed ===');
    return true;
}

testIntegration()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Integration test failed:', error);
        process.exit(1);
    });
