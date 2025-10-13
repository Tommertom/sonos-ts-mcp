# Phase 4 Implementation Complete! 🎉

## Summary

Phase 4 of the Sonos TypeScript MCP implementation has been successfully completed! This phase implements **UPnP GENA Event Subscriptions**, enabling real-time notifications for device state changes including playback, volume, queue updates, and more.

## Completed Features

### 1. Event Listener HTTP Server ✅

**New Module**: `src/events/event-listener.ts`

- HTTP server that listens for NOTIFY callbacks from Sonos devices
- Parses UPnP event XML (GENA protocol)
- Auto-detects local IP address for callback URLs
- Configurable port (default: 4000, via `SONOS_LISTENER_PORT`)
- Graceful start/stop lifecycle management

**Key Features**:
- Receives NOTIFY requests on `/notify` endpoint
- Extracts Subscription ID (SID) from headers
- Parses XML event properties
- Emits parsed events for further processing

### 2. Subscription Manager ✅

**New Module**: `src/events/subscription-manager.ts`

- Manages complete subscription lifecycle
- Automatic subscription renewal (renews 5 minutes before expiry)
- Tracks all active subscriptions by device and SID
- Event handler registration and dispatching
- Clean unsubscribe and shutdown

**Subscription Operations**:
```typescript
// Subscribe to events
const sid = await manager.subscribe(device, endpoint, options);

// Renew subscription
await manager.renew(device, sid);

// Unsubscribe
await manager.unsubscribe(device, sid);

// Unsubscribe from all device events
await manager.unsubscribeDevice(device);

// Clean shutdown - unsubscribe all
await manager.unsubscribeAll();
```

**Event Handler Registration**:
```typescript
manager.on('PlayState', (event) => {
    console.log(`State changed to: ${event.state}`);
});

manager.on('Volume', (event) => {
    console.log(`Volume: ${event.volume}`);
});

manager.off('PlayState', handler); // Unregister
```

### 3. Event Parser ✅

**New Module**: `src/events/event-parser.ts`

- Parses LastChange XML from UPnP events
- Converts raw XML to typed TypeScript event objects
- Handles multiple event endpoints (AVTransport, RenderingControl, Queue, etc.)
- Extracts DIDL-Lite track metadata
- Maps Sonos states to simplified event types

**Supported Events**:
- `AVTransport` - Transport state, current track, play mode
- `RenderingControl` - Volume, mute, bass, treble, loudness
- `PlayState` - Simplified playing/paused/stopped state
- `Volume` - Volume change events
- `Mute` - Mute state changes
- `CurrentTrack` - Track metadata (title, artist, album, art)
- `QueueChanged` - Queue modification notifications
- `ZoneGroupTopology` - Group membership changes
- `AlarmClock` - Alarm list modifications

### 4. Event Type System ✅

**New Types**: `src/types/events.ts`

Comprehensive TypeScript interfaces for all event types:

```typescript
// Event subscription info
interface EventSubscription {
    sid: SubscriptionId;
    endpoint: string;
    deviceId: string;
    renewAt: Date;
    timeout: number;
}

// Base event structure
interface BaseEventData {
    type: EventType;
    deviceId: string;
    timestamp: Date;
}

// Specific event types
interface PlayStateEvent extends BaseEventData {
    type: 'PlayState';
    state: 'playing' | 'paused' | 'stopped' | 'transitioning';
}

interface VolumeEvent extends BaseEventData {
    type: 'Volume';
    volume: number;
    channel?: string;
}

// ... and many more
```

### 5. Service Integration ✅

**Enhanced**: `src/services/base-service.ts`

All services now support event subscriptions:

```typescript
// Any service can subscribe to events
const avTransport = new AVTransportService(device);
const sid = await avTransport.subscribe();

// Register handlers
avTransport.on('PlayState', (event) => {
    // Handle playback state changes
});

// Unsubscribe
await avTransport.unsubscribe(sid);
```

**Available on All Services**:
- `AVTransportService` - Playback and queue events
- `RenderingControlService` - Volume and audio events
- `ZoneGroupTopologyService` - Group topology events
- `AlarmClockService` - Alarm list events
- `ContentDirectoryService` - Library update events

### 6. MCP Server Tools ✅

**New MCP Tools**: Added to `src/mcp/server.ts`

Phase 4 event subscriptions are now fully exposed through the MCP server API:

#### `sonos_subscribe_events`
Subscribe to real-time events from a Sonos device service.

**Parameters**:
- `deviceId` (string, required): Device UUID or IP address
- `service` (string, required): Service name - `AVTransport`, `RenderingControl`, `Queue`, `ZoneGroupTopology`, or `AlarmClock`
- `timeout` (number, optional): Subscription timeout in seconds (default: 1800 = 30 minutes)

**Returns**: Subscription ID (SID), endpoint, and confirmation message

**Example**:
```typescript
{
  "name": "sonos_subscribe_events",
  "arguments": {
    "deviceId": "192.168.1.100",
    "service": "AVTransport",
    "timeout": 1800
  }
}
```

#### `sonos_unsubscribe_events`
Unsubscribe from a specific event subscription.

**Parameters**:
- `deviceId` (string, required): Device UUID or IP address
- `subscriptionId` (string, required): Subscription ID (SID) from subscribe call

**Example**:
```typescript
{
  "name": "sonos_unsubscribe_events",
  "arguments": {
    "deviceId": "192.168.1.100",
    "subscriptionId": "uuid:..."
  }
}
```

#### `sonos_unsubscribe_all`
Unsubscribe from all event subscriptions for a specific device.

**Parameters**:
- `deviceId` (string, required): Device UUID or IP address

**Example**:
```typescript
{
  "name": "sonos_unsubscribe_all",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

#### `sonos_list_subscriptions`
List all active event subscriptions for a device.

**Parameters**:
- `deviceId` (string, required): Device UUID or IP address

**Returns**: Array of active subscriptions with SID, endpoint, service name, timeout, and renewal time

**Example**:
```typescript
{
  "name": "sonos_list_subscriptions",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

### 7. Test Script ✅

**New Script**: `scripts/test-events.ts`

Manual testing script for event subscriptions:

```bash
# Test with specific device
tsx scripts/test-events.ts 192.168.1.100

# Or discover devices
tsx scripts/test-events.ts
```

**Features**:
- Discovers or uses specified Sonos device
- Subscribes to AVTransport and RenderingControl events
- Displays real-time event notifications
- Graceful shutdown with Ctrl+C

## Technical Architecture

### Event Flow

```
Sonos Device
    ↓ (NOTIFY HTTP request)
EventListener (HTTP Server)
    ↓ (Parse XML)
SubscriptionManager
    ↓ (Parse & emit typed events)
EventParser
    ↓
Event Handlers (user code)
```

### Subscription Lifecycle

1. **Subscribe**: Send SUBSCRIBE request with callback URL
2. **Receive SID**: Sonos device returns Subscription ID
3. **Listen**: HTTP server receives NOTIFY callbacks
4. **Auto-renew**: Subscription renewed 5 minutes before expiry
5. **Unsubscribe**: Send UNSUBSCRIBE request on cleanup

### Project Structure

```
src/
├── events/
│   ├── event-listener.ts       # HTTP server for NOTIFY callbacks
│   ├── subscription-manager.ts # Subscription lifecycle management
│   ├── event-parser.ts         # XML parsing & event typing
│   └── index.ts               # Module exports
├── types/
│   └── events.ts              # Event type definitions
└── services/
    └── base-service.ts        # Event subscription methods

scripts/
└── test-events.ts             # Manual testing script
```

## Usage Examples

### Using MCP Tools (Recommended for MCP Clients)

The easiest way to use Phase 4 event subscriptions is through the MCP server tools:

```typescript
// 1. Subscribe to AVTransport events
const subscribeResult = await callTool({
  name: 'sonos_subscribe_events',
  arguments: {
    deviceId: '192.168.1.100',
    service: 'AVTransport'
  }
});
// Returns: { subscriptionId: 'uuid:...', service: 'AVTransport', ... }

// 2. Subscribe to RenderingControl events
await callTool({
  name: 'sonos_subscribe_events',
  arguments: {
    deviceId: '192.168.1.100',
    service: 'RenderingControl',
    timeout: 3600  // 1 hour
  }
});

// 3. List active subscriptions
const subscriptions = await callTool({
  name: 'sonos_list_subscriptions',
  arguments: {
    deviceId: '192.168.1.100'
  }
});
// Returns: { subscriptions: [...], count: 2 }

// 4. Unsubscribe from specific subscription
await callTool({
  name: 'sonos_unsubscribe_events',
  arguments: {
    deviceId: '192.168.1.100',
    subscriptionId: subscribeResult.subscriptionId
  }
});

// 5. Unsubscribe from all device events
await callTool({
  name: 'sonos_unsubscribe_all',
  arguments: {
    deviceId: '192.168.1.100'
  }
});
```

**Available Services**:
- `AVTransport` - Playback state, track info, queue changes
- `RenderingControl` - Volume, mute, EQ settings
- `Queue` - Queue modifications
- `ZoneGroupTopology` - Group membership changes
- `AlarmClock` - Alarm list updates

### Using TypeScript API Directly

### Basic Event Subscription

```typescript
import { AVTransportService } from './services/av-transport.js';
import { getDefaultManager } from './events/subscription-manager.js';

const device = { ip: '192.168.1.100', port: 1400, uuid: '...' };
const avTransport = new AVTransportService(device);
const manager = getDefaultManager();

// Register event handlers
manager.on('PlayState', (event) => {
    console.log(`Now ${event.state}`);
});

manager.on('CurrentTrack', (event) => {
    console.log(`Playing: ${event.artist} - ${event.title}`);
});

// Subscribe
const sid = await avTransport.subscribe();

// ... listen for events ...

// Cleanup
await manager.unsubscribeAll();
```

### Multiple Service Subscriptions

```typescript
const avTransport = new AVTransportService(device);
const renderingControl = new RenderingControlService(device);

// Subscribe to both
const transportSid = await avTransport.subscribe();
const renderingSid = await renderingControl.subscribe();

// Register specific handlers
manager.on('PlayState', handlePlayStateChange);
manager.on('Volume', handleVolumeChange);
manager.on('Mute', handleMuteChange);
```

### Type-Safe Event Handlers

```typescript
import type { PlayStateEvent, VolumeEvent } from './types/events.js';

// Type-safe handlers
manager.on<PlayStateEvent>('PlayState', (event) => {
    // event.state is properly typed
    if (event.state === 'playing') {
        console.log('Music started!');
    }
});

manager.on<VolumeEvent>('Volume', (event) => {
    // event.volume is number
    console.log(`Volume: ${event.volume}%`);
});
```

## Bug Fixes & Improvements

### Subscription Renewal for Short Timeouts
**Fixed**: Renewal time calculation for subscriptions with timeouts shorter than 5 minutes.

**Issue**: The original implementation calculated renewal time as `timeout - 300 seconds` (5 minutes before expiry). For timeouts shorter than 300 seconds (e.g., 120 seconds for testing), this resulted in negative values, causing immediate or invalid renewal attempts.

**Solution**: Implemented adaptive renewal buffer that uses 50% of the timeout duration or 5 minutes, whichever is smaller:
```typescript
const renewBuffer = Math.min(300, Math.floor(timeout * 0.5));
const renewAt = new Date(Date.now() + (timeout - renewBuffer) * 1000);
```

This ensures:
- Short timeouts (e.g., 120s) renew at 60s (50%)
- Standard timeouts (e.g., 1800s/30min) renew at 1500s (5min before expiry)

### HTTP 412 Error Handling
**Fixed**: Graceful handling of HTTP 412 (Precondition Failed) during unsubscribe operations.

**Issue**: When unsubscribing from events, if the subscription had already expired on the Sonos device side, a HTTP 412 error would be thrown, causing error messages in the logs even though the unsubscribe operation should be considered successful.

**Solution**: Modified the `makeRequest` function to accept a list of valid status codes, and updated the `unsubscribe` method to accept both 200 (success) and 412 (already expired) as valid responses:
```typescript
await makeRequest('UNSUBSCRIBE', url, headers, [200, 412]);
```

This provides cleaner unsubscribe operations without spurious error messages when subscriptions have naturally expired.

## Known Limitations

1. **MCP Tool Integration**: Direct MCP tools for event management not yet implemented
2. **Event Persistence**: Events are not persisted; handlers must be registered each session
3. **Network Requirements**: Event listener must be accessible from Sonos devices
4. **Firewall**: May require opening listening port (default 4000)
5. **Complex Event Parsing**: Some event XMLs may have edge cases not fully handled

## Performance Considerations

1. **HTTP Server**: Single shared HTTP server instance for all subscriptions
2. **Auto-Renewal**: Automatic renewal reduces need for re-subscription
3. **Event Batching**: Some events may arrive in batches from Sonos
4. **Memory Usage**: Each subscription creates a renewal timer

## Breaking Changes

None! Phase 4 is fully backward compatible with Phases 1-3. Event subscriptions are opt-in.

## Testing

### Manual Testing

```bash
# Run the test script
npm run dev -- scripts/test-events.ts 192.168.1.100

# Or with discovery
npm run dev -- scripts/test-events.ts
```

### Integration Testing

Unit tests coming in future iteration. Current implementation verified through:
- Manual testing with real Sonos devices
- TypeScript type checking
- ESLint validation

## Future Enhancements (Phase 5+)

1. **MCP Event Tools**: Direct event subscription/management via MCP protocol
2. **Event Persistence**: Save and replay events
3. **Advanced Filtering**: Filter events by device, type, or custom criteria
4. **Event Aggregation**: Combine multiple events into higher-level notifications
5. **Webhook Support**: Forward events to external HTTP endpoints
6. **Music Service Events**: Events from Spotify, Apple Music integration
7. **Advanced Diagnostics**: Network quality, subscription health monitoring

## API Stability

Phase 4 APIs are considered **beta** and may evolve based on usage:
- EventListener: Stable
- SubscriptionManager: Stable
- EventParser: May be extended with new event types
- Event Types: May add new properties to existing events

## Version

Phase 4 complete - Version 1.4.0

## Contributors

Phase 4 implementation completed by GitHub Copilot on October 13, 2025.

---

**Total Implementation Status:**
- ✅ Phase 1: Core functionality (discovery, playback, volume, transport info)
- ✅ Phase 2: Group management, music library browsing, content directory
- ✅ Phase 3: Audio controls, sleep timer, alarms, snapshot/restore, party mode  
- ✅ Phase 4: Event subscriptions (UPnP GENA real-time notifications)
- 🟡 Phase 5: Music service integration, advanced features (planned)

## Event Type Reference

| Event Type | Description | Properties |
|------------|-------------|------------|
| `AVTransport` | Transport state changes | transportState, currentTrack, playMode, etc. |
| `RenderingControl` | Audio settings changes | volume, mute, bass, treble, loudness |
| `PlayState` | Simplified playback state | state (playing/paused/stopped/transitioning) |
| `Volume` | Volume level changes | volume, channel |
| `Mute` | Mute state changes | mute, channel |
| `CurrentTrack` | Track metadata | title, artist, album, albumArtUri, duration, uri |
| `NextTrack` | Next track info | title, artist, album, etc. |
| `QueueChanged` | Queue modifications | updateId |
| `ZoneGroupTopology` | Group membership | zones array |
| `ZonesChanged` | Simplified zone info | zones with coordinator info |
| `AlarmClock` | Alarm list changes | alarmListVersion |

## Endpoint Reference

| Service | Endpoint | Events |
|---------|----------|--------|
| AVTransport | `/MediaRenderer/AVTransport/Event` | Transport state, track info, queue |
| RenderingControl | `/MediaRenderer/RenderingControl/Event` | Volume, mute, EQ settings |
| GroupRenderingControl | `/MediaRenderer/GroupRenderingControl/Event` | Group audio settings |
| Queue | `/MediaRenderer/Queue/Event` | Queue modifications |
| ZoneGroupTopology | `/ZoneGroupTopology/Event` | Speaker grouping |
| AlarmClock | `/AlarmClock/Event` | Alarm changes |
| ContentDirectory | `/MediaServer/ContentDirectory/Event` | Library updates |
