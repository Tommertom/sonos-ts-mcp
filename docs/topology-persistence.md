# Device Topology Persistence

## Overview

The Sonos MCP Server now persists discovered device topology to disk, ensuring that device information is retained across server restarts. This eliminates the need to rediscover devices every time the server starts.

## How It Works

### Storage Location

Device topology is stored in:
```
mcp_data/sonos_topology.json
```

This file is automatically created in the project root directory and is excluded from version control via `.gitignore`.

### Data Structure

The topology file uses the following JSON format:

```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-24T07:51:40.519Z",
  "devices": [
    {
      "uuid": "RINCON_000E58C3897E01400",
      "ip": "192.168.1.100",
      "port": 1400,
      "location": "http://192.168.1.100:1400/xml/device_description.xml",
      "name": "Living Room",
      "modelName": "Sonos One",
      "modelNumber": "S18",
      "softwareVersion": "77.2-51250"
    }
  ]
}
```

### Lifecycle

#### Server Startup
1. The server initializes the `DeviceRegistry`
2. `loadPersistedDevices()` is called to load devices from the JSON file
3. Loaded devices are immediately available in the registry
4. If no file exists or loading fails, the server continues with an empty registry

#### Device Discovery
Every time a discovery operation completes (automatic or manual), the topology is saved:

- **Automatic Discovery**: Runs on server startup and every 5 minutes
- **Manual Discovery**: Via `sonos_discover` tool
- **Manual Device Addition**: Via `sonos_add_device` tool

After any of these operations, `saveTopology()` is called to persist the current device list.

#### Server Shutdown
The topology remains on disk for the next server start.

## Benefits

1. **Faster Startup**: Devices are immediately available without waiting for SSDP discovery
2. **Network Resilience**: Works even if multicast discovery is blocked or fails
3. **Consistent State**: Device names and metadata persist across sessions
4. **Offline Access**: Device information available even when devices are temporarily offline

## Implementation Details

### Key Components

#### `TopologyPersistence` Class
Located in `src/discovery/topology-persistence.ts`

**Methods:**
- `load()`: Loads devices from JSON file
- `save(devices)`: Saves devices to JSON file
- `ensureDirectoryExists()`: Creates the `mcp_data` directory if needed
- `getPersistencePath()`: Returns the full path to the topology file

#### `DeviceRegistry` Updates
Located in `src/discovery/device-registry.ts`

**New Methods:**
- `loadPersistedDevices()`: Loads and registers devices from persistence
- `saveTopology()`: Saves current device list to persistence
- `getPersistencePath()`: Exposes the persistence file path

**Constructor Changes:**
- Now accepts an optional `persistencePath` parameter for testing
- Creates a `TopologyPersistence` instance

#### `ServerContext` Updates
Located in `src/mcp/context.ts`

**New Methods:**
- `initialize()`: Loads persisted devices on context creation

**Modified Methods:**
- `performAutoDiscovery()`: Now saves topology after each discovery run

### Error Handling

The persistence layer is designed to be resilient:

- **Missing File**: If the topology file doesn't exist, returns an empty device list
- **Corrupt File**: Logs error and returns empty device list
- **Permission Errors**: Logs error and continues operation
- **Directory Creation**: Automatically creates the `mcp_data` directory

All errors are logged to stderr but do not prevent server operation.

## Testing

### Manual Testing

1. Start the server and run discovery:
   ```bash
   npm run build
   node dist/index.js
   ```

2. Check that `mcp_data/sonos_topology.json` is created after discovery

3. Restart the server and verify devices are loaded:
   ```
   [ServerContext] Loaded 3 persisted device(s)
   ```

4. Inspect the JSON file:
   ```bash
   cat mcp_data/sonos_topology.json
   ```

### Programmatic Testing

The `DeviceRegistry` constructor accepts an optional `persistencePath` parameter for testing with custom locations:

```typescript
const registry = new DeviceRegistry('/tmp/test-topology.json');
await registry.loadPersistedDevices();
await registry.saveTopology();
```

## Migration Notes

### Existing Installations

No migration is needed. When the server starts with this feature:

1. The `mcp_data` directory is created automatically
2. First discovery will create the topology file
3. Subsequent starts will load from the file

### Manual File Management

The topology file can be safely:
- **Deleted**: Server will recreate it on next discovery
- **Edited**: Manually add/remove devices (use valid JSON format)
- **Backed Up**: Copy the file to preserve device configuration

### Security Considerations

The topology file contains:
- Local IP addresses of Sonos devices
- Device UUIDs and names
- Network location URLs

This information is local-network specific and contains no authentication credentials. However, it does reveal your network topology.

## Troubleshooting

### File Not Created

If `mcp_data/sonos_topology.json` is not created:
1. Check server logs for permission errors
2. Verify the server has write access to its directory
3. Ensure discovery has run at least once

### Devices Not Loading

If devices aren't loaded on startup:
1. Check the JSON file format is valid
2. Look for error messages in server logs
3. Delete the file and let the server recreate it

### Stale Device Information

If devices have incorrect IPs or metadata:
1. Run `sonos_discover` to refresh the topology
2. The next discovery will update the persisted data
3. Restart the server to load fresh data

## Future Enhancements

Potential improvements to the persistence system:

- **Versioned Schemas**: Support for migrating between topology file versions
- **Device Expiry**: Remove devices that haven't been seen in X days
- **Metadata Caching**: Store additional device metadata
- **Multiple Profiles**: Support for different network environments
- **Encryption**: Optional encryption of the topology file
