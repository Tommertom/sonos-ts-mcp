# Phase 2 Test Script Mock Mode

## Overview

The `test-phase2.ts` script has been enhanced to support a **mock mode** that allows running the test suite without physical Sonos devices. This is particularly useful for:

- CI/CD pipelines where hardware is not available
- Development environments without Sonos devices
- Testing the test infrastructure itself
- Demonstrating the test flow to new developers

## Features

### Improved Error Handling

When no Sonos devices are found on the network, the script now provides helpful guidance:

```
⚠️  No Sonos devices found on the network.

To run this test, you need:
  1. At least one Sonos device powered on
  2. This computer on the same network as the Sonos devices
  3. Multicast enabled on your network

Alternatively, run in mock mode to test without real devices:
  npm run test:phase2 -- --mock
  OR
  MOCK_DEVICES=true npm run test:phase2
```

### Mock Mode Operation

In mock mode, the script:
- Creates two simulated Sonos devices with realistic UUIDs and IPs
- Returns mock data for all API calls (browse, search, group management)
- Validates the complete test flow without requiring network operations
- Displays all expected test output with success indicators

## Usage

### Command-line Flag

```bash
npm run test:phase2 -- --mock
```

### Environment Variable

```bash
MOCK_DEVICES=true npm run test:phase2
```

Both methods are equivalent and produce the same result.

## Example Output

### Without Mock Mode (No Devices)

```
╔══════════════════════════════════════════╗
║     Phase 2 API Test Suite               ║
║  Groups & Music Library Browsing         ║
╚══════════════════════════════════════════╝

🚀 Starting MCP Server in stdio mode...

🔌 Initializing MCP connection...

🔍 Discovering Sonos devices...

⚠️  No Sonos devices found on the network.
...helpful guidance displayed...

❌ Test suite failed: Error: No Sonos devices found...
```

### With Mock Mode

```
╔══════════════════════════════════════════╗
║     Phase 2 API Test Suite (MOCK MODE)   ║
║  Groups & Music Library Browsing         ║
╚══════════════════════════════════════════╝

🚀 Starting MCP Server in stdio mode...

🔌 Initializing MCP connection...

🔍 Discovering Sonos devices...

⚠️  Running in MOCK MODE (no real devices required)

✅ Created 2 mock device(s):
   1. Mock Sonos Device 1 (RINCON_MOCK001)
   2. Mock Sonos Device 2 (RINCON_MOCK002)

👥 Testing Group Management APIs

   Mock Sonos Device 2 joined Mock Sonos Device 1's group
✅ Join Group
   Mock Sonos Device 2 is now standalone
✅ Unjoin from Group

📚 Testing Music Library Browsing APIs

   Found 42 artists
   First artist: Mock Item 1
✅ Browse Artists
...all tests pass...

╔══════════════════════════════════════════╗
║      Phase 2 Tests Complete!             ║
╚══════════════════════════════════════════╝
```

## Implementation Details

### Mock Device Generation

Mock devices are created with realistic properties:
```typescript
{
    uuid: 'RINCON_MOCK001',
    ip: '192.168.1.100',
    name: 'Mock Sonos Device 1',
    model: 'Mock Model',
}
```

### Mock API Responses

The `callToolSafe` helper function intercepts API calls in mock mode:
- Group management operations return `{ success: true }`
- Browse/search operations return mock items with titles, IDs, and URIs
- Total counts are set to 42 for demonstration purposes

### Test Flow Validation

Even in mock mode, the script:
- Validates response structure
- Checks for required fields (items, total, returned)
- Executes all test logic paths
- Provides the same output format as real tests

## Benefits

1. **Accessibility**: Developers without Sonos hardware can run tests
2. **Speed**: Mock tests run faster without network delays
3. **Reliability**: No dependency on network conditions or device availability
4. **CI/CD Ready**: Can be integrated into automated pipelines
5. **Documentation**: Serves as a living example of test output

## Limitations

Mock mode:
- Does not test actual network communication
- Does not validate real Sonos device responses
- Cannot detect integration issues with physical hardware
- Should complement, not replace, testing with real devices

## Future Enhancements

Potential improvements for mock mode:
- Mock mode for other phase tests (Phase 1, 3, 4)
- Configurable mock data scenarios
- Mock error conditions for negative testing
- Snapshot testing of mock responses
