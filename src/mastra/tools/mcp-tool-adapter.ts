import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { McpClient, McpTool } from '../server/index.js';

export interface MastraToolFromMcp {
    id: string;
    description: string;
    inputSchema: z.ZodObject<any>;
    execute: (input: any) => Promise<any>;
}

export class McpToolAdapter {
    private mcpClient: McpClient;
    private tools: Map<string, MastraToolFromMcp> = new Map();

    constructor(mcpClient: McpClient) {
        this.mcpClient = mcpClient;
    }

    async loadTools(): Promise<Record<string, any>> {
        if (!this.mcpClient.connected()) {
            throw new Error('MCP client must be connected before loading tools');
        }

        const mcpTools = await this.mcpClient.listTools();
        console.error(`[MCP Adapter] Loaded ${mcpTools.length} tools from MCP server`);

        const mastraTools: Record<string, any> = {};

        for (const mcpTool of mcpTools) {
            const mastraTool = this.convertMcpToolToMastraTool(mcpTool);
            this.tools.set(mcpTool.name, mastraTool);
            
            mastraTools[mcpTool.name] = createTool({
                id: mastraTool.id,
                description: mastraTool.description,
                inputSchema: mastraTool.inputSchema,
                execute: mastraTool.execute,
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
            execute: async (input: any) => {
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

    private convertJsonSchemaToZod(jsonSchema: any): z.ZodObject<any> {
        const properties = jsonSchema.properties || {};
        const required = jsonSchema.required || [];

        const zodFields: Record<string, z.ZodTypeAny> = {};

        for (const [key, value] of Object.entries(properties)) {
            const prop = value as any;
            let zodType: z.ZodTypeAny;

            switch (prop.type) {
                case 'string':
                    zodType = z.string();
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'number':
                case 'integer':
                    zodType = z.number();
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'boolean':
                    zodType = z.boolean();
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'array':
                    zodType = z.array(z.any());
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                case 'object':
                    zodType = z.record(z.any());
                    if (prop.description) {
                        zodType = zodType.describe(prop.description);
                    }
                    break;
                default:
                    zodType = z.any();
                    if (prop.description) {
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

    private formatToolResult(result: any): string {
        if (Array.isArray(result)) {
            return result
                .map((item: any) => {
                    if (item.type === 'text') {
                        return item.text;
                    }
                    return JSON.stringify(item);
                })
                .join('\n');
        }

        if (typeof result === 'object') {
            return JSON.stringify(result, null, 2);
        }

        return String(result);
    }

    getTools(): Map<string, MastraToolFromMcp> {
        return this.tools;
    }
}
