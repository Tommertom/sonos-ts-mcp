#!/usr/bin/env tsx
/**
 * Start the Sonos MCP server in stdio mode (default)
 * This is the standard MCP transport mode using standard input/output
 */

import { spawn } from 'child_process';
import { join } from 'path';

const distPath = join(__dirname, '..', 'dist', 'index.js');

console.log('Starting Sonos MCP Server in stdio mode...');
console.log('Press Ctrl+C to stop\n');

const server = spawn('node', [distPath], {
    stdio: 'inherit',
    env: {
        ...process.env,
        // Ensure stdio mode (default)
        MCP_TRANSPORT: 'stdio'
    }
});

server.on('exit', (code) => {
    if (code !== 0) {
        console.error(`\nServer exited with code ${code}`);
        process.exit(code ?? 1);
    }
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.kill('SIGINT');
});
