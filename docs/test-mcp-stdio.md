# MCP Server stdio Test

## Overview

This test script validates the MCP (Model Context Protocol) server implementation by:
1. Building the server from TypeScript source
2. Starting the server using stdio transport
3. Communicating via JSON-RPC 2.0 protocol
4. Querying server capabilities, tools, and descriptions

## Usage

```bash
npm run test:mcp-stdio
```

## What It Tests

### 1. Build Process
- Compiles TypeScript source to JavaScript in `dist/`
- Verifies the build completes without errors

### 2. Server Initialization
- Spawns the MCP server as a child process
- Establishes stdio communication channel
- Sends `initialize` request with protocol version and client capabilities
- Sends `notifications/initialized` notification

### 3. Server Metadata
- Retrieves server info (name, version, description)
- Queries server capabilities
- Lists all available tools

### 4. Tool Information
- Gets comprehensive list of all tools
- Displays tool names and descriptions
- Shows input schemas for each tool

## How It Works

### Communication Protocol

The script uses JSON-RPC 2.0 over stdio:

**Requests** (expect response):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": { ... }
}
```

**Notifications** (no response expected):
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized",
  "params": {}
}
```

**Responses**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

### MCP Protocol Flow

1. **Initialize**: Client sends `initialize` request
2. **Initialized**: Client sends `notifications/initialized`
3. **Tools List**: Client requests `tools/list`
4. **Shutdown**: Client terminates server gracefully

## Implementation Details

### McpStdioClient Class

A lightweight JSON-RPC client for stdio communication:

- **Spawning**: Creates child process with piped stdio
- **Message Handling**: Line-delimited JSON parsing
- **Request Tracking**: Maps request IDs to promises
- **Timeout Handling**: 10-second timeout per request
- **Error Handling**: Graceful shutdown and error reporting

### Key Features

- **Buffered Reading**: Handles partial messages
- **Server Logs**: Forwards stderr to console
- **Clean Shutdown**: Sends SIGTERM with fallback SIGKILL
- **Type Safety**: Full TypeScript typing

## Output Format

The script outputs:
- Build progress
- Server initialization logs
- Initialize result with server info and capabilities
- Complete tools list with descriptions
- Summary with tool count and names

## Example Output

```
=== MCP Server stdio Test ===

[Build] Running npm run build...
[Build] Build completed successfully

[Client] Spawning MCP server from: /home/tom/sonos-ts-mcp/dist/index.js
[Server] Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents
[Test] Initializing MCP connection...
[Test] Initialize result: {
  "protocolVersion": "2024-11-05",
  "serverInfo": {
    "name": "sonos-mcp-server",
    "version": "1.3.0"
  }
}

[Result] Tools List: {
  "tools": [
    { "name": "sonos_discover", "description": "..." },
    ...
  ]
}

=== Test Summary ===
Server Name: sonos-mcp-server
Server Version: 1.3.0
Total Tools: 54

Available Tools:
  - sonos_discover: Discover Sonos devices on the local network
  - sonos_play: Start playback on a Sonos device
  ...

[Test] All tests completed successfully!
```

## Troubleshooting

### Build Failures
- Ensure TypeScript is installed: `npm install`
- Check for syntax errors: `npm run typecheck`

### Server Won't Start
- Verify `dist/index.js` exists after build
- Check Node.js version: requires >=20.0.0

### Communication Errors
- Ensure server outputs line-delimited JSON
- Check stderr for server error messages
- Verify JSON-RPC 2.0 format compliance

### Timeout Errors
- Increase timeout in `request()` method
- Check for server deadlocks or infinite loops

## Related Scripts

- `npm run dev` - Run server in development mode
- `npm run build` - Build server only
- `scripts/start-mcp-stdio.ts` - Start server interactively
- `scripts/test-*.ts` - Other test utilities

## Technical References

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
