# Plan: Browsing Sonos Radio Service via API

## Executive Summary

This document outlines a comprehensive plan for implementing Sonos Radio service browsing capabilities in the sonos-ts-mcp project, based on the Python SoCo library implementation and Sonos SMAPI (Sonos Music API) specifications.

## Background Research

### Key Findings from SoCo Implementation

1. **Music Services Architecture**
   - SoCo uses a `MusicService` class that provides access to third-party music services
   - Services are registered with Sonos via the `MusicServices` UPnP service
   - Each service has a unique Service ID (e.g., TuneIn = 254, Spotify = 9)
   - Services communicate via SOAP/HTTP using the SMAPI protocol

2. **Service Discovery**
   - Available services are fetched via `MusicServices.ListAvailableServices()` UPnP call
   - Returns XML with service metadata including:
     - Service ID, Name, Version
     - Service URI and Secure URI
     - Authentication type (Anonymous, DeviceLink, UserId)
     - Capabilities flags
     - Presentation Map URI (for UI customization)
     - Strings URI (for localization)

3. **Authentication Types**
   - **Anonymous**: No auth required (e.g., TuneIn, some radio services)
   - **DeviceLink**: OAuth-style device linking (e.g., Spotify, Apple Music)
   - **UserId**: Username/password authentication (e.g., Deezer)

4. **Sonos Radio Specifics**
   - Sonos Radio is likely a registered music service with its own Service ID
   - Uses SMAPI protocol for browsing and metadata retrieval
   - Requires appropriate authentication (likely DeviceLink or Anonymous)
   - Metadata returned in DIDL-Lite format with service-specific extensions

### SMAPI Protocol Overview

The Sonos Music API (SMAPI) is a SOAP-based web service protocol that music services implement to integrate with Sonos. Key operations:

1. **getMetadata** - Browse containers and retrieve item metadata
2. **search** - Search within a service
3. **getMediaMetadata** - Get detailed metadata for a specific item
4. **getMediaURI** - Get streaming URI for playback
5. **getExtendedMetadata** - Get related items and additional info

## Current Project State

### Existing Capabilities

1. **ContentDirectory Service** (`src/services/content-directory.ts`)
   - Already implements UPnP ContentDirectory browsing
   - Supports browsing local library with object IDs like:
     - `A:ARTIST`, `A:ALBUM`, `A:TRACKS` - Local music library
     - `SQ:` - Sonos playlists
     - `FV:2` - Sonos favorites
     - `R:0/0` - Favorite radio stations (TuneIn-based)
   - Uses DIDL-Lite parser for metadata

2. **Missing Components**
   - No `MusicServices` UPnP service wrapper
   - No SMAPI SOAP client implementation
   - No music service account management
   - No service-specific authentication handling
   - No Sonos Radio specific service integration

## Implementation Plan

### Phase 1: Music Services Infrastructure

#### 1.1 Create MusicServices UPnP Service Wrapper

**File**: `src/services/music-services.ts`

```typescript
export class MusicServicesService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:MusicServices:1';
    }

    protected getControlEndpoint(): string {
        return '/MusicServices/Control';
    }

    // List all available music services
    async listAvailableServices(): Promise<MusicServiceDescriptor[]>

    // Get session ID for authenticated services
    async getSessionId(serviceId: number, username: string): Promise<string>
}
```

**Key Methods**:
- `listAvailableServices()` - Returns array of service descriptors
- `getSessionId()` - Handles authentication for services requiring it

#### 1.2 Define Music Service Data Structures

**File**: `src/types/music-services.ts`

```typescript
export interface MusicServiceDescriptor {
    id: number;                    // Service ID (e.g., 254 for TuneIn)
    name: string;                  // Service name
    version: string;               // API version
    uri: string;                   // Service endpoint
    secureUri: string;             // HTTPS endpoint
    containerType: string;         // Usually "MService"
    capabilities: number;          // Bitfield of capabilities
    authType: 'Anonymous' | 'DeviceLink' | 'UserId';
    pollInterval: number;          // Seconds between polls
    presentationMapUri?: string;   // UI customization
    stringsUri?: string;           // Localization
}

export interface MusicServiceItem {
    id: string;                    // Service-specific item ID
    title: string;
    itemType: 'track' | 'stream' | 'album' | 'artist' | 'playlist' | 'show' | 'station';
    canPlay: boolean;
    canSkip?: boolean;
    canAddToFavorites?: boolean;
    artistId?: string;
    artist?: string;
    albumId?: string;
    album?: string;
    albumArtUri?: string;
    duration?: number;
    uri?: string;                  // Streaming URI
}

export interface MusicServiceContainer {
    id: string;
    title: string;
    itemType: 'container' | 'collection' | 'favorites';
    canEnumerate: boolean;
    canPlay?: boolean;
    canCache?: boolean;
    childCount?: number;
    albumArtUri?: string;
}
```

#### 1.3 Implement SMAPI SOAP Client

**File**: `src/services/smapi-client.ts`

```typescript
export class SMAPIClient {
    constructor(
        private serviceUri: string,
        private serviceId: number,
        private authType: string,
        private sessionId?: string
    ) {}

    // Core SMAPI operations
    async getMetadata(
        id: string,
        index: number = 0,
        count: number = 100,
        recursive: boolean = false
    ): Promise<SMAPIResponse>

    async search(
        category: string,
        term: string,
        index: number = 0,
        count: number = 100
    ): Promise<SMAPIResponse>

    async getMediaMetadata(id: string): Promise<MusicServiceItem>

    async getMediaUri(id: string): Promise<string>

    async getExtendedMetadata(id: string): Promise<any>

    // Build SOAP envelope
    private buildSoapEnvelope(action: string, params: Record<string, any>): string

    // Parse SOAP response
    private parseSoapResponse(response: string): any
}
```

**Authentication Handling**:
- Anonymous services: No special headers
- DeviceLink services: Include `X-Sonos-Token` header with auth token
- Include service ID in `desc` metadata field for DIDL items

### Phase 2: Sonos Radio Service Integration

#### 2.1 Create Sonos Radio Service Class

**File**: `src/services/sonos-radio.ts`

```typescript
export class SonosRadioService {
    private smapiClient: SMAPIClient;
    private serviceDescriptor: MusicServiceDescriptor;

    constructor(device: SonosDevice) {
        // Initialize with Sonos Radio service descriptor
    }

    // Browse root level
    async browseRoot(): Promise<MusicServiceContainer[]>

    // Browse a specific container (e.g., "My Stations", "Genres", "For You")
    async browse(
        containerId: string,
        startIndex: number = 0,
        count: number = 100
    ): Promise<(MusicServiceItem | MusicServiceContainer)[]>

    // Search Sonos Radio
    async search(
        query: string,
        category: 'stations' | 'shows' | 'all',
        startIndex: number = 0,
        count: number = 100
    ): Promise<MusicServiceItem[]>

    // Get station details
    async getStationMetadata(stationId: string): Promise<MusicServiceItem>

    // Get currently playing on a station
    async getNowPlaying(stationId: string): Promise<MusicServiceItem>
}
```

**Key Concepts**:
- Sonos Radio uses hierarchical container structure
- Item IDs are service-specific (e.g., `sonosRadio:station:123`)
- Extended IDs encode service type and account info
- Metadata includes streaming URIs in DIDL-Lite format

#### 2.2 Service Discovery and Registration

**File**: `src/discovery/music-service-registry.ts`

```typescript
export class MusicServiceRegistry {
    private services: Map<number, MusicServiceDescriptor> = new Map();

    // Discover available services from any Sonos device
    async discoverServices(device: SonosDevice): Promise<void>

    // Get service by ID
    getService(serviceId: number): MusicServiceDescriptor | undefined

    // Get service by name
    getServiceByName(name: string): MusicServiceDescriptor | undefined

    // Get all services
    getAllServices(): MusicServiceDescriptor[]

    // Check if service is available
    isServiceAvailable(serviceName: string): boolean
}
```

### Phase 3: MCP Tool Integration

#### 3.1 New MCP Tools

**File**: `src/mcp/schemas/tools/music-service-tools.ts`

```typescript
export const musicServiceTools: Tool[] = [
    {
        name: 'sonos_list_music_services',
        description: 'List all available music services (Sonos Radio, Spotify, etc.)',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address'
                }
            },
            required: ['deviceId']
        }
    },
    {
        name: 'sonos_browse_radio_root',
        description: 'Browse root level of Sonos Radio (categories like "My Stations", "For You", etc.)',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address'
                }
            },
            required: ['deviceId']
        }
    },
    {
        name: 'sonos_browse_radio_category',
        description: 'Browse a specific Sonos Radio category or container',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address'
                },
                categoryId: {
                    type: 'string',
                    description: 'Category/container ID from browse_radio_root'
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
                    default: 0
                },
                count: {
                    type: 'number',
                    description: 'Number of items to return (default: 100)',
                    default: 100
                }
            },
            required: ['deviceId', 'categoryId']
        }
    },
    {
        name: 'sonos_search_radio',
        description: 'Search Sonos Radio for stations, shows, or content',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address'
                },
                query: {
                    type: 'string',
                    description: 'Search query'
                },
                category: {
                    type: 'string',
                    description: 'Search category',
                    enum: ['stations', 'shows', 'all'],
                    default: 'all'
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
                    default: 0
                },
                count: {
                    type: 'number',
                    description: 'Number of items to return (default: 100)',
                    default: 100
                }
            },
            required: ['deviceId', 'query']
        }
    },
    {
        name: 'sonos_play_radio_station',
        description: 'Play a Sonos Radio station by ID',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address'
                },
                stationId: {
                    type: 'string',
                    description: 'Station ID from browse or search results'
                }
            },
            required: ['deviceId', 'stationId']
        }
    }
];
```

#### 3.2 Handler Implementations

**File**: `src/mcp/handlers/music-service-handlers.ts`

```typescript
export async function handleListMusicServices(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>

export async function handleBrowseRadioRoot(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>

export async function handleBrowseRadioCategory(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>

export async function handleSearchRadio(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>

export async function handlePlayRadioStation(
    args: unknown,
    context: ServerContext
): Promise<ToolResponse>
```

### Phase 4: Playing Music Service Content

#### 4.1 Enhance AVTransport Service

**File**: `src/services/av-transport.ts`

Add methods to handle music service URIs:

```typescript
async setAVTransportURIFromMusicService(
    item: MusicServiceItem,
    serviceId: number,
    accountId?: string
): Promise<void> {
    // Build proper URI with service metadata
    const uri = this.buildMusicServiceUri(item.id, serviceId, accountId);
    const metadata = this.buildMusicServiceMetadata(item, serviceId);
    
    await this.setAVTransportURI(uri, metadata);
}

private buildMusicServiceUri(
    itemId: string,
    serviceId: number,
    accountId?: string
): string {
    // Format: x-sonosapi-radio:stationId?sid=serviceId&sn=accountSerial
    // or: x-sonos-http:trackId.mp3?sid=serviceId&flags=...
}

private buildMusicServiceMetadata(
    item: MusicServiceItem,
    serviceId: number
): string {
    // Build DIDL-Lite XML with service descriptor
    // Include <desc> tag with service auth info
}
```

#### 4.2 Service-Specific URI Formats

Based on SoCo research, URIs follow these patterns:

- **Radio Streams**: `x-sonosapi-radio:stationId?sid=254&sn=0`
- **On-Demand Tracks**: `x-sonos-http:trackId.mp3?sid=9&flags=8224&sn=1`
- **HLS Streams**: `x-sonosapi-hls:stationId?sid=254`
- **Smart Radio**: `x-sonosapi-stream:stationId?sid=254`

The `sid` parameter is the Service ID, `sn` is the account serial number.

## Technical Challenges and Solutions

### Challenge 1: Service Authentication

**Problem**: DeviceLink services require OAuth-style authentication tokens.

**Solution**:
1. Phase 1: Support Anonymous services only (TuneIn, some radio)
2. Phase 2: Implement account management system
3. Fetch accounts from `/status/accounts` endpoint
4. Store account tokens securely in server context
5. Include `X-Sonos-Token` header in SMAPI requests

### Challenge 2: Service ID Discovery

**Problem**: Need to know Sonos Radio's Service ID.

**Solution**:
1. Query `MusicServices.ListAvailableServices()`
2. Parse XML response to find service by name
3. Cache service descriptors for performance
4. Handle service ID changes between Sonos firmware versions

### Challenge 3: DIDL Metadata Complexity

**Problem**: Music service items require complex DIDL metadata with service descriptors.

**Solution**:
1. Extend existing DIDL serializer to support `<desc>` tags
2. Include service descriptor in metadata: `SA_RINCON{serviceType}_`
3. Use proper UPnP classes: `object.item.audioItem.audioBroadcast` for radio
4. Include extended IDs that encode service type and account

### Challenge 4: Session Management

**Problem**: Some services require session IDs that expire.

**Solution**:
1. Implement session cache with expiration tracking
2. Automatically renew sessions on 401/403 errors
3. Handle re-authentication flow for expired tokens
4. Store session state in server context for persistence

## Implementation Roadmap

### Sprint 1: Foundation (Week 1)
- [ ] Create `MusicServicesService` UPnP wrapper
- [ ] Implement `listAvailableServices()` 
- [ ] Define TypeScript interfaces for service descriptors
- [ ] Create `MusicServiceRegistry` for service discovery
- [ ] Write unit tests for service discovery

### Sprint 2: SMAPI Client (Week 2)
- [ ] Implement `SMAPIClient` base class
- [ ] Add SOAP envelope building
- [ ] Add SOAP response parsing
- [ ] Implement `getMetadata()` operation
- [ ] Implement `search()` operation
- [ ] Write integration tests with mock SMAPI server

### Sprint 3: Sonos Radio Integration (Week 3)
- [ ] Create `SonosRadioService` class
- [ ] Implement `browseRoot()` method
- [ ] Implement `browse()` method for containers
- [ ] Implement `search()` method
- [ ] Parse Sonos Radio specific metadata
- [ ] Test with real Sonos Radio service (if available)

### Sprint 4: Playback Support (Week 4)
- [ ] Enhance `AVTransportService` for music services
- [ ] Implement URI building for different stream types
- [ ] Implement DIDL metadata generation with service descriptors
- [ ] Add `setAVTransportURIFromMusicService()` method
- [ ] Test playback of radio stations

### Sprint 5: MCP Tools (Week 5)
- [ ] Define MCP tool schemas
- [ ] Implement handler functions
- [ ] Register tools in router
- [ ] Update documentation
- [ ] Create example scripts in `scripts/` folder
- [ ] Test with Mastra agent CLI

### Sprint 6: Testing & Documentation (Week 6)
- [ ] Write comprehensive unit tests
- [ ] Write integration tests
- [ ] Create user documentation
- [ ] Create API reference documentation
- [ ] Add example usage scenarios
- [ ] Performance testing and optimization

## Testing Strategy

### Unit Tests
- Service descriptor parsing
- SOAP envelope construction
- SMAPI response parsing
- URI building logic
- Metadata serialization

### Integration Tests
- Service discovery from real Sonos device
- SMAPI calls to TuneIn (Anonymous service)
- Browse operations
- Search operations
- Playback of radio streams

### End-to-End Tests
- Complete workflow: discover → browse → search → play
- Multi-service scenarios
- Error handling and recovery
- Session management and renewal

## Security Considerations

1. **Token Storage**: Never log or expose authentication tokens
2. **HTTPS**: Use secure URIs when available
3. **Input Validation**: Sanitize all user inputs before SOAP calls
4. **Rate Limiting**: Respect service poll intervals
5. **Account Privacy**: Don't expose account serial numbers in responses

## Performance Optimizations

1. **Service Caching**: Cache service descriptors (refresh every 24h)
2. **Session Pooling**: Reuse sessions across requests
3. **Batch Operations**: Support batch metadata fetches when possible
4. **Lazy Loading**: Only fetch metadata when needed
5. **Pagination**: Always support pagination for large result sets

## Future Enhancements

1. **Additional Services**:
   - Spotify integration
   - Apple Music integration
   - Amazon Music integration
   - Deezer, Tidal, etc.

2. **Advanced Features**:
   - Playlist creation/management
   - Favorites management (add/remove)
   - Recently played tracking
   - Recommendations API
   - Lyrics fetching

3. **Authentication**:
   - OAuth flow for DeviceLink services
   - Account linking UI
   - Multi-account support
   - Token refresh automation

## References

### SoCo Python Library
- Repository: https://github.com/SoCo/SoCo
- Music Services: `soco/music_services/music_service.py`
- SMAPI Client: `soco/music_services/music_service.py` (MusicServiceSoapClient)
- Data Structures: `soco/music_services/data_structures.py`
- Examples: `examples/commandline/tunein.py`

### Sonos SMAPI Documentation
- Music Partners API: http://musicpartners.sonos.com/
- SMAPI Specification: http://musicpartners.sonos.com/node/81
- getMetadata: http://musicpartners.sonos.com/node/83
- search: http://musicpartners.sonos.com/node/86

### UPnP Standards
- ContentDirectory Service
- MusicServices Service (Sonos-specific)
- DIDL-Lite metadata format

## Conclusion

This plan provides a comprehensive roadmap for implementing Sonos Radio service browsing and playback in the sonos-ts-mcp project. The approach follows proven patterns from the SoCo library while adapting to TypeScript and the MCP server architecture. The phased implementation allows for incremental development and testing, starting with anonymous services and progressing to authenticated services as needed.

The key to success is building solid foundational infrastructure (MusicServices UPnP wrapper, SMAPI client) before tackling service-specific integration. This approach will make it easier to add support for additional music services in the future beyond just Sonos Radio.
