# JSON-RPC over STDIO Transport: Handling Human-Readable Output

## Overview

When implementing a JSON-RPC server that uses STDIO transport (like MCP servers), understanding how the protocol handles human-readable output is critical. This document explains the behavior and best practices.

## How JSON-RPC STDIO Transport Works

### The Protocol

JSON-RPC messages over STDIO use a simple line-delimited format:

1. **Each JSON-RPC message is a single line** terminated by `\n`
2. **Messages are serialized as JSON** and sent to stdout
3. **Messages are read from stdin** line by line
4. **The client reads stdout** expecting valid JSON-RPC messages

### Key Implementation Details (from @modelcontextprotocol/sdk)

```typescript
// Serialization: JSON + newline
export function serializeMessage(message: JSONRPCMessage): string {
    return JSON.stringify(message) + '\n';
}

// Deserialization: Read until newline, parse JSON
export function deserializeMessage(line: string): JSONRPCMessage {
    return JSONRPCMessageSchema.parse(JSON.parse(line));
}
```

The `ReadBuffer` class reads from stdin:
- Accumulates data into a buffer
- Looks for `\n` delimiter
- Extracts complete lines
- Parses each line as JSON
- Validates against JSON-RPC schema

## The Critical Issue: Human-Readable Output

### What Happens to console.log() and console.error()?

In Node.js:
- **`console.log()`** writes to **stdout** (process.stdout)
- **`console.error()`** writes to **stderr** (process.stderr)

### Impact on JSON-RPC Communication

#### ✅ SAFE: Using stderr (console.error)

```typescript
console.error('Sonos MCP Server initialized');
console.error('[Auto-Discovery] Starting device discovery...');
```

**Why it's safe:**
- JSON-RPC reads only from **stdin** and writes only to **stdout**
- **stderr is completely separate** and ignored by JSON-RPC client
- Human-readable logs, debug messages, and status updates can go to stderr
- Will appear in the parent process's stderr stream (visible in logs/terminal)

#### ❌ UNSAFE: Using stdout (console.log)

```typescript
console.log('Server starting...'); // DON'T DO THIS!
```

**Why it breaks:**
- Writes non-JSON text to stdout
- JSON-RPC client tries to parse it as a JSON-RPC message
- Parsing fails because it's not valid JSON
- Client crashes or reports protocol error
- Communication is disrupted

### Example of What Goes Wrong

```
# Server writes to stdout:
Server starting...
Discovered 3 devices
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}

# Client tries to parse:
Line 1: "Server starting..." ❌ JSON.parse() fails - not valid JSON
Line 2: "Discovered 3 devices" ❌ JSON.parse() fails - not valid JSON  
Line 3: {"jsonrpc":"2.0"...} ✅ Valid JSON-RPC message
```

## Best Practices

### 1. Use stderr for All Human-Readable Output

```typescript
// ✅ CORRECT - Human-readable output
console.error('Sonos MCP Server initialized');
console.error('[Discovery] Found 3 devices');
console.error('[Warning] Device connection slow');

// ❌ WRONG - Will break JSON-RPC
console.log('Sonos MCP Server initialized');
```

### 2. Use stdout ONLY for JSON-RPC Messages

The MCP SDK handles this automatically via `StdioServerTransport`:

```typescript
// This is handled internally by the SDK
async send(message: JSONRPCMessage): Promise<void> {
    const json = serializeMessage(message); // JSON + '\n'
    this._stdout.write(json);
}
```

**Never write directly to stdout** in your server code when using stdio transport.

### 3. Startup Messages Pattern

```typescript
constructor() {
    this.server = new Server({
        name: 'sonos-mcp-server',
        version: '1.3.0',
        description: 'Sonos control server...'
    });

    // ✅ All initialization messages to stderr
    console.error('Sonos MCP Server initialized - Multi-Room Audio Control');
    console.error('Supports: Playback control, volume management, grouping');
    console.error('Ready for JSON-RPC communication');
}
```

### 4. Logging During Operation

```typescript
private async handleDiscover(args: unknown) {
    console.error('[Discovery] Starting SSDP discovery...');
    
    const devices = await this.discoverDevices();
    
    console.error(`[Discovery] Found ${devices.length} devices`);
    
    // Return JSON-RPC response (goes to stdout via SDK)
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({ devices })
        }]
    };
}
```

### 5. Error Messages

```typescript
catch (error) {
    // Log the error for debugging (stderr)
    console.error('[Error] Failed to discover devices:', error);
    
    // Return JSON-RPC error response (stdout via SDK)
    return {
        content: [{
            type: 'text',
            text: `Error: ${error.message}`
        }],
        isError: true
    };
}
```

## Stream Separation in Practice

### Where Each Stream Goes

```
┌─────────────────────────────────────────┐
│   MCP Server (Node.js Process)         │
│                                         │
│   console.error() ──→ stderr ──────┐   │
│                                     │   │
│   SDK.send()      ──→ stdout ──┐   │   │
│                                 │   │   │
│   SDK.receive()   ←── stdin ←──┼───┼───┤
└─────────────────────────────────┼───┼───┘
                                  │   │
                   ┌──────────────┘   │
                   │                  │
                   ▼                  ▼
          ┌─────────────────┐  ┌──────────┐
          │  JSON-RPC       │  │  Logs/   │
          │  Messages       │  │  Debug   │
          │  (Protocol)     │  │  Info    │
          └─────────────────┘  └──────────┘
```

### Example: Server Startup Sequence

```typescript
#!/usr/bin/env node
import { SonosMcpServer } from './mcp/server.js';

// 1. Create server instance
const server = new SonosMcpServer();
// → console.error: "Sonos MCP Server initialized..."
// → console.error: "Supports: Playback control..."

// 2. Connect transport
await server.run();
// → console.error: "[Auto-Discovery] Starting..."
// → Starts JSON-RPC on stdout/stdin

// 3. Ready for JSON-RPC messages
// → stdin: JSON-RPC requests from client
// → stdout: JSON-RPC responses to client  
// → stderr: Ongoing log messages
```

## Debugging Tips

### 1. Verify Stream Separation

Test that your server properly separates streams:

```bash
# Run server and redirect streams separately
node server.js 2>logs.txt 1>protocol.txt < input.json

# Check logs.txt - should have human-readable messages
# Check protocol.txt - should have ONLY JSON-RPC messages
```

### 2. Common Mistakes

```typescript
// ❌ WRONG - stdout pollution
console.log('Server ready');
console.log(`Discovered: ${devices.length} devices`);

// ❌ WRONG - direct stdout write
process.stdout.write('Starting up...\n');

// ❌ WRONG - mixing debug with protocol
console.log(JSON.stringify({jsonrpc: '2.0', ...})); // Don't do this

// ✅ CORRECT - stderr for logs
console.error('Server ready');
console.error(`Discovered: ${devices.length} devices`);

// ✅ CORRECT - SDK handles stdout
return { content: [{type: 'text', text: result}] };
```

### 3. Testing JSON-RPC Communication

Use the MCP Inspector to verify proper communication:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

The inspector will:
- Show JSON-RPC messages exchanged
- Display any protocol errors
- Help identify stdout pollution issues

## Real-World Example: Our Sonos MCP Server

### Current Implementation (Correct)

```typescript
// src/mcp/server.ts
export class SonosMcpServer {
    constructor() {
        this.server = new Server({
            name: 'sonos-mcp-server',
            version: '1.3.0'
        });

        // ✅ Startup messages to stderr
        console.error('Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents');
        console.error('Supports: Playback control, volume management, multi-room grouping, music library browsing');
        console.error('Optimized for: Home audio automation, music streaming, zone coordination, smart scenes');
    }

    private async performAutoDiscovery(): Promise<void> {
        // ✅ Discovery logs to stderr
        console.error('[Auto-Discovery] Starting device discovery...');
        const responses = await client.discover(5000);
        console.error(`[Auto-Discovery] Found ${responses.length} device(s)`);
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        // ✅ Status message to stderr
        console.error('[Auto-Discovery] Periodic discovery started');
    }
}
```

### What the Client Sees

**stderr (visible in logs):**
```
Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents
Supports: Playback control, volume management, multi-room grouping, music library browsing
Optimized for: Home audio automation, music streaming, zone coordination, smart scenes
[Auto-Discovery] Starting device discovery...
[Auto-Discovery] Found 3 device(s), total registered: 3
[Auto-Discovery] Periodic discovery started (every 300s)
```

**stdout (JSON-RPC protocol):**
```
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
{"jsonrpc":"2.0","method":"notifications/tools/list_changed"}
{"jsonrpc":"2.0","id":2,"result":{"content":[...]}}
```

## Language Server Protocol (LSP) Precedent

MCP follows similar patterns to the Language Server Protocol:

- **LSP servers** also use JSON-RPC over stdio
- **Diagnostic output** goes to stderr
- **Protocol messages** go to stdout/stdin
- **Same separation principle** for reliability

This is a well-established pattern in the industry.

## Summary

| Stream | Purpose | Usage |
|--------|---------|-------|
| **stdin** | JSON-RPC requests IN | Read by SDK automatically |
| **stdout** | JSON-RPC responses OUT | Written by SDK automatically |
| **stderr** | Human logs/debug | Use `console.error()` freely |

### Golden Rule

**Use `console.error()` for ALL human-readable output in MCP servers using stdio transport.**

This ensures:
- ✅ Clean JSON-RPC protocol communication
- ✅ Proper client operation  
- ✅ Visible logs and debugging info
- ✅ No parsing errors or protocol violations
- ✅ Professional, reliable server behavior

## References

- [MCP TypeScript SDK - stdio Transport](https://github.com/modelcontextprotocol/typescript-sdk)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Node.js Process Streams](https://nodejs.org/api/process.html#process_process_stderr)

## Related Code

- `src/mcp/server.ts` - Our server implementation with proper stderr usage
- `src/index.ts` - Entry point with graceful shutdown
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js` - SDK stdio transport implementation
- `node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js` - Message serialization/deserialization
