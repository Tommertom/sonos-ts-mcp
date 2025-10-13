# Sonos MCP Server - Implementation Guide

## Quick Start

### Installation
```bash
git clone <repository-url>
cd sonos-ts-mcp
npm install
npm run build
```

### Running the Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
node dist/index.js
```

### Integrating with MCP Clients

Add to your MCP client configuration (e.g., Claude Desktop config):

```json
{
  "mcpServers": {
    "sonos": {
      "command": "node",
      "args": ["/absolute/path/to/sonos-ts-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Discovery

#### `sonos_discover`
Discover Sonos devices on the local network.

**Parameters:**
- `timeout` (optional, number): Discovery timeout in milliseconds (default: 5000)

**Example:**
```json
{
  "name": "sonos_discover",
  "arguments": {
    "timeout": 3000
  }
}
```

**Response:**
```
Discovered 3 Sonos device(s)
```

#### `sonos_list_devices`
List all discovered devices with their details.

**Parameters:** None

**Response:**
```json
[
  {
    "uuid": "RINCON_000E58C3897E01400",
    "ip": "192.168.1.100",
    "port": 1400,
    "location": "http://192.168.1.100:1400/xml/device_description.xml"
  }
]
```

### Playback Control

#### `sonos_play`
Start or resume playback.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Example:**
```json
{
  "name": "sonos_play",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

#### `sonos_pause`
Pause playback.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

#### `sonos_stop`
Stop playback (clears current position).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

#### `sonos_next`
Skip to the next track.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

#### `sonos_previous`
Skip to the previous track.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

### Volume Control

#### `sonos_set_volume`
Set the volume level.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `volume` (required, number): Volume level (0-100)

**Example:**
```json
{
  "name": "sonos_set_volume",
  "arguments": {
    "deviceId": "192.168.1.100",
    "volume": 50
  }
}
```

#### `sonos_get_volume`
Get the current volume level.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```
Volume: 45
```

#### `sonos_set_mute`
Mute or unmute the device.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `mute` (required, boolean): Mute state (true = muted, false = unmuted)

### Information Queries

#### `sonos_get_transport_info`
Get current transport state (playing/paused/stopped).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```json
{
  "state": "PLAYING",
  "status": "OK",
  "speed": "1"
}
```

#### `sonos_get_position_info`
Get current track and playback position.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```json
{
  "track": {
    "title": "Bohemian Rhapsody",
    "artist": "Queen",
    "album": "A Night at the Opera",
    "duration": "0:05:55",
    "uri": "x-file-cifs://...",
    "albumArtUri": "http://..."
  },
  "position": "0:02:30"
}
```

#### `sonos_get_zone_groups`
Get zone group topology (speaker grouping).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```json
[
  {
    "coordinator": "RINCON_000E58C3897E01400",
    "members": [
      "RINCON_000E58C3897E01400",
      "RINCON_B8E9375C397E01400"
    ]
  }
]
```

## Common Usage Patterns

### Basic Playback Control
```
1. Discover devices: sonos_discover
2. List devices: sonos_list_devices
3. Start playback: sonos_play with deviceId
4. Adjust volume: sonos_set_volume with deviceId and volume
```

### Monitoring Playback
```
1. Get transport info: sonos_get_transport_info
2. Get current track: sonos_get_position_info
```

### Multi-room Control
```
1. Discover all devices
2. Get zone groups to see which speakers are grouped
3. Control the coordinator device to affect the entire group
```

## Error Handling

All tools return errors in the following format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Device not found: 192.168.1.999"
    }
  ],
  "isError": true
}
```

### Common Errors

- **Device not found**: The specified device ID doesn't match any discovered device
- **SOAP error 800**: Command not supported or not a coordinator
- **SOAP error 701**: Transition not available (e.g., trying to pause when stopped)
- **SOAP error 802**: Invalid arguments

## Network Requirements

### Firewall Configuration

**Incoming:**
- UDP port 1900 (SSDP discovery responses)
- TCP port 3500 (Sonos events - not yet implemented)

**Outgoing:**
- UDP port 1900 (SSDP discovery multicast)
- TCP port 1400 (Sonos SOAP control)

### Network Topology

- Sonos devices and the MCP server must be on the same subnet
- Multicast must be enabled on the network
- No NAT traversal required (local network only)

## Troubleshooting

### No Devices Discovered

1. Verify Sonos devices are powered on and connected
2. Check that multicast is enabled on your network
3. Verify firewall allows UDP port 1900
4. Try increasing the discovery timeout
5. Check that your computer is on the same subnet as Sonos devices

### Command Failures

1. Ensure you've run `sonos_discover` first
2. Verify the device ID is correct (use `sonos_list_devices`)
3. Check that the device is not in a conflicting state
4. For grouped speakers, send commands to the coordinator

### Performance Issues

1. Reduce discovery timeout if not finding all devices
2. Cache device IDs to avoid repeated discovery
3. Commands to non-coordinators may have limited functionality

## Development

### Running Tests
```bash
npm test                # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### Linting and Formatting
```bash
npm run lint            # Check code style
npm run format          # Auto-format code
npm run typecheck       # Check TypeScript types
```

### Adding New Tools

1. Add service method to appropriate service class
2. Register tool in `src/mcp/server.ts` (ListToolsRequestSchema handler)
3. Implement handler method in `SonosMcpServer` class
4. Add tool name to CallToolRequestSchema handler switch
5. Add tests for new functionality
6. Update documentation

### Project Structure
```
src/
├── discovery/         # Device discovery (SSDP)
├── soap/             # SOAP transport layer
├── services/         # Sonos service wrappers
├── mcp/              # MCP server implementation
└── types/            # TypeScript definitions

tests/                # Unit tests
docs/                 # Documentation
```

## License

MIT - See LICENSE file for details
