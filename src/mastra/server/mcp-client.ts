import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface McpTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
    };
}

export class McpClient {
    private client: Client;
    private transport: StdioClientTransport | null = null;
    private serverPath: string;
    private isConnected = false;

    constructor(serverPath?: string) {
        this.serverPath = serverPath || join(__dirname, '../../../dist/index.js');
        this.client = new Client(
            {
                name: 'mastra-sonos-client',
                version: '1.0.0',
            },
            {
                capabilities: {},
            }
        );
    }

    async connect(): Promise<void> {
        if (this.isConnected) {
            console.error('[MCP Client] Already connected');
            return;
        }

        try {
            console.error(`[MCP Client] Starting MCP server: ${this.serverPath}`);

            this.transport = new StdioClientTransport({
                command: 'node',
                args: [this.serverPath],
                stderr: 'inherit',
            });

            await this.client.connect(this.transport);

            this.isConnected = true;
            console.error('[MCP Client] Connected successfully');
        } catch (error) {
            console.error('[MCP Client] Connection failed:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await this.client.close();
            if (this.transport) {
                await this.transport.close();
            }
            this.isConnected = false;
            console.error('[MCP Client] Disconnected');
        } catch (error) {
            console.error('[MCP Client] Disconnect error:', error);
        }
    }

    async listTools(): Promise<McpTool[]> {
        if (!this.isConnected) {
            throw new Error('MCP client not connected');
        }

        const response = await this.client.listTools();
        return response.tools as McpTool[];
    }

    async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        if (!this.isConnected) {
            throw new Error('MCP client not connected');
        }

        const response = await this.client.callTool({
            name,
            arguments: args,
        });

        if (response.isError) {
            throw new Error(`MCP tool error: ${JSON.stringify(response.content)}`);
        }

        return response.content;
    }

    getClient(): Client {
        return this.client;
    }

    connected(): boolean {
        return this.isConnected;
    }
}
