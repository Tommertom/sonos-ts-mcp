#!/usr/bin/env node
import 'dotenv/config';

// Disable Mastra telemetry warnings
(globalThis as any).___MASTRA_TELEMETRY___ = true;

import { execSync } from 'child_process';
import { initializeMastra } from './lib/mastra-init.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CliOptions {
    prompt: string;
    model?: string;
    skipBuild?: boolean;
}

async function parseArgs(): Promise<CliOptions> {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Sonos Agent CLI - Control your Sonos system with AI

Usage:
  sonos-agent-cli <prompt> [options]

Arguments:
  prompt          Natural language command for the Sonos agent

Options:
  --model <name>  LLM model to use (default: gpt-4o-mini)
  --skip-build    Skip the build step (use existing dist/)
  --help, -h      Show this help message

Examples:
  sonos-agent-cli "Play jazz in the living room"
  sonos-agent-cli "What Sonos devices are available?"
  sonos-agent-cli "Group kitchen and bedroom, then play news radio"
  sonos-agent-cli "Set volume to 50% in all rooms" --model gpt-4o

Environment Variables:
  OPENAI_API_KEY              Your OpenAI API key (required for OpenAI models)
  GOOGLE_GENERATIVE_AI_API_KEY Your Google API key (required for Gemini models)
  SONOS_AGENT_MODEL           Default model to use (optional, overrides default)
        `);
        process.exit(0);
    }

    const options: CliOptions = {
        prompt: '',
        skipBuild: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg) continue;

        if (arg === '--model' && i + 1 < args.length) {
            options.model = args[i + 1];
            i++;
        } else if (arg === '--skip-build') {
            options.skipBuild = true;
        } else if (!arg.startsWith('--')) {
            options.prompt = arg;
        }
    }

    if (!options.prompt) {
        console.error('Error: No prompt provided');
        process.exit(1);
    }

    return options;
}

async function buildMcpServer(): Promise<void> {
    const projectRoot = join(__dirname, '../..');

    console.error('[CLI] Building Sonos MCP server...');

    try {
        execSync('npm run build', {
            cwd: projectRoot,
            stdio: 'inherit',
        });
        console.error('[CLI] Build complete');
    } catch (error) {
        console.error('[CLI] Build failed:', error);
        throw error;
    }
}

async function runAgent(options: CliOptions): Promise<void> {
    const modelName = options.model || process.env.SONOS_AGENT_MODEL || 'gpt-4o-mini';

    if (modelName.startsWith('gemini')) {
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error('Error: GOOGLE_GENERATIVE_AI_API_KEY environment variable is required for Gemini models');
            console.error('Please set it with: export GOOGLE_GENERATIVE_AI_API_KEY=...');
            process.exit(1);
        }
    } else {
        if (!process.env.OPENAI_API_KEY) {
            console.error('Error: OPENAI_API_KEY environment variable is required');
            console.error('Please set it with: export OPENAI_API_KEY=sk-...');
            process.exit(1);
        }
    }

    if (!options.skipBuild) {
        await buildMcpServer();
    }

    console.error('[CLI] Initializing Mastra with Sonos MCP server...');
    const { mastra, sonosAgent, cleanup } = await initializeMastra({
        model: modelName,
    });

    let exitCode = 0;

    try {
        console.error(`[CLI] Executing prompt: "${options.prompt}"\n`);

        const agent = mastra.getAgent('sonosAgent');

        const result = await agent.generate(options.prompt, {
            maxSteps: 10,
            onStepFinish: ({ toolCalls, toolResults }) => {
                if (toolCalls && toolCalls.length > 0) {
                    console.log(`\n[Agent] ${toolCalls.length} tool call(s) in this step`);
                }
                if (toolResults && toolResults.length > 0) {
                    console.log(`[Agent] ${toolResults.length} tool result(s) received\n`);
                    toolResults.forEach((toolResult, idx: number) => {
                        const result = toolResult.payload.result;
                        if (result) {
                            const resultText = typeof result === 'string'
                                ? result.substring(0, 200)
                                : JSON.stringify(result).substring(0, 200);
                            console.log(`  Result ${idx + 1}: ${resultText}...`);
                        }
                    });
                }
            },
        });

        console.log('\n' + '='.repeat(60));
        console.log('AGENT RESPONSE:');
        console.log('='.repeat(60));
        console.log(result.text || '(no text response)');
        console.log('='.repeat(60) + '\n');

        // Debug: show reasoning steps
        if (result.steps && result.steps.length > 0) {
            console.log('[Debug] Agent completed', result.steps.length, 'reasoning step(s):');
            result.steps.forEach((step: any, idx: number) => {
                const hasText = step.text && step.text.trim().length > 0;
                const hasToolCalls = step.toolCalls && step.toolCalls.length > 0;
                const hasToolResults = step.toolResults && step.toolResults.length > 0;

                let stepType = '';
                if (hasToolCalls && hasText) {
                    stepType = 'Tool execution + reasoning';
                } else if (hasToolCalls) {
                    stepType = 'Tool execution';
                } else if (hasText) {
                    stepType = 'Final response';
                } else {
                    stepType = 'Unknown';
                }

                console.log(`  Step ${idx + 1} [${stepType}]:`);

                if (hasToolCalls) {
                    step.toolCalls.forEach((call: any) => {
                        // The tool information is in call.payload
                        const toolName = call.payload?.toolName || call.toolName || call.name || call.type || 'unknown';
                        const args = call.payload?.args || call.args;
                        const argsInfo = args ? ` (${Object.keys(args).join(', ')})` : '';
                        console.log(`    → ${toolName}${argsInfo}`);
                    });
                }

                if (hasText) {
                    const textPreview = step.text.length > 100
                        ? step.text.substring(0, 100) + '...'
                        : step.text;
                    console.log(`    Response: "${textPreview}"`);
                }
            });
            console.log('');
        }

    } catch (error) {
        console.error('[CLI] Error:', error);
        exitCode = 1;
    } finally {
        await cleanup();
        process.exit(exitCode);
    }
}

async function main(): Promise<void> {
    try {
        const options = await parseArgs();
        await runAgent(options);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.error('\n[CLI] Interrupted, shutting down...');
    process.exit(130);
});

process.on('SIGTERM', async () => {
    console.error('\n[CLI] Terminated, shutting down...');
    process.exit(143);
});

main();
