#!/usr/bin/env tsx
/**
 * Test script that builds and queries the MCP server via stdio
 * 
 * This script:
 * 1. Builds the MCP server (npm run build)
 * 2. Spawns the built server from dist/index.js
 * 3. Communicates via stdio using JSON-RPC
 * 4. Queries server info, tools list, and tool descriptions
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
            env: {
                ...process.env,
                MCP_TRANSPORT: 'stdio'
            }
        });

        if (!this.process.stdout || !this.process.stdin) {
            throw new Error('Failed to create stdio streams');
        }

        // Handle stdout data
        this.process.stdout.on('data', (data: Buffer) => {
            this.buffer += data.toString();
            this.processBuffer();
        });

        // Handle stderr (server logs)
        this.process.stderr?.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            if (msg) {
                console.log(`[Server] ${msg}`);
            }
        });

        // Handle process exit
        this.process.on('exit', (code) => {
            console.log(`[Client] Server process exited with code ${code}`);
            // Reject all pending requests
            for (const [id, promise] of this.pendingRequests) {
                promise.reject(new Error(`Server exited with code ${code}`));
            }
            this.pendingRequests.clear();
        });

        // Handle process errors
        this.process.on('error', (error) => {
            console.error(`[Client] Process error:`, error);
        });
    }

    private processBuffer(): void {
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
                const response: JsonRpcResponse = JSON.parse(line);
                const pending = this.pendingRequests.get(Number(response.id));
                
                if (pending) {
                    this.pendingRequests.delete(Number(response.id));
                    
                    if (response.error) {
                        pending.reject(new Error(`JSON-RPC Error: ${response.error.message}`));
                    } else {
                        pending.resolve(response.result);
                    }
                }
            } catch (error) {
                console.error(`[Client] Failed to parse response:`, line);
                console.error(`[Client] Parse error:`, error);
            }
        }
    }

    async request(method: string, params?: unknown): Promise<any> {
        const id = this.requestId++;
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            
            const requestStr = JSON.stringify(request) + '\n';
            
            if (!this.process.stdin?.write(requestStr)) {
                this.pendingRequests.delete(id);
                reject(new Error('Failed to write to server stdin'));
                return;
            }

            // Set a timeout for the request
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request timeout for method: ${method}`));
                }
            }, 10000); // 10 second timeout
        });
    }

    async notify(method: string, params?: unknown): Promise<void> {
        const notification = {
            jsonrpc: '2.0',
            method,
            params
        };

        const notificationStr = JSON.stringify(notification) + '\n';
        
        if (!this.process.stdin?.write(notificationStr)) {
            throw new Error('Failed to write notification to server stdin');
        }
    }

    async shutdown(): Promise<void> {
        console.log('[Client] Shutting down server...');
        
        // Send SIGTERM to the process
        if (this.process && !this.process.killed) {
            this.process.kill('SIGTERM');
            
            // Wait for process to exit
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('[Client] Force killing server...');
                    this.process.kill('SIGKILL');
                    resolve();
                }, 5000);

                this.process.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
    }
}

async function main() {
    console.log('=== MCP Server stdio Test ===\n');

    // Step 1: Build the server
    console.log('[Build] Running npm run build...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('[Build] Build completed successfully\n');
    } catch (error) {
        console.error('[Build] Build failed:', error);
        process.exit(1);
    }

    // Step 2: Start the server
    const distPath = join(__dirname, '..', 'dist', 'index.js');
    const client = new McpStdioClient(distPath);

    // Wait a bit for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        // Step 3: Initialize the connection
        console.log('[Test] Initializing MCP connection...');
        const initResult = await client.request('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: {
                    listChanged: true
                }
            },
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        });
        console.log('[Test] Initialize result:', JSON.stringify(initResult, null, 2));
        console.log();

        // Step 4: Send initialized notification
        console.log('[Test] Sending initialized notification...');
        await client.notify('notifications/initialized', {});
        console.log('[Test] Initialized notification sent\n');

        // Step 5: Get server info
        console.log('[Test] Getting server info...');
        const serverInfo = initResult?.serverInfo || {};
        console.log('[Result] Server Info:', JSON.stringify(serverInfo, null, 2));
        console.log();

        // Step 6: List all tools
        console.log('[Test] Listing all tools...');
        const toolsResult = await client.request('tools/list', {});
        console.log('[Result] Tools List:', JSON.stringify(toolsResult, null, 2));
        console.log();

        // Step 7: Get capabilities
        console.log('[Test] Server Capabilities:');
        console.log(JSON.stringify(initResult?.capabilities || {}, null, 2));
        console.log();

        // Summary
        console.log('=== Test Summary ===');
        console.log(`Server Name: ${serverInfo.name || 'N/A'}`);
        console.log(`Server Version: ${serverInfo.version || 'N/A'}`);
        console.log(`Total Tools: ${toolsResult?.tools?.length || 0}`);
        
        if (toolsResult?.tools && Array.isArray(toolsResult.tools)) {
            console.log('\nAvailable Tools:');
            for (const tool of toolsResult.tools) {
                console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
            }
        }

        console.log('\n[Test] All tests completed successfully!');

    } catch (error) {
        console.error('[Test] Error during testing:', error);
        process.exit(1);
    } finally {
        // Step 8: Cleanup
        await client.shutdown();
    }
}

// Run the test
main().catch((error) => {
    console.error('[Main] Unhandled error:', error);
    process.exit(1);
});
