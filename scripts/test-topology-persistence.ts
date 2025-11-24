#!/usr/bin/env node
/**
 * Test script for topology persistence functionality
 * 
 * This script demonstrates:
 * 1. Creating a device registry with a test persistence file
 * 2. Adding devices manually
 * 3. Saving topology to disk
 * 4. Loading topology from disk
 * 5. Verifying data integrity
 */

import { DeviceRegistry } from '../src/discovery/device-registry.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const TEST_PERSISTENCE_PATH = join(process.cwd(), 'mcp_data', 'test-topology.json');

async function cleanupTestFile() {
    try {
        await fs.unlink(TEST_PERSISTENCE_PATH);
        console.log('✓ Cleaned up test file');
    } catch (error) {
        // File doesn't exist, that's fine
    }
}

async function testTopologyPersistence() {
    console.log('=== Testing Topology Persistence ===\n');

    // Cleanup any existing test file
    await cleanupTestFile();

    // Test 1: Create registry and add devices
    console.log('Test 1: Creating registry and adding devices...');
    const registry1 = new DeviceRegistry(TEST_PERSISTENCE_PATH);
    
    registry1.addManualDevice('192.168.1.100', 1400, 'Living Room', 'RINCON_TEST001');
    registry1.addManualDevice('192.168.1.101', 1400, 'Kitchen', 'RINCON_TEST002');
    registry1.addManualDevice('192.168.1.102', 1400, 'Bedroom', 'RINCON_TEST003');

    const devices1 = registry1.getAllDevices();
    console.log(`✓ Added ${devices1.length} devices`);
    console.log(`  - ${devices1.map(d => d.name).join(', ')}`);

    // Test 2: Save topology
    console.log('\nTest 2: Saving topology to disk...');
    await registry1.saveTopology();
    console.log(`✓ Topology saved to: ${registry1.getPersistencePath()}`);

    // Verify file exists
    try {
        const stat = await fs.stat(TEST_PERSISTENCE_PATH);
        console.log(`✓ File size: ${stat.size} bytes`);
    } catch (error) {
        console.error('✗ Failed to verify file existence:', error);
        return false;
    }

    // Test 3: Load topology in a new registry
    console.log('\nTest 3: Loading topology in a new registry...');
    const registry2 = new DeviceRegistry(TEST_PERSISTENCE_PATH);
    await registry2.loadPersistedDevices();
    
    const devices2 = registry2.getAllDevices();
    console.log(`✓ Loaded ${devices2.length} devices`);
    console.log(`  - ${devices2.map(d => d.name).join(', ')}`);

    // Test 4: Verify data integrity
    console.log('\nTest 4: Verifying data integrity...');
    
    if (devices1.length !== devices2.length) {
        console.error(`✗ Device count mismatch: ${devices1.length} vs ${devices2.length}`);
        return false;
    }

    for (const device1 of devices1) {
        const device2 = registry2.getDevice(device1.uuid);
        if (!device2) {
            console.error(`✗ Device not found: ${device1.uuid}`);
            return false;
        }

        if (device1.ip !== device2.ip || device1.port !== device2.port || device1.name !== device2.name) {
            console.error(`✗ Device data mismatch for ${device1.uuid}`);
            return false;
        }
    }

    console.log('✓ All devices match original data');

    // Test 5: Display file contents
    console.log('\nTest 5: Displaying persisted topology file...');
    const fileContent = await fs.readFile(TEST_PERSISTENCE_PATH, 'utf-8');
    const topology = JSON.parse(fileContent);
    console.log('File contents:');
    console.log(JSON.stringify(topology, null, 2));

    // Cleanup
    console.log('\nCleaning up test file...');
    await cleanupTestFile();

    console.log('\n=== ✓ All Tests Passed ===');
    return true;
}

// Run the test
testTopologyPersistence()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Test failed with error:', error);
        process.exit(1);
    });
