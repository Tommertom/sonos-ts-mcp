import { AgentService } from '../services/agent-service.js';
import { getAiConfig } from '../config/env-config.js';
import type { ToolResponse, ServerContext } from '../types/handler-types.js';

export async function handleAgentInstruction(
    args: unknown,
    _context: ServerContext
): Promise<ToolResponse> {
    const params = args as Record<string, unknown>;
    const { instruction } = params;

    if (!instruction || typeof instruction !== 'string') {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: instruction parameter is required and must be a string',
                },
            ],
            isError: true,
        };
    }

    const aiConfig = getAiConfig();

    if (!aiConfig.hasAiKeys) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: AI capabilities are not configured. Please set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.',
                },
            ],
            isError: true,
        };
    }

    const agentService = new AgentService(aiConfig.model);

    try {
        console.error(`[Agent Tool] Initializing agent with model: ${aiConfig.model}`);
        await agentService.initialize();

        console.error(`[Agent Tool] Executing instruction: "${instruction}"`);
        const result = await agentService.executeInstruction(instruction);

        console.error(`[Agent Tool] Instruction completed successfully`);

        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    } catch (error) {
        console.error('[Agent Tool] Error executing instruction:', error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing agent instruction: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    } finally {
        await agentService.cleanup();
    }
}
