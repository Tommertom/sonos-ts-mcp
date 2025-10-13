# Sonos TypeScript MCP Server

A Model Context Protocol (MCP) server for controlling Sonos audio devices over the local network using UPnP/SOAP.

## Features

- **Device Discovery**: Automatic SSDP-based discovery of Sonos devices
- **Playback Control**: Play, pause, stop, next, previous
- **Volume Control**: Get and set volume levels, mute/unmute
- **Transport Info**: Get current playback state and track information
- **Zone Topology**: Query zone groups and speaker configurations
- **Pure TypeScript**: Built from scratch without external Sonos libraries
- **MCP Compatible**: Integrates with any MCP-compatible client

## Installation

```bash
npm install
npm run build
```

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
npm run dev        # Run with tsx (hot reload)
npm run build      # Compile TypeScript
npm run typecheck  # Type checking only
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Run tests
```

## Available Tools

### Discovery
- `sonos_discover` - Discover Sonos devices on the network
- `sonos_list_devices` - List all discovered devices

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
    └── sonos.ts
```

## Protocol Details

### Discovery (SSDP)
- Sends UDP multicast to `239.255.255.250:1900`
- Searches for `urn:schemas-upnp-org:device:ZonePlayer:1`
- Parses response headers to extract device location

### Control (SOAP/UPnP)
- HTTP POST to `http://{ip}:1400/...`
- XML-based SOAP envelopes
- Supports all standard Sonos UPnP services

## License

MIT
