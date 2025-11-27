/**
 * Environment configuration for AI capabilities
 */

export interface AiConfig {
    hasAiKeys: boolean;
    model: string;
    provider: 'openai' | 'google' | null;
}

/**
 * Get AI configuration from environment variables
 */
export function getAiConfig(): AiConfig {
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const model = process.env.SONOS_AGENT_MODEL || 'gpt-4o-mini';

    if (openaiKey) {
        return {
            hasAiKeys: true,
            model,
            provider: 'openai',
        };
    }

    if (googleKey) {
        return {
            hasAiKeys: true,
            model,
            provider: 'google',
        };
    }

    return {
        hasAiKeys: false,
        model: 'gpt-4o-mini',
        provider: null,
    };
}

/**
 * Get environment without AI-related keys (for child MCP server)
 */
export function getFilteredEnvironment(): Record<string, string> {
    const filtered: Record<string, string> = {};
    
    const aiKeys = [
        'OPENAI_API_KEY',
        'GOOGLE_GENERATIVE_AI_API_KEY',
        'SONOS_AGENT_MODEL',
    ];

    for (const [key, value] of Object.entries(process.env)) {
        if (!aiKeys.includes(key) && value !== undefined) {
            filtered[key] = value;
        }
    }

    return filtered;
}
