import type { ToolHandlerMap } from './types/handler-types.js';

// Import all handler modules
import { handleDiscover, handleAddDevice, handleListDevices } from './handlers/discovery-handlers.js';
import {
    handlePlay,
    handlePause,
    handleStop,
    handleNext,
    handlePrevious,
    handleGetTransportInfo,
    handleGetPositionInfo,
} from './handlers/playback-handlers.js';
import {
    handleGetQueue,
    handleAddToQueue,
    handleRemoveFromQueue,
    handleClearQueue,
    handlePlayFromQueue,
    handleSaveQueue,
    handleSetShuffle,
    handleSetRepeat,
    handleSetCrossfade,
    handleGetPlaybackState,
} from './handlers/queue-handlers.js';
import {
    handleSetVolume,
    handleGetVolume,
    handleSetMute,
    handleSetBass,
    handleSetTreble,
    handleSetLoudness,
    handleGetEQ,
    handleSetNightMode,
    handleSetDialogMode,
} from './handlers/volume-handlers.js';
import {
    handleGetZoneGroups,
    handleJoinGroup,
    handleUnjoin,
    handlePartyMode,
} from './handlers/group-handlers.js';
import {
    handleBrowseArtists,
    handleBrowseAlbums,
    handleBrowseTracks,
    handleBrowseGenres,
    handleBrowsePlaylists,
    handleSearchLibrary,
    handleBrowseItem,
} from './handlers/library-handlers.js';
import {
    handleListAlarms,
    handleCreateAlarm,
    handleUpdateAlarm,
    handleDeleteAlarm,
    handleSetSleepTimer,
    handleGetSleepTimer,
    handleCancelSleepTimer,
} from './handlers/alarm-handlers.js';
import {
    handleSnapshot,
    handleRestoreSnapshot,
} from './handlers/snapshot-handlers.js';
import {
    handleSubscribeEvents,
    handleUnsubscribeEvents,
    handleUnsubscribeAll,
    handleListSubscriptions,
} from './handlers/event-handlers.js';

/**
 * Tool handler registry - maps tool names to handler functions
 */
export const toolHandlers: ToolHandlerMap = {
    // Discovery handlers
    'sonos_discover': handleDiscover,
    'sonos_add_device': handleAddDevice,
    'sonos_list_devices': handleListDevices,

    // Playback handlers
    'sonos_play': handlePlay,
    'sonos_pause': handlePause,
    'sonos_stop': handleStop,
    'sonos_next': handleNext,
    'sonos_previous': handlePrevious,
    'sonos_get_transport_info': handleGetTransportInfo,
    'sonos_get_position_info': handleGetPositionInfo,

    // Queue handlers
    'sonos_get_queue': handleGetQueue,
    'sonos_add_to_queue': handleAddToQueue,
    'sonos_remove_from_queue': handleRemoveFromQueue,
    'sonos_clear_queue': handleClearQueue,
    'sonos_play_from_queue': handlePlayFromQueue,
    'sonos_save_queue': handleSaveQueue,
    'sonos_set_shuffle': handleSetShuffle,
    'sonos_set_repeat': handleSetRepeat,
    'sonos_set_crossfade': handleSetCrossfade,
    'sonos_get_playback_state': handleGetPlaybackState,

    // Volume and audio handlers
    'sonos_set_volume': handleSetVolume,
    'sonos_get_volume': handleGetVolume,
    'sonos_set_mute': handleSetMute,
    'sonos_set_bass': handleSetBass,
    'sonos_set_treble': handleSetTreble,
    'sonos_set_loudness': handleSetLoudness,
    'sonos_get_eq': handleGetEQ,
    'sonos_set_night_mode': handleSetNightMode,
    'sonos_set_dialog_mode': handleSetDialogMode,

    // Group management handlers
    'sonos_get_zone_groups': handleGetZoneGroups,
    'sonos_join_group': handleJoinGroup,
    'sonos_unjoin': handleUnjoin,
    'sonos_party_mode': handlePartyMode,

    // Library browsing handlers
    'sonos_browse_artists': handleBrowseArtists,
    'sonos_browse_albums': handleBrowseAlbums,
    'sonos_browse_tracks': handleBrowseTracks,
    'sonos_browse_genres': handleBrowseGenres,
    'sonos_browse_playlists': handleBrowsePlaylists,
    'sonos_search_library': handleSearchLibrary,
    'sonos_browse_item': handleBrowseItem,

    // Alarm and timer handlers
    'sonos_list_alarms': handleListAlarms,
    'sonos_create_alarm': handleCreateAlarm,
    'sonos_update_alarm': handleUpdateAlarm,
    'sonos_delete_alarm': handleDeleteAlarm,
    'sonos_set_sleep_timer': handleSetSleepTimer,
    'sonos_get_sleep_timer': handleGetSleepTimer,
    'sonos_cancel_sleep_timer': handleCancelSleepTimer,

    // Snapshot handlers
    'sonos_snapshot': handleSnapshot,
    'sonos_restore_snapshot': handleRestoreSnapshot,

    // Event subscription handlers
    'sonos_subscribe_events': handleSubscribeEvents,
    'sonos_unsubscribe_events': handleUnsubscribeEvents,
    'sonos_unsubscribe_all': handleUnsubscribeAll,
    'sonos_list_subscriptions': handleListSubscriptions,
};
