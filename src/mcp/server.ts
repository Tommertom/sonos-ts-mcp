import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    type CallToolRequest,
    type ListToolsRequest,
    type ListPromptsRequest,
    type GetPromptRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { ServerContext } from './context.js';
import { allTools } from './schemas/tools/index.js';
import { toolHandlers } from './router.js';
import { SONOS_AGENT_INSTRUCTIONS } from './constants.js';
import { getAiConfig } from './config/env-config.js';

/**
 * Sonos MCP Server - Orchestrates MCP protocol and delegates to modular components
 */
export class SonosMcpServer {
    private server: Server;
    private context: ServerContext;

    constructor() {
        this.server = new Server(
            {
                name: 'sonos-mcp-server',
                version: '1.3.0',
                description: 'MCP server for Sonos multi-room audio control. Provides tools for device discovery, playback control, volume management, EQ settings, alarms, grouping, and music library browsing. All tools require a deviceId (room name, UUID, or IP address).',
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                },
            }
        );

        console.error('Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents');
        console.error('Supports: Playback control, volume management, multi-room grouping, music library browsing');
        console.error('Optimized for: Home audio automation, music streaming, zone coordination, smart scenes');
        
        // Log AI capability status
        const aiConfig = getAiConfig();
        if (aiConfig.hasAiKeys) {
            console.error(`✨ AI Agent Tool enabled - Model: ${aiConfig.model} (${aiConfig.provider})`);
        } else {
            console.error('AI Agent Tool disabled - Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable');
        }

        this.context = new ServerContext();
        this.setupHandlers();
    }

    /**
     * Setup MCP request handlers
     */
    private setupHandlers(): void {
        // List all available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
            tools: allTools,
        }));

        // Handle tool execution requests
        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request: CallToolRequest) => this.handleToolCall(request)
        );

        // List all available prompts
        this.server.setRequestHandler(ListPromptsRequestSchema, async (_request: ListPromptsRequest) => ({
            prompts: [
                {
                    name: 'sonos-agent-instructions',
                    description: 'Instructions for AI agents on how to properly control Sonos devices using the MCP tools',
                },
            ],
        }));

        // Get a specific prompt
        this.server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
            if (request.params.name !== 'sonos-agent-instructions') {
                throw new Error(`Unknown prompt: ${request.params.name}`);
            }

            return {
                description: 'Comprehensive instructions for controlling Sonos devices',
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: SONOS_AGENT_INSTRUCTIONS,
                        },
                    },
                ],
            };
        });
    }

    /**
     * Route tool calls to appropriate handlers
     */
    private async handleToolCall(request: CallToolRequest) {
        const { name, arguments: args } = request.params;

        try {
            const handler = toolHandlers[name];

            if (!handler) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Unknown tool: ${name}`,
                        },
                    ],
                };
            }

            // Execute the handler with context
            return await handler(args, this.context);
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    /**
     * Start the MCP server
     */
    async run(): Promise<void> {
        // Load persisted devices before starting
        await this.context.initialize();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        // Start automatic discovery after server connects
        this.context.startPeriodicDiscovery();
    }

    /**
     * Shutdown the server and cleanup resources
     */
    async shutdown(): Promise<void> {
        this.context.shutdown();
    }
}
