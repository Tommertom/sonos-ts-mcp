# API Testing Guide

This guide explains how to use the comprehensive API test scripts for the Sonos MCP Server. These scripts test all implemented features across all four phases of development.

## Overview

The test scripts are organized by implementation phase and test all MCP server APIs by:
1. Spawning the MCP server in stdio mode
2. Initializing the MCP connection using the JSON-RPC protocol
3. Discovering Sonos devices on the network
4. Calling various MCP tools to test functionality
5. Validating responses and reporting results

## Test Scripts

### Phase 1: Queue, DIDL, and Playback Properties
**Script**: `scripts/test-phase1.ts`

Tests the following APIs:
- **Queue Management**
  - `sonos_get_queue` - Retrieve queue with DIDL metadata
  - `sonos_add_to_queue` - Add tracks with metadata
  - `sonos_remove_from_queue` - Remove single tracks
  - `sonos_clear_queue` - Clear entire queue
  - `sonos_save_queue` - Save queue as playlist
  - `sonos_play_from_queue` - Play from specific position

- **Playback Properties**
  - `sonos_set_shuffle` - Control shuffle mode
  - `sonos_set_repeat` - Control repeat mode (off/all/one)
  - `sonos_set_crossfade` - Control crossfade
  - `sonos_get_playback_state` - Get all playback properties

- **Enhanced Play URI**
  - `sonos_play_uri` - Play URI with metadata and auto-play

**Run**: `npm run test:phase1`

### Phase 2: Groups & Music Library Browsing
**Script**: `scripts/test-phase2.ts`

Tests the following APIs:
- **Group Management**
  - `sonos_join_group` - Join devices into a group
  - `sonos_unjoin` - Remove device from group

- **Music Library Browsing**
  - `sonos_browse_artists` - Browse all artists
  - `sonos_browse_albums` - Browse all albums
  - `sonos_browse_tracks` - Browse all tracks
  - `sonos_browse_genres` - Browse all genres
  - `sonos_browse_playlists` - Browse Sonos playlists

- **Content Search**
  - `sonos_search_library` - Search library (artists/albums/tracks/genres)
  - `sonos_browse_item` - Browse subcategories (e.g., albums for an artist)

**Run**: `npm run test:phase2`

### Phase 3: Audio, Alarms, and Snapshots
**Script**: `scripts/test-phase3.ts`

Tests the following APIs:
- **Enhanced Audio Controls**
  - `sonos_set_bass` - Set bass level (-10 to +10)
  - `sonos_set_treble` - Set treble level (-10 to +10)
  - `sonos_set_loudness` - Enable/disable loudness compensation
  - `sonos_get_eq` - Get all EQ settings
  - `sonos_set_night_mode` - Night mode (soundbars only)
  - `sonos_set_dialog_mode` - Dialog enhancement (soundbars only)

- **Sleep Timer**
  - `sonos_set_sleep_timer` - Set automatic stop timer
  - `sonos_get_sleep_timer` - Get remaining time
  - `sonos_cancel_sleep_timer` - Cancel timer

- **Alarm Management**
  - `sonos_list_alarms` - List all alarms
  - `sonos_create_alarm` - Create new alarm
  - `sonos_update_alarm` - Update existing alarm
  - `sonos_delete_alarm` - Delete alarm

- **State Snapshots**
  - `sonos_create_snapshot` - Capture current state
  - `sonos_restore_snapshot` - Restore saved state
  - Snapshot restore with fade option

**Run**: `npm run test:phase3`

### Phase 4: UPnP GENA Event Subscriptions
**Script**: `scripts/test-phase4.ts`

Tests the following APIs:
- **Event Subscription**
  - `sonos_subscribe_events` - Subscribe to device events
  - `sonos_list_subscriptions` - List active subscriptions
  - `sonos_unsubscribe_events` - Unsubscribe from specific events
  - `sonos_unsubscribe_all` - Unsubscribe from all device events

- **Event Generation**
  - Triggers various state changes to generate events
  - Validates that events are received and processed
  - Tests automatic subscription renewal

**Run**: `npm run test:phase4`

### All Phases Test Runner
**Script**: `scripts/test-all-phases.ts`

Runs all four phase test suites sequentially and provides a comprehensive summary.

**Run**: `npm run test:all-phases`

## Prerequisites

1. **Build the project** (required before running tests):
   ```bash
   npm run build
   ```

2. **Sonos devices on network**: Ensure at least one Sonos device is powered on and connected to the same network as your test machine.

3. **Network connectivity**: The test scripts use SSDP discovery, which requires multicast to be enabled on your network.

## Running Tests

### Run All Tests
```bash
npm run test:all-phases
```

### Run Individual Phase Tests
```bash
# Phase 1: Queue & Playback
npm run test:phase1

# Phase 2: Groups & Library
npm run test:phase2

# Phase 3: Audio & Alarms
npm run test:phase3

# Phase 4: Events
npm run test:phase4
```

## Test Output

Each test script provides detailed output:

- **✅** Green checkmarks indicate successful tests
- **❌** Red X marks indicate failed tests
- Detailed information about each operation
- Error messages for failures
- Summary statistics at the end

Example output:
```
╔══════════════════════════════════════════╗
║     Phase 1 API Test Suite               ║
║  Queue, DIDL, Playback Properties        ║
╚══════════════════════════════════════════╝

🚀 Starting MCP Server in stdio mode...

🔌 Initializing MCP connection...

🔍 Discovering Sonos devices...

✅ Found 2 device(s)
   Using device: Living Room

📋 Testing Queue Management APIs

✅ Get Queue
   Queue size: 5 tracks
✅ Add to Queue
   Added at position: 6
✅ Remove from Queue
✅ Clear Queue
✅ Save Queue as Playlist
   Saved as: SQ:15

...
```

## How the Tests Work

### 1. Server Spawning
The test utilities spawn the MCP server as a child process using Node.js `child_process.spawn()`:
```typescript
const mcpProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
});
```

### 2. JSON-RPC Communication
Tests communicate with the server using JSON-RPC 2.0 over stdio:
- Requests are sent via `stdin` (newline-delimited JSON)
- Responses are received via `stdout` (newline-delimited JSON)
- Server logs appear on `stderr`

### 3. MCP Protocol
The tests follow the MCP protocol lifecycle:
1. **Initialize**: Send `initialize` request with capabilities
2. **Initialized**: Send `notifications/initialized` notification
3. **List Tools**: Optionally list available tools
4. **Call Tools**: Make tool calls via `tools/call` requests
5. **Cleanup**: Clean shutdown of server and subscriptions

### 4. Test Utilities
Shared utilities in `scripts/test-utils.ts` provide:
- `initializeMcpConnection()` - Initialize MCP protocol
- `discoverDevices()` - Discover Sonos devices
- `callTool()` - Call an MCP tool
- `runTest()` - Run a test with error handling
- `wait()` - Add delays between operations

## Troubleshooting

### No Devices Found
If discovery fails:
1. Ensure Sonos devices are powered on
2. Check network connectivity
3. Verify multicast is enabled on your router
4. Try manually adding a device IP in the test scripts

### Server Startup Failures
If the server fails to start:
1. Ensure the project is built: `npm run build`
2. Check that Node.js version is >= 20.0.0
3. Verify all dependencies are installed: `npm install`

### Test Timeouts
If tests timeout:
1. Check network latency to Sonos devices
2. Ensure devices are responsive (not in standby)
3. Increase timeout values in test scripts if needed

### Event Subscription Issues (Phase 4)
If event tests fail:
1. Ensure the event listener port (default 4000) is available
2. Check firewall settings allow incoming HTTP connections
3. Verify devices can reach your test machine's IP

## Customizing Tests

### Change Test Device
To use a specific device instead of the first discovered:
```typescript
// In test scripts, modify:
deviceId = devices[0].uuid || devices[0].ip;
// To:
deviceId = 'RINCON_XXXXXXXXXXXX01400'; // Your device UUID
```

### Add Custom Tests
Create new test functions following the pattern:
```typescript
async function testCustomFeature(): Promise<void> {
    console.log('\n🎯 Testing Custom Feature\n');

    await runTest('My Custom Test', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_my_tool',
            arguments: { deviceId, param: 'value' },
        });

        if (!result || !result.success) {
            throw new Error('Test failed');
        }

        console.log('   Success!');
    });
}
```

### Change Event Listener Port
Set the environment variable before running Phase 4 tests:
```bash
SONOS_LISTENER_PORT=5000 npm run test:phase4
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Build
  run: npm run build

- name: Run API Tests
  run: npm run test:all-phases
  env:
    # Mock mode for CI without real devices
    SONOS_MOCK_MODE: true
```

## Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Phase Documentation](./PHASE-*-COMPLETE.md)
- [Technical Architecture](./technical-architecture.md)
- [Implementation Guide](./implementation-guide.md)

## Summary

The test scripts provide comprehensive coverage of all Sonos MCP Server APIs:
- ✅ Automated testing of all 50+ MCP tools
- ✅ Organized by implementation phase
- ✅ Real device testing with stdio transport
- ✅ Detailed output and error reporting
- ✅ Easy to run and customize

Use these tests to verify functionality, catch regressions, and ensure the MCP server works correctly with your Sonos devices.
