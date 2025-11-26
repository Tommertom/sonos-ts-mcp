import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { SONOS_AGENT_INSTRUCTIONS } from '../../mcp/constants.js';

export interface SonosAgentConfig {
    tools: Record<string, unknown>;
    model?: string;
}

export function createSonosAgent(config: SonosAgentConfig): Agent {
    const modelName = config.model || 'gpt-4o-mini';

    const model = modelName.startsWith('gemini')
        ? google(modelName)
        : openai(modelName);

    return new Agent({
        id: 'sonos-control-agent',
        name: 'Sonos Control Agent',
        description: 'An AI agent specialized in controlling Sonos multi-room audio systems.',
        instructions: SONOS_AGENT_INSTRUCTIONS,
        model: model,
        tools: config.tools,
    });
}

export const SONOS_AGENT_DEFAULT_MODEL = 'gpt-4o-mini';
