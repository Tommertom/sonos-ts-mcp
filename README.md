# Sonos TypeScript MCP Server

Your comprehensive Sonos control companion powered by the Model Context Protocol (MCP). This intelligent server provides seamless access to Sonos audio devices over your local network using UPnP/SOAP protocols. Whether you're controlling playback, managing zones, browsing your music library, or setting up alarms, this MCP server delivers complete device control directly to your AI assistant, enabling smart home automation and better audio experiences.

**Specifically designed for coding agents and AI-driven home audio automation workflows.** This server enables AI assistants to build intelligent multi-room audio experiences, music library management, zone grouping, queue management, and integration with smart home platforms.

Data is sourced from real-time UPnP/SOAP communication with Sonos devices to ensure accuracy and completeness.

> **📊 Feature Status**: Phase 4 complete! Implements real-time event subscriptions with UPnP GENA protocol for playback, volume, queue, and topology changes. See [Phase 4 completion](./docs/PHASE-4-COMPLETE.md) for details.

## 📚 Documentation

- **[Comprehensive Tool Descriptions](./docs/TOOL_DESCRIPTIONS.md)** - Detailed guide for coding agents with use cases, workflows, and best practices for all 50+ tools
- **[API Reference](./docs/)** - Technical API documentation
- **[Example Scripts](./scripts/)** - Sample automation scripts and use cases

## Hosted deployment

A hosted deployment is available on [Fronteir AI](https://fronteir.ai/mcp/tommertom-sonos-ts-mcp).

## Getting Started

The Sonos TypeScript MCP Server can work with any MCP client that supports standard I/O (stdio) as the transport medium. Here are specific instructions for some popular tools:

### Basic Configuration

#### Claude Desktop

To configure Claude Desktop to use the Sonos MCP server, edit the `claude_desktop_config.json` file. You can open or create this file from the Claude > Settings menu. Select the Developer tab, then click Edit Config.

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

#### Cline

To configure Cline to use the Sonos MCP server, edit the `cline_mcp_settings.json` file. You can open or create this file by clicking the MCP Servers icon at the top of the Cline pane, then clicking the Configure MCP Servers button.

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"],
      "disabled": false
    }
  }
}
```

#### Cursor

To configure Cursor to use the Sonos MCP server, edit either the file `.cursor/mcp.json` (to configure only a specific project) or the file `~/.cursor/mcp.json` (to make the MCP server available in all projects):

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

#### Visual Studio Code Copilot

To configure a single project, edit the `.vscode/mcp.json` file in your workspace:

```json
{
  "servers": {
    "sonos-ts-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

To make the server available in every project you open, edit your user settings:

```json
{
  "mcp": {
    "servers": {
      "sonos-ts-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "sonos-ts-mcp@latest"]
      }
    }
  }
}
```

#### Windsurf Editor

To configure Windsurf Editor, edit the file `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

## Testing with an Agent

You can quickly test the MCP server using the built-in CLI agent, which uses natural language to interact with your Sonos system:

```bash
# Run directly with npx (no installation required)
npx sonos-agent-cli "Play jazz in the living room"

# Use a specific AI model
npx sonos-agent-cli "What's playing in the kitchen?" --model gpt-4o

# Use Gemini models
npx sonos-agent-cli "Set volume to 50 in all rooms" --model gemini-3-pro-preview
```

**Required Environment Variables:**

- `OPENAI_API_KEY`: For OpenAI models (gpt-4o, gpt-4o-mini, etc.)
- `GOOGLE_GENERATIVE_AI_API_KEY`: For Gemini models
- `SONOS_AGENT_MODEL`: Set a default model (optional)

**Build Behavior:**

The CLI automatically builds the MCP server before running to ensure the latest code is used. To skip the build (e.g., during rapid testing), use `--skip-build`:

```bash
npx sonos-agent-cli "Play music" --skip-build
```

This agent provides an easy way to verify that the MCP server is working correctly and can communicate with your Sonos devices.

## Features

This MCP server provides comprehensive control of your Sonos audio system:

- **AI-Powered Agent Tool**: Natural language control via the `sonos_agent` tool (requires AI API keys) ✨ NEW
- **Topology Persistence**: Device topology automatically saved to disk and loaded on startup
- **Intelligent Device Resolution**: Control devices by friendly name (e.g., "Kitchen") instead of UUIDs
- **Automatic Discovery**: Discovers devices on startup and every 5 minutes
- **Device Discovery**: Manual SSDP-based discovery of Sonos devices
- **Playback Control**: Play, pause, stop, next, previous
- **Volume Control**: Get and set volume levels, mute/unmute
- **Transport Info**: Get current playback state and track information
- **Zone Topology**: Query zone groups and speaker configurations
- **Queue Management**: Full queue control (add, remove, reorder, save, play)
- **DIDL-Lite Support**: Complete metadata handling for tracks, albums, and containers
- **Playback Properties**: Shuffle, repeat, and crossfade controls
- **Group Management**: Join and unjoin devices to create multi-room groups
- **Music Library Browsing**: Browse artists, albums, tracks, genres, and playlists
- **Library Search**: Fuzzy search across your music library
- **Audio/EQ Controls**: Bass, treble, loudness, night mode, dialog enhancement
- **Sleep Timer**: Automatic playback stop after duration
- **Alarm Management**: Create, update, and delete alarms
- **Snapshot/Restore**: Save and restore complete device state
- **Party Mode**: Join all devices at once
- **Event Subscriptions**: Real-time notifications for state changes ✨ NEW
- **MCP Prompts**: Exposes AI agent instructions as discoverable prompts ✨ NEW
- **Pure TypeScript**: Built from scratch without external Sonos libraries
- **MCP Compatible**: Integrates with any MCP-compatible client

### Planned Features (Phase 5+)

This project is actively expanding to match the comprehensive feature set of the Python SoCo library:

-  Music service integration (Spotify, Apple Music)
- 🟢 Advanced group management (stereo pairs, home theater)
- 🟢 Audio analysis and diagnostics
- 🟢 MCP event tool integration

See the [Phase 4 completion](./docs/PHASE-4-COMPLETE.md) for the latest features.

## Tools Available

### AI Agent Tool ✨ NEW
| Tool | Description |
|------|-------------|
| `sonos_agent` | AI-powered natural language control. Give instructions like "Play jazz in the living room" and the agent autonomously handles device discovery, tool selection, and execution. Only available when `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` is configured. See [Agent Tool Documentation](./docs/agent-tool.md) for details. |

### Discovery Tools
| Tool | Description |
|------|-------------|
| `sonos_discover` | Discover Sonos devices on the network using SSDP multicast |
| `sonos_add_device` | Manually add a Sonos device by IP address (useful when SSDP discovery fails) |
| `sonos_list_devices` | List all discovered/registered devices |

### Playback Control Tools
| Tool | Description |
|------|-------------|
| `sonos_play` | Start playback |
| `sonos_pause` | Pause playback |
| `sonos_stop` | Stop playback |
| `sonos_next` | Skip to next track |
| `sonos_previous` | Skip to previous track |

### Volume Control Tools
| Tool | Description |
|------|-------------|
| `sonos_set_volume` | Set volume (0-100) |
| `sonos_get_volume` | Get current volume |
| `sonos_set_mute` | Mute or unmute |

### Queue Management Tools
| Tool | Description |
|------|-------------|
| `sonos_get_queue` | Get the current playback queue |
| `sonos_add_to_queue` | Add a URI to the queue |
| `sonos_remove_from_queue` | Remove a track from the queue |
| `sonos_clear_queue` | Remove all tracks from the queue |
| `sonos_play_from_queue` | Play from a specific queue position |
| `sonos_save_queue` | Save the queue as a Sonos playlist |

### Playback Properties Tools
| Tool | Description |
|------|-------------|
| `sonos_set_shuffle` | Enable or disable shuffle mode |
| `sonos_set_repeat` | Set repeat mode (off, all, one) |
| `sonos_set_crossfade` | Enable or disable crossfade |
| `sonos_get_playback_state` | Get shuffle, repeat, crossfade, and playback state |

### Group Management Tools
| Tool | Description |
|------|-------------|
| `sonos_join_group` | Join a device to another device's group |
| `sonos_unjoin` | Remove a device from its group |
| `sonos_party_mode` | Join all devices at once |

### Music Library Tools
| Tool | Description |
|------|-------------|
| `sonos_browse_artists` | Browse all artists in the music library |
| `sonos_browse_albums` | Browse all albums in the music library |
| `sonos_browse_tracks` | Browse all tracks in the music library |
| `sonos_browse_genres` | Browse all genres in the music library |
| `sonos_browse_playlists` | Browse Sonos playlists |
| `sonos_get_favorite_radio_stations` | Get favorite radio stations from Sonos favorites |
| `sonos_search_library` | Search the music library |
| `sonos_browse_item` | Browse subcategories (e.g., albums for an artist) |

### Music Services Tools
| Tool | Description |
|------|-------------|
| `sonos_list_music_services` | List available music services (Sonos Radio, TuneIn, Spotify, etc.) |
| `sonos_browse_music_service` | Browse content from a music service (categories, stations, playlists) |
| `sonos_search_music_service` | Search for content within a music service |
| `sonos_play_music_service_item` | Play an item from a music service (radio station, track, album) |
| `sonos_get_music_service_item_uri` | Get the streaming URI for a music service item |

### Audio/EQ Control Tools
| Tool | Description |
|------|-------------|
| `sonos_set_bass` | Set bass level (-10 to 10) |
| `sonos_set_treble` | Set treble level (-10 to 10) |
| `sonos_set_loudness` | Enable/disable loudness compensation |
| `sonos_get_eq` | Get all EQ settings |
| `sonos_set_night_mode` | Enable/disable night mode (home theater) |
| `sonos_set_dialog_mode` | Enable/disable dialog enhancement (home theater) |

### Sleep Timer Tools
| Tool | Description |
|------|-------------|
| `sonos_set_sleep_timer` | Set automatic playback stop timer |
| `sonos_get_sleep_timer` | Get remaining timer |
| `sonos_cancel_sleep_timer` | Cancel sleep timer |

### Alarm Management Tools
| Tool | Description |
|------|-------------|
| `sonos_list_alarms` | List all alarms |
| `sonos_create_alarm` | Create a new alarm |
| `sonos_update_alarm` | Update an existing alarm |
| `sonos_delete_alarm` | Delete an alarm |

### State Management Tools
| Tool | Description |
|------|-------------|
| `sonos_snapshot` | Take a snapshot of device state |
| `sonos_restore_snapshot` | Restore from snapshot |

### Event Subscription Tools
| Tool | Description |
|------|-------------|
| `sonos_subscribe_events` | Subscribe to real-time device events (AVTransport, RenderingControl, Queue, ZoneGroupTopology, AlarmClock) |
| `sonos_unsubscribe_events` | Unsubscribe from a specific subscription |
| `sonos_unsubscribe_all` | Unsubscribe from all device subscriptions |
| `sonos_list_subscriptions` | List active event subscriptions |

### Information Tools
| Tool | Description |
|------|-------------|
| `sonos_get_transport_info` | Get playback state |
| `sonos_get_position_info` | Get current track details |
| `sonos_get_zone_groups` | Get zone topology |

## Development and Installation

```bash
npm install
npm run build
```

### Test Discovery

After installation, you can test if your Sonos devices can be discovered:

```bash
npm run test:discovery
```

This will perform an SSDP multicast search and display any Sonos devices found on your network.

### Test Favorite Radio Stations

You can test the favorite radio stations feature:

```bash
npm run test:radio
```

This will query your Sonos device for saved radio stations and display them. If no stations are found, it will provide instructions on how to add some using the Sonos app.

### Test Agent Tool

You can test the AI-powered agent tool (requires AI API keys):

```bash
# Set up your API key first
export OPENAI_API_KEY=sk-...
# or
export GOOGLE_GENERATIVE_AI_API_KEY=...

# Run the test
npm run test:agent-tool
```

This will verify that the agent tool is properly configured and can execute natural language instructions. See the [Agent Tool Documentation](./docs/agent-tool.md) for more details.


## Usage

### As MCP Server

The server supports two transport modes:

#### Stdio Mode (Default)

Stdio mode is the standard way to run MCP servers, communicating over standard input/output. This is the mode used by most MCP clients.

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "sonos": {
      "command": "node",
      "args": ["path/to/sonos-ts-mcp/dist/index.js"]
    }
  }
}
```

Or run directly:

```bash
node dist/index.js
```

You can also use the convenience script:

```bash
npm run start:stdio
# or
tsx scripts/start-mcp-stdio.ts
```

#### CLI Agent

The project includes a CLI agent powered by Mastra that allows you to control your Sonos system using natural language.

```bash
# Run with default model (gpt-4o-mini)
npx sonos-agent-cli "Play jazz in the living room"

# Run with a specific model
npx sonos-agent-cli "Play jazz in the living room" --model gpt-4o

# Run with Gemini 3
npx sonos-agent-cli "Play jazz in the living room" --model gemini-3-pro-preview
```

**Environment Variables:**

- `OPENAI_API_KEY`: Required for OpenAI models (default)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Required for Gemini models
- `SONOS_AGENT_MODEL`: Set the default model (optional, e.g., `gemini-3-pro-preview`)

**Note on Telemetry**: The Mastra framework's built-in telemetry has been disabled in this implementation. Telemetry warnings are suppressed by setting `globalThis.___MASTRA_TELEMETRY___ = true` before Mastra initialization. This is set automatically in the CLI agent.

#### SSE Mode (HTTP Server)

SSE (Server-Sent Events) mode runs the MCP server as an HTTP server, useful for web-based clients or remote access.

Set the `MCP_TRANSPORT` environment variable to `sse`:

```bash
MCP_TRANSPORT=sse node dist/index.js
```

Or with custom port (default is 3000):

```bash
MCP_TRANSPORT=sse MCP_PORT=8080 node dist/index.js
```

You can also use the convenience script:

```bash
npm run start:sse
# or
tsx scripts/start-mcp-sse.ts
```

With custom port:

```bash
MCP_PORT=8080 npm run start:sse
```

The server will start an HTTP endpoint at `http://localhost:3000/sse` (or your configured port) that clients can connect to.

### Development

```bash
npm run dev            # Run with tsx (hot reload)
npm run build          # Compile TypeScript
npm run typecheck      # Type checking only
npm run lint           # ESLint
npm run format         # Prettier
npm test               # Run tests
npm run test:discovery # Test Sonos device discovery
npm run test:phase1    # Test Phase 1 APIs (Queue, Playback)
npm run test:phase2    # Test Phase 2 APIs (Groups, Library)
npm run test:phase3    # Test Phase 3 APIs (Audio, Alarms)
npm run test:phase4    # Test Phase 4 APIs (Events)
npm run test:all-phases # Run all phase tests
```

### Testing

Comprehensive API test scripts are available for all implemented features:

```bash
# Run all tests
npm run test:all-phases

# Or run individual phase tests
npm run test:phase1  # Queue, DIDL, Playback Properties
npm run test:phase2  # Groups & Music Library Browsing
npm run test:phase3  # Audio, Alarms, Snapshots
npm run test:phase4  # Event Subscriptions

# Run Phase 2 tests in mock mode (no physical devices required)
npm run test:phase2 -- --mock

# Run integration tests (uses AI validation)
npm test
```

**Note**: Phase 2 tests support a mock mode for testing without physical Sonos devices. Use `--mock` flag or set `MOCK_DEVICES=true` environment variable.

**AI-Powered Integration Tests**: The integration test suite uses Gemini 2.5 Flash AI to intelligently validate agent outputs instead of brittle string matching. This provides semantic understanding of test results and adapts to different output formats. Requires `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

See the [API Testing Guide](./docs/api-testing-guide.md) and [AI-Powered Testing Guide](./docs/ai-powered-testing.md) for detailed documentation on the test suite.

## Architecture

```
src/
├── discovery/         # SSDP device discovery
│   ├── ssdp-client.ts
│   └── device-registry.ts
├── didl/             # DIDL-Lite metadata handling
│   ├── didl-object.ts
│   ├── didl-resource.ts
│   ├── didl-item.ts
│   ├── didl-container.ts
│   ├── didl-serializer.ts
│   ├── didl-parser.ts
│   └── index.ts
├── soap/             # SOAP/UPnP transport layer
│   ├── client.ts
│   ├── request-builder.ts
│   └── response-parser.ts
├── services/         # Sonos service wrappers
│   ├── base-service.ts
│   ├── av-transport.ts        # Playback, queue, sleep timer
│   ├── rendering-control.ts   # Volume, EQ, audio enhancements
│   ├── zone-topology.ts       # Groups, party mode
│   ├── content-directory.ts   # Music library browsing
│   ├── alarm-clock.ts         # ✨ NEW: Alarm management
│   └── snapshot.ts            # ✨ NEW: State snapshot/restore
├── mcp/             # MCP server implementation
│   └── server.ts
└── types/           # TypeScript definitions
    ├── sonos.ts
    └── queue.ts
```

## Protocol Details

### Discovery (SSDP)
- Sends UDP multicast to `239.255.255.250:1900`
- Searches for `urn:schemas-upnp-org:device:ZonePlayer:1`
- Parses response headers to extract device location

**Note on Discovery**: SSDP multicast discovery may not work in all network environments due to:
- Windows Firewall blocking UDP port 1900
- Network switches not properly forwarding multicast traffic
- VPN interference with multicast routing
- Corporate network policies

If automatic discovery fails, use the `sonos_add_device` tool to manually register devices by IP address. The server will verify connectivity before registering the device.

### Manual Device Registration

When SSDP discovery doesn't work, you can manually add devices:

```typescript
// Using the MCP tool
sonos_add_device({
  ip: "192.168.1.100",
  port: 1400,  // optional, defaults to 1400
  name: "Kitchen"  // optional, defaults to "Sonos at {ip}"
})
```

The server will test connectivity to the device before adding it to the registry.

### Control (SOAP/UPnP)
- HTTP POST to `http://{ip}:1400/...`
- XML-based SOAP envelopes
- Supports all standard Sonos UPnP services

## Documentation

- 🤖 **[Agent Tool Guide](./docs/agent-tool.md)** - AI-powered natural language control ✨ NEW
- 📚 **[Comprehensive Tool Descriptions](./docs/TOOL_DESCRIPTIONS.md)** - Detailed guide for coding agents with use cases, workflows, and best practices for all 50+ tools
- 📦 [Installation Guide](./docs/installation-guide.md) - Detailed installation and configuration instructions
- 💾 [Topology Persistence Guide](./docs/topology-persistence.md) - Device topology storage and management ✨ NEW
- 🎯 [Device Resolution Guide](./docs/device-resolution.md) - Using friendly device names ✨ NEW
- 🧪 [API Testing Guide](./docs/api-testing-guide.md) - Comprehensive test suite documentation
- 📘 [Implementation Guide](./docs/implementation-guide.md) - Tool usage and examples
- 🏗️ [Technical Architecture](./docs/technical-architecture.md) - System design details
- 📚 [Phase Completion Docs](./docs/) - PHASE-1-COMPLETE.md through PHASE-4-COMPLETE.md

## Contributing

Contributions are welcome! This project is expanding to provide comprehensive Sonos control. See the [roadmap](./docs/implementation-roadmap.md) for planned features.

Areas where contributions are especially valuable:
- Implementing additional UPnP services
- Adding DIDL-Lite object model
- Event subscription system
- Test coverage expansion
- Documentation improvements

## License

MIT
