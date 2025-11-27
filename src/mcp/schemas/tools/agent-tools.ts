import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getAiConfig } from '../../config/env-config.js';

/**
 * Agent tool - AI-powered natural language control
 * Only available when AI API keys are configured
 */
export const agentTools: Tool[] = (() => {
    const aiConfig = getAiConfig();

    if (!aiConfig.hasAiKeys) {
        return [];
    }

    return [
        {
            name: 'sonos_agent',
            description: 'An AI-powered assistant that can take natural language instructions and autonomously control the Sonos system. Use this when you need to solve complex multi-step tasks or when you\'re unsure which specific tools to use. The agent can discover devices, control playback, manage groups, browse music, and more based on your instruction. Examples: "Play jazz in the living room", "Group kitchen and bedroom then play news radio", "Set volume to 50% in all rooms".',
            inputSchema: {
                type: 'object',
                properties: {
                    instruction: {
                        type: 'string',
                        description: 'Natural language instruction for the AI agent to execute. Be specific about what you want to accomplish.',
                    },
                },
                required: ['instruction'],
            },
        },
    ];
})();
