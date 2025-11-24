# Mastra AI Sonos Control Agent

## Overview

This implementation provides a Mastra AI agent that controls Sonos devices through the Sonos MCP (Model Context Protocol) server. The architecture is modular and designed for reuse in agent network configurations.

## Quick Start

### Prerequisites

1. Node.js >= 20.0.0
2. OpenAI API key (or other supported LLM provider)
3. Sonos devices on your local network

### Installation

Dependencies are already installed if you've built the project. The required packages are:
- `@mastra/core` - Mastra framework
- `@ai-sdk/openai` - OpenAI integration
- `ai` - AI SDK
- `zod` - Schema validation

### Basic Usage

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-your-key-here

# Run a command
npm run agent "Play jazz in the living room"

# With custom model
npm run agent "What devices are available?" -- --model gpt-4o

# Skip build if already built
npm run agent "Pause all music" -- --skip-build
```

## Architecture

### Directory Structure

```
src/
├── mastra/
│   ├── server/
│   │   ├── mcp-client.ts          # MCP client for connecting to Sonos MCP server
│   │   └── index.ts
│   ├── tools/
│   │   ├── mcp-tool-adapter.ts    # Converts MCP tools to Mastra tools
│   │   └── index.ts
│   ├── agents/
│   │   ├── sonos-agent.ts         # Sonos control agent definition
│   │   └── index.ts
```
src/
├── cli/
│   ├── lib/
│   │   ├── mastra-init.ts        # Mastra initialization
│   │   ├── mcp-client.ts         # MCP client connection
│   │   ├── sonos-agent.ts        # Agent definition
│   │   └── tool-adapter.ts       # Tool conversion
│   └── sonos-agent-cli.ts        # CLI entry point
└── [existing MCP server code]
```

### Components

#### 1. MCP Client (`src/cli/lib/mcp-client.ts`)

Manages connection to the Sonos MCP server via stdio transport.

**Key Features:**
- Spawns MCP server as child process
- Handles stdio communication
- Provides tool listing and execution
- Lifecycle management (connect/disconnect)

**API:**
```typescript
const mcpClient = new McpClient(serverPath);
await mcpClient.connect();
const tools = await mcpClient.listTools();
const result = await mcpClient.callTool('toolName', { arg: 'value' });
await mcpClient.disconnect();
```

#### 2. MCP Tool Adapter (`src/cli/lib/tool-adapter.ts`)

Converts MCP tools to Mastra-compatible tool definitions.

**Key Features:**
- Fetches tools from MCP server
- Converts JSON Schema to Zod schemas
- Wraps tool execution with MCP client
- Handles result formatting

**API:**
```typescript
const adapter = new McpToolAdapter(mcpClient);
const mastraTools = await adapter.loadTools();
// Returns: Record<string, MastraTool>
```

#### 3. Sonos Agent (`src/cli/lib/sonos-agent.ts`)

Agent specialized in Sonos device control.

**System Prompt Summary:**
- Expert in Sonos audio systems
- Always starts with device discovery (sonos_discover)
- Resolves room names to device IDs
- For playback requests by name (e.g., "Play Radio 2"):
  - Searches favorites using sonos_get_favorite_radio_stations or sonos_get_sonos_favorites
  - Fuzzy matches user query against favorite titles
  - Extracts URI from matched item
  - Plays using sonos_play_uri with proper metadata
- Manages playback, volume, grouping, alarms, EQ
- Provides clear, user-friendly feedback

**API:**
```typescript
const agent = createSonosAgent({
  tools: mastraTools,
  model: 'gpt-4o-mini', // optional
});
```

#### 4. Mastra Configuration (`src/cli/lib/mastra-init.ts`)

Initializes Mastra with MCP integration.

**API:**
```typescript
const { mastra, sonosAgent, mcpClient, cleanup } = await initializeMastra({
  mcpServerPath: './dist/index.js', // optional
  model: 'gpt-4o-mini',              // optional
  enableLogging: true,               // optional
});

// Use the agent
const result = await mastra.getAgent('sonosAgent').generate('Play music');

// Cleanup when done
await cleanup();
```

#### 5. CLI (`src/cli/sonos-agent-cli.ts`)

Command-line interface for running the agent.

**Features:**
- Parses command-line arguments
- Builds MCP server if needed
- Initializes Mastra
- Executes agent with user prompt
- Displays streaming responses
- Handles cleanup

## Usage Examples

### Example 1: Simple Playback

```bash
npm run agent "Play classic rock in the living room"
```

**Agent Flow:**
1. Discovers devices
2. Finds "Living Room" speaker
3. Searches library for "classic rock"
4. Plays music
5. Confirms action

### Example 2: Multi-Room Setup

```bash
npm run agent "Group all speakers and play party music at 60% volume"
```

**Agent Flow:**
1. Discovers all devices
2. Creates group
3. Searches for "party" music
4. Sets volume to 60%
5. Plays music
6. Confirms setup

### Example 3: Playing Radio by Name

```bash
npm run agent "Play Radio 2 in the kitchen"
```

**Agent Flow:**
1. Discovers devices
2. Finds "Kitchen" speaker
3. Calls sonos_get_favorite_radio_stations
4. Fuzzy matches "Radio 2" against favorite titles (e.g., "NPO Radio 2")
5. Extracts URI from matched station
6. Calls sonos_play_uri with the URI and metadata
7. Confirms playback started

### Example 4: Device Information

```bash
npm run agent "What Sonos devices are available?"
```

**Agent Flow:**
1. Runs discovery
2. Lists devices with room names
3. Provides friendly summary

### Example 5: Alarm Management

```bash
npm run agent "Set an alarm for 7 AM tomorrow with NPR news in the bedroom"
```

**Agent Flow:**
1. Resolves "bedroom" device
2. Creates alarm
3. Configures sound
4. Enables alarm
5. Confirms creation

## Modular Reuse Patterns

### Pattern 1: Standalone Usage

```typescript
import { initializeMastra } from './mastra/index.js';

const { mastra, cleanup } = await initializeMastra();
const agent = mastra.getAgent('sonosAgent');
const result = await agent.generate('Play music');
await cleanup();
```

### Pattern 2: Agent Network Integration

```typescript
import { Mastra } from '@mastra/core/mastra';
import { createSonosAgent } from './mastra/agents/index.js';
import { McpClient } from './mastra/server/index.js';
import { McpToolAdapter } from './mastra/tools/index.js';

// Initialize MCP tools
const mcpClient = new McpClient();
await mcpClient.connect();
const adapter = new McpToolAdapter(mcpClient);
const sonosTools = await adapter.loadTools();

// Create agents
const sonosAgent = createSonosAgent({ tools: sonosTools });
const weatherAgent = createWeatherAgent();
const orchestratorAgent = createOrchestratorAgent();

// Create network
const mastra = new Mastra({
  agents: {
    sonosAgent,
    weatherAgent,
    orchestratorAgent,
  },
});

// Orchestrator can delegate to Sonos agent
const result = await mastra.getAgent('orchestratorAgent').generate(
  'Play relaxing music and tell me tomorrow\'s weather'
);
```

### Pattern 3: Custom Agent with Sonos Tools

```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { McpClient } from './mastra/server/index.js';
import { McpToolAdapter } from './mastra/tools/index.js';

// Get Sonos tools
const mcpClient = new McpClient();
await mcpClient.connect();
const adapter = new McpToolAdapter(mcpClient);
const sonosTools = await adapter.loadTools();

// Create custom smart home agent
const smartHomeAgent = new Agent({
  id: 'smart-home-agent',
  name: 'Smart Home Agent',
  instructions: 'Control entire smart home including Sonos...',
  model: openai('gpt-4o'),
  tools: {
    ...sonosTools,        // Sonos control
    ...lightsTools,       // Lights control
    ...thermostatTools,   // Climate control
  },
});
```

### Pattern 4: Programmatic Tool Access

```typescript
import { McpClient } from './mastra/server/index.js';

// Direct MCP tool calls (without agent)
const mcpClient = new McpClient();
await mcpClient.connect();

// List all tools
const tools = await mcpClient.listTools();
console.log(tools.map(t => t.name));

// Call a tool directly
const result = await mcpClient.callTool('sonos_discover', {});
console.log(result);

await mcpClient.disconnect();
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-openai-key

# Optional
MCP_SERVER_PATH=./dist/index.js  # Custom MCP server path
```

## CLI Options

```
Usage:
  npm run agent "<prompt>" [-- options]

Options:
  --model <name>  LLM model to use (default: gpt-4o-mini)
  --skip-build    Skip the build step
  --help, -h      Show help

Examples:
  npm run agent "Play jazz"
  npm run agent "What devices are available?" -- --model gpt-4o
  npm run agent "Group kitchen and bedroom" -- --skip-build
```

## Available Sonos Tools

The agent has access to all Sonos MCP tools, including:

**Device Management:**
- `sonos_discover` - Discover devices
- `sonos_get_device_info` - Get device details

**Playback Control:**
- `sonos_play` - Start playback
- `sonos_pause` - Pause playback
- `sonos_next` - Next track
- `sonos_previous` - Previous track
- `sonos_seek` - Seek position

**Volume Management:**
- `sonos_get_volume` - Get volume
- `sonos_set_volume` - Set volume (absolute)
- `sonos_adjust_volume` - Adjust volume (relative)
- `sonos_get_mute` - Get mute state
- `sonos_set_mute` - Set mute state

**Grouping:**
- `sonos_get_groups` - Get group info
- `sonos_create_group` - Create group
- `sonos_leave_group` - Leave group

**Music Library:**
- `sonos_browse_library` - Browse music
- `sonos_search_library` - Search music
- `sonos_add_to_queue` - Add to queue
- `sonos_clear_queue` - Clear queue

**EQ & Settings:**
- `sonos_get_eq` - Get EQ settings
- `sonos_set_bass` - Set bass
- `sonos_set_treble` - Set treble

**Alarms:**
- `sonos_list_alarms` - List alarms
- `sonos_set_alarm` - Create/update alarm

## Testing

### Test Agent Locally

```bash
# Build first
npm run build

# Test basic commands
npm run agent "Discover devices"
npm run agent "Play music in the living room"

# Test with skip build
npm run agent "Pause" -- --skip-build
```

### Test Programmatically

Create a test script:

```typescript
// scripts/test-agent.ts
import { initializeMastra } from './src/cli/mastra/index.js';

async function test() {
  const { mastra, cleanup } = await initializeMastra();
  
  const agent = mastra.getAgent('sonosAgent');
  const result = await agent.generate('What devices are available?');
  
  console.log(result.text);
  await cleanup();
}

test();
```

Run it:
```bash
tsx scripts/test-agent.ts
```

## Troubleshooting

### "MCP client not connected"
Ensure the MCP server builds successfully:
```bash
npm run build
ls -la dist/index.js
```

### "OPENAI_API_KEY environment variable is required"
Set your API key:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Agent doesn't find devices
Ensure Sonos devices are on the same network and discoverable. Test the MCP server directly:
```bash
npm run test:discovery
```

### Build errors
Ensure all dependencies are installed:
```bash
npm install
```

## Advanced Configuration

### Custom Model Provider

You can use other AI providers by importing their SDK:

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createSonosAgent } from './mastra/agents/index.js';

const agent = createSonosAgent({
  tools: sonosTools,
  model: 'claude-3-5-sonnet-20241022',
});

// Then override the model in the agent
agent.model = anthropic('claude-3-5-sonnet-20241022');
```

### Custom MCP Server Path

```typescript
const { mastra, cleanup } = await initializeMastra({
  mcpServerPath: '/custom/path/to/mcp-server.js',
});
```

### Logging Control

```typescript
const { mastra, cleanup } = await initializeMastra({
  enableLogging: false, // Disable internal logs
});
```

## Contributing

When extending the agent system:

1. **Add new agents** to `src/cli/lib/`
2. **Add new tools** to `src/cli/lib/`
3. **Update configuration** in `src/cli/lib/mastra-init.ts`
4. **Document** in this file

## License

MIT

## Support

For issues or questions:
1. Check existing Sonos MCP server documentation
2. Review Mastra documentation at https://mastra.ai/docs
3. Open an issue on GitHub
