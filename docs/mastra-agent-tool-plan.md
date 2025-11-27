# Mastra Agent Tool Implementation Plan

## Overview
Implement a Mastra-powered AI agent as an MCP tool that allows users to send natural language instructions to control their Sonos system. The tool will only be available when AI API keys are configured in the environment.

## Requirements
1. **Conditional Availability**: Tool only appears when AI credentials are configured
2. **Environment Variables**:
   - Check for `OPENAI_API_KEY` OR `GOOGLE_GENERATIVE_AI_API_KEY`
   - Check for `SONOS_AGENT_MODEL` (with fallback to 'gpt-4o-mini')
3. **Recursive MCP Architecture**: The agent spawns its own MCP server instance WITHOUT AI keys to expose tools
4. **Input**: Natural language instruction string
5. **Output**: Result of the agent's action execution

## Architecture

### Current State
- MCP Server exposes Sonos tools (in `src/mcp/server.ts`)
- Mastra agent implementation exists in `src/cli/lib/` folder
- Agent connects to MCP server via `McpClient` and `StdioClientTransport`
- Tools are converted from MCP to Mastra format via `McpToolAdapter`

### New Components

#### 1. Environment Configuration Module
**File**: `src/mcp/config/env-config.ts`
```typescript
- Function: `getAiConfig()` returns AI configuration if available
- Returns: { hasAiKeys: boolean, model: string | null, apiKey: string | null }
- Checks process.env for OPENAI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
- Reads SONOS_AGENT_MODEL with fallback
```

#### 2. Agent Tool Schema
**File**: `src/mcp/schemas/tools/agent-tools.ts`
```typescript
- Tool name: 'sonos_agent'
- Description: "An AI-powered assistant that can take natural language instructions and autonomously control the Sonos system. Use this when you need to solve complex multi-step tasks or when you're unsure which specific tools to use. The agent can discover devices, control playback, manage groups, and more based on your instruction."
- Input schema:
  {
    instruction: string (required) - Natural language command for the AI agent
  }
- Only exported if AI keys are available
```

#### 3. Agent Handler
**File**: `src/mcp/handlers/agent-handler.ts`
```typescript
- Function: `handleAgentInstruction(args, context)`
- Spawns child MCP server WITHOUT AI env vars (to prevent recursion)
- Initializes Mastra agent with tools from child server
- Executes instruction via agent.generate()
- Returns formatted result
- Handles cleanup of child server
```

#### 4. Agent Service
**File**: `src/mcp/services/agent-service.ts`
```typescript
- Class: AgentService
- Methods:
  - spawnChildMcpServer(): Creates MCP client WITHOUT AI keys
  - initializeMastra(mcpClient): Sets up Mastra with tools
  - executeInstruction(instruction): Runs agent with instruction
  - cleanup(): Shuts down child server and agent
```

## Implementation Steps

### Step 1: Create Environment Configuration Module
- Create `src/mcp/config/` directory
- Implement `env-config.ts` with AI key detection
- Export helper functions to check AI availability

### Step 2: Create Agent Service
- Create `src/mcp/services/agent-service.ts`
- Implement AgentService class with child server spawning
- Key: Strip AI-related env vars when spawning child server to prevent infinite recursion
- Use existing `McpClient` and `McpToolAdapter` from CLI

### Step 3: Create Agent Handler
- Create handler in `src/mcp/handlers/agent-handler.ts`
- Implement tool execution logic
- Handle errors and cleanup gracefully
- Format output for MCP response

### Step 4: Create Agent Tool Schema
- Create `src/mcp/schemas/tools/agent-tools.ts`
- Define tool schema with conditional export
- Import and merge into `allTools` only when AI is available

### Step 5: Update Router
- Add agent handler to `src/mcp/router.ts`
- Conditionally register handler based on AI availability

### Step 6: Update Server Initialization
- Modify `src/mcp/server.ts` to check AI config on startup
- Log whether agent tool is available
- Ensure dotenv is loaded in `src/index.ts`

### Step 7: Documentation
- Create `docs/agent-tool.md` explaining:
  - How to configure AI API keys
  - How to use the agent tool
  - Examples of natural language instructions
  - Limitations and best practices
- Update main README.md with agent tool information

### Step 8: Testing
- Create `tests/agent-service.test.ts` for unit tests
- Create `scripts/test-agent-tool.ts` for integration testing
- Test with and without AI keys configured
- Test various natural language instructions

## Technical Considerations

### 1. Environment Variable Filtering
When spawning the child MCP server, must filter out:
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `SONOS_AGENT_MODEL`

Pass through:
- All other environment variables needed for MCP server operation

### 2. Preventing Infinite Recursion
- Child server spawned WITHOUT AI keys → agent tool not available in child
- Only parent server with AI keys exposes the agent tool
- This creates a clean separation

### 3. Resource Management
- Ensure child MCP server is properly cleaned up after each agent execution
- Consider connection pooling if performance becomes an issue
- Implement timeout for agent execution (e.g., 60 seconds)

### 4. Error Handling
- Handle missing AI keys gracefully
- Handle child server spawn failures
- Handle agent execution errors
- Return meaningful error messages to user

### 5. StdioClientTransport Configuration
According to the SDK, `StdioClientTransport` accepts:
- `command`: The executable (e.g., 'node')
- `args`: Array of arguments (e.g., ['dist/index.js'])
- `env`: Environment variables (filter out AI keys here)
- `stderr`: How to handle stderr ('inherit', 'pipe', etc.)
- `cwd`: Working directory

### 6. Security
- Never expose AI API keys in logs or error messages
- Validate instruction input to prevent injection attacks
- Limit agent execution time to prevent runaway processes

## Files to Create

1. `src/mcp/config/env-config.ts` - Environment configuration detection
2. `src/mcp/services/agent-service.ts` - Agent service with child server management
3. `src/mcp/handlers/agent-handler.ts` - Agent tool handler
4. `src/mcp/schemas/tools/agent-tools.ts` - Agent tool schema
5. `docs/agent-tool.md` - Agent tool documentation
6. `tests/agent-service.test.ts` - Unit tests
7. `scripts/test-agent-tool.ts` - Integration test script

## Files to Modify

1. `src/index.ts` - Add dotenv config import
2. `src/mcp/server.ts` - Update to check AI config and log status
3. `src/mcp/router.ts` - Add conditional agent handler registration
4. `src/mcp/schemas/tools/index.ts` - Conditionally import/export agent tools
5. `README.md` - Add agent tool documentation section

## Dependencies

All required dependencies already installed:
- `@mastra/core` - Agent framework
- `@ai-sdk/google` - Gemini support
- `@ai-sdk/openai` - OpenAI support
- `ai` - AI SDK
- `dotenv` - Environment variables
- `@modelcontextprotocol/sdk` - MCP SDK

## Testing Strategy

### Unit Tests
- Environment configuration detection
- Child server spawning with filtered env vars
- Agent service initialization
- Error handling

### Integration Tests
- Full agent execution with simple instructions
- Multi-step agent workflows
- Tool not available when AI keys missing
- Proper cleanup after execution

### Manual Testing
- Various natural language commands
- Error scenarios
- Performance with long-running tasks
- Resource cleanup verification

## Success Criteria

1. ✅ Tool only appears when AI keys are configured
2. ✅ Agent can execute natural language instructions
3. ✅ Child MCP server properly spawned without AI keys (no recursion)
4. ✅ Results returned in structured format
5. ✅ Proper cleanup of resources
6. ✅ Clear documentation for users
7. ✅ Error handling for all edge cases
8. ✅ Tests pass for all scenarios

## Future Enhancements (Out of Scope for Initial Implementation)

- Connection pooling for child servers (performance optimization)
- Streaming responses for long-running agent tasks
- Agent execution history/logging
- Custom agent instructions via environment variable
- Multiple agent configurations (different models for different tasks)
