# Tool Description Examples - Before & After

This document provides concrete before/after examples for improving Sonos MCP Server tool descriptions according to MCP best practices.

---

## Example 1: sonos_discover

### ❌ Before (Current - Too Verbose)

```typescript
{
  name: 'sonos_discover',
  description: `Discover Sonos devices on the local network using SSDP (Simple Service Discovery Protocol). Essential first step for coding agents building Sonos control applications.

CODING AGENT BENEFITS:
- Build device discovery and setup interfaces for audio applications
- Create automated device inventory and registration systems
- Develop network scanning utilities for home audio systems
- Generate device lists for user selection in control interfaces
- Build multi-location audio system discovery workflows
- Create device health monitoring and network diagnostics tools

HOW IT WORKS:
- Broadcasts SSDP M-SEARCH requests on the local network
- Listens for Sonos device responses (typically port 1400)
- Parses device UUIDs, IP addresses, and capabilities
- Fetches detailed device information (model, room name, firmware)
- Registers all discovered devices in the device registry
- Returns comprehensive device list with all metadata

WHAT IT RETURNS:
- Device UUID (unique identifier like RINCON_xxxxx)
- IP address and port (usually 192.168.x.x:1400)
- Room name (e.g., "Kitchen", "Living Room")
- Model name and number (e.g., "Sonos One", "Beam")
- Software version and capabilities
- Discovery timestamp

BEST PRACTICES FOR AI AGENTS:
- Initial Setup: Always run discovery first in new environments
- Timeout Selection: Use 5000ms (5s) for most networks, 10000ms (10s) for large homes
- Periodic Refresh: Re-run discovery after adding/moving devices
- Error Handling: Handle zero devices gracefully with helpful user guidance
- Network Requirements: Ensure same subnet as Sonos devices
- Multi-Network: May need to run on each network segment
- Caching: Store discovered devices for quick subsequent access

COMMON WORKFLOWS:
1. First Use: sonos_discover → sonos_list_devices → select device → control
2. Refresh: sonos_discover (periodic) → update device registry
3. Troubleshooting: sonos_discover → verify devices reachable

DISCOVERY TIPS:
- Devices must be powered on and connected to network
- UPnP/SSDP must not be blocked by firewall
- Works only on local network (not remote/cloud)
- May discover non-Sonos UPnP devices (filtered automatically)`,
  inputSchema: {
    type: 'object',
    properties: {
      timeout: {
        type: 'number',
        description: 'Discovery timeout in milliseconds. Longer timeouts find more devices in large networks but take more time. Recommended: 5000ms for small networks, 10000ms for large homes. Default: 5000ms',
        default: 5000
      }
    }
  }
}
```

### ✅ After (Improved - Concise & Clear)

```typescript
{
  name: 'sonos_discover',
  title: 'Discover Sonos Devices',
  description: 'Discover Sonos devices on the local network using SSDP. Returns device UUID, IP address, room name, model, and firmware version. Use 5000-10000ms timeout based on network size.',
  inputSchema: {
    type: 'object',
    properties: {
      timeout: {
        type: 'number',
        description: 'Discovery timeout in milliseconds (5000-10000 recommended)',
        default: 5000,
        minimum: 1000,
        maximum: 30000
      }
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      message: { 
        type: 'string',
        description: 'Summary of discovery results'
      },
      devices: {
        type: 'array',
        description: 'List of discovered Sonos devices',
        items: {
          type: 'object',
          properties: {
            uuid: { 
              type: 'string',
              description: 'Unique device identifier (e.g., RINCON_xxxxx)'
            },
            ip: { 
              type: 'string',
              description: 'Device IP address'
            },
            port: { 
              type: 'number',
              description: 'Device port (typically 1400)'
            },
            name: { 
              type: 'string',
              description: 'Room name assigned to device'
            },
            modelName: { 
              type: 'string',
              description: 'Device model (e.g., Sonos One, Beam)'
            },
            modelNumber: { 
              type: 'string',
              description: 'Model number'
            },
            softwareVersion: { 
              type: 'string',
              description: 'Current firmware version'
            }
          }
        }
      }
    },
    required: ['message', 'devices']
  }
}
```

**Improvements:**
- ✅ Reduced from ~100 lines to 3 sentences
- ✅ Added `title` for UI display
- ✅ Added `outputSchema` for validation
- ✅ Moved agent documentation to separate guide
- ✅ Kept essential information only
- ✅ Added schema constraints (min/max)

---

## Example 2: sonos_play

### ❌ Before (Current - Too Verbose)

```typescript
{
  name: 'sonos_play',
  description: `Start or resume playback on a Sonos device. Core function for coding agents building music playback automation and voice control systems.

CODING AGENT BENEFITS:
- Build play/pause buttons in audio control interfaces
- Create voice command handlers ("play music")
- Develop automated playback scheduling (morning music routines)
- Generate scene-based audio automation (dinner party mode)
- Build gesture or sensor-triggered playback
- Create multi-room synchronized playback triggers

HOW IT WORKS:
- Resumes playback if paused
- Starts from beginning if stopped
- Continues from current queue position
- Respects current volume and EQ settings
- Works with any audio source (queue, streaming, line-in, etc.)
- Immediate response (typically <100ms)

PLAYBACK SOURCES:
- Queue: Plays from the device's playback queue
- Streaming Services: Spotify, Apple Music, etc. (if already playing)
- Radio: TuneIn, iHeartRadio stations
- Line-In: Connected audio device
- TV: Sonos soundbar TV input
- Airplay: Airplay 2 stream

BEST PRACTICES FOR AI AGENTS:
- State Check: Use sonos_get_transport_info first to see current state
- User Feedback: Confirm playback started with visual/audio cue
- Error Handling: Handle empty queue gracefully
- Group Coordination: Play affects entire group (not just one device)
- Volume Safety: Check volume before playing (avoid sudden loud music)
- Source Awareness: Different sources behave differently on play

MULTI-ROOM BEHAVIOR:
- If device is group coordinator: All group members play
- If device is group member: Entire group plays (coordinator controls)
- Use sonos_get_zone_groups to understand group topology

INTELLIGENT AUTOMATION EXAMPLES:
- Morning Routine: 7:00 AM → sonos_play ("Kitchen")
- Motion Detected: Entry sensor → sonos_play ("Hallway")
- Voice Command: "Play music" → sonos_play (current room)
- Scene Activation: "Dinner party" → sonos_play (all downstairs rooms)
- Geofencing: Arrive home → sonos_play ("Living Room")
- Calendar Integration: Meeting ends → sonos_play ("Office")

COMMON WORKFLOWS:
1. Simple Play: sonos_play → music starts
2. Resume: sonos_pause → (pause) → sonos_play → resume from same position
3. Check First: sonos_get_transport_info → if paused → sonos_play

ERROR SCENARIOS:
- Empty Queue: Nothing happens if no tracks in queue and no active stream
- Device Offline: Command fails if device unreachable
- Group Conflict: May fail if group topology changing`,
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Device identifier: room name (e.g., "Kitchen"), UUID (e.g., "RINCON_xxxxx"), or IP address (e.g., "192.168.1.100"). If device is in a group, playback affects entire group.'
      }
    },
    required: ['deviceId']
  }
}
```

### ✅ After (Improved - Concise & Clear)

```typescript
{
  name: 'sonos_play',
  title: 'Play/Resume',
  description: 'Start or resume playback on a Sonos device. Continues from current queue position. If device is in a group, affects entire group.',
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
      success: { 
        type: 'boolean',
        description: 'Whether playback started successfully'
      },
      message: { 
        type: 'string',
        description: 'Status message'
      }
    },
    required: ['success', 'message']
  }
}
```

**Improvements:**
- ✅ Reduced from ~80 lines to 2 sentences
- ✅ Added `title` for UI display
- ✅ Added `outputSchema` for validation
- ✅ Simplified deviceId description
- ✅ Kept only essential behavioral information

---

## Example 3: sonos_set_volume

### ❌ Before (Current - Brief but Missing Fields)

```typescript
{
  name: 'sonos_set_volume',
  description: 'Set volume on a Sonos device (0-100)',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Device name (e.g., "Kitchen"), UUID, or IP address'
      },
      volume: {
        type: 'number',
        description: 'Volume level 0-100',
        minimum: 0,
        maximum: 100
      }
    },
    required: ['deviceId', 'volume']
  }
}
```

### ✅ After (Improved - Added Fields)

```typescript
{
  name: 'sonos_set_volume',
  title: 'Set Volume',
  description: 'Set volume level on a Sonos device. Range: 0 (muted) to 100 (maximum). Affects entire group if device is grouped.',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Room name, UUID, or IP address'
      },
      volume: {
        type: 'number',
        description: 'Volume level (0-100)',
        minimum: 0,
        maximum: 100
      }
    },
    required: ['deviceId', 'volume']
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { 
        type: 'boolean',
        description: 'Whether volume was set successfully'
      },
      message: { 
        type: 'string',
        description: 'Confirmation message including new volume level'
      }
    },
    required: ['success', 'message']
  }
}
```

**Improvements:**
- ✅ Added `title` field
- ✅ Added `outputSchema`
- ✅ Enhanced description with range explanation
- ✅ Simplified deviceId description
- ✅ Added group behavior note

---

## Example 4: sonos_get_queue

### ❌ Before (Current - Missing Output Schema)

```typescript
{
  name: 'sonos_get_queue',
  description: 'Get the current playback queue',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Device name (e.g., "Kitchen"), UUID, or IP address'
      },
      startIndex: {
        type: 'number',
        description: 'Starting index (0-based, default: 0)',
        default: 0
      },
      count: {
        type: 'number',
        description: 'Number of tracks to retrieve (default: 100)',
        default: 100
      }
    },
    required: ['deviceId']
  }
}
```

### ✅ After (Improved - With Output Schema)

```typescript
{
  name: 'sonos_get_queue',
  title: 'Get Queue',
  description: 'Retrieve the current playback queue with track information. Supports pagination for large queues.',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: {
        type: 'string',
        description: 'Room name, UUID, or IP address'
      },
      startIndex: {
        type: 'number',
        description: 'Starting index for pagination (0-based)',
        default: 0,
        minimum: 0
      },
      count: {
        type: 'number',
        description: 'Number of tracks to retrieve',
        default: 100,
        minimum: 1,
        maximum: 1000
      }
    },
    required: ['deviceId']
  },
  outputSchema: {
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total number of tracks in queue'
      },
      returned: {
        type: 'number',
        description: 'Number of tracks returned in this response'
      },
      startIndex: {
        type: 'number',
        description: 'Starting index of returned tracks'
      },
      tracks: {
        type: 'array',
        description: 'Array of track objects',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Track ID' },
            title: { type: 'string', description: 'Track title' },
            artist: { type: 'string', description: 'Artist name' },
            album: { type: 'string', description: 'Album name' },
            albumArtUri: { type: 'string', description: 'Album art URL' },
            duration: { type: 'string', description: 'Track duration (HH:MM:SS)' },
            uri: { type: 'string', description: 'Track URI' }
          }
        }
      }
    },
    required: ['total', 'returned', 'startIndex', 'tracks']
  }
}
```

**Improvements:**
- ✅ Added `title` field
- ✅ Added comprehensive `outputSchema`
- ✅ Added min/max constraints to inputs
- ✅ Better parameter descriptions
- ✅ Clear pagination explanation

---

## Example 5: Shared Constants Pattern

To avoid repetition, create shared constants:

```typescript
// Shared device ID schema
const DEVICE_ID_PARAM = {
  type: 'string',
  description: 'Room name, UUID, or IP address'
} as const;

// Shared success response schema
const SUCCESS_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    success: { 
      type: 'boolean',
      description: 'Whether the operation succeeded'
    },
    message: { 
      type: 'string',
      description: 'Status or error message'
    }
  },
  required: ['success', 'message']
} as const;

// Usage in tool definitions
{
  name: 'sonos_play',
  title: 'Play/Resume',
  description: '...',
  inputSchema: {
    type: 'object',
    properties: {
      deviceId: DEVICE_ID_PARAM
    },
    required: ['deviceId']
  },
  outputSchema: SUCCESS_RESPONSE_SCHEMA
}
```

---

## Key Takeaways

1. **Brevity is Key** - 2-4 sentences maximum for descriptions
2. **Title for Display** - Always include a user-friendly title
3. **Output Schemas** - Define expected return structure
4. **Move Details to Docs** - Extensive guides belong in separate markdown files
5. **Consistent Patterns** - Use shared constants to avoid repetition
6. **Type Safety** - Use min/max, enums, and proper types
7. **Clear Descriptions** - Focus on what and when, not how
8. **Professional Tone** - Avoid marketing language

---

## Benefits

- **Token Efficiency** - Reduce LLM token usage by 80-90%
- **Better Parsing** - LLMs parse concise descriptions more accurately
- **Maintainability** - Easier to update and keep consistent
- **Standards Compliance** - Aligns with official MCP best practices
- **Type Safety** - Output schemas enable validation
- **Better UX** - Clear titles and descriptions improve user experience

