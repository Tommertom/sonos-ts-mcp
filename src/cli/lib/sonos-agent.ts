import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

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
        instructions: `You control Sonos devices. 

CRITICAL: Your first action must ALWAYS be to call the sonos_discover tool.

Steps:
1. Call sonos_discover (no arguments needed)
2. Identify the room name from results
3. Use room name as deviceId for other tools
4. Execute the requested action

When users want to PLAY content by name (e.g., "Play Radio 2", "Play my Jazz playlist"):
1. First call sonos_discover to get the deviceId
2. Then search through favorites using the appropriate tool:
   - sonos_get_favorite_radio_stations for radio stations
   - sonos_get_sonos_favorites for all favorites (playlists, albums, radio, etc.)
3. Fuzzy match the user's query against the titles in the results
4. Extract the URI from resources[0].uri of the matched item
5. Use sonos_play_uri with the extracted URI and proper metadata

Example: For "Play Radio 2 in Badkamer" → call sonos_discover, find "Badkamer" device, call sonos_get_favorite_radio_stations with deviceId="Badkamer", fuzzy match "Radio 2" against titles, extract the URI, then call sonos_play_uri.

Example: For "What's playing in Badkamer?" → call sonos_discover, find "Badkamer" device, then call playback status tool with deviceId="Badkamer".`,
        model: model,
        tools: config.tools,
    });
}

export const SONOS_AGENT_DEFAULT_MODEL = 'gpt-4o-mini';
