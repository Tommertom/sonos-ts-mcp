# Modular Server Architecture

## Overview

The Sonos MCP Server has been refactored into a modular, maintainable architecture that separates concerns and improves testability, scalability, and code navigation.

## Architecture Layers

### 1. **Schema Layer** (`src/mcp/schemas/`)

**Purpose**: Define all MCP tool schemas separate from implementation logic.

**Files**:
- `tool-definitions.ts` - Contains all 40+ tool schema definitions organized by domain

**Organization**:
- `discoveryTools` - Device discovery and registration
- `playbackTools` - Play, pause, stop, skip operations
- `queueTools` - Queue management and playback modes
- `volumeTools` - Volume, mute, and EQ controls
- `groupTools` - Multi-room grouping and zone management
- `libraryTools` - Music library browsing
- `alarmTools` - Alarm and sleep timer management
- `snapshotTools` - State capture and restoration
- `eventTools` - Event subscription management
- `allTools` - Combined export of all tools

**Benefits**:
- Single source of truth for tool schemas
- Easy to add new tools without touching handler logic
- Schemas can be tested independently
- Clear documentation of API surface

### 2. **Handler Layer** (`src/mcp/handlers/`)

**Purpose**: Implement business logic for each tool, organized by domain.

**Files**:
- `discovery-handlers.ts` - Device discovery, manual registration, listing
- `playback-handlers.ts` - Playback control operations
- `queue-handlers.ts` - Queue management, shuffle, repeat
- `volume-handlers.ts` - Volume, mute, EQ, night mode, dialog
- `group-handlers.ts` - Zone grouping, party mode
- `library-handlers.ts` - Browse artists, albums, tracks, search
- `alarm-handlers.ts` - Alarm CRUD, sleep timer
- `snapshot-handlers.ts` - State snapshot and restoration
- `event-handlers.ts` - Event subscription management

**Handler Signature**:
```typescript
async function handleToolName(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>
```

**Benefits**:
- Each handler file focuses on a single domain
- Handlers are pure functions that can be tested in isolation
- Easy to locate and modify specific functionality
- Shared context injected via dependency injection

### 3. **Router Layer** (`src/mcp/router.ts`)

**Purpose**: Map tool names to their corresponding handler functions.

**Structure**:
```typescript
export const toolHandlers: ToolHandlerMap = {
    'sonos_play': handlePlay,
    'sonos_pause': handlePause,
    // ... 40+ mappings
};
```

**Benefits**:
- Single registry for all tool handlers
- Type-safe routing with ToolHandlerMap
- Easy to add new tools (import handler, add mapping)
- Centralized error handling

### 4. **Context Layer** (`src/mcp/context.ts`)

**Purpose**: Manage shared state and lifecycle across all handlers.

**Responsibilities**:
- Device registry management
- Device resolution (by name, UUID, or IP)
- Auto-discovery orchestration
- Periodic discovery scheduling
- Resource cleanup on shutdown

**Key Methods**:
```typescript
class ServerContext {
    registry: DeviceRegistry
    resolver: DeviceResolver
    
    fetchDeviceDetails(device): Promise<void>
    performAutoDiscovery(): Promise<void>
    startPeriodicDiscovery(): void
    stopPeriodicDiscovery(): void
    shutdown(): void
}
```

**Benefits**:
- Encapsulates all shared state
- Handlers receive context via dependency injection
- Easy to mock for testing
- Lifecycle management in one place

### 5. **Server Orchestrator** (`src/mcp/server.ts`)

**Purpose**: Minimal orchestration of MCP protocol integration.

**Reduced from**: ~2500 lines
**Reduced to**: ~110 lines (96% reduction!)

**Responsibilities**:
- Initialize MCP Server instance
- Create ServerContext
- Register request handlers
- Delegate tool execution to router
- Handle server lifecycle

**Key Code**:
```typescript
export class SonosMcpServer {
    private server: Server;
    private context: ServerContext;

    constructor() {
        this.server = new Server(/* config */);
        this.context = new ServerContext();
        this.setupHandlers();
    }

    private setupHandlers() {
        // List tools
        this.server.setRequestHandler(
            ListToolsRequestSchema,
            () => ({ tools: allTools })
        );
        
        // Execute tools
        this.server.setRequestHandler(
            CallToolRequestSchema,
            (req) => this.handleToolCall(req)
        );
    }

    private async handleToolCall(request) {
        const handler = toolHandlers[request.params.name];
        return await handler(request.params.arguments, this.context);
    }
}
```

## Type System (`src/mcp/types/`)

**Files**:
- `handler-types.ts` - Shared TypeScript interfaces

**Key Types**:
```typescript
// Context interface for dependency injection
interface ServerContext {
    registry: DeviceRegistry;
    resolver: DeviceResolver;
    // ... lifecycle methods
}

// Standard response format
interface ToolResponse {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
}

// Handler function signature
type ToolHandler = (
    args: unknown,
    context: ServerContext
) => Promise<ToolResponse>;

// Router registry type
type ToolHandlerMap = Record<string, ToolHandler>;
```

## Benefits of Modular Architecture

### 🧪 **Testability**
- Each handler can be tested in isolation with mocked context
- Schema definitions can be validated independently
- Router logic is trivial to test
- Context lifecycle can be tested separately

### 🔧 **Maintainability**
- Feature changes confined to single files
- Example: Alarm changes only touch `alarm-handlers.ts`
- Clear separation of concerns
- Reduced cognitive load (small, focused files)

### 📈 **Scalability**
- Adding new tools: Create handler → Add to router → Add schema
- New feature domains get their own handler file
- No risk of merge conflicts in monolithic file
- Easy to parallelize development across features

### 🗺️ **Code Navigation**
- Domain-driven file organization mirrors mental model
- Want alarm features? Go to `alarm-handlers.ts`
- Tool schemas? Check `tool-definitions.ts`
- Clear file naming convention

### 🔄 **Reusability**
- Handlers can compose other handlers
- Example: `handlePartyMode` uses `handleJoinGroup` logic
- Context utilities shared across all handlers
- Common patterns extracted to utilities

### 🛡️ **Type Safety**
- Full TypeScript coverage
- Handler signatures enforced by ToolHandler type
- Context interface ensures consistent API
- Compile-time verification of tool registration

## File Structure

```
src/mcp/
├── server.ts                 # Main orchestrator (110 lines)
├── context.ts                # Shared state & lifecycle
├── router.ts                 # Tool name → handler mapping
├── device-resolver.ts        # Device resolution logic (unchanged)
├── schemas/
│   └── tool-definitions.ts   # All MCP tool schemas
├── handlers/
│   ├── discovery-handlers.ts
│   ├── playback-handlers.ts
│   ├── queue-handlers.ts
│   ├── volume-handlers.ts
│   ├── group-handlers.ts
│   ├── library-handlers.ts
│   ├── alarm-handlers.ts
│   ├── snapshot-handlers.ts
│   └── event-handlers.ts
└── types/
    └── handler-types.ts      # Shared TypeScript interfaces
```

## Adding a New Tool

### Example: Add `sonos_get_favorites`

1. **Add schema** in `schemas/tool-definitions.ts`:
```typescript
export const libraryTools: Tool[] = [
    // ... existing tools
    {
        name: 'sonos_get_favorites',
        description: 'Get user favorites',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: { type: 'string', description: '...' }
            },
            required: ['deviceId']
        }
    }
];
```

2. **Add handler** in `handlers/library-handlers.ts`:
```typescript
export async function handleGetFavorites(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse> {
    const { deviceId } = args as { deviceId: string };
    const device = context.resolver.resolve(deviceId);
    const service = new ContentDirectoryService(device);
    const favorites = await service.getFavorites();
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(favorites, null, 2)
        }]
    };
}
```

3. **Register in router** (`router.ts`):
```typescript
import { handleGetFavorites } from './handlers/library-handlers.js';

export const toolHandlers: ToolHandlerMap = {
    // ... existing handlers
    'sonos_get_favorites': handleGetFavorites,
};
```

Done! The new tool is fully integrated.

## Testing Strategy

### Unit Tests
- Test each handler with mocked ServerContext
- Test context lifecycle methods independently
- Validate schema definitions

### Integration Tests
- Test router dispatches to correct handlers
- Verify full request/response flow
- Test error handling paths

### Example Handler Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import { handlePlay } from '../src/mcp/handlers/playback-handlers';

describe('handlePlay', () => {
    it('should start playback', async () => {
        const mockContext = {
            resolver: {
                resolve: vi.fn().mockReturnValue({
                    ip: '192.168.1.100',
                    port: 1400
                })
            }
        };
        
        const result = await handlePlay(
            { deviceId: 'Living Room' },
            mockContext as any
        );
        
        expect(result.content[0].text).toContain('Playback started');
    });
});
```

## Migration Notes

- Original `server.ts` backed up as `server.ts.backup`
- All functionality preserved with identical behavior
- Existing tests pass without modification (85/85 tests ✓)
- No breaking changes to external API
- Build succeeds with TypeScript strict mode

## Performance Considerations

- No runtime overhead (same execution path)
- Slightly faster module loading (smaller files)
- Improved tree-shaking potential
- Better code splitting for future optimizations

## Future Enhancements

Possible improvements enabled by modular architecture:

1. **Plugin System**: Load handler modules dynamically
2. **Feature Flags**: Conditionally register tools
3. **Lazy Loading**: Import handlers on-demand
4. **Middleware**: Add cross-cutting concerns (logging, metrics)
5. **Multi-Transport**: Support SSE alongside stdio
6. **Handler Composition**: Build complex operations from primitives

## Conclusion

The modular architecture transforms a 2500-line monolithic file into a well-organized, maintainable codebase with:
- **96% size reduction** in main orchestrator
- **100% test compatibility** (all 85 tests pass)
- **Domain-driven organization** (9 handler modules)
- **Type-safe interfaces** throughout
- **Zero breaking changes** to external API

This foundation supports long-term maintainability and feature development.
