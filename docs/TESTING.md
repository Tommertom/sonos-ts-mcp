# Testing Guide

This document describes how to run the various test scripts in this project.

## Unit Tests

Run the automated unit tests with:

```bash
npm test
```

This runs all unit tests in the `tests/` directory using Vitest. These tests do not require actual Sonos hardware.

## Integration Tests

The integration test scripts in the `scripts/` folder test the MCP server against real Sonos devices.

### Device Discovery Test

Test if Sonos devices can be discovered on your network:

```bash
npm run test:discovery
```

### Phase Tests

Test specific functionality phases:

```bash
# Phase 1: Core functionality, queue management, playback
npm run test:phase1

# Phase 2: Group management, music library browsing
npm run test:phase2

# Phase 3: Audio controls, alarms, snapshots
npm run test:phase3

# Phase 4: Event subscriptions
npm run test:phase4

# Run all phase tests
npm run test:all-phases
```

### Manual Device Registration

If device discovery doesn't work (e.g., in CI/CD environments or restricted networks), you can specify a device IP manually:

```bash
# Test with a specific device IP
SONOS_DEVICE_IP=192.168.1.100 npm run test:phase3
```

This works for all phase test scripts (test:phase1, test:phase2, test:phase3, test:phase4).

### Requirements

- **Unit tests**: No special requirements
- **Integration tests**: 
  - Require at least one Sonos device on the network
  - Device must be accessible from the machine running the tests
  - Network must allow SSDP multicast (for device discovery) or manual IP specification

## Troubleshooting

### "No Sonos devices found"

If you see this error:
1. Ensure your Sonos devices are powered on and connected to the network
2. Check that your machine is on the same network as the Sonos devices
3. Try using manual device registration: `SONOS_DEVICE_IP=<your-device-ip> npm run test:phase3`

### Test failures with mock/unreachable devices

The integration tests are designed to test against real hardware. If you run them with a non-existent device IP (for testing purposes), tests that require device communication will fail with connection errors. This is expected behavior.

### Network permissions

Some networks may block SSDP multicast traffic (port 1900 UDP). In such cases, use manual device registration instead of relying on automatic discovery.

## Test Coverage

Current test statistics:
- **Unit tests**: 70 tests (8 test files)
- **Integration tests**: 4 phase test scripts
- Coverage includes:
  - Core playback controls
  - Queue management
  - Group/zone management  
  - Music library browsing
  - Audio EQ and enhancements
  - Sleep timer
  - Alarm management
  - Snapshot/restore
  - Event subscriptions

For detailed test results, see the [CHANGELOG.md](../CHANGELOG.md).
