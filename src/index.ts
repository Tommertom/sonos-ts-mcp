#!/usr/bin/env node
import 'dotenv/config';
import { SonosMcpServer } from './mcp/server.js';

const server = new SonosMcpServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('\n[Shutdown] Received SIGINT, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('\n[Shutdown] Received SIGTERM, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
});

server.run().catch((error) => {
    console.error('Failed to start Sonos MCP server:', error);
    process.exit(1);
});
