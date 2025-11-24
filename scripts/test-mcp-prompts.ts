#!/usr/bin/env tsx
/**
 * Test script for MCP prompts functionality
 * 
 * This script:
 * 1. Starts the MCP server via stdio
 * 2. Lists all available prompts
 * 3. Retrieves the sonos-agent-instructions prompt
 * 4. Verifies the content matches expected instructions
 */

import { spawn, type ChildProcess } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: unknown;
}

interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number | string;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

class McpStdioClient {
    private process: ChildProcess;
    private requestId = 1;
    private pendingRequests = new Map<number, {
        resolve: (value: any) => void;
        reject: (error: Error) => void;
    }>();
    private buffer = '';

    constructor(serverPath: string) {
        console.log(`[Client] Spawning MCP server from: ${serverPath}`);

        this.process = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.process.stdout?.on('data', (data: Buffer) => {
            this.buffer += data.toString();
            this.processBuffer();
        });

        this.process.stderr?.on('data', (data: Buffer) => {
            const message = data.toString();
            if (!message.includes('Sonos MCP Server')) {
                console.error('[Server Error]', message);
            }
        });

        this.process.on('exit', (code) => {
            console.log(`[Server] Process exited with code ${code}`);
        });
    }

    private processBuffer(): void {
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;

            try {
                const response: JsonRpcResponse = JSON.parse(line);
                const pending = this.pendingRequests.get(response.id as number);

                if (pending) {
                    this.pendingRequests.delete(response.id as number);

                    if (response.error) {
                        pending.reject(new Error(`${response.error.message} (code: ${response.error.code})`));
                    } else {
                        pending.resolve(response.result);
                    }
                }
            } catch (e) {
                console.error('[Client] Failed to parse response:', line);
            }
        }
    }

    async request(method: string, params?: unknown): Promise<any> {
        const id = this.requestId++;
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            const requestLine = JSON.stringify(request) + '\n';
            this.process.stdin?.write(requestLine);

            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request timeout for method: ${method}`));
                }
            }, 10000);
        });
    }

    close(): void {
        this.process.kill();
    }
}

async function testMcpPrompts(): Promise<void> {
    console.log('='.repeat(60));
    console.log('MCP Prompts Test');
    console.log('='.repeat(60));
    console.log('');

    const projectRoot = join(__dirname, '..');

    // Build first
    console.log('[Test] Building MCP server...');
    try {
        execSync('npm run build', {
            cwd: projectRoot,
            stdio: 'inherit',
        });
        console.log('[Test] Build complete');
        console.log('');
    } catch (error) {
        console.error('[Test] Build failed');
        process.exit(1);
    }

    const serverPath = join(projectRoot, 'dist', 'index.js');
    const client = new McpStdioClient(serverPath);

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Initialize
        console.log('[Test] Initializing MCP connection...');
        const initResult = await client.request('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'prompts-test-client',
                version: '1.0.0',
            },
        });
        console.log('[Test] Server initialized');
        console.log('');

        // List prompts
        console.log('[Test] Listing available prompts...');
        const promptsList = await client.request('prompts/list');

        console.log(`[Test] Found ${promptsList.prompts?.length || 0} prompt(s):`);
        if (promptsList.prompts) {
            promptsList.prompts.forEach((prompt: any, idx: number) => {
                console.log(`  ${idx + 1}. ${prompt.name}`);
                if (prompt.description) {
                    console.log(`     Description: ${prompt.description}`);
                }
            });
        }
        console.log('');

        // Verify we have the sonos-agent-instructions prompt
        const sonosPrompt = promptsList.prompts?.find((p: any) => p.name === 'sonos-agent-instructions');
        if (!sonosPrompt) {
            throw new Error('sonos-agent-instructions prompt not found!');
        }

        console.log('[Test] ✓ sonos-agent-instructions prompt found');
        console.log('');

        // Get the prompt details
        console.log('[Test] Retrieving sonos-agent-instructions prompt...');
        const promptDetails = await client.request('prompts/get', {
            name: 'sonos-agent-instructions',
            arguments: {},
        });

        console.log(`[Test] Prompt description: ${promptDetails.description || 'N/A'}`);
        console.log(`[Test] Number of messages: ${promptDetails.messages?.length || 0}`);
        console.log('');

        // Verify the content
        if (!promptDetails.messages || promptDetails.messages.length === 0) {
            throw new Error('Prompt has no messages!');
        }

        const message = promptDetails.messages[0];
        if (message.role !== 'user') {
            throw new Error(`Expected role 'user', got '${message.role}'`);
        }

        if (message.content.type !== 'text') {
            throw new Error(`Expected content type 'text', got '${message.content.type}'`);
        }

        const instructionsText = message.content.text;
        console.log('[Test] Instructions preview (first 200 chars):');
        console.log('-'.repeat(60));
        console.log(instructionsText.substring(0, 200) + '...');
        console.log('-'.repeat(60));
        console.log('');

        // Verify key phrases are present
        const keyPhrases = [
            'You control Sonos devices',
            'sonos_list_devices',
            'sonos_discover',
            'sonos_get_favorite_radio_stations',
            'sonos_get_sonos_favorites',
            'sonos_play_uri',
        ];

        console.log('[Test] Verifying key phrases are present...');
        for (const phrase of keyPhrases) {
            if (!instructionsText.includes(phrase)) {
                throw new Error(`Key phrase missing: "${phrase}"`);
            }
            console.log(`  ✓ Found: "${phrase}"`);
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✓ All tests passed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('✗ Test failed!');
        console.error('='.repeat(60));
        console.error('Error:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    } finally {
        client.close();
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n[Test] Interrupted');
    process.exit(130);
});

// Run the test
testMcpPrompts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
