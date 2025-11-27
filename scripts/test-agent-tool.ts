#!/usr/bin/env tsx
import 'dotenv/config';
import { McpClient } from '../src/cli/lib/mcp-client.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testAgentTool() {
    console.log('='.repeat(60));
    console.log('Testing Sonos Agent Tool');
    console.log('='.repeat(60));
    console.log('');

    // Check environment
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.SONOS_AGENT_MODEL || 'gpt-4o-mini';

    console.log('Environment Configuration:');
    console.log(`  OPENAI_API_KEY: ${hasOpenAI ? '✓ Set' : '✗ Not set'}`);
    console.log(`  GOOGLE_GENERATIVE_AI_API_KEY: ${hasGoogle ? '✓ Set' : '✗ Not set'}`);
    console.log(`  SONOS_AGENT_MODEL: ${model}`);
    console.log('');

    if (!hasOpenAI && !hasGoogle) {
        console.log('❌ No AI API keys configured!');
        console.log('   Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable the agent tool.');
        console.log('');
        process.exit(1);
    }

    // Connect to MCP server
    const serverPath = join(__dirname, '../dist/index.js');
    const client = new McpClient(serverPath);

    try {
        console.log('Connecting to MCP server...');
        await client.connect();
        console.log('✓ Connected');
        console.log('');

        // List all tools
        console.log('Fetching available tools...');
        const tools = await client.listTools();
        console.log(`✓ Found ${tools.length} tools`);
        console.log('');

        // Check if agent tool is available
        const agentTool = tools.find((t) => t.name === 'sonos_agent');

        if (agentTool) {
            console.log('✅ Agent tool is available!');
            console.log('');
            console.log('Tool Details:');
            console.log(`  Name: ${agentTool.name}`);
            console.log(`  Description: ${agentTool.description}`);
            console.log('');

            // Test with a simple instruction
            const testInstruction = 'List all available Sonos devices';
            console.log(`Testing agent with instruction: "${testInstruction}"`);
            console.log('');
            console.log('Calling agent tool (this may take a few seconds)...');

            const startTime = Date.now();
            const result = await client.callTool('sonos_agent', {
                instruction: testInstruction,
            });
            const elapsed = Date.now() - startTime;

            console.log('');
            console.log('='.repeat(60));
            console.log('Agent Response:');
            console.log('='.repeat(60));
            
            if (Array.isArray(result)) {
                result.forEach((item: any) => {
                    if (item.type === 'text') {
                        console.log(item.text);
                    }
                });
            } else {
                console.log(result);
            }
            
            console.log('='.repeat(60));
            console.log('');
            console.log(`✓ Execution time: ${(elapsed / 1000).toFixed(2)}s`);
            console.log('');
            console.log('✅ Agent tool test completed successfully!');
        } else {
            console.log('❌ Agent tool is NOT available!');
            console.log('');
            console.log('This could mean:');
            console.log('  1. AI API keys are not properly configured');
            console.log('  2. Environment variables were not loaded correctly');
            console.log('  3. There is an error in the agent tool implementation');
            console.log('');
            console.log('Available tools:');
            tools.forEach((t) => console.log(`  - ${t.name}`));
            process.exit(1);
        }
    } catch (error) {
        console.error('');
        console.error('❌ Error during test:');
        console.error(error);
        process.exit(1);
    } finally {
        await client.disconnect();
    }
}

testAgentTool().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
