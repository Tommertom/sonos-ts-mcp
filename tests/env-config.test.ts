/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import { getAiConfig, getFilteredEnvironment } from '../src/mcp/config/env-config.js';

describe('Environment Configuration', () => {
    describe('getAiConfig', () => {
        it('should detect OpenAI configuration', () => {
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.SONOS_AGENT_MODEL = 'gpt-4o';
            
            const config = getAiConfig();
            
            expect(config.hasAiKeys).toBe(true);
            expect(config.provider).toBe('openai');
            expect(config.model).toBe('gpt-4o');
            
            delete process.env.OPENAI_API_KEY;
            delete process.env.SONOS_AGENT_MODEL;
        });

        it('should detect Google configuration', () => {
            process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'google-test123';
            process.env.SONOS_AGENT_MODEL = 'gemini-3-pro-preview';
            
            const config = getAiConfig();
            
            expect(config.hasAiKeys).toBe(true);
            expect(config.provider).toBe('google');
            expect(config.model).toBe('gemini-3-pro-preview');
            
            delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            delete process.env.SONOS_AGENT_MODEL;
        });

        it('should return no AI keys when not configured', () => {
            const originalOpenAI = process.env.OPENAI_API_KEY;
            const originalGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            
            delete process.env.OPENAI_API_KEY;
            delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            
            const config = getAiConfig();
            
            expect(config.hasAiKeys).toBe(false);
            expect(config.provider).toBe(null);
            expect(config.model).toBe('gpt-4o-mini');
            
            if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
            if (originalGoogle) process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogle;
        });

        it('should use default model when not specified', () => {
            process.env.OPENAI_API_KEY = 'sk-test123';
            delete process.env.SONOS_AGENT_MODEL;
            
            const config = getAiConfig();
            
            expect(config.model).toBe('gpt-4o-mini');
            
            delete process.env.OPENAI_API_KEY;
        });
    });

    describe('getFilteredEnvironment', () => {
        it('should filter out AI-related environment variables', () => {
            process.env.OPENAI_API_KEY = 'sk-test123';
            process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'google-test123';
            process.env.SONOS_AGENT_MODEL = 'gpt-4o';
            process.env.SOME_OTHER_VAR = 'keep-this';
            
            const filtered = getFilteredEnvironment();
            
            expect(filtered.OPENAI_API_KEY).toBeUndefined();
            expect(filtered.GOOGLE_GENERATIVE_AI_API_KEY).toBeUndefined();
            expect(filtered.SONOS_AGENT_MODEL).toBeUndefined();
            expect(filtered.SOME_OTHER_VAR).toBe('keep-this');
            
            delete process.env.OPENAI_API_KEY;
            delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            delete process.env.SONOS_AGENT_MODEL;
            delete process.env.SOME_OTHER_VAR;
        });

        it('should preserve all non-AI environment variables', () => {
            process.env.PATH = '/usr/bin';
            process.env.HOME = '/home/user';
            
            const filtered = getFilteredEnvironment();
            
            expect(filtered.PATH).toBe('/usr/bin');
            expect(filtered.HOME).toBe('/home/user');
        });
    });
});
