# Mastra Agent Configuration

This document explains the Mastra AI agent configuration used in the Sonos TypeScript MCP CLI agent.

## Overview

The Sonos TypeScript MCP server includes a CLI agent powered by [Mastra](https://mastra.ai), an AI agent framework. The agent enables natural language control of your Sonos system through AI models like GPT-4 and Gemini.

## Telemetry Configuration

### Background

Mastra includes built-in telemetry and observability features using OpenTelemetry. However, as of the November 2024 release, Mastra's legacy telemetry system is deprecated in favor of the new AI Tracing system.

The legacy telemetry system requires an instrumentation file to be loaded before the application starts. Without this file, Mastra displays a warning message about telemetry not being properly initialized. Additionally, Mastra shows a deprecation notice about the telemetry system being removed.

### Telemetry Disabled by Default

In this implementation, we have disabled the Mastra telemetry system to suppress the instrumentation warning. This is done by setting a global flag before Mastra is initialized:

```typescript
// Disable Mastra telemetry warnings
(globalThis as any).___MASTRA_TELEMETRY___ = true;
```

This flag tells Mastra that telemetry has been handled, preventing the "instrumentation file was not loaded" warning from appearing.

**Note**: You may still see a deprecation notice about Mastra telemetry being removed in future releases. This is expected and informational only - it does not affect functionality.

### Where Telemetry is Disabled

The telemetry flag is set in the following files:

1. **`src/cli/sonos-agent-cli.ts`**: Main CLI entry point
2. **`scripts/test-mastra-agent.ts`**: Test script for the Mastra agent

### Enabling Telemetry (Optional)

If you want to enable Mastra's AI Tracing or observability features in the future, you can:

1. Remove or comment out the `globalThis.___MASTRA_TELEMETRY___ = true;` line
2. Follow Mastra's documentation for setting up AI Tracing: https://mastra.ai/en/docs/observability/ai-tracing/overview
3. Create an instrumentation file as described in the Mastra documentation

## Agent Configuration

### Models

The CLI agent supports multiple AI models:

- **OpenAI models** (default: `gpt-4o-mini`)
  - `gpt-4o`
  - `gpt-4o-mini`
  - Other OpenAI models

- **Google Gemini models**
  - `gemini-3-pro-preview`
  - Other Gemini models

### Environment Variables

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key (required for OpenAI models)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google API key (required for Gemini models)

Optional environment variables:

- `SONOS_AGENT_MODEL`: Set the default model to use (e.g., `gpt-4o`, `gemini-3-pro-preview`)

### MCP Integration

The Mastra agent communicates with Sonos devices through the MCP (Model Context Protocol) server:

1. The agent initializes a connection to the MCP server
2. MCP tools are loaded and converted to Mastra-compatible format
3. The AI model uses these tools to control Sonos devices
4. Responses are formatted and returned to the user

## Architecture

```
sonos-agent-cli.ts
  ↓
  Disable telemetry (globalThis flag)
  ↓
  Initialize Mastra
    ↓
    Create MCP Client
      ↓
      Load MCP Tools → Convert to Mastra format
      ↓
      Create Sonos Agent with tools
      ↓
      Return initialized agent
```

## Usage Examples

```bash
# Use default model (gpt-4o-mini)
npm run agent "Play jazz in the living room"

# Use a specific OpenAI model
npm run agent "What's playing?" --model gpt-4o

# Use a Gemini model
npm run agent "Set volume to 50" --model gemini-3-pro-preview

# Skip build step for faster iteration
npm run agent "Play music" --skip-build
```

## Related Documentation

- [Mastra Documentation](https://mastra.ai/en/docs)
- [Mastra AI Tracing](https://mastra.ai/en/docs/observability/ai-tracing/overview)
- [Mastra GitHub Issue #8577](https://github.com/mastra-ai/mastra/issues/8577) - Telemetry deprecation notice
- [MCP Specification](https://spec.modelcontextprotocol.io/)

## Troubleshooting

### Telemetry Warnings

**"Instrumentation file was not loaded" warning:**

If you see this warning when running the agent, verify that:

1. The `(globalThis as any).___MASTRA_TELEMETRY___ = true;` line is present and executed before Mastra imports
2. You're using the latest version of the code
3. No other code is importing Mastra before the flag is set

**Deprecation notice about telemetry:**

You may see a message like "Mastra telemetry is deprecated and will be removed on the Nov 4th release..." This is normal and expected. It's an informational message from Mastra about the future removal of their legacy telemetry system. This does not affect functionality and can be safely ignored.

### Agent Not Working

If the agent isn't responding correctly:

1. Verify your API key is set correctly
2. Check that the MCP server builds successfully
3. Ensure your Sonos devices are discoverable on the network
4. Use `--skip-build` flag to avoid rebuild issues during testing

### Model Selection

If a model isn't working:

1. Verify you have the correct API key set for that model provider
2. Check that the model name is spelled correctly
3. Ensure you have API access to that specific model
