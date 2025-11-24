# Music Services Documentation

## Overview

The Sonos MCP server provides comprehensive support for browsing and playing content from third-party music services registered with your Sonos system. This includes services like:

- **SomaFM Radio** - Independent internet radio (89 stations discovered in testing)
- **TuneIn** - Internet radio stations from around the world  
- **Spotify** - Music streaming (if configured)
- **Apple Music** - Music streaming (if configured)
- **And 85+ other services** - Any music service registered with your Sonos system

**Note:** Music services that require authentication (DeviceLink, AppLink) will return empty results unless you have authenticated them through the Sonos app. Anonymous services like SomaFM Radio and TuneIn work immediately.

## Architecture

The music service implementation consists of several components:

### 1. Type Definitions (`src/types/music-services.ts`)

Defines TypeScript interfaces for:
- `MusicServiceDescriptor` - Service metadata (ID, name, URI, auth type)
- `MusicServiceItem` - Playable items (tracks, streams, stations)
- `MusicServiceContainer` - Browsable containers (categories, playlists, albums)
- `SMAPIResponse` - API response structure with pagination

### 2. UPnP Service Wrapper (`src/services/music-services.ts`)

`MusicServicesService` extends `BaseService` to interact with the Sonos MusicServices UPnP service:
- `listAvailableServices()` - Discover registered music services
  - Handles HTML entity decoding for service descriptor XML
- `getSessionId()` - Get session ID for authenticated services

**Implementation Notes:**
- Service descriptors are returned HTML-encoded by Sonos (`&lt;Service&gt;` instead of `<Service>`)
- The implementation decodes HTML entities before parsing XML

### 3. SMAPI Client (`src/services/smapi-client.ts`)

`SMAPIClient` handles SOAP communication with music service endpoints (SMAPI 1.1 protocol):
- `getMetadata()` - Browse containers and get item lists
- `search()` - Search for content by keyword
- `getExtendedMetadata()` - Get detailed item information
- `getMediaURI()` - Get playable streaming URI

**Implementation Notes:**
- SOAP requests use proper SMAPI 1.1 format (no `s:encodingStyle` attribute)
- XML parsing handles namespace prefixes (`tns:`, `ns:`, etc.)
- Credentials omitted for anonymous services to avoid SOAP parsing errors

### 4. Service Registry (`src/discovery/music-service-registry.ts`)

`MusicServiceRegistry` caches discovered services for efficient lookup:
- `discoverServices()` - Discover and cache services
- `getServiceByName()` - Lookup by service name
- `getServiceById()` - Lookup by service ID
- `searchServices()` - Search services by partial name

### 5. MCP Tools

Five tools exposed via the MCP protocol:
- `sonos_list_music_services` - List available services
- `sonos_browse_music_service` - Browse service content
- `sonos_search_music_service` - Search for content
- `sonos_play_music_service_item` - Play an item
- `sonos_get_music_service_item_uri` - Get streaming URI

## Usage Examples

### List Available Services

```typescript
// List all music services registered with the Sonos system
const result = await client.callTool('sonos_list_music_services', {
    deviceId: 'Living Room'
});

// Response:
{
    services: [
        { id: 52, name: 'Sonos Radio', type: 'MService', authType: 'Anonymous' },
        { id: 254, name: 'TuneIn', type: 'MService', authType: 'Anonymous' },
        { id: 2311, name: 'Spotify', type: 'MService', authType: 'DeviceLink' }
    ],
    total: 3
}
```

### Browse Sonos Radio

```typescript
// Browse top-level categories
const result = await client.callTool('sonos_browse_music_service', {
    deviceId: 'Living Room',
    serviceName: 'Sonos Radio',
    containerId: 'root'
});

// Response includes containers and items:
{
    serviceName: 'Sonos Radio',
    serviceId: 52,
    containerId: 'root',
    items: [
        {
            id: 'category/live',
            title: 'Live Radio',
            type: 'container',
            canEnumerate: true,
            canPlay: false
        },
        {
            id: 'category/genre/rock',
            title: 'Rock',
            type: 'container',
            canEnumerate: true,
            canPlay: true
        }
    ],
    total: 15
}

// Browse a specific category
const liveStations = await client.callTool('sonos_browse_music_service', {
    deviceId: 'Living Room',
    serviceName: 'Sonos Radio',
    containerId: 'category/live'
});
```

### Search for Content

```typescript
// Search for "BBC Radio 1"
const result = await client.callTool('sonos_search_music_service', {
    deviceId: 'Living Room',
    serviceName: 'TuneIn',
    query: 'BBC Radio 1'
});

// Response:
{
    serviceName: 'TuneIn',
    query: 'BBC Radio 1',
    items: [
        {
            id: 's24939',
            title: 'BBC Radio 1',
            type: 'item',
            itemType: 'station',
            albumArtUri: 'https://cdn-radiotime-logos.tunein.com/s24939q.png'
        }
    ],
    total: 1
}
```

### Play a Radio Station

```typescript
// Play BBC Radio 1 from TuneIn
const result = await client.callTool('sonos_play_music_service_item', {
    deviceId: 'Living Room',
    serviceName: 'TuneIn',
    itemId: 's24939',
    itemTitle: 'BBC Radio 1'
});

// Response:
{
    success: true,
    message: 'Now playing: BBC Radio 1',
    serviceName: 'TuneIn',
    itemId: 's24939',
    uri: 'x-sonosapi-stream:s24939?sid=254&...'
}
```

### Get Streaming URI

```typescript
// Get the actual streaming URL (for debugging)
const result = await client.callTool('sonos_get_music_service_item_uri', {
    deviceId: 'Living Room',
    serviceName: 'TuneIn',
    itemId: 's24939'
});

// Response:
{
    serviceName: 'TuneIn',
    itemId: 's24939',
    uri: 'x-sonosapi-stream:s24939?sid=254&flags=8224&sn=0'
}
```

## AI Agent Workflow

When implementing an AI agent that uses music services, follow this pattern:

### 1. Browse Workflow

```
User: "What's on Sonos Radio?"

Agent Actions:
1. sonos_list_devices() → Get device ID
2. sonos_list_music_services(deviceId) → Confirm "Sonos Radio" is available
3. sonos_browse_music_service(deviceId, "Sonos Radio", "root") → Get top-level categories
4. Present categories to user
```

### 2. Search and Play Workflow

```
User: "Play BBC Radio 1 in the Living Room"

Agent Actions:
1. sonos_list_devices() → Find "Living Room" device
2. sonos_search_music_service("Living Room", "TuneIn", "BBC Radio 1") → Find station
3. sonos_play_music_service_item("Living Room", "TuneIn", itemId, "BBC Radio 1") → Play
```

### 3. Deep Browsing Workflow

```
User: "Browse jazz stations on Sonos Radio"

Agent Actions:
1. sonos_list_devices() → Get device ID
2. sonos_browse_music_service(deviceId, "Sonos Radio", "root") → Get categories
3. Find "Jazz" category ID (e.g., "category/genre/jazz")
4. sonos_browse_music_service(deviceId, "Sonos Radio", "category/genre/jazz") → Get jazz stations
5. Present stations to user
```

## Protocol Details

### SMAPI (Sonos Music API)

Music services communicate using SMAPI, a SOAP-based protocol:

**getMetadata Request:**
```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getMetadata xmlns="http://www.sonos.com/Services/1.1">
            <id>root</id>
            <index>0</index>
            <count>100</count>
        </getMetadata>
    </s:Body>
</s:Envelope>
```

**Response:**
```xml
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getMetadataResponse>
            <getMetadataResult>
                <index>0</index>
                <count>2</count>
                <total>15</total>
                <mediaCollection>
                    <id>category/live</id>
                    <title>Live Radio</title>
                    <itemType>container</itemType>
                </mediaCollection>
            </getMetadataResult>
        </getMetadataResponse>
    </s:Body>
</s:Envelope>
```

### Service Discovery

Services are discovered via the MusicServices UPnP service:
- Action: `ListAvailableServices`
- Returns: XML descriptor list with service metadata
- Cached for 1 hour to reduce load

### Authentication

Services support different auth types:
- **Anonymous** - No authentication (most radio services)
- **DeviceLink** - Device-level authentication (Spotify, Apple Music)
- **UserId** - Username/password authentication
- **AppLink** - App-based authentication

Authenticated services require obtaining a session ID via `getSessionId()`.

## Error Handling

Common error scenarios:

### Service Not Found
```json
{
    "error": "Music service 'XYZ' not found. Use sonos_list_music_services to see available services.",
    "items": [],
    "total": 0
}
```

### Invalid Container ID
```json
{
    "error": "Container not found or empty",
    "items": [],
    "total": 0
}
```

### Playback Failure
```json
{
    "error": "Failed to get media URI for item",
    "itemId": "s12345"
}
```

## Performance Considerations

1. **Service Registry Caching**: Services are cached for 1 hour to avoid repeated UPnP calls
2. **Pagination**: Browse and search support pagination (default: 100 items per page)
3. **Lazy Loading**: Services are only queried when needed
4. **Session Management**: Session IDs are cached per service when authenticated

## Security Considerations

1. **Input Validation**: All service names and item IDs are validated before use
2. **XML Escaping**: User input is properly escaped in SOAP requests
3. **URL Validation**: Service URIs are validated and sanitized
4. **Rate Limiting**: Registry implements discovery interval to prevent abuse

## Testing

See `scripts/test-music-services.ts` for comprehensive testing examples.

## Limitations

1. **Authentication**: Only Anonymous and DeviceLink services are fully supported
2. **Metadata**: Some services may have limited metadata (e.g., no album art)
3. **Search**: Search capabilities vary by service
4. **Session Management**: Session IDs are not persisted across server restarts

## Future Enhancements

Potential improvements documented in `docs/PLAN-SONOS-RADIO-API.md`:
- Session persistence
- Presentation maps for UI customization
- Service-specific search categories
- Favorites management via SMAPI
- Playlist creation and editing
