# Automatic Discovery

## Overview

The Sonos MCP Server now features automatic device discovery that runs on startup and periodically to keep the device registry up-to-date with all available Sonos devices on your network.

## How It Works

### Startup Discovery
When the MCP server starts, it immediately initiates a discovery process:
1. Sends SSDP M-SEARCH multicast packets to discover Sonos devices
2. Collects responses from all Sonos devices on the network
3. Fetches detailed device information from each device's description XML
4. Stores devices with complete details in the device registry

### Periodic Discovery
After the initial discovery, the server automatically re-discovers devices every **5 minutes**:
- Helps detect new devices added to the network
- Updates the registry if devices have changed IP addresses
- Ensures the device list remains current
- Preserves existing device details when re-discovering known devices

## Device Details Collected

For each discovered device, the server fetches and stores:
- **UUID**: Unique identifier (e.g., `RINCON_000E58C3897E01400`)
- **IP Address**: Current network IP address
- **Port**: Service port (typically 1400)
- **Name**: Room name or display name
- **Model Name**: Device model (e.g., "Sonos Play:1", "Sonos Beam")
- **Model Number**: Specific model identifier
- **Software Version**: Current firmware version
- **Location**: Device description XML URL

## Configuration

### Discovery Interval
The discovery interval is set to **5 minutes (300,000 ms)** by default. This value is defined in the `SonosMcpServer` class:

```typescript
private readonly DISCOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
```

To change this interval, modify the constant in `/src/mcp/server.ts`.

### Discovery Timeout
Each individual discovery operation has a timeout of **5 seconds (5000 ms)**. This ensures that discovery doesn't hang indefinitely if devices are slow to respond.

## Logging

The server logs discovery events to stderr (visible in MCP client logs):

```
[Auto-Discovery] Starting device discovery...
[Auto-Discovery] Found 3 device(s), total registered: 3
[Auto-Discovery] Periodic discovery started (every 300s)
```

If errors occur during discovery, they are also logged:
```
[Auto-Discovery] Error during discovery: <error details>
[Auto-Discovery] Periodic discovery failed: <error details>
```

## Manual Discovery

Even with automatic discovery enabled, you can still manually trigger discovery using the `sonos_discover` tool:

```json
{
  "name": "sonos_discover",
  "arguments": {
    "timeout": 5000
  }
}
```

Manual discovery will:
- Fetch fresh device information
- Update the device registry with any changes
- Return detailed results about discovered devices

## Device Registry Behavior

### Adding Devices
- New devices are added with all available details
- Devices are indexed by their UUID
- Multiple devices can coexist on the same network

### Updating Devices
- When a device is re-discovered, its network information (IP, port) is updated
- Existing device details (name, model, etc.) are preserved unless new data is available
- This prevents data loss during periodic re-discovery

### Device Lookup
Devices can be looked up by:
- **UUID**: Primary identifier (e.g., `RINCON_000E58C3897E01400`)
- **IP Address**: Useful for manual operations

## Graceful Shutdown

When the server shuts down (SIGINT or SIGTERM), it:
1. Stops the periodic discovery timer
2. Cleans up resources
3. Logs the shutdown event

```
[Shutdown] Received SIGINT, shutting down gracefully...
[Auto-Discovery] Periodic discovery stopped
```

## Troubleshooting

### No Devices Found
If automatic discovery finds no devices:
1. Verify Sonos devices are powered on and connected to the network
2. Check that the server and Sonos devices are on the same network/VLAN
3. Ensure multicast traffic (SSDP) is not blocked by firewall or network configuration
4. Try manual discovery with a longer timeout

### Devices Disappearing
If devices disappear from the registry:
1. Check network connectivity
2. Verify devices haven't been moved to a different network
3. Look for error logs in the console output

### Discovery Taking Too Long
If discovery is slow:
1. The default 5-second timeout should be sufficient for most networks
2. If you have many devices or a complex network, devices may take longer to respond
3. Consider increasing the timeout in manual discovery calls

## Integration with MCP Tools

All MCP tools automatically use the device registry populated by auto-discovery:
- `sonos_list_devices`: Shows all registered devices
- `sonos_play`, `sonos_pause`, etc.: Can use device UUIDs or IPs from the registry
- `sonos_get_state`: Fetches state from registered devices

You don't need to manually discover devices before using other tools—the automatic discovery ensures devices are already available.

## Best Practices

1. **Let Auto-Discovery Run**: Wait a few seconds after server startup for initial discovery to complete
2. **Use Device UUIDs**: Prefer UUIDs over IP addresses for device identification (more stable)
3. **Check Device List**: Use `sonos_list_devices` to see all available devices
4. **Monitor Logs**: Watch stderr output for discovery status and errors
5. **Network Stability**: Ensure your network provides stable IP addresses (DHCP reservations recommended)

## Technical Details

### SSDP Discovery
The server uses SSDP (Simple Service Discovery Protocol) to find Sonos devices:
- **Multicast Address**: 239.255.255.250:1900
- **Search Target**: `urn:schemas-upnp-org:device:ZonePlayer:1`
- **Method**: M-SEARCH HTTP/1.1

### Device Description Parsing
After discovery, the server fetches device details from:
```
http://<device-ip>:1400/xml/device_description.xml
```

The XML contains:
```xml
<root>
  <device>
    <roomName>Living Room</roomName>
    <displayName>Living Room</displayName>
    <modelName>Sonos Play:1</modelName>
    <modelNumber>S1</modelNumber>
    <softwareVersion>73.1-50210</softwareVersion>
    <UDN>uuid:RINCON_000E58C3897E01400</UDN>
  </device>
</root>
```

### Thread Safety
- The device registry is thread-safe for concurrent access
- Discovery operations don't block the main event loop
- Failed discoveries don't crash the server
