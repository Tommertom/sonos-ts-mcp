# Sonos Agent Tool

The Sonos Agent Tool is an AI-powered natural language interface for controlling your Sonos system. It uses the Mastra framework to provide an intelligent assistant that can understand complex instructions and execute multi-step tasks autonomously.

## Features

- **Natural Language Control**: Give commands in plain English like "Play jazz in the living room"
- **Multi-Step Execution**: The agent can handle complex workflows involving discovery, grouping, and playback
- **Automatic Tool Selection**: The AI determines which Sonos tools to use based on your instruction
- **Context Awareness**: The agent remembers device states and makes intelligent decisions

## Configuration

The agent tool is **conditionally available** - it only appears when AI API keys are configured in your environment.

### Required Environment Variables

You need **at least one** of these API keys:

```bash
# For OpenAI models (GPT-4, GPT-4o, GPT-4o-mini, etc.)
export OPENAI_API_KEY=sk-...

# For Google Gemini models
export GOOGLE_GENERATIVE_AI_API_KEY=...
```

### Optional Configuration

```bash
# Set the default model (optional, defaults to gpt-4o-mini)
export SONOS_AGENT_MODEL=gpt-4o

# Other supported models:
# - gpt-4o
# - gpt-4o-mini (default)
# - gemini-3-pro-preview
# - gemini-2.5-flash
```

### Checking If Agent Tool Is Enabled

When you start the MCP server, check the startup logs:

```
Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents
✨ AI Agent Tool enabled - Model: gpt-4o-mini (openai)
```

If AI keys are not configured, you'll see:

```
AI Agent Tool disabled - Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable
```

## Usage

### Tool Schema

**Tool Name**: `sonos_agent`

**Input**:
- `instruction` (string, required): Natural language command for the AI agent

**Output**: Text response from the agent describing what was accomplished

### Example Instructions

#### Simple Playback
```
"Play jazz in the living room"
"Pause the kitchen speaker"
"What's currently playing in the bedroom?"
```

#### Volume Control
```
"Set volume to 50% in all rooms"
"Mute the office speaker"
"Increase volume in the living room by 20%"
```

#### Multi-Room Control
```
"Group kitchen and bedroom, then play news radio"
"Create a party mode with all speakers and play upbeat music"
"Ungroup the office from the living room"
```

#### Music Selection
```
"Play my favorite radio station in the bathroom"
"Find and play BBC Radio 2 in the kitchen"
"Browse jazz playlists and play the first one"
```

#### Complex Workflows
```
"Discover all Sonos devices, group the kitchen and living room, set volume to 40%, and play smooth jazz"
"Check what's playing in every room and give me a summary"
"Set up morning music: group bedroom and bathroom, set volume to 30%, play my morning playlist"
```

## How It Works

### Architecture

The agent tool uses a clever recursive architecture to prevent infinite loops:

1. **Parent MCP Server** (with AI keys)
   - Exposes all regular Sonos tools
   - **Also exposes** the `sonos_agent` tool

2. **Child MCP Server** (without AI keys)
   - Spawned by the agent when you use `sonos_agent`
   - Exposes only regular Sonos tools (no `sonos_agent`)
   - Isolated from parent's AI capabilities

3. **Mastra Agent**
   - Connects to child MCP server
   - Uses AI model to interpret instructions
   - Calls appropriate Sonos tools
   - Returns results

### Execution Flow

```
User → sonos_agent tool → Agent Service
                              ↓
                        Spawn Child MCP Server (no AI keys)
                              ↓
                        Load Sonos Tools from Child
                              ↓
                        Create Mastra Agent with Tools
                              ↓
                        Execute Instruction via AI
                              ↓
                        Agent Calls Sonos Tools
                              ↓
                        Return Result → User
                              ↓
                        Cleanup Child Server
```

## Using the Agent Tool via MCP Client

From any MCP client (Claude Desktop, Cline, Cursor, etc.):

```typescript
// The client will expose the sonos_agent tool
{
  name: 'sonos_agent',
  arguments: {
    instruction: 'Play jazz in the living room'
  }
}
```

The tool will return the agent's response as text.

## Best Practices

### When to Use the Agent Tool

✅ **Use the agent tool when:**
- You want natural language convenience
- You're performing multi-step workflows
- You're not sure which specific tools to use
- You want the AI to make decisions (e.g., "play any radio station")

❌ **Use specific tools directly when:**
- You know exactly which tool you need
- You're building automated scripts
- You need precise control over every parameter
- Performance is critical (agent has overhead)

### Instruction Writing Tips

**Be Specific**: Include device names, volume levels, and specific actions
```
Good: "Play BBC Radio 2 in the kitchen at 50% volume"
Poor: "Play some music"
```

**Multi-Step Instructions**: Clearly separate steps
```
Good: "First discover devices, then group kitchen and bedroom, then play jazz"
Poor: "Do some stuff with the speakers"
```

**Reference Named Devices**: Use room names from your Sonos setup
```
Good: "Set volume to 40 in the living room"
Poor: "Set volume in the main speaker"
```

## Troubleshooting

### Agent Tool Not Available

**Problem**: The `sonos_agent` tool doesn't appear in your MCP client

**Solutions**:
1. Check that you've set `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`
2. Restart your MCP client after setting environment variables
3. Check the MCP server startup logs for the "AI Agent Tool enabled" message

### Agent Fails to Execute

**Problem**: Agent returns an error or doesn't complete the task

**Common Causes**:
1. **API Key Invalid**: Verify your API key is correct and has credits
2. **Network Issues**: Check internet connectivity for AI API calls
3. **Device Not Found**: Ensure Sonos devices are discovered first
4. **Complex Instructions**: Break down into simpler steps

### Slow Response Times

The agent tool has more overhead than direct tool calls because it:
- Spawns a child MCP server
- Makes AI inference calls
- May execute multiple tools sequentially

For performance-critical applications, use specific tools directly.

## Examples

### Example 1: Simple Playback

**Instruction**: `"Play any radio station in the kitchen"`

**Agent Actions**:
1. Calls `sonos_list_devices` to find "kitchen" device
2. Calls `sonos_get_favorite_radio_stations` to get available stations
3. Picks the first station from the list
4. Calls `sonos_play_uri` with the station URI

**Result**: `"Now playing [Station Name] in the kitchen"`

### Example 2: Multi-Room Setup

**Instruction**: `"Create a party mode with all speakers at 60% volume and play upbeat music"`

**Agent Actions**:
1. Calls `sonos_list_devices` to enumerate all devices
2. Calls `sonos_party_mode` to group all speakers
3. Calls `sonos_set_volume` for each device to set 60%
4. Calls `sonos_get_favorite_radio_stations` or `sonos_browse_playlists`
5. Selects appropriate music and calls `sonos_play_uri`

**Result**: `"Party mode activated! All 5 speakers are grouped and playing [Music Name] at 60% volume"`

### Example 3: Information Query

**Instruction**: `"What's playing in every room?"`

**Agent Actions**:
1. Calls `sonos_list_devices` to get all devices
2. Calls `sonos_get_position_info` for each device
3. Formats the information into a readable summary

**Result**: 
```
Living Room: Playing "Blue in Green" by Miles Davis
Kitchen: Paused - Last played "News Hour"
Bedroom: Not playing anything
Office: Playing BBC Radio 4
```

## Security Considerations

- **API Keys**: Never commit API keys to source control
- **Environment Variables**: Store keys securely in environment or secrets manager
- **Child Process**: The agent spawns child processes - ensure your environment allows this
- **Resource Limits**: The agent has a max of 10 steps per instruction to prevent runaway execution

## Performance Notes

**Resource Usage**:
- Each agent execution spawns a new child MCP server
- Child server is cleaned up after execution
- Average execution time: 2-10 seconds depending on complexity

**Optimization**:
- Agent uses streaming where possible
- Tools are loaded once and reused within an execution
- Child server caches device topology

## API Limits

Be aware of AI provider rate limits:

- **OpenAI**: Varies by tier (free tier has strict limits)
- **Google Gemini**: Generous free tier, paid tier for production

The agent makes 1-10 AI API calls per instruction depending on complexity.

## Future Enhancements

Planned improvements:
- Streaming responses for long-running tasks
- Conversation history and context
- Custom agent instructions via environment variable
- Multiple agent configurations for different use cases
- Connection pooling for better performance

## Related Documentation

- [Main README](../README.md) - Overall server documentation
- [Tool Descriptions](./TOOL_DESCRIPTIONS.md) - All available Sonos tools
- [Implementation Guide](./implementation-guide.md) - Technical details
