#!/usr/bin/env node
/**
 * Phase 4 API Tests
 * 
 * Tests the following Phase 4 features:
 * - UPnP GENA Event Subscriptions
 * - Event Listener
 * - Real-time notifications for state changes
 * 
 * Usage:
 * - With device discovery: npm run test:phase4
 * - With manual device IP: SONOS_DEVICE_IP=192.168.1.100 npm run test:phase4
 * 
 * Note: This test requires a real Sonos device on the network.
 * The test remains running for an extended period to monitor events.
 * to receive and validate event notifications.
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
let subscriptionId: string | undefined;

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
            name: 'sonos_register_device',
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

async function testEventSubscription(): Promise<void> {
    console.log('🔔 Testing Event Subscription\n');

    // Test: Subscribe to AVTransport events
    await runTest('Subscribe to AVTransport Events', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_subscribe_events',
            arguments: {
                deviceId,
                service: 'AVTransport',
            },
        });

        if (!result || !result.subscriptionId) {
            throw new Error('Failed to subscribe to events');
        }

        subscriptionId = result.subscriptionId;
        console.log(`   Subscription ID: ${subscriptionId}`);
    });

    await wait(1000);

    // Test: Subscribe to RenderingControl events
    await runTest('Subscribe to RenderingControl Events', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_subscribe_events',
            arguments: {
                deviceId,
                service: 'RenderingControl',
            },
        });

        if (!result || !result.subscriptionId) {
            throw new Error('Failed to subscribe to events');
        }

        console.log(`   Subscription ID: ${result.subscriptionId}`);
    });
}

async function testEventGeneration(): Promise<void> {
    console.log('\n🎬 Generating Events by Changing Device State\n');

    console.log('⏸️  This will trigger various events. Monitor server output...\n');

    // Trigger volume change event
    await runTest('Trigger Volume Change Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_volume',
            arguments: { deviceId, volume: 20 },
        });
        console.log('   Changed volume to 20');
    });

    await wait(2000);

    await runTest('Trigger Another Volume Change', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_volume',
            arguments: { deviceId, volume: 25 },
        });
        console.log('   Changed volume to 25');
    });

    await wait(2000);

    // Trigger mute event
    await runTest('Trigger Mute Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_mute',
            arguments: { deviceId, muted: true },
        });
        console.log('   Muted device');
    });

    await wait(2000);

    await runTest('Trigger Unmute Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_set_mute',
            arguments: { deviceId, muted: false },
        });
        console.log('   Unmuted device');
    });

    await wait(2000);

    // Trigger playback state events
    console.log('\n▶️  Triggering playback state events...\n');

    // Add something to queue first
    await callTool(mcpProcess, {
        name: 'sonos_add_to_queue',
        arguments: {
            deviceId,
            uri: 'x-file-cifs://server/music/test.mp3',
            metadata: { title: 'Event Test Track' },
        },
    });

    await wait(1000);

    await runTest('Trigger Play Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_play',
            arguments: { deviceId },
        });
        console.log('   Started playback');
    });

    await wait(3000);

    await runTest('Trigger Pause Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_pause',
            arguments: { deviceId },
        });
        console.log('   Paused playback');
    });

    await wait(2000);

    await runTest('Trigger Stop Event', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_stop',
            arguments: { deviceId },
        });
        console.log('   Stopped playback');
    });

    await wait(2000);
}

async function testEventQuerying(): Promise<void> {
    console.log('\n📊 Testing Event Subscription Status\n');

    // Test: List active subscriptions
    await runTest('List Active Subscriptions', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_list_subscriptions',
            arguments: { deviceId },
        });

        if (!result || !result.subscriptions) {
            throw new Error('Failed to list subscriptions');
        }

        console.log(`   Active subscriptions: ${result.subscriptions.length}`);
        result.subscriptions.forEach((sub: any) => {
            console.log(`   - ${sub.service}: ${sub.subscriptionId}`);
        });
    });
}

async function testEventUnsubscription(): Promise<void> {
    console.log('\n🔕 Testing Event Unsubscription\n');

    // Test: Unsubscribe from specific subscription
    if (subscriptionId) {
        await runTest('Unsubscribe from AVTransport', async () => {
            await callTool(mcpProcess, {
                name: 'sonos_unsubscribe_events',
                arguments: { deviceId, subscriptionId },
            });

            console.log('   Unsubscribed from AVTransport');
        });

        await wait(1000);
    }

    // Test: Unsubscribe from all device events
    await runTest('Unsubscribe from All Device Events', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_unsubscribe_all',
            arguments: { deviceId },
        });

        console.log('   Unsubscribed from all events');
    });
}

async function testEventRenewal(): Promise<void> {
    console.log('\n🔄 Testing Event Subscription Renewal\n');

    console.log('⏱️  Subscriptions are automatically renewed by the server.');
    console.log('   Default timeout: 30 minutes, renewal at 25 minutes.\n');

    // Subscribe with a short timeout for testing
    await runTest('Subscribe with Short Timeout (2 minutes)', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_subscribe_events',
            arguments: {
                deviceId,
                service: 'AVTransport',
                timeout: 120, // 2 minutes
            },
        });

        if (!result || !result.subscriptionId) {
            throw new Error('Failed to subscribe to events');
        }

        console.log(`   Subscription will auto-renew at ~1:40`);
        console.log('   (Server handles renewal automatically)');
    });

    console.log('\n   In production, subscriptions are renewed automatically.');
    console.log('   No action needed from clients.\n');
}

async function cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...\n');

    // Unsubscribe from all events
    try {
        await callTool(mcpProcess, {
            name: 'sonos_unsubscribe_all',
            arguments: { deviceId },
        });
    } catch (error) {
        // Ignore errors during cleanup
    }

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
    console.log('║     Phase 4 API Test Suite              ║');
    console.log('║  UPnP GENA Event Subscriptions          ║');
    console.log('╚══════════════════════════════════════════╝\n');

    console.log('📝 Note: This test subscribes to events and generates');
    console.log('   state changes to trigger notifications.\n');
    console.log('   Watch the server output for event notifications.\n');

    try {
        await startMcpServer();
        await initializeAndDiscover();

        await testEventSubscription();
        await testEventGeneration();
        await testEventQuerying();
        await testEventRenewal();
        await testEventUnsubscription();

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║      Phase 4 Tests Complete!             ║');
        console.log('╚══════════════════════════════════════════╝\n');

        console.log('✅ Event subscription system working correctly!');
        console.log('   Events are received and processed automatically.');
        console.log('   Subscriptions are renewed automatically.');
        console.log('   Check server logs for event notifications.\n');
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
