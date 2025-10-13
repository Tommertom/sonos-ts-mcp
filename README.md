# Sonos TypeScript MCP Server

A Model Context Protocol (MCP) server for controlling Sonos audio devices over the local network using UPnP/SOAP.

> **📊 Feature Status**: Phase 1 complete! Implements DIDL-Lite metadata, queue management, and playback properties. See [Phase 1 completion](./docs/PHASE-1-COMPLETE.md) for details.

## Features

- **Device Discovery**: Automatic SSDP-based discovery of Sonos devices
- **Playback Control**: Play, pause, stop, next, previous
- **Volume Control**: Get and set volume levels, mute/unmute
- **Transport Info**: Get current playback state and track information
- **Zone Topology**: Query zone groups and speaker configurations
- **Queue Management**: Full queue control (add, remove, reorder, save, play)
- **DIDL-Lite Support**: Complete metadata handling for tracks, albums, and containers
- **Playback Properties**: Shuffle, repeat, and crossfade controls
- **Pure TypeScript**: Built from scratch without external Sonos libraries
- **MCP Compatible**: Integrates with any MCP-compatible client

### Planned Features

This project is actively expanding to match the comprehensive feature set of the Python SoCo library:

- 🚧 Group management (join, unjoin, party mode)
- 🟠 Playlist management (create, edit, delete playlists)
- 🟠 Music library browsing (artists, albums, tracks)
- 🟡 Event subscriptions (real-time updates)
- 🟡 Alarm configuration
- 🟢 Snapshot/restore state
- 🟢 Home theater controls

See the [implementation roadmap](./docs/implementation-roadmap.md) for the complete expansion plan.

## Installation

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

## Usage

### As MCP Server

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

### Development

```bash
npm run dev            # Run with tsx (hot reload)
npm run build          # Compile TypeScript
npm run typecheck      # Type checking only
npm run lint           # ESLint
npm run format         # Prettier
npm test               # Run tests
npm run test:discovery # Test Sonos device discovery
```

## Available Tools

### Discovery
- `sonos_discover` - Discover Sonos devices on the network using SSDP multicast
- `sonos_add_device` - Manually add a Sonos device by IP address (useful when SSDP discovery fails)
- `sonos_list_devices` - List all discovered/registered devices

### Playback Control
- `sonos_play` - Start playback
- `sonos_pause` - Pause playback
- `sonos_stop` - Stop playback
- `sonos_next` - Skip to next track
- `sonos_previous` - Skip to previous track

### Volume Control
- `sonos_set_volume` - Set volume (0-100)
- `sonos_get_volume` - Get current volume
- `sonos_set_mute` - Mute or unmute

### Queue Management
- `sonos_get_queue` - Get the current playback queue
- `sonos_add_to_queue` - Add a URI to the queue
- `sonos_remove_from_queue` - Remove a track from the queue
- `sonos_clear_queue` - Remove all tracks from the queue
- `sonos_play_from_queue` - Play from a specific queue position
- `sonos_save_queue` - Save the queue as a Sonos playlist

### Playback Properties
- `sonos_set_shuffle` - Enable or disable shuffle mode
- `sonos_set_repeat` - Set repeat mode (off, all, one)
- `sonos_set_crossfade` - Enable or disable crossfade
- `sonos_get_playback_state` - Get shuffle, repeat, crossfade, and playback state

### Information
- `sonos_get_transport_info` - Get playback state
- `sonos_get_position_info` - Get current track details
- `sonos_get_zone_groups` - Get zone topology

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
│   ├── av-transport.ts
│   ├── rendering-control.ts
│   └── zone-topology.ts
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

- 📖 [Quick Reference](./docs/quick-reference.md) - Feature status at a glance
- 📊 [SoCo Feature Comparison](./docs/soco-comparison.md) - Detailed feature comparison with SoCo
- 🗺️ [Implementation Roadmap](./docs/implementation-roadmap.md) - Phased expansion plan
- 📋 [Executive Summary](./docs/soco-analysis-summary.md) - High-level overview
- 🏗️ [Technical Architecture](./docs/technical-architecture.md) - System design details

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
