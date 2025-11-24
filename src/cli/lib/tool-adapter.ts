import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { McpClient, McpTool } from './mcp-client.js';

export interface MastraToolFromMcp {
    id: string;
    description: string;
    inputSchema: z.ZodObject<Record<string, z.ZodTypeAny>>;
    execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export class McpToolAdapter {
    private mcpClient: McpClient;
    private tools: Map<string, MastraToolFromMcp> = new Map();

    constructor(mcpClient: McpClient) {
        this.mcpClient = mcpClient;
    }

    async loadTools(): Promise<Record<string, unknown>> {
        if (!this.mcpClient.connected()) {
            throw new Error('MCP client must be connected before loading tools');
        }

        const mcpTools = await this.mcpClient.listTools();
        console.error(`[MCP Adapter] Loaded ${mcpTools.length} tools from MCP server`);

        const mastraTools: Record<string, unknown> = {};

        for (const mcpTool of mcpTools) {
            const mastraTool = this.convertMcpToolToMastraTool(mcpTool);
            this.tools.set(mcpTool.name, mastraTool);

            mastraTools[mcpTool.name] = createTool({
                id: mastraTool.id,
                description: mastraTool.description,
                inputSchema: mastraTool.inputSchema,
                execute: async (context: any) => {
                    // Extract the actual input from the Mastra context
                    // Mastra wraps tool parameters in a nested context.context structure
                    const input: Record<string, unknown> = {};

                    // First, collect any direct parameters (excluding Mastra framework properties)
                    for (const [key, value] of Object.entries(context)) {
                        // Skip Mastra framework properties
                        if (!['mastra', 'runId', 'threadId', 'resourceId', 'agentName', 'tracingContext',
                            'writableStream', 'tracingPolicy', 'requireApproval', 'description', 'model',
                            'context', 'runtimeContext', 'writer'].includes(key)) {
                            input[key] = value;
                        }
                    }

                    // Tool parameters are nested in context.context
                    if (context.context && typeof context.context === 'object') {
                        Object.assign(input, context.context);
                    }

                    console.error(`[MCP Adapter] Calling ${mastraTool.id} with input:`, JSON.stringify(input));
                    return mastraTool.execute(input);
                },
            });
        }

        return mastraTools;
    }

    private convertMcpToolToMastraTool(mcpTool: McpTool): MastraToolFromMcp {
        const zodSchema = this.convertJsonSchemaToZod(mcpTool.inputSchema);

        return {
            id: mcpTool.name,
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            inputSchema: zodSchema,
            execute: async (input: Record<string, unknown>) => {
                try {
                    const result = await this.mcpClient.callTool(mcpTool.name, input);
                    return this.formatToolResult(result);
                } catch (error) {
                    console.error(`[MCP Adapter] Error executing tool ${mcpTool.name}:`, error);
                    throw error;
                }
            },
        };
    }

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
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'number':
                case 'integer':
                    zodType = z.number();
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'boolean':
                    zodType = z.boolean();
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'array':
                    zodType = z.array(z.unknown());
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'object':
                    zodType = z.record(z.unknown());
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                default:
                    zodType = z.unknown();
                    if (prop.description && typeof prop.description === 'string') {
                        zodType = zodType.describe(prop.description);
                    }
            }

            if (!required.includes(key)) {
                zodType = zodType.optional();
            }

            zodFields[key] = zodType;
        }

        return z.object(zodFields);
    }

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

    getTools(): Map<string, MastraToolFromMcp> {
        return this.tools;
    }
}
