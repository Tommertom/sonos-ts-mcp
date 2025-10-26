# Device Name Resolution

The Sonos MCP server now supports intelligent device resolution, allowing you to control devices using human-friendly names instead of UUIDs or IP addresses.

## Overview

When the LLM (Language Learning Model) needs to control a Sonos device, it can now provide the device name directly. The MCP server will automatically resolve the name to the correct device UUID, making interactions more natural and intuitive.

## How It Works

The device resolver accepts three types of identifiers:

1. **Device Names** (e.g., "Kitchen", "Living Room")
   - Case-insensitive matching
   - Supports exact name matches
   - Supports partial name matches when unambiguous

2. **UUIDs** (e.g., "RINCON_000E58C3CA2E01400")
   - Exact UUID matching
   - Used for programmatic access

3. **IP Addresses** (e.g., "192.168.1.100")
   - Direct IP address matching
   - Useful for troubleshooting

## Examples

### Using Device Names

```
User: "Change volume for the Kitchen to 10"
LLM: Calls sonos_set_volume with deviceId="Kitchen", volume=10
Server: Resolves "Kitchen" to RINCON_xxx and sets volume
```

### Case-Insensitive Matching

```
User: "Play music in the LIVING ROOM"
LLM: Calls sonos_play with deviceId="living room"
Server: Resolves to "Living Room" device
```

### Partial Name Matching

```
User: "What's playing in the Kitchen?"
LLM: Calls sonos_get_position_info with deviceId="Kit"
Server: Resolves "Kit" to "Kitchen" (if unambiguous)
```

## Ambiguity Handling

When a name is ambiguous (matches multiple devices), the server provides helpful error messages:

### Example 1: Multiple Exact Matches
If you have two devices named "Kitchen":
```
Error: Multiple devices found with name "Kitchen": 
  - Kitchen (RINCON_xxx)
  - Kitchen (RINCON_yyy)
Please use UUID or IP address instead.
```

### Example 2: Multiple Partial Matches
If you search for "Bed" and have "Bedroom" and "Bedroom 2":
```
Error: Multiple devices found matching "Bed":
  - Bedroom (RINCON_xxx)
  - Bedroom 2 (RINCON_yyy)
Please be more specific.
```

## Resolution Priority

The device resolver uses the following priority order:

1. **Exact UUID match** - Highest priority
2. **IP address match** - Direct network identifier
3. **Exact name match** (case-insensitive) - Precise device name
4. **Partial name match** (case-insensitive) - Fuzzy matching (must be unambiguous)

## Best Practices

### For LLMs

1. **Use descriptive names**: Pass the device name exactly as the user stated it
2. **Handle errors gracefully**: If resolution fails, inform the user about available devices
3. **List devices first**: For first-time users, run `sonos_discover` and `sonos_list_devices` to see available devices

### For Users

1. **Use unique names**: Give each device a distinct, memorable name
2. **Be specific**: If you have multiple similar devices, use more specific identifiers
3. **Discover devices**: Run discovery at least once to populate the device registry

## API Changes

All tools that accept a `deviceId` parameter now support device names:

```typescript
// Before (still supported)
sonos_set_volume({
  deviceId: "RINCON_000E58C3CA2E01400",
  volume: 50
})

// After (new capability)
sonos_set_volume({
  deviceId: "Kitchen",
  volume: 50
})
```

## Tool Schema Updates

All `deviceId` parameters now have updated descriptions:

```json
{
  "deviceId": {
    "type": "string",
    "description": "Device name (e.g., \"Kitchen\"), UUID, or IP address"
  }
}
```

## Error Messages

The device resolver provides informative error messages:

### Device Not Found
```
Device not found: "Garage"

Available devices:
- Kitchen (UUID: RINCON_xxx, IP: 192.168.1.10)
- Living Room (UUID: RINCON_yyy, IP: 192.168.1.11)
- Bedroom (UUID: RINCON_zzz, IP: 192.168.1.12)
```

### No Devices Discovered
```
Device not found: "Kitchen"

Available devices:
(none discovered yet - try running sonos_discover first)
```

### Empty Identifier
```
Device identifier cannot be empty
```

## Implementation Details

The device resolution is implemented in the `DeviceResolver` class:

### Key Methods

- `resolve(identifier: string): SonosDevice` - Main resolution method
- `getDeviceDescription(device: SonosDevice): string` - Get friendly device description
- `listAvailableDevices(): string` - List all available devices

### Internal Flow

```
User Input ("Kitchen")
    ↓
LLM Tool Call (deviceId="Kitchen")
    ↓
DeviceResolver.resolve("Kitchen")
    ↓
1. Try exact UUID match → No match
2. Try IP address match → No match
3. Try exact name match → Found!
    ↓
Return SonosDevice object
    ↓
Execute command on device
```

## Testing

Comprehensive tests ensure reliable device resolution:

- Exact UUID matching
- IP address matching
- Case-insensitive name matching
- Partial name matching
- Ambiguity detection
- Error handling
- Whitespace handling

See `tests/device-resolver.test.ts` for complete test coverage.

## Future Enhancements

Potential improvements for future versions:

1. **Fuzzy matching**: Handle typos and minor variations
2. **Room aliases**: Support multiple names for the same device
3. **Group resolution**: Resolve group names to all members
4. **Context awareness**: Remember last-used device in a conversation
5. **Smart suggestions**: Suggest similar device names when not found
