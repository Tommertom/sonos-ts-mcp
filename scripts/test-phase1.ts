#!/usr/bin/env node
/**
 * Phase 1 API Tests
 * 
 * Tests the following Phase 1 features:
 * - Queue Management (get, add, remove, reorder, save, play from queue)
 * - DIDL-Lite metadata handling
 * - Playback Properties (shuffle, repeat, crossfade)
 * - Enhanced Play URI
 * 
 * Usage:
 * - With device discovery: npm run test:phase1
 * - With manual device IP: SONOS_DEVICE_IP=192.168.1.100 npm run test:phase1
 * 
 * Note: This test requires a real Sonos device on the network.
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

    // Give server time to start
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

async function testQueueManagement(): Promise<void> {
    console.log('📋 Testing Queue Management APIs\n');

    // Test: Get Queue
    await runTest('Get Queue', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_get_queue',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || typeof result.totalTracks === 'undefined') {
            throw new Error('Invalid queue response');
        }

        console.log(`   Queue size: ${result.totalTracks} tracks`);
    });

    // Test: Add to Queue
    await runTest('Add to Queue', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_add_to_queue',
            arguments: {
                deviceId,
                uri: 'x-file-cifs://server/music/test.mp3',
                metadata: {
                    title: 'Test Track',
                    artist: 'Test Artist',
                    album: 'Test Album',
                },
            },
        });

        if (!result || typeof result.position === 'undefined') {
            throw new Error('Failed to add to queue');
        }

        console.log(`   Added at position: ${result.position}`);
    });

    // Test: Remove from Queue
    await runTest('Remove from Queue', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_remove_from_queue',
            arguments: { deviceId, position: 1 },
        });
    });

    // Test: Clear Queue
    await runTest('Clear Queue', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_clear_queue',
            arguments: { deviceId },
        });
    });

    // Test: Save Queue - first add a track so we have something to save
    await runTest('Save Queue as Playlist', async () => {
        // Add a track first
        await callTool(mcpProcess, {
            name: 'sonos_add_to_queue',
            arguments: {
                deviceId,
                uri: 'x-file-cifs://server/music/test.mp3',
                metadata: {
                    title: 'Test Track for Playlist',
                    artist: 'Test Artist',
                    album: 'Test Album',
                },
            },
        });

        // Now save the queue
        const result = await callTool(mcpProcess, {
            name: 'sonos_save_queue',
            arguments: { deviceId, title: 'Test Playlist' },
        });

        if (!result || result.objectId === undefined) {
            throw new Error('Failed to save queue');
        }

        console.log(`   Saved as: ${result.objectId}`);
    });
}

async function testPlaybackProperties(): Promise<void> {
    console.log('\n🎚️  Testing Playback Property Controls\n');

    // Test: Set Shuffle
    await runTest('Set Shuffle ON', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_shuffle',
            arguments: { deviceId, enabled: true },
        });
    });

    await runTest('Set Shuffle OFF', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_shuffle',
            arguments: { deviceId, enabled: false },
        });
    });

    // Test: Set Repeat
    await runTest('Set Repeat ALL', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_repeat',
            arguments: { deviceId, mode: 'all' },
        });
    });

    await runTest('Set Repeat ONE', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_repeat',
            arguments: { deviceId, mode: 'one' },
        });
    });

    await runTest('Set Repeat OFF', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_repeat',
            arguments: { deviceId, mode: 'off' },
        });
    });

    // Test: Set Crossfade
    await runTest('Set Crossfade ON', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_crossfade',
            arguments: { deviceId, enabled: true },
        });
    });

    await runTest('Set Crossfade OFF', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_crossfade',
            arguments: { deviceId, enabled: false },
        });
    });

    // Test: Get Playback State
    await runTest('Get Playback State', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_get_playback_state',
            arguments: { deviceId },
        });

        if (!result) {
            throw new Error('Invalid playback state response');
        }

        console.log(`   State: ${result.state || 'unknown'}`);
        console.log(`   Shuffle: ${result.shuffle ? 'ON' : 'OFF'}`);
        console.log(`   Repeat: ${result.repeat || 'off'}`);
        console.log(`   Crossfade: ${result.crossfade ? 'ON' : 'OFF'}`);
    });
}

async function testEnhancedPlayUri(): Promise<void> {
    console.log('\n🎵 Testing Enhanced Play URI\n');

    // Test: Play URI with metadata
    await runTest('Play URI with metadata', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_play_uri',
            arguments: {
                deviceId,
                uri: 'x-file-cifs://server/music/test.mp3',
                metadata: {
                    title: 'Test Song',
                    artist: 'Test Artist',
                    album: 'Test Album',
                },
                autoPlay: false,
            },
        });
    });

    // Test: Play URI with auto-play
    await runTest('Play URI with auto-play', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_play_uri',
            arguments: {
                deviceId,
                uri: 'x-file-cifs://server/music/test.mp3',
                autoPlay: true,
            },
        });

        // Stop playback after test
        await wait(1000);
        await callTool(mcpProcess, {
            name: 'sonos_stop',
            arguments: { deviceId },
        });
    });
}

async function testPlayFromQueue(): Promise<void> {
    console.log('\n▶️  Testing Play from Queue\n');

    await runTest('Play from Queue Position', async () => {
        // First add some items to queue
        await callTool(mcpProcess, {
            name: 'sonos_add_to_queue',
            arguments: {
                deviceId,
                uri: 'x-file-cifs://server/music/track1.mp3',
                metadata: { title: 'Track 1' },
            },
        });

        // Play from position 1
        await callTool(mcpProcess, {
            name: 'sonos_play_from_queue',
            arguments: { deviceId, position: 1 },
        });

        await wait(1000);

        // Stop playback
        await callTool(mcpProcess, {
            name: 'sonos_stop',
            arguments: { deviceId },
        });
    });
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
    console.log('║     Phase 1 API Test Suite               ║');
    console.log('║  Queue, DIDL, Playback Properties        ║');
    console.log('╚══════════════════════════════════════════╝\n');

    try {
        await startMcpServer();
        await initializeAndDiscover();

        await testQueueManagement();
        await testPlaybackProperties();
        await testEnhancedPlayUri();
        await testPlayFromQueue();

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║      Phase 1 Tests Complete!             ║');
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
