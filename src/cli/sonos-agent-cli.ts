#!/usr/bin/env node
import 'dotenv/config';
import { execSync } from 'child_process';
import { initializeMastra } from '../mastra/config/index.js';
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

        const result = await agent.generate(options.prompt);

        console.log('\n' + '='.repeat(60));
        console.log('AGENT RESPONSE:');
        console.log('='.repeat(60));
        console.log(result.text);
        console.log('='.repeat(60) + '\n');

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
