import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const execAsync = promisify(exec);

interface ValidationResult {
    isValid: boolean;
    reason: string;
}

async function validateWithAI(prompt: string, output: string, expectedBehavior: string): Promise<ValidationResult> {
    const validationPrompt = `You are a test validator for a Sonos control agent.

User Request: "${prompt}"
Expected Behavior: ${expectedBehavior}
Actual Agent Output: ${output}

Analyze if the agent's output correctly fulfills the user's request and matches the expected behavior.

Respond in JSON format:
{
    "isValid": true/false,
    "reason": "Brief explanation of why the output is valid or invalid"
}`;

    try {
        const result = await generateText({
            model: google('gemini-2.0-flash-exp'),
            prompt: validationPrompt,
        });

        const parsed = JSON.parse(result.text);
        return {
            isValid: parsed.isValid,
            reason: parsed.reason,
        };
    } catch (error) {
        throw new Error(`AI validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

describe('Sonos Integration Tests', () => {
    it('should list all sonos devices', async () => {
        const { stdout } = await execAsync('npm run agent -- "list all sonos devices"');
        
        const validation = await validateWithAI(
            'list all sonos devices',
            stdout,
            'The output should contain a list of discovered Sonos devices with their names or identifiers.'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);

    it('should check if Kitchen device is present', async () => {
        const { stdout } = await execAsync('npm run agent -- "list all sonos devices" --skip-build');
        
        const validation = await validateWithAI(
            'list all sonos devices',
            stdout,
            'The output should include a device named "Kitchen" among the list of discovered Sonos devices.'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);

    it('should check if nothing is playing', async () => {
        const { stdout } = await execAsync('npm run agent -- "check if Kitchen is playing anything" --skip-build');
        
        const validation = await validateWithAI(
            'check if Kitchen is playing anything',
            stdout,
            'The output should indicate the playback state of the Kitchen device (playing, stopped, paused, or not playing).'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);

    it('should set Kitchen volume to 10', async () => {
        const { stdout } = await execAsync('npm run agent -- "set Kitchen volume to 10" --skip-build');
        
        const validation = await validateWithAI(
            'set Kitchen volume to 10',
            stdout,
            'The output should confirm that the Kitchen device volume has been set to 10 or level 10.'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);

    it('should verify Kitchen volume is 10', async () => {
        const { stdout } = await execAsync('npm run agent -- "get Kitchen volume" --skip-build');
        
        const validation = await validateWithAI(
            'get Kitchen volume',
            stdout,
            'The output should report that the Kitchen device volume is currently at 10 or level 10.'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);

    it('should set Kitchen volume back to 0', async () => {
        const { stdout } = await execAsync('npm run agent -- "set Kitchen volume to 0" --skip-build');
        
        const validation = await validateWithAI(
            'set Kitchen volume to 0',
            stdout,
            'The output should confirm that the Kitchen device volume has been set to 0 or muted.'
        );

        expect(validation.isValid).toBe(true);
        if (!validation.isValid) {
            throw new Error(`AI validation failed: ${validation.reason}`);
        }
    }, 60000);
});
