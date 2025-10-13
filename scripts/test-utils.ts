/**
 * Test Utilities for MCP Server Testing
 * 
 * This module provides utilities for:
 * - Spawning the MCP server in SSE mode (HTTP)
 * - Making JSON-RPC requests to the server
 * - Handling responses and errors
 */

import { spawn, type ChildProcess } from 'child_process';
import { request as httpRequest } from 'http';
import type { IncomingMessage } from 'http';

export interface McpServerConfig {
    port: number;
    host: string;
}

export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: unknown;
}

export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number | string;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

export interface McpToolCall {
    name: string;
    arguments?: Record<string, unknown>;
}

export interface SonosDevice {
    uuid?: string;
    ip: string;
    name?: string;
    model?: string;
    [key: string]: unknown;
}

/**
 * Spawn an MCP server in SSE/HTTP mode
 */
export async function spawnMcpServer(config: McpServerConfig): Promise<{
    process: ChildProcess;
    url: string;
    shutdown: () => Promise<void>;
}> {
    const { port, host } = config;
    const url = `http://${host}:${port}/mcp`;

    // Start a simple HTTP server that wraps the MCP server
    const serverScript = `
import express from 'express';
import { SonosMcpServer } from '../src/mcp/server.js';

const app = express();
app.use(express.json());

const mcpServer = new SonosMcpServer();

// Simple HTTP endpoint that handles JSON-RPC over HTTP
app.post('/mcp', async (req, res) => {
    try {
        // For testing, we'll use a simple request/response pattern
        // In production, you'd use StreamableHTTPServerTransport
        
        // Mock stdin/stdout for the server
        const mockTransport = {
            messages: [] as any[],
            send: (message: any) => {
                res.json(message);
            },
            close: () => {},
        };
        
        // This is a simplified test transport
        res.json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: {
                code: -32601,
                message: 'Test server needs full transport implementation'
            }
        });
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id || null,
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error)
            }
        });
    }
});

app.listen(${port}, '${host}', () => {
    console.log('MCP Test Server listening on ${url}');
});
`;

    // For now, we'll use a simpler approach: spawn the MCP server with stdio
    // and create a test client that communicates via stdio
    const serverProcess = spawn('node', ['--loader', 'tsx', '-e', serverScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });

    let serverReady = false;
    let serverError: Error | null = null;

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Server startup timeout'));
        }, 10000);

        serverProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log('[MCP Server]', output);
            if (output.includes('listening')) {
                serverReady = true;
                clearTimeout(timeout);
                resolve();
            }
        });

        serverProcess.stderr?.on('data', (data) => {
            console.error('[MCP Server Error]', data.toString());
        });

        serverProcess.on('error', (error) => {
            serverError = error;
            clearTimeout(timeout);
            reject(error);
        });

        serverProcess.on('exit', (code) => {
            if (!serverReady) {
                clearTimeout(timeout);
                reject(new Error(`Server exited with code ${code} before becoming ready`));
            }
        });
    });

    const shutdown = async () => {
        return new Promise<void>((resolve) => {
            if (serverProcess.killed) {
                resolve();
                return;
            }

            serverProcess.on('exit', () => {
                resolve();
            });

            serverProcess.kill('SIGTERM');

            // Force kill after 5 seconds
            setTimeout(() => {
                if (!serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                    resolve();
                }
            }, 5000);
        });
    };

    return {
        process: serverProcess,
        url,
        shutdown,
    };
}

/**
 * Make a JSON-RPC request to the MCP server via stdio
 * 
 * Since the MCP server uses stdio transport, we'll communicate directly
 * with the process stdin/stdout
 */
export async function makeStdioRequest(
    serverProcess: ChildProcess,
    request: JsonRpcRequest
): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, 30000);

        let responseData = '';

        const onData = (data: Buffer) => {
            responseData += data.toString();

            // JSON-RPC over stdio uses newline-delimited JSON
            const lines = responseData.split('\n');

            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line) {
                    try {
                        const response = JSON.parse(line) as JsonRpcResponse;
                        if (response.id === request.id) {
                            clearTimeout(timeout);
                            serverProcess.stdout?.removeListener('data', onData);
                            resolve(response);
                            return;
                        }
                    } catch (error) {
                        // Not valid JSON, keep accumulating
                    }
                }
            }

            // Keep the last incomplete line
            responseData = lines[lines.length - 1];
        };

        serverProcess.stdout?.on('data', onData);

        // Send request
        const requestStr = JSON.stringify(request) + '\n';
        serverProcess.stdin?.write(requestStr);
    });
}

/**
 * Initialize the MCP server connection
 */
export async function initializeMcpConnection(
    serverProcess: ChildProcess
): Promise<void> {
    const initRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
            },
            clientInfo: {
                name: 'test-client',
                version: '1.0.0',
            },
        },
    };

    const response = await makeStdioRequest(serverProcess, initRequest);

    if (response.error) {
        throw new Error(`Initialization failed: ${response.error.message}`);
    }

    // Send initialized notification
    const initializedNotification: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'notifications/initialized',
    };

    serverProcess.stdin?.write(JSON.stringify(initializedNotification) + '\n');
}

/**
 * List all available tools from the MCP server
 */
export async function listTools(serverProcess: ChildProcess): Promise<any[]> {
    const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
    };

    const response = await makeStdioRequest(serverProcess, request);

    if (response.error) {
        throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    return (response.result as any)?.tools || [];
}

/**
 * Call an MCP tool
 */
export async function callTool(
    serverProcess: ChildProcess,
    toolCall: McpToolCall
): Promise<any> {
    const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
            name: toolCall.name,
            arguments: toolCall.arguments || {},
        },
    };

    const response = await makeStdioRequest(serverProcess, request);

    if (response.error) {
        throw new Error(`Tool call failed: ${response.error.message}`);
    }

    // MCP tools return results in content array format
    // Parse the text content if it's JSON
    if (response.result && typeof response.result === 'object') {
        const result = response.result as any;

        // Check if the result has an error flag
        if (result.isError) {
            const errorText = result.content?.[0]?.text || 'Unknown error';
            throw new Error(errorText);
        }

        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
            const textContent = result.content[0].text;
            if (textContent) {
                try {
                    // Try to parse as JSON
                    return JSON.parse(textContent);
                } catch {
                    // If not JSON, return the raw text wrapped in an object
                    return { text: textContent };
                }
            }
        }
        return result;
    }

    return response.result;
}

/**
 * Discover Sonos devices
 */
export async function discoverDevices(
    serverProcess: ChildProcess
): Promise<SonosDevice[]> {
    const result = await callTool(serverProcess, {
        name: 'sonos_discover',
        arguments: { timeout: 5000 },
    });

    // Result has already been parsed by callTool
    if (result && result.devices && Array.isArray(result.devices)) {
        return result.devices;
    }

    return [];
}

/**
 * Helper to format test results
 */
export function formatTestResult(
    testName: string,
    success: boolean,
    details?: string
): string {
    const status = success ? '✅' : '❌';
    const prefix = `${status} ${testName}`;
    return details ? `${prefix}\n   ${details}` : prefix;
}

/**
 * Helper to run a test with error handling
 */
export async function runTest(
    name: string,
    testFn: () => Promise<void>
): Promise<boolean> {
    try {
        await testFn();
        console.log(formatTestResult(name, true));
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(formatTestResult(name, false, message));
        return false;
    }
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
