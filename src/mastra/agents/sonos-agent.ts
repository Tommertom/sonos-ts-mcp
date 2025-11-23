import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export interface SonosAgentConfig {
    tools: Record<string, any>;
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
        instructions: `You are a Sonos control expert. CRITICAL: Always call sonos_list_devices or sonos_discover FIRST before any other action to see available devices.

Required workflow:
1. Call sonos_list_devices or sonos_discover to get devices
2. Use device room names (e.g., "Badkamer", "Living Room") as deviceId
3. Execute the requested action with appropriate tools
4. Report results clearly

Device identification: Use room names from the device list as the deviceId parameter.

Be concise and always verify devices exist before attempting control actions.`,
        model: model,
        tools: config.tools,
    });
}

export const SONOS_AGENT_DEFAULT_MODEL = 'gpt-4o-mini';
