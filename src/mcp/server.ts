import { setInterval, clearInterval } from 'node:timers';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    type CallToolRequest,
    type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { SsdpClient } from '../discovery/ssdp-client.js';
import { DeviceRegistry } from '../discovery/device-registry.js';
import { DeviceResolver } from './device-resolver.js';
import { AVTransportService } from '../services/av-transport.js';
import { RenderingControlService } from '../services/rendering-control.js';
import { ZoneGroupTopologyService } from '../services/zone-topology.js';
import { ContentDirectoryService } from '../services/content-directory.js';
import { AlarmClockService } from '../services/alarm-clock.js';
import { SnapshotService } from '../services/snapshot.js';
import { SoapClient } from '../soap/client.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { DidlObject } from '../didl/didl-object.js';
import { getDefaultManager } from '../events/subscription-manager.js';
import type { SonosDevice } from '../types/sonos.js';

export class SonosMcpServer {
    private server: Server;
    private registry: DeviceRegistry;
    private resolver: DeviceResolver;
    private discoveryInterval: NodeJS.Timeout | null = null;
    private readonly DISCOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.server = new Server(
            {
                name: 'sonos-mcp-server',
                version: '1.3.0',
                description: `Sonos Multi-Room Audio Control Server. Specifically designed for coding agents and AI-driven home audio automation workflows. Provides comprehensive tools for discovering, controlling, and automating Sonos wireless speaker systems. Enables coding agents to build intelligent multi-room audio experiences, music library management, zone grouping, queue management, and integration with smart home platforms. Supports network discovery, real-time playback control, volume management, EQ settings, alarms, sleep timers, group coordination, and event subscriptions for building responsive audio applications.

All tools require a deviceId parameter which can be:
- Device name (e.g., "Kitchen", "Living Room") - most user-friendly
- Device UUID (e.g., "RINCON_xxxxx") - most reliable
- IP address (e.g., "192.168.1.100") - direct access

Always start with sonos_discover or sonos_list_devices to find available devices before controlling them.`,
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        console.error('Sonos MCP Server initialized - Multi-Room Audio Control for AI Agents');
        console.error('Supports: Playback control, volume management, multi-room grouping, music library browsing');
        console.error('Optimized for: Home audio automation, music streaming, zone coordination, smart scenes');

        this.registry = new DeviceRegistry();
        this.resolver = new DeviceResolver(this.registry);
        this.setupHandlers();
    }

    private setupHandlers(): void {
        this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
            tools: [
                {
                    name: 'sonos_discover',
                    description: `Discover Sonos devices on the local network using SSDP (Simple Service Discovery Protocol). Essential first step for coding agents building Sonos control applications.

CODING AGENT BENEFITS:
- Build device discovery and setup interfaces for audio applications
- Create automated device inventory and registration systems
- Develop network scanning utilities for home audio systems
- Generate device lists for user selection in control interfaces
- Build multi-location audio system discovery workflows
- Create device health monitoring and network diagnostics tools

HOW IT WORKS:
- Broadcasts SSDP M-SEARCH requests on the local network
- Listens for Sonos device responses (typically port 1400)
- Parses device UUIDs, IP addresses, and capabilities
- Fetches detailed device information (model, room name, firmware)
- Registers all discovered devices in the device registry
- Returns comprehensive device list with all metadata

WHAT IT RETURNS:
- Device UUID (unique identifier like RINCON_xxxxx)
- IP address and port (usually 192.168.x.x:1400)
- Room name (e.g., "Kitchen", "Living Room")
- Model name and number (e.g., "Sonos One", "Beam")
- Software version and capabilities
- Discovery timestamp

BEST PRACTICES FOR AI AGENTS:
- Initial Setup: Always run discovery first in new environments
- Timeout Selection: Use 5000ms (5s) for most networks, 10000ms (10s) for large homes
- Periodic Refresh: Re-run discovery after adding/moving devices
- Error Handling: Handle zero devices gracefully with helpful user guidance
- Network Requirements: Ensure same subnet as Sonos devices
- Multi-Network: May need to run on each network segment
- Caching: Store discovered devices for quick subsequent access

COMMON WORKFLOWS:
1. First Use: sonos_discover → sonos_list_devices → select device → control
2. Refresh: sonos_discover (periodic) → update device registry
3. Troubleshooting: sonos_discover → verify devices reachable

DISCOVERY TIPS:
- Devices must be powered on and connected to network
- UPnP/SSDP must not be blocked by firewall
- Works only on local network (not remote/cloud)
- May discover non-Sonos UPnP devices (filtered automatically)`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            timeout: {
                                type: 'number',
                                description: 'Discovery timeout in milliseconds. Longer timeouts find more devices in large networks but take more time. Recommended: 5000ms for small networks, 10000ms for large homes. Default: 5000ms',
                                default: 5000,
                            },
                        },
                    },
                },
                {
                    name: 'sonos_add_device',
                    description: `Manually add a Sonos device by IP address. Critical fallback for coding agents when automatic SSDP discovery fails due to network restrictions or firewall rules.

CODING AGENT BENEFITS:
- Build manual device registration interfaces for restricted networks
- Create static device configuration systems for enterprise environments
- Develop fallback discovery mechanisms for reliable device access
- Generate device provisioning workflows for IT deployment
- Build cross-VLAN device registration tools
- Create VPN-based remote device access systems

HOW IT WORKS:
- Accepts IP address and optional port (default 1400)
- Validates device accessibility with test SOAP call
- Fetches device UUID from device_description.xml
- Retrieves room name, model, and firmware information
- Registers device in local device registry
- Makes device immediately available for control

WHEN TO USE:
- SSDP discovery blocked by firewall/network policy
- Devices on different VLAN/subnet
- Corporate networks with UPnP disabled
- Known static IP addresses preferred
- Remote access through VPN
- Troubleshooting specific device connectivity

DEVICE CONNECTIVITY:
- Standard Sonos port: 1400 (HTTP)
- Device must be network-accessible from agent
- Requires HTTP access to /xml/device_description.xml
- No authentication required (local network trust model)

BEST PRACTICES FOR AI AGENTS:
- Validation: Verify IP is reachable before adding
- Port Default: Use 1400 unless custom port known
- Name Override: Allow user to set friendly name if auto-detect fails
- Error Messages: Provide clear guidance on connectivity issues
- Fallback Chain: Try discovery first, then manual add
- Documentation: Guide users to find device IP (router DHCP, Sonos app)
- Static IPs: Recommend static IP assignment for manually added devices

IP ADDRESS DISCOVERY GUIDANCE:
- Check router's DHCP client list
- Use Sonos mobile app: Settings → System → About My System
- Network scanner tools (nmap, Fing, etc.)
- Check device display (if available)
- mDNS/Bonjour browser (look for _sonos._tcp)

COMMON WORKFLOWS:
1. Discovery Failed: sonos_discover (fails) → sonos_add_device (manual)
2. Static Config: sonos_add_device → store in config → use directly
3. Remote Access: VPN connect → sonos_add_device → control

ERROR SCENARIOS:
- "Cannot reach device": IP incorrect, device offline, or network blocked
- "Not a Sonos device": Wrong IP or port, or non-Sonos UPnP device
- "Timeout": Network latency too high or firewall delay`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            ip: {
                                type: 'string',
                                description: 'IP address of the Sonos device (e.g., "192.168.1.150"). Must be reachable on the local network or through VPN. Can be found in router DHCP list or Sonos app settings.',
                            },
                            port: {
                                type: 'number',
                                description: 'Port number for Sonos HTTP API. Default: 1400 (standard for all Sonos devices). Only change if using custom port forwarding.',
                                default: 1400,
                            },
                            name: {
                                type: 'string',
                                description: 'Optional friendly name for the device (e.g., "Kitchen Speaker"). If not provided, will auto-fetch from device. Useful for custom naming or when auto-detection fails.',
                            },
                        },
                        required: ['ip'],
                    },
                },
                {
                    name: 'sonos_list_devices',
                    description: `List all discovered and registered Sonos devices. Essential for coding agents building device selection interfaces and system status dashboards.

CODING AGENT BENEFITS:
- Build device selector dropdowns and picker UIs
- Create system status dashboards showing all speakers
- Generate device inventory and asset management reports
- Develop multi-room audio control interfaces
- Build zone-based automation logic
- Create device health monitoring displays

WHAT IT RETURNS:
- Complete list of all registered devices with full metadata
- Device UUID (unique identifier, never changes)
- Current IP address and port
- Room name (user-assigned friendly name)
- Model name and number (hardware type)
- Software version (firmware version)
- Registration timestamp and method (discovered vs manual)

DATA SOURCES:
- Devices from automatic SSDP discovery
- Manually added devices (via sonos_add_device)
- Cached device information with latest updates
- Persistent device registry (survives restarts)

BEST PRACTICES FOR AI AGENTS:
- Pre-Control Check: Always list devices before attempting control
- Device Selection: Present list to user for choosing target device
- Status Display: Show device count and online status
- Empty State: Handle zero devices with discovery guidance
- Refresh Strategy: Re-list after discovery or add operations
- Multi-Device: Use for building room/zone selectors
- Validation: Verify deviceId exists before control commands

DEVICE IDENTIFICATION:
Each device can be referenced by:
1. Room name: "Kitchen" (most user-friendly)
2. UUID: "RINCON_B8E9373C90DC01400" (most reliable)
3. IP address: "192.168.1.150" (direct access)

COMMON WORKFLOWS:
1. Setup: sonos_discover → sonos_list_devices → show to user
2. Control: sonos_list_devices → user selects → execute command
3. Monitoring: sonos_list_devices (periodic) → display status`,
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'sonos_play',
                    description: `Start or resume playback on a Sonos device. Core function for coding agents building music playback automation and voice control systems.

CODING AGENT BENEFITS:
- Build play/pause buttons in audio control interfaces
- Create voice command handlers ("play music")
- Develop automated playback scheduling (morning music routines)
- Generate scene-based audio automation (dinner party mode)
- Build gesture or sensor-triggered playback
- Create multi-room synchronized playback triggers

HOW IT WORKS:
- Resumes playback if paused
- Starts from beginning if stopped
- Continues from current queue position
- Respects current volume and EQ settings
- Works with any audio source (queue, streaming, line-in, etc.)
- Immediate response (typically <100ms)

PLAYBACK SOURCES:
- Queue: Plays from the device's playback queue
- Streaming Services: Spotify, Apple Music, etc. (if already playing)
- Radio: TuneIn, iHeartRadio stations
- Line-In: Connected audio device
- TV: Sonos soundbar TV input
- Airplay: Airplay 2 stream

BEST PRACTICES FOR AI AGENTS:
- State Check: Use sonos_get_transport_info first to see current state
- User Feedback: Confirm playback started with visual/audio cue
- Error Handling: Handle empty queue gracefully
- Group Coordination: Play affects entire group (not just one device)
- Volume Safety: Check volume before playing (avoid sudden loud music)
- Source Awareness: Different sources behave differently on play

MULTI-ROOM BEHAVIOR:
- If device is group coordinator: All group members play
- If device is group member: Entire group plays (coordinator controls)
- Use sonos_get_zone_groups to understand group topology

INTELLIGENT AUTOMATION EXAMPLES:
- Morning Routine: 7:00 AM → sonos_play ("Kitchen")
- Motion Detected: Entry sensor → sonos_play ("Hallway")
- Voice Command: "Play music" → sonos_play (current room)
- Scene Activation: "Dinner party" → sonos_play (all downstairs rooms)
- Geofencing: Arrive home → sonos_play ("Living Room")
- Calendar Integration: Meeting ends → sonos_play ("Office")

COMMON WORKFLOWS:
1. Simple Play: sonos_play → music starts
2. Resume: sonos_pause → (pause) → sonos_play → resume from same position
3. Check First: sonos_get_transport_info → if paused → sonos_play

ERROR SCENARIOS:
- Empty Queue: Nothing happens if no tracks in queue and no active stream
- Device Offline: Command fails if device unreachable
- Group Conflict: May fail if group topology changing`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device identifier: room name (e.g., "Kitchen"), UUID (e.g., "RINCON_xxxxx"), or IP address (e.g., "192.168.1.100"). If device is in a group, playback affects entire group.',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_pause',
                    description: `Pause playback on a Sonos device. Essential for coding agents building playback control and automation systems.

CODING AGENT BENEFITS:
- Build pause buttons in audio control interfaces
- Create voice command handlers ("pause music")
- Develop automated silence triggers (phone call detection)
- Generate doorbell/notification pause automation
- Build presence-based audio pause (leaving room)
- Create calendar-integrated quiet time enforcement

HOW IT WORKS:
- Pauses current playback immediately
- Maintains current position in track and queue
- Preserves all playback settings (volume, EQ, etc.)
- Can be resumed with sonos_play
- Affects entire group if device is grouped
- Idempotent: safe to call multiple times

PAUSE VS STOP:
- Pause: Maintains state, quick resume, keeps position
- Stop: Clears some state, may reset position
- Recommendation: Use pause for temporary interruptions

BEST PRACTICES FOR AI AGENTS:
- User Feedback: Confirm pause with visual indicator
- State Tracking: Update UI to show paused state
- Group Awareness: Pause affects all grouped devices
- Resume Logic: Store pause reason for smart auto-resume
- Timeout: Consider auto-resume after timeout (e.g., 5 minutes)
- Notification: Alert user if pause was automated

INTELLIGENT AUTOMATION EXAMPLES:
- Phone Call: Call incoming → sonos_pause (all rooms)
- Doorbell: Ring detected → sonos_pause → announce visitor
- Voice Command: "Pause music" → sonos_pause (current room)
- Motion Absence: No motion 10 min → sonos_pause → energy saving
- Calendar Event: Meeting starts → sonos_pause ("Office")
- Smart Scenes: "Goodnight" routine → sonos_pause (all devices)
- Presence Detection: All people leave → sonos_pause (entire home)

AUTO-RESUME SCENARIOS:
- Store pause timestamp and reason
- Auto-resume after: call ends, doorbell timeout, return to room
- User preference: ask if should resume or stay paused

COMMON WORKFLOWS:
1. Simple Pause: sonos_pause → music pauses
2. Pause-Resume: sonos_pause → (wait) → sonos_play → resume
3. Conditional Pause: if playing → sonos_pause`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device identifier: room name (e.g., "Kitchen"), UUID, or IP address. Pauses entire group if device is grouped.',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_stop',
                    description: 'Stop playback on a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_next',
                    description: 'Skip to next track',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_previous',
                    description: 'Skip to previous track',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_set_volume',
                    description: 'Set volume on a Sonos device (0-100)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            volume: {
                                type: 'number',
                                description: 'Volume level 0-100',
                                minimum: 0,
                                maximum: 100,
                            },
                        },
                        required: ['deviceId', 'volume'],
                    },
                },
                {
                    name: 'sonos_get_volume',
                    description: 'Get current volume from a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_set_mute',
                    description: 'Mute or unmute a Sonos device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            mute: {
                                type: 'boolean',
                                description: 'Mute state',
                            },
                        },
                        required: ['deviceId', 'mute'],
                    },
                },
                {
                    name: 'sonos_get_transport_info',
                    description: 'Get current transport state (playing/paused/stopped)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_get_position_info',
                    description: 'Get current track and position information',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_get_zone_groups',
                    description: 'Get zone group topology',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_get_queue',
                    description: 'Get the current playback queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (0-based, default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of tracks to retrieve (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_add_to_queue',
                    description: 'Add a URI to the playback queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            uri: {
                                type: 'string',
                                description: 'URI to add to queue (e.g., x-file-cifs://..., x-sonos-spotify:...)',
                            },
                            metadata: {
                                type: 'string',
                                description: 'Optional DIDL-Lite metadata XML',
                            },
                            position: {
                                type: 'number',
                                description: 'Insert at specific position (1-based), or append if not specified',
                            },
                            playNext: {
                                type: 'boolean',
                                description: 'Play this track next',
                                default: false,
                            },
                        },
                        required: ['deviceId', 'uri'],
                    },
                },
                {
                    name: 'sonos_remove_from_queue',
                    description: 'Remove a track from the queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            position: {
                                type: 'number',
                                description: 'Track position to remove (1-based)',
                            },
                        },
                        required: ['deviceId', 'position'],
                    },
                },
                {
                    name: 'sonos_clear_queue',
                    description: 'Remove all tracks from the queue',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_play_from_queue',
                    description: 'Play from the queue starting at a specific position',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            position: {
                                type: 'number',
                                description: 'Track position to start playing from (1-based)',
                            },
                        },
                        required: ['deviceId', 'position'],
                    },
                },
                {
                    name: 'sonos_save_queue',
                    description: 'Save the current queue as a Sonos playlist',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            title: {
                                type: 'string',
                                description: 'Playlist title',
                            },
                        },
                        required: ['deviceId', 'title'],
                    },
                },
                {
                    name: 'sonos_set_shuffle',
                    description: 'Enable or disable shuffle mode',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            shuffle: {
                                type: 'boolean',
                                description: 'Enable shuffle',
                            },
                        },
                        required: ['deviceId', 'shuffle'],
                    },
                },
                {
                    name: 'sonos_set_repeat',
                    description: 'Set repeat mode',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            mode: {
                                type: 'string',
                                description: 'Repeat mode',
                                enum: ['off', 'all', 'one'],
                            },
                        },
                        required: ['deviceId', 'mode'],
                    },
                },
                {
                    name: 'sonos_set_crossfade',
                    description: 'Enable or disable crossfade',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable crossfade',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_get_playback_state',
                    description: 'Get current playback state including shuffle, repeat, and crossfade',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                // Group Management Tools
                {
                    name: 'sonos_join_group',
                    description: 'Join this device to another device\'s group',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Bedroom"), UUID, or IP address to join from',
                            },
                            masterDeviceId: {
                                type: 'string',
                                description: 'Master/coordinator device name (e.g., "Living Room"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId', 'masterDeviceId'],
                    },
                },
                {
                    name: 'sonos_unjoin',
                    description: 'Remove this device from its current group (make it standalone)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                // Music Library Browsing Tools
                {
                    name: 'sonos_browse_artists',
                    description: 'Browse artists in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_albums',
                    description: 'Browse albums in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_tracks',
                    description: 'Browse tracks in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_genres',
                    description: 'Browse genres in the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_browse_playlists',
                    description: 'Browse Sonos playlists',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_search_library',
                    description: 'Search the music library',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            searchType: {
                                type: 'string',
                                description: 'Type of search',
                                enum: ['artists', 'albums', 'tracks', 'genres'],
                            },
                            searchTerm: {
                                type: 'string',
                                description: 'Search term',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId', 'searchType', 'searchTerm'],
                    },
                },
                {
                    name: 'sonos_browse_item',
                    description: 'Browse a specific music library item (e.g., get albums for an artist, tracks for an album)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            objectId: {
                                type: 'string',
                                description: 'Object ID to browse (from a previous browse or search result)',
                            },
                            startIndex: {
                                type: 'number',
                                description: 'Starting index (default: 0)',
                                default: 0,
                            },
                            count: {
                                type: 'number',
                                description: 'Number of items to return (default: 100)',
                                default: 100,
                            },
                        },
                        required: ['deviceId', 'objectId'],
                    },
                },
                // Phase 3 Features - EQ Controls
                {
                    name: 'sonos_set_bass',
                    description: 'Set bass level (-10 to 10)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            bass: {
                                type: 'number',
                                description: 'Bass level (-10 to 10)',
                                minimum: -10,
                                maximum: 10,
                            },
                        },
                        required: ['deviceId', 'bass'],
                    },
                },
                {
                    name: 'sonos_set_treble',
                    description: 'Set treble level (-10 to 10)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            treble: {
                                type: 'number',
                                description: 'Treble level (-10 to 10)',
                                minimum: -10,
                                maximum: 10,
                            },
                        },
                        required: ['deviceId', 'treble'],
                    },
                },
                {
                    name: 'sonos_set_loudness',
                    description: 'Enable or disable loudness compensation',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable loudness',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_get_eq',
                    description: 'Get current EQ settings (bass, treble, loudness)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_set_night_mode',
                    description: 'Set night mode for home theater devices (reduces loud sounds)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable night mode',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                {
                    name: 'sonos_set_dialog_mode',
                    description: 'Set dialog enhancement for home theater devices (enhances speech clarity)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable dialog enhancement',
                            },
                        },
                        required: ['deviceId', 'enabled'],
                    },
                },
                // Phase 3 Features - Sleep Timer
                {
                    name: 'sonos_set_sleep_timer',
                    description: 'Set sleep timer to automatically stop playback after a duration',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            duration: {
                                type: 'string',
                                description: 'Duration in HH:MM:SS format (e.g., "00:30:00" for 30 minutes)',
                            },
                        },
                        required: ['deviceId', 'duration'],
                    },
                },
                {
                    name: 'sonos_get_sleep_timer',
                    description: 'Get remaining sleep timer duration',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_cancel_sleep_timer',
                    description: 'Cancel the sleep timer',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                // Phase 3 Features - Alarms
                {
                    name: 'sonos_list_alarms',
                    description: 'List all configured alarms',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_create_alarm',
                    description: 'Create a new alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            startTime: {
                                type: 'string',
                                description: 'Start time in HH:MM:SS format (e.g., "07:00:00")',
                            },
                            recurrence: {
                                type: 'string',
                                description: 'DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456 (0=Sunday)',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable alarm (default: true)',
                                default: true,
                            },
                            volume: {
                                type: 'number',
                                description: 'Alarm volume (0-100, default: 25)',
                                minimum: 0,
                                maximum: 100,
                                default: 25,
                            },
                            duration: {
                                type: 'string',
                                description: 'Duration in HH:MM:SS (default: 02:00:00)',
                                default: '02:00:00',
                            },
                        },
                        required: ['deviceId', 'startTime', 'recurrence'],
                    },
                },
                {
                    name: 'sonos_update_alarm',
                    description: 'Update an existing alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            alarmId: {
                                type: 'string',
                                description: 'Alarm ID to update',
                            },
                            startTime: {
                                type: 'string',
                                description: 'Start time in HH:MM:SS format',
                            },
                            recurrence: {
                                type: 'string',
                                description: 'DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456',
                            },
                            enabled: {
                                type: 'boolean',
                                description: 'Enable/disable alarm',
                            },
                            volume: {
                                type: 'number',
                                description: 'Alarm volume (0-100)',
                                minimum: 0,
                                maximum: 100,
                            },
                        },
                        required: ['deviceId', 'alarmId'],
                    },
                },
                {
                    name: 'sonos_delete_alarm',
                    description: 'Delete an alarm',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            alarmId: {
                                type: 'string',
                                description: 'Alarm ID to delete',
                            },
                        },
                        required: ['deviceId', 'alarmId'],
                    },
                },
                // Phase 3 Features - Snapshot/Restore
                {
                    name: 'sonos_snapshot',
                    description: 'Take a snapshot of current device state (playback, volume, EQ)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_restore_snapshot',
                    description: 'Restore a previously saved snapshot',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            snapshot: {
                                type: 'string',
                                description: 'JSON string of the snapshot to restore',
                            },
                            fade: {
                                type: 'boolean',
                                description: 'Fade volume up on restore (default: false)',
                                default: false,
                            },
                        },
                        required: ['deviceId', 'snapshot'],
                    },
                },
                // Phase 3 Features - Party Mode
                {
                    name: 'sonos_party_mode',
                    description: 'Join all devices to this device (party mode)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Living Room"), UUID, or IP address (will become group coordinator)',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                // Phase 4 Features - Event Subscriptions
                {
                    name: 'sonos_subscribe_events',
                    description: 'Subscribe to real-time events from a Sonos device service (AVTransport, RenderingControl, etc.)',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            service: {
                                type: 'string',
                                description: 'Service name to subscribe to',
                                enum: ['AVTransport', 'RenderingControl', 'Queue', 'ZoneGroupTopology', 'AlarmClock'],
                            },
                            timeout: {
                                type: 'number',
                                description: 'Subscription timeout in seconds (default: 1800 = 30 minutes)',
                                default: 1800,
                            },
                        },
                        required: ['deviceId', 'service'],
                    },
                },
                {
                    name: 'sonos_unsubscribe_events',
                    description: 'Unsubscribe from a specific event subscription',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                            subscriptionId: {
                                type: 'string',
                                description: 'Subscription ID (SID) to unsubscribe from',
                            },
                        },
                        required: ['deviceId', 'subscriptionId'],
                    },
                },
                {
                    name: 'sonos_unsubscribe_all',
                    description: 'Unsubscribe from all event subscriptions for a specific device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
                {
                    name: 'sonos_list_subscriptions',
                    description: 'List all active event subscriptions for a device',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            deviceId: {
                                type: 'string',
                                description: 'Device name (e.g., "Kitchen"), UUID, or IP address',
                            },
                        },
                        required: ['deviceId'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(
            CallToolRequestSchema,
            async (request: CallToolRequest) => this.handleToolCall(request)
        );
    }

    private async handleToolCall(request: CallToolRequest) {
        const { name, arguments: args } = request.params;

        try {
            switch (name) {
                case 'sonos_discover':
                    return await this.handleDiscover(args);
                case 'sonos_add_device':
                    return await this.handleAddDevice(args);
                case 'sonos_list_devices':
                    return this.handleListDevices();
                case 'sonos_play':
                    return await this.handlePlay(args);
                case 'sonos_pause':
                    return await this.handlePause(args);
                case 'sonos_stop':
                    return await this.handleStop(args);
                case 'sonos_next':
                    return await this.handleNext(args);
                case 'sonos_previous':
                    return await this.handlePrevious(args);
                case 'sonos_set_volume':
                    return await this.handleSetVolume(args);
                case 'sonos_get_volume':
                    return await this.handleGetVolume(args);
                case 'sonos_set_mute':
                    return await this.handleSetMute(args);
                case 'sonos_get_transport_info':
                    return await this.handleGetTransportInfo(args);
                case 'sonos_get_position_info':
                    return await this.handleGetPositionInfo(args);
                case 'sonos_get_zone_groups':
                    return await this.handleGetZoneGroups(args);
                case 'sonos_get_queue':
                    return await this.handleGetQueue(args);
                case 'sonos_add_to_queue':
                    return await this.handleAddToQueue(args);
                case 'sonos_remove_from_queue':
                    return await this.handleRemoveFromQueue(args);
                case 'sonos_clear_queue':
                    return await this.handleClearQueue(args);
                case 'sonos_play_from_queue':
                    return await this.handlePlayFromQueue(args);
                case 'sonos_save_queue':
                    return await this.handleSaveQueue(args);
                case 'sonos_set_shuffle':
                    return await this.handleSetShuffle(args);
                case 'sonos_set_repeat':
                    return await this.handleSetRepeat(args);
                case 'sonos_set_crossfade':
                    return await this.handleSetCrossfade(args);
                case 'sonos_get_playback_state':
                    return await this.handleGetPlaybackState(args);
                case 'sonos_join_group':
                    return await this.handleJoinGroup(args);
                case 'sonos_unjoin':
                    return await this.handleUnjoin(args);
                case 'sonos_browse_artists':
                    return await this.handleBrowseArtists(args);
                case 'sonos_browse_albums':
                    return await this.handleBrowseAlbums(args);
                case 'sonos_browse_tracks':
                    return await this.handleBrowseTracks(args);
                case 'sonos_browse_genres':
                    return await this.handleBrowseGenres(args);
                case 'sonos_browse_playlists':
                    return await this.handleBrowsePlaylists(args);
                case 'sonos_search_library':
                    return await this.handleSearchLibrary(args);
                case 'sonos_browse_item':
                    return await this.handleBrowseItem(args);
                // Phase 3 - EQ Controls
                case 'sonos_set_bass':
                    return await this.handleSetBass(args);
                case 'sonos_set_treble':
                    return await this.handleSetTreble(args);
                case 'sonos_set_loudness':
                    return await this.handleSetLoudness(args);
                case 'sonos_get_eq':
                    return await this.handleGetEQ(args);
                case 'sonos_set_night_mode':
                    return await this.handleSetNightMode(args);
                case 'sonos_set_dialog_mode':
                    return await this.handleSetDialogMode(args);
                // Phase 3 - Sleep Timer
                case 'sonos_set_sleep_timer':
                    return await this.handleSetSleepTimer(args);
                case 'sonos_get_sleep_timer':
                    return await this.handleGetSleepTimer(args);
                case 'sonos_cancel_sleep_timer':
                    return await this.handleCancelSleepTimer(args);
                // Phase 3 - Alarms
                case 'sonos_list_alarms':
                    return await this.handleListAlarms(args);
                case 'sonos_create_alarm':
                    return await this.handleCreateAlarm(args);
                case 'sonos_update_alarm':
                    return await this.handleUpdateAlarm(args);
                case 'sonos_delete_alarm':
                    return await this.handleDeleteAlarm(args);
                // Phase 3 - Snapshot/Restore
                case 'sonos_snapshot':
                    return await this.handleSnapshot(args);
                case 'sonos_restore_snapshot':
                    return await this.handleRestoreSnapshot(args);
                // Phase 3 - Party Mode
                case 'sonos_party_mode':
                    return await this.handlePartyMode(args);
                // Phase 4 - Event Subscriptions
                case 'sonos_subscribe_events':
                    return await this.handleSubscribeEvents(args);
                case 'sonos_unsubscribe_events':
                    return await this.handleUnsubscribeEvents(args);
                case 'sonos_unsubscribe_all':
                    return await this.handleUnsubscribeAll(args);
                case 'sonos_list_subscriptions':
                    return await this.handleListSubscriptions(args);
                default:
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Unknown tool: ${name}`,
                            },
                        ],
                    };
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }

    private async handleDiscover(args: unknown) {
        const timeout = typeof args === 'object' && args !== null && 'timeout' in args
            ? (args.timeout as number)
            : 5000;

        const client = new SsdpClient();
        const responses = await client.discover(timeout);

        for (const response of responses) {
            const device = this.registry.addFromDiscovery(response);
            if (device) {
                // Fetch full device details
                await this.fetchDeviceDetails(device);
            }
        }

        const devices = this.registry.getAllDevices();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: `Discovered ${responses.length} Sonos device(s)`,
                        devices: devices,
                    }, null, 2),
                },
            ],
        };
    }

    private async handleAddDevice(args: unknown) {
        if (typeof args !== 'object' || args === null || !('ip' in args)) {
            throw new Error('IP address is required');
        }

        const ip = args.ip as string;
        const port = 'port' in args ? (args.port as number) : 1400;
        const name = 'name' in args ? (args.name as string) : undefined;

        const soapClient = new SoapClient();
        const body = RequestBuilder.buildSimpleBody({ InstanceID: 0 });
        const response = await soapClient.call({
            ip,
            port,
            endpoint: '/MediaRenderer/AVTransport/Control',
            service: 'urn:schemas-upnp-org:service:AVTransport:1',
            action: 'GetTransportInfo',
            body,
        });

        if (!response.success) {
            throw new Error(`Cannot reach Sonos device at ${ip}:${port}`);
        }

        // Fetch the device description to get the real UUID
        let deviceUuid: string | undefined;
        try {
            const descriptionUrl = `http://${ip}:${port}/xml/device_description.xml`;
            const descResponse = await fetch(descriptionUrl);
            if (descResponse.ok) {
                const xml = await descResponse.text();
                // Extract UUID from <UDN>uuid:RINCON_xxxxx</UDN>
                const udnMatch = /<UDN>uuid:([^<]+)<\/UDN>/i.exec(xml);
                if (udnMatch) {
                    deviceUuid = udnMatch[1];
                }
            }
        } catch (error) {
            // If we can't fetch the UUID, we'll use a fallback
            console.warn(`Could not fetch device UUID for ${ip}:${port}`, error);
        }

        this.registry.addManualDevice(ip, port, name, deviceUuid);

        return {
            content: [
                {
                    type: 'text',
                    text: `Successfully added Sonos device at ${ip}${deviceUuid ? ` (UUID: ${deviceUuid})` : ''}`,
                },
            ],
        };
    }

    private handleListDevices() {
        const devices = this.registry.getAllDevices();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(devices, null, 2),
                },
            ],
        };
    }

    private getDevice(deviceId: string) {
        return this.resolver.resolve(deviceId);
    }

    private async handlePlay(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.play();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback started' : 'Failed to start playback',
                },
            ],
        };
    }

    private async handlePause(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.pause();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback paused' : 'Failed to pause playback',
                },
            ],
        };
    }

    private async handleStop(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.stop();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Playback stopped' : 'Failed to stop playback',
                },
            ],
        };
    }

    private async handleNext(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.next();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Skipped to next track' : 'Failed to skip track',
                },
            ],
        };
    }

    private async handlePrevious(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.previous();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Skipped to previous track' : 'Failed to skip track',
                },
            ],
        };
    }

    private async handleSetVolume(args: unknown) {
        const { deviceId, volume } = args as { deviceId: string; volume: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const success = await service.setVolume(volume);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Volume set to ${volume}` : 'Failed to set volume',
                },
            ],
        };
    }

    private async handleGetVolume(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const volume = await service.getVolume();

        return {
            content: [
                {
                    type: 'text',
                    text: volume !== null ? `Volume: ${volume}` : 'Failed to get volume',
                },
            ],
        };
    }

    private async handleSetMute(args: unknown) {
        const { deviceId, mute } = args as { deviceId: string; mute: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        const success = await service.setMute(mute);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Mute ${mute ? 'enabled' : 'disabled'}` : 'Failed to set mute',
                },
            ],
        };
    }

    private async handleGetTransportInfo(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const info = await service.getTransportInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: info ? JSON.stringify(info, null, 2) : 'Failed to get transport info',
                },
            ],
        };
    }

    private async handleGetPositionInfo(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const info = await service.getPositionInfo();

        return {
            content: [
                {
                    type: 'text',
                    text: info ? JSON.stringify(info, null, 2) : 'Failed to get position info',
                },
            ],
        };
    }

    private async handleGetZoneGroups(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new ZoneGroupTopologyService(device);
        const groups = await service.getZoneGroupState();

        return {
            content: [
                {
                    type: 'text',
                    text: groups ? JSON.stringify(groups, null, 2) : 'Failed to get zone groups',
                },
            ],
        };
    }

    private async handleGetQueue(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const queue = await service.getQueue(startIndex, count);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(queue, null, 2),
                },
            ],
        };
    }

    private async handleAddToQueue(args: unknown) {
        const { deviceId, uri, metadata, position, playNext = false } = args as {
            deviceId: string;
            uri: string;
            metadata?: unknown;
            position?: number;
            playNext?: boolean;
        };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        // metadata can be a plain object, string, or DidlObject - the service handles all cases
        const trackNumber = await service.addToQueue({
            uri,
            metadata: metadata as string | DidlObject | undefined,
            position,
            playNext
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        position: trackNumber,
                        message: `Added to queue at position ${trackNumber}`,
                    }),
                },
            ],
        };
    }

    private async handleRemoveFromQueue(args: unknown) {
        const { deviceId, position } = args as { deviceId: string; position: number };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.removeFromQueue(position);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Removed track at position ${position}`
                        : 'Failed to remove track from queue',
                },
            ],
        };
    }

    private async handleClearQueue(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.removeAllTracksFromQueue();

        return {
            content: [
                {
                    type: 'text',
                    text: success ? 'Queue cleared' : 'Failed to clear queue',
                },
            ],
        };
    }

    private async handlePlayFromQueue(args: unknown) {
        const { deviceId, position } = args as { deviceId: string; position: number };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.playFromQueue(position);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Playing from queue position ${position}`
                        : 'Failed to play from queue',
                },
            ],
        };
    }

    private async handleSaveQueue(args: unknown) {
        const { deviceId, title } = args as { deviceId: string; title: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const playlistId = await service.saveQueue(title);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        objectId: playlistId,
                        title,
                        message: `Queue saved as playlist "${title}" (ID: ${playlistId})`,
                    }),
                },
            ],
        };
    }

    private async handleSetShuffle(args: unknown) {
        const { deviceId, shuffle } = args as { deviceId: string; shuffle: boolean };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setShuffle(shuffle);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Shuffle ${shuffle ? 'enabled' : 'disabled'}`
                        : 'Failed to set shuffle',
                },
            ],
        };
    }

    private async handleSetRepeat(args: unknown) {
        const { deviceId, mode } = args as { deviceId: string; mode: 'off' | 'all' | 'one' };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setRepeat(mode);

        return {
            content: [
                {
                    type: 'text',
                    text: success ? `Repeat set to: ${mode}` : 'Failed to set repeat mode',
                },
            ],
        };
    }

    private async handleSetCrossfade(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const success = await service.setCrossFade(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Crossfade ${enabled ? 'enabled' : 'disabled'}`
                        : 'Failed to set crossfade',
                },
            ],
        };
    }

    private async handleGetPlaybackState(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);

        const [shuffle, repeat, crossfade, transportInfo] = await Promise.all([
            service.getShuffle(),
            service.getRepeat(),
            service.getCrossFade(),
            service.getTransportInfo(),
        ]);

        const state = {
            shuffle,
            repeat,
            crossfade,
            playbackState: transportInfo?.state,
            speed: transportInfo?.speed,
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(state, null, 2),
                },
            ],
        };
    }

    // Group Management Handlers
    private async handleJoinGroup(args: unknown) {
        const { deviceId, masterDeviceId } = args as { deviceId: string; masterDeviceId: string };
        const device = this.getDevice(deviceId);
        const masterDevice = this.getDevice(masterDeviceId);

        const service = new ZoneGroupTopologyService(device);
        const success = await service.join(masterDevice.uuid);

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Device ${device.name || device.ip} joined group with ${masterDevice.name || masterDevice.ip}`
                        : 'Failed to join group',
                },
            ],
        };
    }

    private async handleUnjoin(args: unknown) {
        const deviceId = (args as { deviceId: string }).deviceId;
        const device = this.getDevice(deviceId);
        const service = new ZoneGroupTopologyService(device);
        const success = await service.unjoin();

        return {
            content: [
                {
                    type: 'text',
                    text: success
                        ? `Device ${device.name || device.ip} removed from group`
                        : 'Failed to unjoin from group',
                },
            ],
        };
    }

    // Music Library Browsing Handlers
    private async handleBrowseArtists(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getArtists({ startIndex, count });

        const artists = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items: artists,
                        total: result.total,
                        returned: result.returned,
                    }),
                },
            ],
        };
    }

    private async handleBrowseAlbums(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getAlbums({ startIndex, count });

        const albums = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items: albums,
                        total: result.total,
                        returned: result.returned,
                    }),
                },
            ],
        };
    }

    private async handleBrowseTracks(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getTracks({ startIndex, count });

        const tracks = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            uri: item.resources[0]?.uri,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items: tracks,
                        total: result.total,
                        returned: result.returned,
                    }),
                },
            ],
        };
    }

    private async handleBrowseGenres(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getGenres({ startIndex, count });

        const genres = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items: genres,
                        total: result.total,
                        returned: result.returned,
                    }),
                },
            ],
        };
    }

    private async handleBrowsePlaylists(args: unknown) {
        const { deviceId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.getSonosPlaylists({ startIndex, count });

        const playlists = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items: playlists,
                        total: result.total,
                        returned: result.returned,
                    }),
                },
            ],
        };
    }

    private async handleSearchLibrary(args: unknown) {
        const { deviceId, searchType, searchTerm, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            searchType: 'artists' | 'albums' | 'tracks' | 'genres';
            searchTerm: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.search(searchType, searchTerm, { startIndex, count });

        const items = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items,
                        total: result.total,
                        returned: result.returned,
                        searchTerm,
                        searchType,
                    }),
                },
            ],
        };
    }

    private async handleBrowseItem(args: unknown) {
        const { deviceId, objectId, startIndex = 0, count = 100 } = args as {
            deviceId: string;
            objectId: string;
            startIndex?: number;
            count?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new ContentDirectoryService(device);
        const result = await service.browse(objectId, { startIndex, count });

        const items = result.items.map((item) => ({
            id: item.id,
            title: item.title,
            artist: item.getProperty('artist'),
            album: item.getProperty('album'),
            uri: item.resources[0]?.uri,
            type: item.upnpClass,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        items,
                        total: result.total,
                        returned: result.returned,
                        objectId,
                    }),
                },
            ],
        };
    }

    // Phase 3 Handlers - EQ Controls
    private async handleSetBass(args: unknown) {
        const { deviceId, bass } = args as { deviceId: string; bass: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setBass(bass);

        return {
            content: [
                {
                    type: 'text',
                    text: `Set bass to ${bass}`,
                },
            ],
        };
    }

    private async handleSetTreble(args: unknown) {
        const { deviceId, treble } = args as { deviceId: string; treble: number };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setTreble(treble);

        return {
            content: [
                {
                    type: 'text',
                    text: `Set treble to ${treble}`,
                },
            ],
        };
    }

    private async handleSetLoudness(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setLoudness(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Loudness ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleGetEQ(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);

        const bass = await service.getBass();
        const treble = await service.getTreble();
        const loudness = await service.getLoudness();

        return {
            content: [
                {
                    type: 'text',
                    text: `EQ Settings:\nBass: ${bass}\nTreble: ${treble}\nLoudness: ${loudness ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleSetNightMode(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setNightMode(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Night mode ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    private async handleSetDialogMode(args: unknown) {
        const { deviceId, enabled } = args as { deviceId: string; enabled: boolean };
        const device = this.getDevice(deviceId);
        const service = new RenderingControlService(device);
        await service.setDialogLevel(enabled);

        return {
            content: [
                {
                    type: 'text',
                    text: `Dialog enhancement ${enabled ? 'enabled' : 'disabled'}`,
                },
            ],
        };
    }

    // Phase 3 Handlers - Sleep Timer
    private async handleSetSleepTimer(args: unknown) {
        const { deviceId, duration } = args as { deviceId: string; duration: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        await service.configureSleepTimer(duration);

        return {
            content: [
                {
                    type: 'text',
                    text: `Sleep timer set to ${duration}`,
                },
            ],
        };
    }

    private async handleGetSleepTimer(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        const remaining = await service.getSleepTimerRemaining();

        return {
            content: [
                {
                    type: 'text',
                    text: remaining ? `Sleep timer: ${remaining} remaining` : 'No sleep timer active',
                },
            ],
        };
    }

    private async handleCancelSleepTimer(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AVTransportService(device);
        await service.cancelSleepTimer();

        return {
            content: [
                {
                    type: 'text',
                    text: 'Sleep timer cancelled',
                },
            ],
        };
    }

    // Phase 3 Handlers - Alarms
    private async handleListAlarms(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        const alarms = await service.listAlarms();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ alarms }, null, 2),
                },
            ],
        };
    }

    private async handleCreateAlarm(args: unknown) {
        const { deviceId, startTime, recurrence, enabled = true, volume = 25, duration = '02:00:00' } = args as {
            deviceId: string;
            startTime: string;
            recurrence: string;
            enabled?: boolean;
            volume?: number;
            duration?: string;
        };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        const alarmId = await service.createAlarm({
            startTime,
            recurrence,
            enabled,
            volume,
            duration,
        });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ alarmId }, null, 2),
                },
            ],
        };
    }

    private async handleUpdateAlarm(args: unknown) {
        const { deviceId, alarmId, ...updates } = args as {
            deviceId: string;
            alarmId: string;
            startTime?: string;
            recurrence?: string;
            enabled?: boolean;
            volume?: number;
        };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        await service.updateAlarm(alarmId, updates);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, alarmId }, null, 2),
                },
            ],
        };
    }

    private async handleDeleteAlarm(args: unknown) {
        const { deviceId, alarmId } = args as { deviceId: string; alarmId: string };
        const device = this.getDevice(deviceId);
        const service = new AlarmClockService(device);
        await service.destroyAlarm(alarmId);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, alarmId }, null, 2),
                },
            ],
        };
    }

    // Phase 3 Handlers - Snapshot/Restore
    private async handleSnapshot(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const service = new SnapshotService(device);
        const snapshot = await service.snapshot();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ snapshot }, null, 2),
                },
            ],
        };
    }

    private async handleRestoreSnapshot(args: unknown) {
        const { deviceId, snapshot: snapshotJson, fade = false } = args as {
            deviceId: string;
            snapshot: string;
            fade?: boolean;
        };
        const device = this.getDevice(deviceId);
        const service = new SnapshotService(device);
        const snapshot = JSON.parse(snapshotJson);
        await service.restore(snapshot, fade);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true }, null, 2),
                },
            ],
        };
    }

    // Phase 3 Handlers - Party Mode
    private async handlePartyMode(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const topologyService = new ZoneGroupTopologyService(device);

        // Get all groups and join all other devices to this one
        const groups = await topologyService.getZoneGroupState();
        if (!groups) {
            throw new Error('Failed to get zone groups');
        }

        const thisDeviceUuid = device.uuid;
        const joinedDevices: string[] = [];

        // Find all devices that are not already in this device's group
        const thisGroup = groups.find(g => g.members.includes(thisDeviceUuid));
        const currentMembers = thisGroup?.members ?? [thisDeviceUuid];

        // Collect all other devices and join them
        for (const group of groups) {
            for (const memberUuid of group.members) {
                if (!currentMembers.includes(memberUuid) && memberUuid !== thisDeviceUuid) {
                    try {
                        // Get the device from registry
                        const memberDevice = this.registry.getDevice(memberUuid);
                        if (memberDevice) {
                            const memberTopology = new ZoneGroupTopologyService(memberDevice);
                            await memberTopology.join(thisDeviceUuid);
                            joinedDevices.push(memberUuid);
                        }
                    } catch (error) {
                        console.error(`Failed to join device ${memberUuid}:`, error);
                    }
                }
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ success: true, joinedDevices }, null, 2),
                },
            ],
        };
    }

    // Phase 4 Handlers - Event Subscriptions
    private async handleSubscribeEvents(args: unknown) {
        const { deviceId, service, timeout = 1800 } = args as {
            deviceId: string;
            service: string;
            timeout?: number;
        };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        // Map service names to endpoints
        const serviceEndpoints: Record<string, string> = {
            'AVTransport': '/MediaRenderer/AVTransport/Event',
            'RenderingControl': '/MediaRenderer/RenderingControl/Event',
            'Queue': '/MediaRenderer/Queue/Event',
            'ZoneGroupTopology': '/ZoneGroupTopology/Event',
            'AlarmClock': '/AlarmClock/Event',
        };

        const endpoint = serviceEndpoints[service];
        if (!endpoint) {
            throw new Error(`Unknown service: ${service}. Valid services: ${Object.keys(serviceEndpoints).join(', ')}`);
        }

        // Subscribe to events
        const subscriptionId = await manager.subscribe(device, endpoint, { timeout });

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        subscriptionId,
                        service,
                        endpoint,
                        timeout,
                        message: `Subscribed to ${service} events`,
                    }, null, 2),
                },
            ],
        };
    }

    private async handleUnsubscribeEvents(args: unknown) {
        const { deviceId, subscriptionId } = args as {
            deviceId: string;
            subscriptionId: string;
        };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        await manager.unsubscribe(device, subscriptionId);

        return {
            content: [
                {
                    type: 'text',
                    text: `Unsubscribed from subscription: ${subscriptionId}`,
                },
            ],
        };
    }

    private async handleUnsubscribeAll(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        await manager.unsubscribeDevice(device);

        return {
            content: [
                {
                    type: 'text',
                    text: `Unsubscribed from all events for device: ${device.name || deviceId}`,
                },
            ],
        };
    }

    private async handleListSubscriptions(args: unknown) {
        const { deviceId } = args as { deviceId: string };
        const device = this.getDevice(deviceId);
        const manager = getDefaultManager();

        const deviceIdKey = device.uuid || device.ip;
        const subscriptions = manager.getDeviceSubscriptions(deviceIdKey);

        const subscriptionList = subscriptions.map(sub => ({
            subscriptionId: sub.sid,
            endpoint: sub.endpoint,
            service: this.endpointToServiceName(sub.endpoint),
            timeout: sub.timeout,
            renewAt: sub.renewAt,
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        deviceId: deviceIdKey,
                        subscriptions: subscriptionList,
                        count: subscriptions.length,
                    }, null, 2),
                },
            ],
        };
    }

    /**
     * Helper to convert endpoint to service name
     */
    private endpointToServiceName(endpoint: string): string {
        if (endpoint.includes('AVTransport')) return 'AVTransport';
        if (endpoint.includes('RenderingControl')) return 'RenderingControl';
        if (endpoint.includes('Queue')) return 'Queue';
        if (endpoint.includes('ZoneGroupTopology')) return 'ZoneGroupTopology';
        if (endpoint.includes('AlarmClock')) return 'AlarmClock';
        return 'Unknown';
    }

    /**
     * Fetch full device details from device_description.xml
     */
    private async fetchDeviceDetails(device: SonosDevice): Promise<void> {
        try {
            const descriptionUrl = `http://${device.ip}:${device.port}/xml/device_description.xml`;
            const response = await fetch(descriptionUrl);
            if (!response.ok) {
                console.warn(`Failed to fetch device details for ${device.ip}:${device.port}`);
                return;
            }

            const xml = await response.text();

            // Extract device information
            const roomNameMatch = /<roomName>([^<]+)<\/roomName>/i.exec(xml);
            const modelNameMatch = /<modelName>([^<]+)<\/modelName>/i.exec(xml);
            const modelNumberMatch = /<modelNumber>([^<]+)<\/modelNumber>/i.exec(xml);
            const softwareVersionMatch = /<softwareVersion>([^<]+)<\/softwareVersion>/i.exec(xml);
            const displayNameMatch = /<displayName>([^<]+)<\/displayName>/i.exec(xml);

            // Update device with details
            if (roomNameMatch?.[1]) {
                device.name = roomNameMatch[1];
            } else if (displayNameMatch?.[1]) {
                device.name = displayNameMatch[1];
            }

            if (modelNameMatch?.[1]) {
                device.modelName = modelNameMatch[1];
            }

            if (modelNumberMatch?.[1]) {
                device.modelNumber = modelNumberMatch[1];
            }

            if (softwareVersionMatch?.[1]) {
                device.softwareVersion = softwareVersionMatch[1];
            }

            this.registry.updateDevice(device);
        } catch (error) {
            console.warn(`Error fetching device details for ${device.ip}:${device.port}:`, error);
        }
    }

    /**
     * Perform automatic discovery
     */
    private async performAutoDiscovery(): Promise<void> {
        try {
            console.error('[Auto-Discovery] Starting device discovery...');
            const client = new SsdpClient();
            const responses = await client.discover(5000);

            for (const response of responses) {
                const device = this.registry.addFromDiscovery(response);
                if (device) {
                    await this.fetchDeviceDetails(device);
                }
            }

            const devices = this.registry.getAllDevices();
            console.error(`[Auto-Discovery] Found ${responses.length} device(s), total registered: ${devices.length}`);
        } catch (error) {
            console.error('[Auto-Discovery] Error during discovery:', error);
        }
    }

    /**
     * Start periodic discovery
     */
    private startPeriodicDiscovery(): void {
        // Perform initial discovery
        this.performAutoDiscovery().catch((error) => {
            console.error('[Auto-Discovery] Initial discovery failed:', error);
        });

        // Set up periodic discovery every 5 minutes
        this.discoveryInterval = setInterval(() => {
            this.performAutoDiscovery().catch((error) => {
                console.error('[Auto-Discovery] Periodic discovery failed:', error);
            });
        }, this.DISCOVERY_INTERVAL_MS);

        console.error(`[Auto-Discovery] Periodic discovery started (every ${this.DISCOVERY_INTERVAL_MS / 1000}s)`);
    }

    /**
     * Stop periodic discovery
     */
    private stopPeriodicDiscovery(): void {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
            console.error('[Auto-Discovery] Periodic discovery stopped');
        }
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        // Start automatic discovery after server connects
        this.startPeriodicDiscovery();
    }

    async shutdown(): Promise<void> {
        this.stopPeriodicDiscovery();
    }
}
