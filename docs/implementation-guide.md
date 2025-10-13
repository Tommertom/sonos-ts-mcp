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

### Group Management (Phase 2)
```
1. Join devices: sonos_join_group
2. Unjoin a device: sonos_unjoin
3. Check groups: sonos_get_zone_groups
```

### Music Library Browsing (Phase 2)
```
1. Browse artists: sonos_browse_artists
2. Search library: sonos_search_library
3. Browse artist's albums: sonos_browse_item with artist's object ID
4. Browse playlists: sonos_browse_playlists
```

## Phase 2 Features

### Group Management

#### `sonos_join_group`
Join a device to another device's group.

**Parameters:**
- `deviceId` (required, string): Device to join
- `masterDeviceId` (required, string): Coordinator device to join to

**Example:**
```json
{
  "name": "sonos_join_group",
  "arguments": {
    "deviceId": "192.168.1.100",
    "masterDeviceId": "192.168.1.101"
  }
}
```

#### `sonos_unjoin`
Remove a device from its current group.

**Parameters:**
- `deviceId` (required, string): Device to unjoin

**Example:**
```json
{
  "name": "sonos_unjoin",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

### Music Library Browsing

#### `sonos_browse_artists`
Browse all artists in the music library.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

**Response:**
```json
{
  "items": [
    {
      "id": "A:ALBUMARTIST/The%20Beatles",
      "title": "The Beatles",
      "type": "object.container.person.musicArtist"
    }
  ],
  "total": 150,
  "returned": 100
}
```

#### `sonos_browse_albums`
Browse all albums in the music library.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

**Response:**
```json
{
  "items": [
    {
      "id": "A:ALBUM/Abbey%20Road",
      "title": "Abbey Road",
      "artist": "The Beatles",
      "type": "object.container.album.musicAlbum"
    }
  ],
  "total": 300,
  "returned": 100
}
```

#### `sonos_browse_tracks`
Browse all tracks in the music library.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

#### `sonos_browse_genres`
Browse all genres in the music library.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

#### `sonos_browse_playlists`
Browse Sonos playlists.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

#### `sonos_search_library`
Search the music library.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `searchType` (required, string): Type of search - `artists`, `albums`, `tracks`, or `genres`
- `searchTerm` (required, string): Search term (fuzzy search)
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

**Example:**
```json
{
  "name": "sonos_search_library",
  "arguments": {
    "deviceId": "192.168.1.100",
    "searchType": "artists",
    "searchTerm": "Beatles"
  }
}
```

#### `sonos_browse_item`
Browse a specific music library item (e.g., get albums for an artist).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `objectId` (required, string): Object ID from a previous browse/search result
- `startIndex` (optional, number): Starting index (default: 0)
- `count` (optional, number): Number of items to return (default: 100)

**Example:**
```json
{
  "name": "sonos_browse_item",
  "arguments": {
    "deviceId": "192.168.1.100",
    "objectId": "A:ALBUMARTIST/The%20Beatles"
  }
}
```

**Response:** Returns the albums by The Beatles

## Phase 3 Features (Advanced)

### Audio/EQ Controls

#### `sonos_set_bass`
Set bass level.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `bass` (required, number): Bass level from -10 to 10

#### `sonos_set_treble`
Set treble level.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `treble` (required, number): Treble level from -10 to 10

#### `sonos_set_loudness`
Enable or disable loudness compensation.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `enabled` (required, boolean): Enable loudness

#### `sonos_get_eq`
Get current EQ settings (bass, treble, loudness).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```
EQ Settings:
Bass: 2
Treble: -1
Loudness: enabled
```

#### `sonos_set_night_mode`
Set night mode for home theater devices (Playbar, Beam, Arc).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `enabled` (required, boolean): Enable night mode

#### `sonos_set_dialog_mode`
Set dialog enhancement for home theater devices.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `enabled` (required, boolean): Enable dialog enhancement

### Sleep Timer

#### `sonos_set_sleep_timer`
Set a sleep timer to automatically stop playback after a duration.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `duration` (required, string): Duration in HH:MM:SS format (e.g., "00:30:00" for 30 minutes)

**Example:**
```json
{
  "name": "sonos_set_sleep_timer",
  "arguments": {
    "deviceId": "192.168.1.100",
    "duration": "00:30:00"
  }
}
```

#### `sonos_get_sleep_timer`
Get remaining sleep timer duration.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```
Sleep timer: 00:25:30 remaining
```

#### `sonos_cancel_sleep_timer`
Cancel the sleep timer.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

### Alarm Management

#### `sonos_list_alarms`
List all configured alarms.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```json
[
  {
    "id": "123",
    "startTime": "07:00:00",
    "duration": "02:00:00",
    "recurrence": "WEEKDAYS",
    "enabled": true,
    "volume": 30,
    "includeLinkedZones": false
  }
]
```

#### `sonos_create_alarm`
Create a new alarm.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `startTime` (required, string): Start time in HH:MM:SS format (e.g., "07:00:00")
- `recurrence` (required, string): DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456 (0=Sunday)
- `enabled` (optional, boolean): Enable alarm (default: true)
- `volume` (optional, number): Alarm volume 0-100 (default: 25)
- `duration` (optional, string): Duration in HH:MM:SS (default: 02:00:00)

**Example:**
```json
{
  "name": "sonos_create_alarm",
  "arguments": {
    "deviceId": "192.168.1.100",
    "startTime": "07:00:00",
    "recurrence": "WEEKDAYS",
    "volume": 30
  }
}
```

**Response:**
```
Alarm created with ID: 125
```

#### `sonos_update_alarm`
Update an existing alarm.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `alarmId` (required, string): Alarm ID to update
- `startTime` (optional, string): New start time
- `recurrence` (optional, string): New recurrence pattern
- `enabled` (optional, boolean): Enable/disable alarm
- `volume` (optional, number): New volume level

**Example:**
```json
{
  "name": "sonos_update_alarm",
  "arguments": {
    "deviceId": "192.168.1.100",
    "alarmId": "125",
    "enabled": false
  }
}
```

#### `sonos_delete_alarm`
Delete an alarm.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `alarmId` (required, string): Alarm ID to delete

### State Management

#### `sonos_snapshot`
Take a snapshot of current device state (playback, volume, EQ, group membership).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address

**Response:**
```json
{
  "transportState": "PLAYING",
  "trackUri": "x-file-cifs://...",
  "trackPosition": "0:02:15",
  "playMode": "NORMAL",
  "volume": 35,
  "mute": false,
  "bass": 0,
  "treble": 0,
  "loudness": true,
  "timestamp": 1697234567890
}
```

**Use Case:** Save state before playing an announcement, then restore after.

#### `sonos_restore_snapshot`
Restore a previously saved snapshot.

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address
- `snapshot` (required, string): JSON string of snapshot to restore
- `fade` (optional, boolean): Fade volume up on restore (default: false)

**Example:**
```json
{
  "name": "sonos_restore_snapshot",
  "arguments": {
    "deviceId": "192.168.1.100",
    "snapshot": "{\"transportState\":\"PLAYING\",...}",
    "fade": true
  }
}
```

### Party Mode

#### `sonos_party_mode`
Join all discovered devices to this device's group (party mode).

**Parameters:**
- `deviceId` (required, string): Device UUID or IP address (will become coordinator)

**Example:**
```json
{
  "name": "sonos_party_mode",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

**Response:**
```
Party mode activated! Joined 5 device(s)
```

**Note:** All devices must be discovered via `sonos_discover` first.

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
