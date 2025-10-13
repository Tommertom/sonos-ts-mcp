#!/usr/bin/env tsx
/**
 * Start the Sonos MCP server in SSE mode (HTTP Server-Sent Events)
 * This mode runs an HTTP server for web-based clients or remote access
 */

import { spawn } from 'child_process';
import { join } from 'path';

const distPath = join(__dirname, '..', 'dist', 'index.js');
const port = process.env.MCP_PORT || '3000';

console.log('Starting Sonos MCP Server in SSE mode...');
console.log(`Server will be available at: http://localhost:${port}/sse`);
console.log('Press Ctrl+C to stop\n');

const server = spawn('node', [distPath], {
    stdio: 'inherit',
    env: {
        ...process.env,
        MCP_TRANSPORT: 'sse',
        MCP_PORT: port
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
