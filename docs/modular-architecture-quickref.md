# Modular Architecture Quick Reference

## Directory Structure

```
src/mcp/
├── server.ts              # MCP Server orchestrator (110 lines)
├── context.ts             # Shared state & lifecycle management
├── router.ts              # Tool name → handler mapping
├── device-resolver.ts     # Device resolution by ID/name/IP
├── schemas/               # Tool schema definitions
│   └── tool-definitions.ts
├── handlers/              # Handler implementations by domain
│   ├── discovery-handlers.ts    # discover, add_device, list_devices
│   ├── playback-handlers.ts     # play, pause, stop, next, previous
│   ├── queue-handlers.ts        # queue ops, shuffle, repeat, crossfade
│   ├── volume-handlers.ts       # volume, mute, bass, treble, EQ
│   ├── group-handlers.ts        # join, unjoin, party_mode, zone_groups
│   ├── library-handlers.ts      # browse artists/albums/tracks/playlists
│   ├── alarm-handlers.ts        # alarms CRUD, sleep timer
│   ├── snapshot-handlers.ts     # snapshot, restore
│   └── event-handlers.ts        # event subscriptions
└── types/                 # TypeScript interfaces
    └── handler-types.ts
```

## Key Files & Responsibilities

| File | Lines | Purpose | When to Edit |
|------|-------|---------|--------------|
| `server.ts` | 110 | MCP protocol orchestration | Rarely (core infrastructure) |
| `context.ts` | 130 | Shared state management | Add shared utilities |
| `router.ts` | 150 | Tool routing registry | Register new handlers |
| `tool-definitions.ts` | 900 | All tool schemas | Add/modify tool schemas |
| Handler files | 100-200 | Business logic per domain | Add/modify features |

## Common Tasks

### Add a New Tool

**1. Define Schema** (`schemas/tool-definitions.ts`)
```typescript
export const categoryTools: Tool[] = [
    {
        name: 'sonos_new_tool',
        description: 'What it does',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: { type: 'string', description: '...' },
                param: { type: 'number', description: '...' }
            },
            required: ['deviceId']
        }
    }
];
```

**2. Implement Handler** (`handlers/category-handlers.ts`)
```typescript
export async function handleNewTool(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse> {
    const { deviceId, param } = args as { deviceId: string; param?: number };
    const device = context.resolver.resolve(deviceId);
    
    // Your logic here
    const result = await someService.doSomething(device, param);
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
        }]
    };
}
```

**3. Register in Router** (`router.ts`)
```typescript
import { handleNewTool } from './handlers/category-handlers.js';

export const toolHandlers: ToolHandlerMap = {
    'sonos_new_tool': handleNewTool,
    // ... other handlers
};
```

### Modify Existing Tool

**Option A: Change Schema Only**
- Edit `schemas/tool-definitions.ts`
- Update the specific tool definition
- No handler changes needed

**Option B: Change Logic Only**
- Edit appropriate handler in `handlers/`
- Find handler function (e.g., `handlePlay`)
- Modify implementation
- Schema unchanged

**Option C: Change Both**
- Update schema in `tool-definitions.ts`
- Update handler in `handlers/category-handlers.ts`

### Add Shared Utility to Context

**In `context.ts`:**
```typescript
export class ServerContext {
    // ... existing properties
    
    async yourNewUtility(param: string): Promise<void> {
        // Implementation
    }
}
```

**In `types/handler-types.ts`:**
```typescript
export interface ServerContext {
    // ... existing methods
    yourNewUtility(param: string): Promise<void>;
}
```

Now all handlers can use: `context.yourNewUtility(param)`

## Handler Patterns

### Basic Pattern
```typescript
export async function handleSomething(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new SomeService(device);
    const result = await service.doSomething();
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
        }]
    };
}
```

### With Optional Parameters
```typescript
const { deviceId, startIndex = 0, count = 100 } = args as {
    deviceId: string;
    startIndex?: number;
    count?: number;
};
```

### With Multiple Services
```typescript
const service1 = new Service1(device);
const service2 = new Service2(device);

const [result1, result2] = await Promise.all([
    service1.getData(),
    service2.getData()
]);
```

### Error Handling
```typescript
// Router handles errors automatically, but you can throw:
if (!isValid(args)) {
    throw new Error('Invalid arguments: ...');
}

// Or return error explicitly:
return {
    content: [{
        type: 'text',
        text: 'Error: Something went wrong'
    }],
    isError: true
};
```

## Testing

### Test a Handler
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handlePlay } from '../handlers/playback-handlers';
import type { ServerContext } from '../types/handler-types';

describe('handlePlay', () => {
    it('starts playback', async () => {
        const mockContext: Partial<ServerContext> = {
            resolver: {
                resolve: vi.fn().mockReturnValue({
                    ip: '192.168.1.100',
                    port: 1400,
                    uuid: 'TEST-UUID'
                })
            }
        };
        
        const result = await handlePlay(
            { deviceId: 'Living Room' },
            mockContext as ServerContext
        );
        
        expect(result.content[0].text).toContain('Playback started');
    });
});
```

### Test Context
```typescript
import { ServerContext } from '../context';

describe('ServerContext', () => {
    it('initializes registry and resolver', () => {
        const context = new ServerContext();
        expect(context.registry).toBeDefined();
        expect(context.resolver).toBeDefined();
    });
});
```

## Debugging

### Enable Verbose Logging
Add logging in handlers:
```typescript
console.error(`[${toolName}] Processing deviceId: ${deviceId}`);
console.error(`[${toolName}] Result:`, JSON.stringify(result));
```

### Check Router Registration
```typescript
// In router.ts, add:
console.error('Registered tools:', Object.keys(toolHandlers));
```

### Inspect Context State
```typescript
// In any handler:
console.error('Registry devices:', context.registry.getAllDevices());
```

## Performance Tips

- Handlers run sequentially (one at a time)
- Use `Promise.all()` for parallel service calls within handler
- Context is shared (singleton pattern)
- Device registry caches discovered devices

## Code Style

### Naming Conventions
- Handlers: `handleToolName` (camelCase)
- Tool names: `sonos_tool_name` (snake_case)
- Files: `category-handlers.ts` (kebab-case)
- Types: `ToolResponse` (PascalCase)

### Import Order
```typescript
// 1. External packages
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// 2. Internal types
import type { ServerContext, ToolResponse } from '../types/handler-types.js';

// 3. Internal services
import { AVTransportService } from '../../services/av-transport.js';
```

## Migration Notes

- Old `server.ts` backed up as `server.ts.backup`
- All 85 tests pass unchanged
- No breaking changes to MCP API
- Compatible with existing scripts and clients

## Troubleshooting

**Handler not found?**
- Check router.ts registration
- Verify handler export in handler file
- Check import in router.ts

**Type errors?**
- Update `handler-types.ts` interface
- Ensure handler matches `ToolHandler` signature
- Check return type is `Promise<ToolResponse>`

**Build fails?**
```bash
npm run build
# Check TypeScript errors
# Verify all imports have .js extensions
```

**Tests fail?**
```bash
npm test
# Isolate failing test
# Check mock context matches ServerContext interface
```

## Resources

- Full documentation: `docs/modular-architecture.md`
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Original implementation: `src/mcp/server.ts.backup`
