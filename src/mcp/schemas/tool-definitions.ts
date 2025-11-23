import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Discovery and Device Management Tools
 */
export const discoveryTools: Tool[] = [
    {
        name: 'sonos_discover',
        description: 'Actively scan the network for Sonos devices using SSDP. Always call this when the sonos_list_devices tool returns empty or you are missing a device. Returns device UUID, IP address, room name, model, and firmware version. Use room name to communicate with the user.',
        inputSchema: {
            type: 'object',
            properties: {
                timeout: {
                    type: 'number',
                    description: 'Discovery timeout in milliseconds (5000-10000 recommended)',
                    default: 5000,
                },
            },
        },
    },
    {
        name: 'sonos_add_device',
        description: 'Manually add a Sonos device by IP address. Use when SSDP discovery fails due to network restrictions or firewall rules. Device must be network-accessible on port 1400.',
        inputSchema: {
            type: 'object',
            properties: {
                ip: {
                    type: 'string',
                    description: 'IP address of the Sonos device (e.g., "192.168.1.150")',
                },
                port: {
                    type: 'number',
                    description: 'Port number (default: 1400)',
                    default: 1400,
                },
                name: {
                    type: 'string',
                    description: 'Optional friendly name for the device',
                },
            },
            required: ['ip'],
        },
    },
    {
        name: 'sonos_list_devices',
        description: 'List devices currently in the registry. Note: Call sonos_discover first to populate the registry if a device is not found in the current registry. Returns UUID, IP address, room name, model, and software version of registered devices. Use room name to communicate with the user.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];

/**
 * Playback Control Tools
 */
export const playbackTools: Tool[] = [
    {
        name: 'sonos_play',
        description: 'Start or resume playback on a Sonos device. Continues from current queue position and respects volume settings. If device is in a group, affects entire group.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_pause',
        description: 'Pause playback on a Sonos device. Maintains current position in track and queue for quick resume. If device is in a group, affects entire group.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_stop',
        description: 'Stop playback on a Sonos device. Clears playback state, unlike pause which maintains position.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_next',
        description: 'Skip to next track in the queue.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_previous',
        description: 'Skip to previous track or restart current track if played more than a few seconds.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_get_transport_info',
        description: 'Get current transport state (playing, paused, stopped) and playback speed.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_get_position_info',
        description: 'Get current track information, position, and duration. Includes track metadata like title, artist, album.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
];

/**
 * Queue Management Tools
 */
export const queueTools: Tool[] = [
    {
        name: 'sonos_get_queue',
        description: 'Retrieve the current playback queue with track information. Supports pagination for large queues.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (0-based)',
                    default: 0,
                },
                count: {
                    type: 'number',
                    description: 'Number of tracks to retrieve',
                    default: 100,
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_add_to_queue',
        description: 'Add a track URI to the playback queue. Supports music library URIs and streaming service URIs. Optional metadata in DIDL-Lite XML format.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                uri: {
                    type: 'string',
                    description: 'Track URI (e.g., x-file-cifs://..., x-sonos-spotify:...)',
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
                    description: 'Add as next track to play',
                    default: false,
                },
            },
            required: ['deviceId', 'uri'],
        },
    },
    {
        name: 'sonos_remove_from_queue',
        description: 'Remove a track from the queue at the specified position.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Remove all tracks from the queue. Does not stop current playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_play_from_queue',
        description: 'Start playing from the queue at a specific position.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Save the current queue as a Sonos playlist with the specified title.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable shuffle mode for queue playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                shuffle: {
                    type: 'boolean',
                    description: 'True to enable shuffle, false to disable',
                },
            },
            required: ['deviceId', 'shuffle'],
        },
    },
    {
        name: 'sonos_set_repeat',
        description: 'Set repeat mode for queue playback. Options: off (no repeat), all (repeat entire queue), one (repeat current track).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable crossfade between tracks. Crossfade creates smooth transitions between songs.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable crossfade, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_get_playback_state',
        description: 'Get current playback settings including shuffle, repeat, crossfade, transport state, and speed.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
];

/**
 * Volume and Audio Control Tools
 */
export const volumeTools: Tool[] = [
    {
        name: 'sonos_set_volume',
        description: 'Set volume level on a Sonos device. Range: 0 (silent) to 100 (maximum). Affects entire group if device is grouped.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                volume: {
                    type: 'number',
                    description: 'Volume level (0-100)',
                    minimum: 0,
                    maximum: 100,
                },
            },
            required: ['deviceId', 'volume'],
        },
    },
    {
        name: 'sonos_get_volume',
        description: 'Get current volume level from a Sonos device.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_set_mute',
        description: 'Mute or unmute a Sonos device. Mute preserves volume level for quick unmute.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                mute: {
                    type: 'boolean',
                    description: 'True to mute, false to unmute',
                },
            },
            required: ['deviceId', 'mute'],
        },
    },
    {
        name: 'sonos_set_bass',
        description: 'Set bass EQ level. Range: -10 (reduced bass) to +10 (enhanced bass).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Set treble EQ level. Range: -10 (reduced treble) to +10 (enhanced treble).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Enable or disable loudness compensation. Loudness boosts bass and treble at low volumes for better sound quality.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable loudness, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_get_eq',
        description: 'Get current EQ settings including bass, treble, and loudness.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_set_night_mode',
        description: 'Set night mode for home theater devices. Reduces loud sounds and enhances quiet sounds for late-night viewing.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable night mode, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
    {
        name: 'sonos_set_dialog_mode',
        description: 'Set dialog enhancement for home theater devices. Enhances speech clarity in movies and TV shows.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                enabled: {
                    type: 'boolean',
                    description: 'True to enable dialog enhancement, false to disable',
                },
            },
            required: ['deviceId', 'enabled'],
        },
    },
];

/**
 * Group Management Tools
 */
export const groupTools: Tool[] = [
    {
        name: 'sonos_get_zone_groups',
        description: 'Get zone group topology showing which devices are grouped together and their coordinator.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_join_group',
        description: 'Join a device to another device\'s group for synchronized multi-room playback. The device will follow the master\'s playback.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Device to join from (room name, UUID, or IP)',
                },
                masterDeviceId: {
                    type: 'string',
                    description: 'Master/coordinator device (room name, UUID, or IP)',
                },
            },
            required: ['deviceId', 'masterDeviceId'],
        },
    },
    {
        name: 'sonos_unjoin',
        description: 'Remove a device from its current group, making it a standalone player.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_party_mode',
        description: 'Join all discovered devices to the specified device to create a whole-house audio experience.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address (will become group coordinator)',
                },
            },
            required: ['deviceId'],
        },
    },
];

/**
 * Music Library Browsing Tools
 */
export const libraryTools: Tool[] = [
    {
        name: 'sonos_browse_artists',
        description: 'Browse artists in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse albums in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse all tracks in the music library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse music genres in the library. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse Sonos playlists. Supports pagination for large collections.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Search the music library by artist, album, track, or genre. Returns matching items.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                searchType: {
                    type: 'string',
                    description: 'Type of content to search',
                    enum: ['artists', 'albums', 'tracks', 'genres'],
                },
                searchTerm: {
                    type: 'string',
                    description: 'Search term',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
        description: 'Browse a specific library item to get its children. For example, get albums for an artist or tracks for an album.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                objectId: {
                    type: 'string',
                    description: 'Object ID from a previous browse or search result',
                },
                startIndex: {
                    type: 'number',
                    description: 'Starting index for pagination (default: 0)',
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
];

/**
 * Alarm Management Tools
 */
export const alarmTools: Tool[] = [
    {
        name: 'sonos_list_alarms',
        description: 'List all configured alarms including their schedule, enabled status, and room assignments.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_create_alarm',
        description: 'Create a new alarm with specified time, days, music source, and settings. Returns the alarm ID.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Update an existing alarm. Only specified fields will be changed.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Delete an existing alarm permanently.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
                alarmId: {
                    type: 'string',
                    description: 'Alarm ID to delete',
                },
            },
            required: ['deviceId', 'alarmId'],
        },
    },
    {
        name: 'sonos_set_sleep_timer',
        description: 'Set a sleep timer to automatically stop playback after the specified duration. Format: HH:MM:SS (e.g., "00:30:00" for 30 minutes).',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Get remaining sleep timer duration. Returns empty if no timer is active.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_cancel_sleep_timer',
        description: 'Cancel the active sleep timer.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
];

/**
 * Snapshot and State Management Tools
 */
export const snapshotTools: Tool[] = [
    {
        name: 'sonos_snapshot',
        description: 'Take a snapshot of current device state including playback, volume, and EQ settings. Returns snapshot data for later restoration.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_restore_snapshot',
        description: 'Restore a previously saved snapshot to return device to its captured state. Optionally fade in volume.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
];

/**
 * Event Subscription Tools
 */
export const eventTools: Tool[] = [
    {
        name: 'sonos_subscribe_events',
        description: 'Subscribe to real-time events from a Sonos device service to receive automatic notifications of state changes.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Unsubscribe from a specific event subscription to stop receiving notifications.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
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
        description: 'Unsubscribe from all active event subscriptions for a specific device.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
    {
        name: 'sonos_list_subscriptions',
        description: 'List all active event subscriptions for a device including subscription IDs and services.',
        inputSchema: {
            type: 'object',
            properties: {
                deviceId: {
                    type: 'string',
                    description: 'Room name, UUID, or IP address',
                },
            },
            required: ['deviceId'],
        },
    },
];

/**
 * All tools combined
 */
export const allTools: Tool[] = [
    ...discoveryTools,
    ...playbackTools,
    ...queueTools,
    ...volumeTools,
    ...groupTools,
    ...libraryTools,
    ...alarmTools,
    ...snapshotTools,
    ...eventTools,
];
