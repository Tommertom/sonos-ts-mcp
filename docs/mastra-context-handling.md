# Mastra Context Handling for MCP Tools

## Problem

When integrating MCP tools with Mastra agents, tool parameters were being lost during the context extraction process, causing errors like "Device identifier cannot be empty".

## Root Cause

Mastra wraps tool execution in a context object with the following structure:

```json
{
  "context": {
    "deviceId": "Badkamer"  // Actual tool parameters are nested here
  },
  "mastra": {},
  "runId": "...",
  "runtimeContext": {},
  "writer": {...},
  "tracingContext": {}
}
```

The original implementation in `src/mastra/tools/mcp-tool-adapter.ts` was filtering out Mastra's metadata properties but:
1. It wasn't excluding `context`, `runtimeContext`, and `writer`
2. It wasn't extracting parameters from the nested `context.context` structure

## Solution

Updated the parameter extraction logic in `mcp-tool-adapter.ts`:

```typescript
execute: async (context: any) => {
    // Extract the actual input from the Mastra context
    // Mastra wraps tool parameters in a nested context.context structure
    const input: Record<string, unknown> = {};
    
    // First, collect any direct parameters (excluding Mastra framework properties)
    for (const [key, value] of Object.entries(context)) {
        // Skip Mastra framework properties
        if (!['mastra', 'runId', 'threadId', 'resourceId', 'agentName', 'tracingContext',
            'writableStream', 'tracingPolicy', 'requireApproval', 'description', 'model',
            'context', 'runtimeContext', 'writer'].includes(key)) {
            input[key] = value;
        }
    }
    
    // Tool parameters are nested in context.context
    if (context.context && typeof context.context === 'object') {
        Object.assign(input, context.context);
    }
    
    console.error(`[MCP Adapter] Calling ${mastraTool.id} with input:`, JSON.stringify(input));
    return mastraTool.execute(input);
}
```

## Key Changes

1. **Extended filter list**: Added `'context'`, `'runtimeContext'`, and `'writer'` to the list of framework properties to exclude
2. **Nested parameter extraction**: Check if `context.context` exists and merge those parameters into the input object
3. **Preserved logging**: Keep the logging statement to help debug future issues

## Testing

Verified the fix works with multiple scenarios:
- `npm run agent "Tell me what is playing in the Badkamer?"` - Successfully extracts deviceId and queries device
- `npm run agent "What devices are available?"` - Works with parameter-less tools
- Both tools now correctly receive their parameters

## Impact

This fix ensures that all MCP tools integrated with Mastra agents receive their parameters correctly, enabling proper device resolution and tool execution.
