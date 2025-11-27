import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { getFilteredEnvironment } from '../config/env-config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SONOS_AGENT_INSTRUCTIONS } from '../constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface McpTool {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
    };
}

/**
 * Agent service that spawns a child MCP server and provides AI-powered control
 */
export class AgentService {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private agent: Agent | null = null;
    private model: string;

    constructor(model: string = 'gpt-4o-mini') {
        this.model = model;
    }

    /**
     * Initialize the agent by spawning a child MCP server and loading tools
     */
    async initialize(): Promise<void> {
        if (this.client) {
            throw new Error('Agent already initialized');
        }

        // Spawn child MCP server without AI keys
        await this.spawnChildMcpServer();

        // Load tools from child server
        const tools = await this.loadTools();

        // Create agent with loaded tools
        this.agent = this.createAgent(tools);
    }

    /**
     * Spawn a child MCP server without AI environment variables
     */
    private async spawnChildMcpServer(): Promise<void> {
        const serverPath = join(__dirname, '../../../dist/index.js');
        const filteredEnv = getFilteredEnvironment();

        this.client = new Client(
            {
                name: 'sonos-agent-client',
                version: '1.0.0',
            },
            {
                capabilities: {},
            }
        );

        this.transport = new StdioClientTransport({
            command: 'node',
            args: [serverPath],
            env: filteredEnv,
            stderr: 'pipe',
        });

        await this.client.connect(this.transport);
    }

    /**
     * Load tools from the child MCP server and convert to Mastra format
     */
    private async loadTools(): Promise<Record<string, unknown>> {
        if (!this.client) {
            throw new Error('Client not initialized');
        }

        const response = await this.client.listTools();
        const mcpTools = response.tools as McpTool[];

        const mastraTools: Record<string, unknown> = {};

        for (const mcpTool of mcpTools) {
            const zodSchema = this.convertJsonSchemaToZod(mcpTool.inputSchema);

            mastraTools[mcpTool.name] = createTool({
                id: mcpTool.name,
                description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
                inputSchema: zodSchema,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                execute: async (context: any) => {
                    const input: Record<string, unknown> = {};

                    // Extract parameters from Mastra context
                    for (const [key, value] of Object.entries(context)) {
                        if (!['mastra', 'runId', 'threadId', 'resourceId', 'agentName', 'tracingContext',
                            'writableStream', 'tracingPolicy', 'requireApproval', 'description', 'model',
                            'context', 'runtimeContext', 'writer'].includes(key)) {
                            input[key] = value;
                        }
                    }

                    if (context.context && typeof context.context === 'object') {
                        Object.assign(input, context.context);
                    }

                    if (!this.client) {
                        throw new Error('Client not initialized');
                    }

                    const result = await this.client.callTool({
                        name: mcpTool.name,
                        arguments: input,
                    });

                    if (result.isError) {
                        throw new Error(`MCP tool error: ${JSON.stringify(result.content)}`);
                    }

                    return this.formatToolResult(result.content);
                },
            });
        }

        return mastraTools;
    }

    /**
     * Convert JSON schema to Zod schema
     */
    private convertJsonSchemaToZod(jsonSchema: Record<string, unknown>): z.ZodObject<Record<string, z.ZodTypeAny>> {
        const properties = (jsonSchema.properties as Record<string, unknown>) || {};
        const required = (jsonSchema.required as string[]) || [];

        const zodFields: Record<string, z.ZodTypeAny> = {};

        for (const [key, value] of Object.entries(properties)) {
            const prop = value as Record<string, unknown>;
            let zodType: z.ZodTypeAny;

            switch (prop.type) {
                case 'string':
                    zodType = z.string();
                    break;
                case 'number':
                case 'integer':
                    zodType = z.number();
                    break;
                case 'boolean':
                    zodType = z.boolean();
                    break;
                case 'array':
                    zodType = z.array(z.unknown());
                    break;
                case 'object':
                    zodType = z.record(z.unknown());
                    break;
                default:
                    zodType = z.unknown();
            }

            if (prop.description && typeof prop.description === 'string') {
                zodType = zodType.describe(prop.description);
            }

            if (!required.includes(key)) {
                zodType = zodType.optional();
            }

            zodFields[key] = zodType;
        }

        return z.object(zodFields);
    }

    /**
     * Create the Mastra agent with tools
     */
    private createAgent(tools: Record<string, unknown>): Agent {
        const model = this.model.startsWith('gemini')
            ? google(this.model)
            : openai(this.model);

        return new Agent({
            id: 'sonos-agent-tool',
            name: 'Sonos Agent Tool',
            description: 'AI-powered Sonos control agent',
            instructions: SONOS_AGENT_INSTRUCTIONS,
            model: model,
            tools: tools,
        });
    }

    /**
     * Execute a natural language instruction
     */
    async executeInstruction(instruction: string): Promise<string> {
        if (!this.agent) {
            throw new Error('Agent not initialized');
        }

        const result = await this.agent.generate(instruction, {
            maxSteps: 10,
        });

        return result.text || '(no response from agent)';
    }

    /**
     * Format tool result for display
     */
    private formatToolResult(result: unknown): string {
        if (Array.isArray(result)) {
            return result
                .map((item: unknown) => {
                    if (typeof item === 'object' && item !== null && 'type' in item && item.type === 'text' && 'text' in item) {
                        return String(item.text);
                    }
                    return JSON.stringify(item);
                })
                .join('\n');
        }

        if (typeof result === 'object' && result !== null) {
            return JSON.stringify(result, null, 2);
        }

        return String(result);
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
        if (this.transport) {
            await this.transport.close();
        }
        this.client = null;
        this.transport = null;
        this.agent = null;
    }
}
