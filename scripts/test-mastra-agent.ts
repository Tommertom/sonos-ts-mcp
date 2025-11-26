#!/usr/bin/env node
/**
 * Simple test script for the Mastra Sonos agent
 * Tests basic connectivity without requiring Sonos devices
 */

import 'dotenv/config';

// Disable Mastra telemetry warnings
(globalThis as any).___MASTRA_TELEMETRY___ = true;

import { initializeMastra } from '../src/cli/lib/mastra-init.js';

async function testAgent() {
    console.log('Testing Mastra Sonos Agent...\n');

    try {
        // Initialize Mastra with MCP client
        console.log('1. Initializing Mastra...');
        const { mastra, mcpClient, cleanup } = await initializeMastra();
        console.log('   ✓ Mastra initialized\n');

        // List available tools
        console.log('2. Listing available Sonos tools...');
        const tools = await mcpClient.listTools();
        console.log(`   ✓ Found ${tools.length} tools:\n`);

        tools.forEach((tool, idx) => {
            console.log(`   ${idx + 1}. ${tool.name}`);
            if (tool.description) {
                console.log(`      ${tool.description}`);
            }
        });

        console.log('\n3. Agent is ready to receive commands!\n');
        console.log('Example usage:');
        console.log('  npm run agent "What Sonos devices are available?"');
        console.log('  npm run agent "Play jazz in the living room"\n');

        // Cleanup
        await cleanup();
        console.log('✓ Test completed successfully');

    } catch (error) {
        console.error('✗ Test failed:', error);
        process.exit(1);
    }
}

testAgent();
