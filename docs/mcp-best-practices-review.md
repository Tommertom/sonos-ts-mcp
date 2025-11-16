# MCP Tool Description Best Practices Review

**Date:** November 16, 2025  
**Reviewed Against:** MCP Specification 2025-06-18 and TypeScript SDK examples

## Executive Summary

This document reviews the Sonos MCP Server tool descriptions against official Model Context Protocol (MCP) best practices from [modelcontextprotocol.io](https://modelcontextprotocol.io) and the [TypeScript SDK repository](https://github.com/modelcontextprotocol/typescript-sdk).

**Key Finding:** While the current implementation is functional, the tool descriptions are excessively verbose and include extensive agent-focused documentation that should be moved to separate documentation files rather than embedded in the tool definitions.

---

## MCP Best Practices Summary

Based on the official MCP specification and SDK examples, here are the key best practices:

### 1. Tool Structure

A well-designed MCP tool should include:

- **`name`**: Unique identifier using underscores (e.g., `weather_current`, not just `weather`)
- **`title`**: Human-readable display name for UI (e.g., "Current Weather")
- **`description`**: Clear, concise explanation of functionality (1-3 sentences typically)
- **`inputSchema`**: JSON Schema with descriptions for all parameters
- **`outputSchema`**: Optional but recommended JSON Schema for structured validation

### 2. Description Guidelines

**DO:**
- Keep descriptions concise and focused
- Explain WHAT the tool does
- Explain WHEN to use it
- Make it understandable to LLMs
- Use clear, professional language

**DON'T:**
- Include marketing language
- Add excessive implementation details
- Embed extensive documentation
- Use overly verbose multi-section descriptions
- Include tutorial-style content

**Good Example from Official Docs:**
```typescript
{
  name: 'get_weather',
  title: 'Weather Information Provider',
  description: 'Get current weather information for a location',
  inputSchema: { ... }
}
```

**Bad Example (Too Verbose):**
```typescript
{
  name: 'get_weather',
  description: `Get weather data.

CODING AGENT BENEFITS:
- Build weather apps
- Create automation
... (many more paragraphs)

HOW IT WORKS:
... (more paragraphs)

BEST PRACTICES:
... (even more paragraphs)`
}
```

### 3. Schema Design

- Use descriptive parameter names
- Include clear descriptions for each property
- Mark required vs optional parameters explicitly
- Use appropriate types and constraints (min, max, enum)
- Provide sensible default values
- Use Zod or JSON Schema for validation

### 4. Naming Conventions

- Use lowercase with underscores: `create_playlist`, `set_volume`
- Be descriptive but concise: `weather_current` not `weather`
- Use consistent patterns: `sonos_*` prefix is good
- Avoid generic names: `do_thing` is bad

### 5. Security Considerations

From the MCP specification:

**Servers MUST:**
- Validate all tool inputs
- Implement proper access controls
- Rate limit tool invocations
- Sanitize tool outputs

**Clients SHOULD:**
- Prompt for user confirmation on sensitive operations
- Show tool inputs before calling server
- Validate tool results
- Implement timeouts

---

## Current Implementation Analysis

### Issues Identified

#### 1. **Excessive Verbosity** (CRITICAL)

Many tools have extremely long descriptions with multiple sections:
- "CODING AGENT BENEFITS" 
- "HOW IT WORKS"
- "BEST PRACTICES FOR AI AGENTS"
- "COMMON WORKFLOWS"
- "INTELLIGENT AUTOMATION EXAMPLES"
- "ERROR SCENARIOS"

**Example:** The `sonos_discover` tool has a description that is ~100 lines long.

**Impact:** 
- Increases token usage unnecessarily
- Makes tool lists harder to parse for LLMs
- Mixes documentation with tool definitions
- Not aligned with MCP best practices

**Recommendation:** Reduce to 2-4 sentences. Move detailed documentation to separate files.

#### 2. **Inconsistent Description Quality**

Some tools are well-described (brief):
```typescript
{
  name: 'sonos_stop',
  description: 'Stop playback on a Sonos device'
}
```

Others are excessively detailed:
```typescript
{
  name: 'sonos_discover',
  description: `(~100 lines of text with multiple sections)`
}
```

**Recommendation:** Standardize all descriptions to 2-4 sentences maximum.

#### 3. **Missing Title Fields**

Most tools lack the `title` field, which is recommended for UI display.

**Current:**
```typescript
{
  name: 'sonos_play',
  description: 'Start or resume playback...'
}
```

**Should be:**
```typescript
{
  name: 'sonos_play',
  title: 'Play/Resume',
  description: 'Start or resume playback on a Sonos device'
}
```

#### 4. **No Output Schemas**

None of the tools define `outputSchema`, which is a best practice for structured outputs.

**Benefits of outputSchema:**
- Enables strict schema validation
- Provides type information for clients
- Better documentation
- Guides LLMs to properly parse results

**Example implementation:**
```typescript
{
  name: 'sonos_get_volume',
  outputSchema: {
    volume: z.number().min(0).max(100),
    muted: z.boolean()
  }
}
```

#### 5. **Parameter Descriptions Could Be Improved**

Some parameters have redundant descriptions:

```typescript
deviceId: {
  type: 'string',
  description: 'Device name (e.g., "Kitchen"), UUID, or IP address'
}
```

This appears in almost every tool. Could be more concise or use a shared constant.

#### 6. **Server Description Is Too Long**

The main server description is also excessively verbose with marketing language:

**Current:** ~30 lines with multiple paragraphs  
**Recommended:** 2-3 sentences

---

## Specific Tool Recommendations

### High Priority: Shorten Verbose Tools

These tools need immediate description reduction:

1. **sonos_discover** - Currently ~100 lines → Should be ~3 sentences
2. **sonos_add_device** - Currently ~80 lines → Should be ~3 sentences
3. **sonos_list_devices** - Currently ~60 lines → Should be ~3 sentences
4. **sonos_play** - Currently ~80 lines → Should be ~2 sentences
5. **sonos_pause** - Currently ~70 lines → Should be ~2 sentences

**Recommended Format:**

```typescript
{
  name: 'sonos_discover',
  title: 'Discover Sonos Devices',
  description: 'Discover Sonos devices on the local network using SSDP. Returns device UUID, IP address, room name, model, and firmware version. Timeout parameter controls discovery duration (default 5000ms).',
  inputSchema: {
    type: 'object',
    properties: {
      timeout: {
        type: 'number',
        description: 'Discovery timeout in milliseconds (5000-10000 recommended)',
        default: 5000
      }
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      devices: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            uuid: { type: 'string' },
            ip: { type: 'string' },
            port: { type: 'number' },
            name: { type: 'string' },
            modelName: { type: 'string' },
            softwareVersion: { type: 'string' }
          }
        }
      }
    }
  }
}
```

### Medium Priority: Add Missing Fields

All tools should have:
- `title` field for UI display
- `outputSchema` for structured validation
- Improved parameter descriptions

### Low Priority: Consistency

- Standardize deviceId description across all tools
- Ensure consistent enum usage
- Align error messaging

---

## Recommended Changes

### 1. Separate Documentation from Tool Definitions

**Create:** `docs/agent-integration-guide.md`

Move all the "CODING AGENT BENEFITS", "BEST PRACTICES", "EXAMPLES" content to this comprehensive guide.

**Structure:**
```markdown
# Sonos MCP Server - AI Agent Integration Guide

## Discovery and Device Management
### Using sonos_discover
(All the detailed content currently in tool descriptions)

## Playback Control
### Using sonos_play
### Using sonos_pause
...

## Advanced Patterns
### Multi-room Automation
### Voice Control Integration
...
```

### 2. Update Server Description

**Current:** ~30 lines  
**Recommended:**

```typescript
new Server({
  name: 'sonos-mcp-server',
  version: '1.3.0',
  description: 'MCP server for Sonos multi-room audio control. Provides tools for device discovery, playback control, volume management, EQ settings, alarms, grouping, and music library browsing. All tools require a deviceId (room name, UUID, or IP address).'
})
```

### 3. Example Tool Updates

**Before (sonos_play):**
```typescript
{
  name: 'sonos_play',
  description: `Start or resume playback on a Sonos device. Core function for coding agents building music playback automation and voice control systems.

CODING AGENT BENEFITS:
- Build play/pause buttons in audio control interfaces
... (70+ more lines)
`
}
```

**After:**
```typescript
{
  name: 'sonos_play',
  title: 'Play/Resume',
  description: 'Start or resume playback on a Sonos device. Continues from current queue position and respects volume settings. If device is in a group, affects entire group.',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Room name, UUID, or IP address'
      }
    },
    required: ['deviceId']
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' }
    }
  }
}
```

### 4. Create Shared Constants

For commonly reused descriptions:

```typescript
const DEVICE_ID_DESCRIPTION = 'Device identifier: room name (e.g., "Kitchen"), UUID (e.g., "RINCON_xxxxx"), or IP address (e.g., "192.168.1.100")';

const DEVICE_ID_SCHEMA = {
  type: 'string',
  description: DEVICE_ID_DESCRIPTION
};
```

---

## Implementation Priority

### Phase 1: Critical (Immediate)
1. Reduce verbose tool descriptions to 2-4 sentences
2. Update server description to 2-3 sentences
3. Create `docs/agent-integration-guide.md` with detailed agent documentation

### Phase 2: Important (Next Sprint)
1. Add `title` field to all tools
2. Add `outputSchema` to all tools
3. Improve parameter descriptions

### Phase 3: Polish (Future)
1. Create shared constants for common descriptions
2. Add more detailed examples in separate docs
3. Consider adding annotations for advanced features

---

## Comparison Table

| Tool Name | Current Description Length | Recommended Length | Has Title? | Has OutputSchema? |
|-----------|---------------------------|-------------------|------------|-------------------|
| sonos_discover | ~100 lines | 3 sentences | No | No |
| sonos_add_device | ~80 lines | 3 sentences | No | No |
| sonos_play | ~80 lines | 2 sentences | No | No |
| sonos_pause | ~70 lines | 2 sentences | No | No |
| sonos_stop | 1 sentence | ✓ Good | No | No |
| sonos_next | 1 sentence | ✓ Good | No | No |
| sonos_set_volume | 1 sentence | ✓ Good | No | No |
| sonos_get_volume | 1 sentence | ✓ Good | No | No |

---

## Benefits of Implementing These Changes

1. **Reduced Token Usage** - Shorter descriptions = lower LLM costs
2. **Better LLM Understanding** - Concise descriptions are easier to parse
3. **Improved Maintainability** - Separate docs easier to update
4. **Standards Compliance** - Aligns with official MCP best practices
5. **Better Developer Experience** - Clear separation of concerns
6. **Enhanced Type Safety** - Output schemas enable validation

---

## References

- [MCP Tools Specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#security-considerations)

---

## Next Steps

1. Review this document with the team
2. Prioritize which changes to implement first
3. Create `docs/agent-integration-guide.md` with detailed agent documentation
4. Update tool descriptions in phases
5. Test with MCP Inspector to ensure compatibility
6. Update README.md to reference new documentation structure

---

## Appendix: Example Agent Integration Guide Structure

```markdown
# Sonos MCP Server - AI Agent Integration Guide

## Table of Contents
1. Getting Started
2. Device Discovery & Management
3. Playback Control
4. Volume & Audio Settings
5. Queue Management
6. Multi-Room Grouping
7. Music Library Browsing
8. Advanced Features
9. Common Patterns & Workflows
10. Troubleshooting

## 1. Getting Started

### Quick Start
...

### Device Identification
All tools require a deviceId parameter which can be:
- Room name (e.g., "Kitchen") - most user-friendly
- UUID (e.g., "RINCON_xxxxx") - most reliable  
- IP address (e.g., "192.168.1.100") - direct access

### Initial Discovery Workflow
1. Run sonos_discover to find devices
2. Run sonos_list_devices to see registered devices
3. Use deviceId in subsequent commands

## 2. Device Discovery & Management

### sonos_discover

**Purpose:** Find Sonos devices on local network

**Coding Agent Benefits:**
- Build device discovery and setup interfaces
- Create automated device inventory systems
- Develop network scanning utilities
...

(All the detailed content from current tool descriptions)
```

