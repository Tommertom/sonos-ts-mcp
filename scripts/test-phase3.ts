#!/usr/bin/env node
/**
 * Phase 3 API Tests
 * 
 * Tests the following Phase 3 features:
 * - Enhanced Audio Controls (bass, treble, loudness, night mode, dialog mode)
 * - Sleep Timer
 * - Alarm Management
 * - Snapshot (save/restore state)
 * 
 * Usage:
 * - With device discovery: npm run test:phase3
 * - With manual device IP: SONOS_DEVICE_IP=192.168.1.100 npm run test:phase3
 * 
 * Note: This test requires a real Sonos device on the network.
 * If no devices are found via discovery and no manual IP is provided,
 * the test will fail with a device not found error.
 */

import { spawn, type ChildProcess } from 'child_process';
import {
    initializeMcpConnection,
    discoverDevices,
    callTool,
    runTest,
    wait,
} from './test-utils.js';

let mcpProcess: ChildProcess;
let deviceId: string;

async function startMcpServer(): Promise<void> {
    console.log('🚀 Starting MCP Server in stdio mode...\n');

    mcpProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
    });

    // Log server output
    mcpProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('"jsonrpc"')) {
            console.log('[Server]', output);
        }
    });

    mcpProcess.stderr?.on('data', (data) => {
        console.error('[Server Error]', data.toString());
    });

    await wait(1000);
}

async function initializeAndDiscover(): Promise<void> {
    console.log('🔌 Initializing MCP connection...\n');
    await initializeMcpConnection(mcpProcess);

    // Check for manual device IP via environment variable
    const manualIp = process.env.SONOS_DEVICE_IP;

    if (manualIp) {
        console.log(`📍 Using manual device IP: ${manualIp}\n`);
        // Register the device manually
        await callTool(mcpProcess, {
            name: 'sonos_add_device',
            arguments: { ip: manualIp, port: 1400 },
        });
        deviceId = manualIp;
        console.log(`✅ Manually registered device: ${deviceId}\n`);
        return;
    }

    console.log('🔍 Discovering Sonos devices...\n');
    const devices = await discoverDevices(mcpProcess);

    if (devices.length === 0) {
        throw new Error(
            'No Sonos devices found. Please ensure devices are on the network.\n' +
            'Alternatively, set SONOS_DEVICE_IP environment variable to test with a specific device.'
        );
    }

    deviceId = devices[0].uuid || devices[0].ip;
    console.log(`✅ Found ${devices.length} device(s)`);
    console.log(`   Using device: ${devices[0].name || deviceId}\n`);
}

async function testEnhancedAudioControls(): Promise<void> {
    console.log('🎛️  Testing Enhanced Audio Controls\n');

    // Test: Set Bass
    await runTest('Set Bass to +5', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_bass',
            arguments: { deviceId, level: 5 },
        });
    });

    await runTest('Set Bass to 0', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_bass',
            arguments: { deviceId, level: 0 },
        });
    });

    // Test: Set Treble
    await runTest('Set Treble to +3', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_treble',
            arguments: { deviceId, level: 3 },
        });
    });

    await runTest('Set Treble to 0', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_treble',
            arguments: { deviceId, level: 0 },
        });
    });

    // Test: Set Loudness
    await runTest('Set Loudness ON', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_loudness',
            arguments: { deviceId, enabled: true },
        });
    });

    await runTest('Set Loudness OFF', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_loudness',
            arguments: { deviceId, enabled: false },
        });
    });

    // Test: Get EQ Settings
    await runTest('Get EQ Settings', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_get_eq',
            arguments: { deviceId },
        });

        if (!result) {
            throw new Error('Invalid EQ response');
        }

        console.log(`   Bass: ${result.bass || 0}`);
        console.log(`   Treble: ${result.treble || 0}`);
        console.log(`   Loudness: ${result.loudness ? 'ON' : 'OFF'}`);
    });

    // Test: Night Mode (may fail on non-soundbar devices)
    await runTest('Set Night Mode ON (soundbar only)', async () => {
        try {
            await callTool(mcpProcess, {
                name: 'sonos_set_night_mode',
                arguments: { deviceId, enabled: true },
            });
        } catch (error) {
            // Expected to fail on non-soundbar devices
            if (error instanceof Error && error.message.includes('not supported')) {
                console.log('   ⚠️  Not supported on this device (OK)');
            } else {
                throw error;
            }
        }
    });

    // Test: Dialog Mode (may fail on non-soundbar devices)
    await runTest('Set Dialog Mode ON (soundbar only)', async () => {
        try {
            await callTool(mcpProcess, {
                name: 'sonos_set_dialog_mode',
                arguments: { deviceId, enabled: true },
            });
        } catch (error) {
            // Expected to fail on non-soundbar devices
            if (error instanceof Error && error.message.includes('not supported')) {
                console.log('   ⚠️  Not supported on this device (OK)');
            } else {
                throw error;
            }
        }
    });
}

async function testSleepTimer(): Promise<void> {
    console.log('\n😴 Testing Sleep Timer APIs\n');

    // Test: Set Sleep Timer
    await runTest('Set Sleep Timer (30 minutes)', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_sleep_timer',
            arguments: { deviceId, duration: '00:30:00' },
        });

        console.log('   Sleep timer set for 30 minutes');
    });

    await wait(1000);

    // Test: Get Sleep Timer
    await runTest('Get Sleep Timer Remaining', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_get_sleep_timer',
            arguments: { deviceId },
        });

        if (!result) {
            throw new Error('Invalid sleep timer response');
        }

        console.log(`   Remaining: ${result.remaining || '00:00:00'}`);
    });

    // Test: Cancel Sleep Timer
    await runTest('Cancel Sleep Timer', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_cancel_sleep_timer',
            arguments: { deviceId },
        });

        console.log('   Sleep timer cancelled');
    });
}

async function testAlarmManagement(): Promise<void> {
    console.log('\n⏰ Testing Alarm Management APIs\n');

    let alarmId: string | undefined;

    // Test: List Alarms
    await runTest('List All Alarms', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_list_alarms',
            arguments: { deviceId },
        });

        if (!result || !result.alarms) {
            throw new Error('Invalid alarm list response');
        }

        console.log(`   Found ${result.alarms.length} alarm(s)`);
    });

    // Test: Create Alarm
    // Note: This may fail with error 801 if the device is in a grouped state,
    // part of a stereo pair, or if there's a temporary system condition.
    await runTest('Create Test Alarm', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_create_alarm',
            arguments: {
                deviceId,
                startTime: '07:00:00',
                recurrence: 'ONCE',
                enabled: false, // Disabled so it doesn't actually go off
                volume: 25,
                duration: '01:00:00',
            },
        });

        if (!result || !result.alarmId) {
            // Check if it's the known 801 error (device/system state issue)
            if (result && result.text && result.text.includes('801')) {
                console.log('   ⚠️  Device cannot create alarms in current state (error 801)');
                console.log('   This is expected if device is grouped or in a stereo pair');
                return; // Don't fail the test
            }
            console.error('   Result received:', JSON.stringify(result, null, 2));
            throw new Error('Failed to create alarm - no alarmId in response');
        }

        alarmId = result.alarmId;
        console.log(`   Created alarm: ${alarmId}`);
    });

    await wait(1000);

    // Test: Update Alarm
    if (alarmId) {
        await runTest('Update Alarm Time', async () => {
            await callTool(mcpProcess, {
                name: 'sonos_update_alarm',
                arguments: {
                    deviceId,
                    alarmId,
                    startTime: '08:00:00',
                    volume: 30,
                },
            });

            console.log('   Updated alarm to 08:00');
        });
    }

    await wait(1000);

    // Test: Delete Alarm
    if (alarmId) {
        await runTest('Delete Test Alarm', async () => {
            await callTool(mcpProcess, {
                name: 'sonos_delete_alarm',
                arguments: { deviceId, alarmId },
            });

            console.log('   Deleted test alarm');
        });
    }
}

async function testSnapshot(): Promise<void> {
    console.log('\n📸 Testing Snapshot APIs\n');

    let snapshot: string | undefined;

    // Test: Create Snapshot
    await runTest('Create State Snapshot', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_snapshot',
            arguments: { deviceId },
        });

        if (!result || !result.snapshot) {
            throw new Error('Failed to create snapshot');
        }

        snapshot = result.snapshot;
        console.log('   Snapshot created');
    });

    // Make some changes to state
    await callTool(mcpProcess, {
        name: 'sonos_set_volume',
        arguments: { deviceId, volume: 15 },
    });

    await wait(1000);

    // Test: Restore Snapshot
    if (snapshot) {
        await runTest('Restore State from Snapshot', async () => {
            await callTool(mcpProcess, {
                name: 'sonos_restore_snapshot',
                arguments: { deviceId, snapshot },
            });

            console.log('   State restored from snapshot');
        });
    }

    await wait(1000);

    // Test: Restore with Fade
    if (snapshot) {
        await runTest('Restore Snapshot with Fade', async () => {
            await callTool(mcpProcess, {
                name: 'sonos_restore_snapshot',
                arguments: { deviceId, snapshot, fade: true },
            });

            console.log('   State restored with fade');
        });
    }
}

async function cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...\n');

    if (mcpProcess && !mcpProcess.killed) {
        mcpProcess.kill('SIGTERM');

        await new Promise<void>((resolve) => {
            mcpProcess.on('exit', () => resolve());
            setTimeout(() => {
                if (!mcpProcess.killed) {
                    mcpProcess.kill('SIGKILL');
                }
                resolve();
            }, 3000);
        });
    }
}

async function main(): Promise<void> {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     Phase 3 API Test Suite               ║');
    console.log('║  Audio, Sleep, Alarms, Snapshots         ║');
    console.log('╚══════════════════════════════════════════╝\n');

    try {
        await startMcpServer();
        await initializeAndDiscover();

        await testEnhancedAudioControls();
        await testSleepTimer();
        await testAlarmManagement();
        await testSnapshot();

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║      Phase 3 Tests Complete!             ║');
        console.log('╚══════════════════════════════════════════╝\n');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
