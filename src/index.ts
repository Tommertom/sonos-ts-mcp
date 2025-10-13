#!/usr/bin/env node
import { SonosMcpServer } from './mcp/server.js';

const server = new SonosMcpServer();

server.run().catch((error) => {
    console.error('Failed to start Sonos MCP server:', error);
    process.exit(1);
});
