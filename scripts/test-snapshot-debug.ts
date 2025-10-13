#!/usr/bin/env node
import { spawn, type ChildProcess } from 'child_process';
import { initializeMcpConnection, callTool, wait } from './test-utils.js';

let mcpProcess: ChildProcess;

async function main() {
    console.log('Starting MCP Server...\n');
    
    mcpProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
    });

    mcpProcess.stderr?.on('data', (data) => {
        console.error('[Server Error]', data.toString());
    });

    await wait(1000);
    await initializeMcpConnection(mcpProcess);
    
    const devices = await callTool(mcpProcess, {
        name: 'sonos_discover',
        arguments: { timeout: 5000 },
    });
    
    const deviceId = devices.devices[0].uuid || devices.devices[0].ip;
    console.log('Using device:', deviceId);
    
    console.log('\nTesting Create Snapshot...');
    try {
        const result = await callTool(mcpProcess, {
            name: 'sonos_create_snapshot',
            arguments: { deviceId },
        });
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
    
    mcpProcess.kill('SIGTERM');
}

main().catch(console.error);
