# Quick Start Guide - Kitchen Sonos Control

## Your Kitchen Sonos Device

**IP Address**: 192.168.178.149  
**Port**: 1400  
**Name**: Kitchen  

## Starting the MCP Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
node dist/index.js
```

## MCP Client Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "sonos": {
      "command": "node",
      "args": ["C:/Users/gruin/code/sonos-ts-mcp/dist/index.js"]
    }
  }
}
```

## Usage Examples

### 1. Add Your Kitchen Device

Since SSDP discovery may not work on your network, manually register the device:

```typescript
sonos_add_device({
  "ip": "192.168.178.149",
  "port": 1400,
  "name": "Kitchen"
})
```

Response:
```
Successfully added Sonos device at 192.168.178.149
```

### 2. List Registered Devices

```typescript
sonos_list_devices()
```

Response:
```json
[
  {
    "uuid": "MANUAL_192_168_178_149",
    "ip": "192.168.178.149",
    "port": 1400,
    "location": "http://192.168.178.149:1400/xml/device_description.xml",
    "name": "Kitchen"
  }
]
```

### 3. Get Current Playback State

```typescript
sonos_get_transport_info({
  "deviceId": "MANUAL_192_168_178_149"
})
```

Response:
```json
{
  "state": "PLAYING",
  "status": "OK",
  "speed": "1"
}
```

### 4. Get Current Track Information

```typescript
sonos_get_position_info({
  "deviceId": "MANUAL_192_168_178_149"
})
```

Response:
```json
{
  "track": {
    "title": "radio2-bb-aac",
    "artist": "",
    "album": "",
    "duration": "0:00:00",
    "uri": "aac://https://icecast.omroep.nl/radio2-bb-aac"
  },
  "position": "0:01:59"
}
```

### 5. Playback Control

#### Play
```typescript
sonos_play({
  "deviceId": "MANUAL_192_168_178_149"
})
```

#### Pause
```typescript
sonos_pause({
  "deviceId": "MANUAL_192_168_178_149"
})
```

#### Stop
```typescript
sonos_stop({
  "deviceId": "MANUAL_192_168_178_149"
})
```

#### Next Track
```typescript
sonos_next({
  "deviceId": "MANUAL_192_168_178_149"
})
```

#### Previous Track
```typescript
sonos_previous({
  "deviceId": "MANUAL_192_168_178_149"
})
```

### 6. Volume Control

#### Set Volume (0-100)
```typescript
sonos_set_volume({
  "deviceId": "MANUAL_192_168_178_149",
  "volume": 25
})
```

#### Get Current Volume
```typescript
sonos_get_volume({
  "deviceId": "MANUAL_192_168_178_149"
})
```

Response:
```json
{
  "volume": 2
}
```

#### Mute/Unmute
```typescript
sonos_set_mute({
  "deviceId": "MANUAL_192_168_178_149",
  "mute": true
})
```

## Device ID Options

You can use either:
- **UUID**: `"MANUAL_192_168_178_149"` (from manual registration)
- **IP Address**: `"192.168.178.149"` (direct IP lookup)

Both work interchangeably in all commands.

## Testing Commands

Quick test commands you can run directly:

```bash
# Test Kitchen device connectivity
npx tsx test-kitchen.ts

# Test manual registration
npx tsx test-manual-registration.ts

# Run comprehensive tests
npx tsx test-comprehensive.ts
```

## Troubleshooting

### Can't Connect to Device
1. Verify Kitchen Sonos is powered on
2. Check you're on same network (192.168.178.x)
3. Ping the device: `ping 192.168.178.149`
4. Test direct connection: `npx tsx test-kitchen.ts`

### SSDP Discovery Not Working
This is normal on Windows networks. Use manual registration:
```typescript
sonos_add_device({
  "ip": "192.168.178.149",
  "name": "Kitchen"
})
```

### Device ID Not Found
Make sure to:
1. Add device first with `sonos_add_device`
2. Use correct UUID or IP in subsequent commands
3. Check device list with `sonos_list_devices`

## Current Kitchen Device Status

As of last test:
- ✅ Reachable at 192.168.178.149
- ✅ Status: PLAYING
- ✅ Current: radio2-bb-aac streaming
- ✅ Volume: 2%
- ✅ Muted: No

Enjoy controlling your Kitchen Sonos! 🎵
