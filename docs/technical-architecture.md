# Technical Architecture - Sonos TypeScript MCP Server

## Overview

The Sonos TypeScript MCP Server is a Model Context Protocol server that enables AI assistants and automation tools to discover and control Sonos audio devices on a local network. It implements a complete UPnP/SOAP client from scratch without relying on third-party Sonos libraries.

## Architecture Layers

### 1. Discovery Layer (`src/discovery/`)

**SSDP Client** (`ssdp-client.ts`)
- Implements Simple Service Discovery Protocol (SSDP) over UDP multicast
- Sends M-SEARCH requests to `239.255.255.250:1900`
- Searches for `urn:schemas-upnp-org:device:ZonePlayer:1`
- Parses HTTP-like response headers from discovered devices
- Emits device discovery events

**Device Registry** (`device-registry.ts`)
- Maintains an in-memory cache of discovered devices
- Indexes devices by UUID and IP address
- Provides lookup methods for device retrieval
- Handles device metadata extraction from discovery responses

### 2. Transport Layer (`src/soap/`)

**SOAP Client** (`client.ts`)
- Constructs and sends SOAP HTTP POST requests
- Builds XML envelopes conforming to UPnP specifications
- Handles HTTP transport to `http://{ip}:1400/...`
- Parses error responses and extracts UPnP error codes

**Request Builder** (`request-builder.ts`)
- Generates XML request bodies from parameter objects
- Handles type conversion (boolean → "1"/"0" for Sonos)
- Escapes XML special characters
- Constructs DIDL-Lite metadata for track information

**Response Parser** (`response-parser.ts`)
- Extracts values from XML responses using regex
- Handles nested and escaped XML content
- Provides XML escape/unescape utilities
- Converts Sonos boolean format to JavaScript booleans

### 3. Service Layer (`src/services/`)

Implements Sonos UPnP services as TypeScript classes:

**Base Service** (`base-service.ts`)
- Abstract base class for all service implementations
- Provides common SOAP action invocation logic
- Manages device reference and SOAP client

**AVTransport Service** (`av-transport.ts`)
- Controls playback: play, pause, stop, next, previous
- Manages queue: add/remove tracks, clear queue
- Seek operations: by track number or time
- Retrieves transport state and position info
- Sets play mode (normal, shuffle, repeat)

**Rendering Control Service** (`rendering-control.ts`)
- Volume control: get/set volume (0-100)
- Mute/unmute functionality
- EQ controls: bass and treble (-10 to +10)
- Channel-specific operations (Master, LF, RF)

**Zone Group Topology Service** (`zone-topology.ts`)
- Queries zone group configuration
- Identifies coordinators and group members
- Parses complex XML zone state information

### 4. MCP Integration Layer (`src/mcp/`)

**MCP Server** (`server.ts`)
- Implements Model Context Protocol server interface
- Registers and handles tool invocations
- Maintains device registry
- Translates between MCP tool calls and Sonos service actions
- Returns results in MCP-compatible format

### 5. Type System (`src/types/`)

**TypeScript Interfaces** (`sonos.ts`)
- `SonosDevice`: Device metadata and connection info
- `SonosDiscoveryResponse`: SSDP response structure
- `SonosPlaybackState`: Current playback status and track info
- `SonosZoneGroup`: Group topology representation
- `SonosError`: Enhanced error type with UPnP codes

## Communication Flow

### Discovery Flow
```
User/AI → MCP Tool Call (sonos_discover)
  ↓
MCP Server → SSDP Client
  ↓
UDP Multicast → 239.255.255.250:1900
  ↓
Sonos Devices → UDP Responses
  ↓
SSDP Client → Parse Responses
  ↓
Device Registry → Cache Devices
  ↓
MCP Server → Return Device List
```

### Control Flow
```
User/AI → MCP Tool Call (sonos_play)
  ↓
MCP Server → Lookup Device
  ↓
AVTransport Service → Build SOAP Request
  ↓
SOAP Client → HTTP POST to http://{ip}:1400/MediaRenderer/AVTransport/Control
  ↓
Sonos Device → Execute Command
  ↓
SOAP Response → Parse XML
  ↓
MCP Server → Return Success/Error
```

## Protocol Details

### SSDP Discovery Message
```
M-SEARCH * HTTP/1.1
HOST: 239.255.255.250:1900
MAN: "ssdp:discover"
MX: 1
ST: urn:schemas-upnp-org:device:ZonePlayer:1
```

### SOAP Request Example (Play)
```xml
POST /MediaRenderer/AVTransport/Control HTTP/1.1
Host: 192.168.1.100:1400
SOAPAction: "urn:schemas-upnp-org:service:AVTransport:1#Play"
Content-Type: text/xml; charset="utf-8"

<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" 
            s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
      <InstanceID>0</InstanceID>
      <Speed>1</Speed>
    </u:Play>
  </s:Body>
</s:Envelope>
```

### SOAP Response Example
```xml
<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" 
            s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:PlayResponse xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">
    </u:PlayResponse>
  </s:Body>
</s:Envelope>
```

## Security Considerations

### Input Validation
- All device IDs are validated before lookup
- Volume levels are clamped to valid ranges (0-100)
- EQ values are clamped to valid ranges (-10 to +10)
- XML content is properly escaped to prevent injection

### Network Security
- Communication is local network only (no internet exposure)
- No authentication required (relies on network segmentation)
- All HTTP traffic is unencrypted (Sonos design constraint)
- SSDP multicast limited to local subnet

### Error Handling
- All SOAP errors include UPnP error codes
- Network failures return graceful error messages
- Device not found errors are explicit
- Timeout handling for discovery operations

## Performance Characteristics

### Discovery
- Typical discovery time: 2-5 seconds
- Default timeout: 5 seconds (configurable)
- Multicast TTL: 4 hops
- No persistent connections required

### Control Operations
- Average response time: 50-200ms
- Single HTTP request per operation
- No connection pooling required
- Stateless operation model

## Testing Strategy

### Unit Tests
- XML parsing and generation
- Device registry operations
- Request building
- Response parsing

### Integration Tests
- SSDP discovery (requires network)
- SOAP operations (requires real devices)
- End-to-end MCP tool invocations

## Deployment

### Prerequisites
- Node.js 20+
- Network access to Sonos devices (same subnet)
- UDP multicast enabled on network

### Configuration
- No configuration files required
- Discovery timeout can be adjusted via tool parameters
- Device registry maintained in memory (no persistence)

## Future Enhancements

### Potential Additions
1. **Event Subscriptions**: Subscribe to device state changes via UPnP eventing
2. **Group Management**: Join/unjoin speakers, create groups
3. **Queue Management**: Advanced queue manipulation (reorder, save playlists)
4. **Favorites**: Access and play Sonos favorites
5. **Search**: Browse music library and streaming services
6. **Persistent Cache**: Save discovered devices between sessions
7. **WebSocket Transport**: Alternative to stdio for MCP communication

### Performance Improvements
1. Connection pooling for HTTP requests
2. Caching of frequently accessed device info
3. Parallel discovery requests
4. Response streaming for large datasets

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/)
- [UPnP Device Architecture](https://openconnectivity.org/developer/specifications/upnp-resources/upnp/)
- [Sonos API Documentation](https://sonos.svrooij.io/)
- [SSDP Specification](https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol)
