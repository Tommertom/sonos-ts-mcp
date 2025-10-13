#!/usr/bin/env node
/**
 * Debug script for Phase 3 issues
 */

import { spawn, type ChildProcess } from 'child_process';
import {
    initializeMcpConnection,
    callTool,
    wait,
} from './test-utils.js';

let mcpProcess: ChildProcess;

async function startMcpServer(): Promise<void> {
    console.log('🚀 Starting MCP Server...\n');

    mcpProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
    });

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

async function main(): Promise<void> {
    try {
        await startMcpServer();
        await initializeMcpConnection(mcpProcess);

        const deviceId = process.env.SONOS_DEVICE_IP || '192.168.1.100';
        console.log(`Using device: ${deviceId}\n`);

        // Register device
        console.log('Registering device...');
        const addResult = await callTool(mcpProcess, {
            name: 'sonos_add_device',
            arguments: { ip: deviceId, port: 1400 },
        });
        console.log('Add Device Result:', JSON.stringify(addResult, null, 2));

        // List devices
        console.log('\nListing devices...');
        const listResult = await callTool(mcpProcess, {
            name: 'sonos_list_devices',
            arguments: {},
        });
        console.log('List Devices Result:', JSON.stringify(listResult, null, 2));

        // Test list alarms
        console.log('Testing sonos_list_alarms...');
        const alarmsResult = await callTool(mcpProcess, {
            name: 'sonos_list_alarms',
            arguments: { deviceId },
        });
        console.log('List Alarms Result:', JSON.stringify(alarmsResult, null, 2));

        // Test create alarm
        console.log('\nTesting sonos_create_alarm...');
        try {
            const createResult = await callTool(mcpProcess, {
                name: 'sonos_create_alarm',
                arguments: {
                    deviceId,
                    startTime: '07:00:00',
                    recurrence: 'ONCE',
                    enabled: false,
                    volume: 25,
                    duration: '01:00:00',
                },
            });
            console.log('Create Alarm Result:', JSON.stringify(createResult, null, 2));
        } catch (error) {
            console.error('Create alarm error:', error);
        }

        // Test snapshot with correct name
        console.log('\nTesting sonos_snapshot...');
        try {
            const snapshotResult = await callTool(mcpProcess, {
                name: 'sonos_snapshot',
                arguments: { deviceId },
            });
            console.log('Snapshot Result:', JSON.stringify(snapshotResult, null, 2));
        } catch (error) {
            console.error('Snapshot error:', error);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (mcpProcess && !mcpProcess.killed) {
            mcpProcess.kill('SIGTERM');
        }
    }
}

main();
