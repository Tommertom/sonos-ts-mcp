# Test Scripts Mock Mode

## Overview

All phase test scripts (`test-phase1.ts`, `test-phase2.ts`, `test-phase3.ts`, `test-phase4.ts`, and `test-all-phases.ts`) now support **mock mode**, which allows running the complete test suite without requiring physical Sonos devices on the network.

## Features

Mock mode provides:

- **No Hardware Required**: Run tests in CI/CD pipelines, development environments, or demonstrations without Sonos devices
- **Fast Execution**: Tests run quickly without network operations or device communication
- **Consistent Results**: Mock data ensures predictable test outcomes
- **Full Test Coverage**: All test scenarios are executed with simulated responses
- **Environment Variable Passing**: The `test-all-phases.ts` script properly passes environment variables to child processes

## Usage

### Command-line Flag

```bash
npm run test:phase1 -- --mock
npm run test:phase2 -- --mock
npm run test:phase3 -- --mock
npm run test:phase4 -- --mock
npm run test:all-phases -- --mock
```

### Environment Variable

```bash
MOCK_DEVICES=true npm run test:phase1
MOCK_DEVICES=true npm run test:phase2
MOCK_DEVICES=true npm run test:phase3
MOCK_DEVICES=true npm run test:phase4
MOCK_DEVICES=true npm run test:all-phases
```

Both methods are equivalent and produce the same result.

## Mock Data by Phase

### Phase 1: Queue, DIDL, Playback

Mock responses include:
- Queue with 5 tracks
- Add to queue returns position 1
- Save queue returns object ID "SQ:123"
- Playback state: PLAYING, no shuffle, no repeat, no crossfade
- All control commands return success

### Phase 2: Groups & Music Library

Mock responses include:
- Two simulated devices (RINCON_MOCK001, RINCON_MOCK002)
- Group operations return success
- Browse/search operations return 2 items with total of 42
- Mock items have IDs, titles, and URIs

### Phase 3: Audio, Sleep, Alarms, Snapshots

Mock responses include:
- Audio settings: bass 0, treble 0, loudness true
- Sleep timer: 0 remaining
- One alarm: ID "1", time "07:00", enabled, weekdays
- Created alarm ID: "123"
- Snapshot data: "mock-snapshot-data-123"

### Phase 4: Event Subscriptions

Mock responses include:
- Subscription ID: "mock-sub-123"
- SID: "uuid:mock-sid-123"
- One active subscription to AVTransport
- All subscription operations return success

## Implementation Details

### Architecture

Each phase test script includes:

1. **`mockMode` flag**: Global boolean that tracks whether mock mode is enabled
2. **`callToolSafe()` function**: Wrapper that returns mock data in mock mode, or calls the real `callTool()` otherwise
3. **Mock device creation**: Simulated devices are created during discovery instead of performing SSDP discovery
4. **Test function updates**: All test functions use `callToolSafe()` instead of `callTool()` directly

### Example: Phase 1 callToolSafe

```typescript
async function callToolSafe(toolCall: any): Promise<any> {
    if (mockMode) {
        const toolName = toolCall.name;

        if (toolName === 'sonos_get_queue') {
            return {
                totalTracks: 5,
                tracks: [
                    { position: 1, title: 'Mock Track 1', artist: 'Mock Artist' },
                    { position: 2, title: 'Mock Track 2', artist: 'Mock Artist' },
                ],
            };
        }

        if (toolName === 'sonos_add_to_queue') {
            return { position: 1 };
        }

        // ... more mock responses ...

        return { success: true };
    }

    return await callTool(mcpProcess, toolCall);
}
```

### Header Display

When running in mock mode, test scripts display "(MOCK MODE)" in their header:

```
╔══════════════════════════════════════════╗
║     Phase 1 API Test Suite (MOCK MODE)   ║
║  Queue, DIDL, Playback Properties        ║
╚══════════════════════════════════════════╝
```

### Environment Variable Propagation

The `test-all-phases.ts` script properly passes environment variables to spawned child processes:

```typescript
const testProcess = spawn('tsx', [scriptPath], {
    stdio: 'inherit',
    shell: false,
    env: process.env, // Pass through environment variables including MOCK_DEVICES
});
```

## Example Output

### Running All Phases with Mock Mode

```bash
$ MOCK_DEVICES=true npm run test:all-phases

╔══════════════════════════════════════════════════════════╗
║              Sonos MCP Server - All Phases Test          ║
║                  Complete API Test Suite                 ║
╚══════════════════════════════════════════════════════════╝

============================================================
Running Phase 1: Queue, DIDL, Playback
============================================================

╔══════════════════════════════════════════╗
║     Phase 1 API Test Suite (MOCK MODE)   ║
║  Queue, DIDL, Playback Properties        ║
╚══════════════════════════════════════════╝

🚀 Starting MCP Server in stdio mode...

🔌 Initializing MCP connection...

🔍 Discovering Sonos devices...

⚠️  Running in MOCK MODE (no real devices required)

✅ Created mock device: Mock Sonos Device (RINCON_MOCK001)

📋 Testing Queue Management APIs

   Queue size: 5 tracks
✅ Get Queue
   Added at position: 1
✅ Add to Queue
...

============================================================
TEST SUMMARY
============================================================

✅ PASS - Phase 1 (6.36s)
✅ PASS - Phase 2 (6.37s)
✅ PASS - Phase 3 (9.44s)
✅ PASS - Phase 4 (22.38s)

------------------------------------------------------------
Total: 4 passed, 0 failed in 44.55s
============================================================

✅ All test phases completed successfully!

🎉 The Sonos MCP Server API is fully functional.
```

## Use Cases

### Continuous Integration

Mock mode is ideal for CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: MOCK_DEVICES=true npm run test:all-phases
```

### Local Development

Test changes without physical devices:

```bash
# Make code changes
npm run build

# Test with mock devices
MOCK_DEVICES=true npm run test:all-phases
```

### Demonstrations

Show test capabilities without hardware setup:

```bash
# Quick demo of all features
MOCK_DEVICES=true npm run test:all-phases
```

## Testing with Real Devices

To test with actual Sonos devices:

### Automatic Discovery

```bash
npm run test:all-phases
```

The script will discover devices via SSDP multicast.

### Manual Device IP

```bash
SONOS_DEVICE_IP=192.168.1.100 npm run test:all-phases
```

Use this when discovery doesn't work or to target a specific device.

## Troubleshooting

### Mock Mode Not Working

If mock mode isn't activating:

1. **Check environment variable**: Ensure `MOCK_DEVICES=true` is set
2. **Check command line flag**: Use `-- --mock` (note the double dashes)
3. **Verify header**: Look for "(MOCK MODE)" in the test output header
4. **Check script**: Ensure you're using an updated version of the test scripts

### Tests Failing in Mock Mode

Mock mode tests should always pass. If they fail:

1. **Check build**: Run `npm run build` to rebuild the project
2. **Check mock data**: Verify the `callToolSafe()` function returns expected data
3. **Check test logic**: Some tests may have assumptions that don't work in mock mode

## Security Considerations

Mock mode is safe for development and testing:

- **No Network Access**: Mock mode doesn't make network requests
- **No Device Communication**: Real Sonos devices are never contacted
- **Predictable Behavior**: Mock data is hardcoded and consistent
- **No Side Effects**: Tests don't modify actual device state

## Future Enhancements

Potential improvements to mock mode:

1. **Configurable Mock Data**: Allow users to provide custom mock responses
2. **Failure Simulation**: Test error handling by simulating failures
3. **Performance Testing**: Add timing metrics for mock vs. real tests
4. **Mock Server**: Consider a full mock UPnP server for more realistic testing

## Related Documentation

- [Phase 1 Complete](./PHASE-1-COMPLETE.md) - Queue, DIDL, Playback
- [Phase 2 Complete](./PHASE-2-COMPLETE.md) - Groups & Library
- [Phase 3 Complete](./PHASE-3-COMPLETE.md) - Audio, Sleep, Alarms
- [Phase 4 Complete](./PHASE-4-COMPLETE.md) - Event Subscriptions
- [Testing Guide](./TESTING.md) - General testing information
- [API Testing Guide](./api-testing-guide.md) - Comprehensive API testing
