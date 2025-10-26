# Changelog

All notable changes to the Sonos TypeScript MCP Server project.

## [Unreleased]

### Added
- **Comprehensive Tool Descriptions**: Enhanced all MCP tool descriptions with detailed guidance for AI coding agents
  - Added "CODING AGENT BENEFITS" sections explaining automation use cases
  - Included "HOW IT WORKS" technical details for each tool
  - Provided "BEST PRACTICES FOR AI AGENTS" with implementation guidance
  - Added "INTELLIGENT AUTOMATION EXAMPLES" showing real-world scenarios
  - Created comprehensive workflows and troubleshooting guides
  - Similar to Plugwise MCP server style with extensive educational content
  - See `docs/TOOL_DESCRIPTIONS.md` for complete reference documentation
- **Enhanced Server Description**: Updated server metadata with comprehensive overview
  - Added detailed description of server capabilities and use cases
  - Included device identification format explanations
  - Added console logging for server capabilities on startup
  - Optimized for AI assistant understanding and effective use
- **Intelligent Device Resolution**: Control devices using friendly names instead of UUIDs
  - Accepts device names (e.g., "Kitchen"), UUIDs, or IP addresses
  - Case-insensitive name matching
  - Supports partial name matching when unambiguous
  - Helpful error messages when devices are not found or names are ambiguous
  - New `DeviceResolver` class handles all resolution logic
  - All MCP tools now accept friendly device names
  - Resolution priority: UUID → IP → Exact name → Partial name
  - See `docs/device-resolution.md` for complete documentation
- **Automatic Discovery**: Server now automatically discovers devices on startup and every 5 minutes
  - Initial discovery runs immediately after server starts
  - Periodic discovery every 5 minutes (300 seconds) keeps device registry updated
  - Full device details fetched from device_description.xml (name, model, software version)
  - Preserves existing device details when re-discovering known devices
  - Graceful shutdown stops periodic discovery timer
  - See `docs/auto-discovery.md` for complete documentation
- **Documentation Suite**: Created comprehensive documentation in `docs/` folder
  - `TOOL_DESCRIPTIONS.md`: Complete tool reference with 50+ tools documented
  - Workflow examples for common scenarios
  - URI format reference for all media types
  - Recurrence pattern reference for alarms
  - Troubleshooting guide for common issues
  - Best practices for AI agent development

### Changed
- **Tool Descriptions**: Updated all `deviceId` parameter descriptions to indicate name support
  - Changed from "Device UUID or IP address" to "Device name (e.g., 'Kitchen'), UUID, or IP address"
  - Makes tool usage more intuitive for LLMs and users
  - Backward compatible with existing UUID and IP-based workflows
- **README**: Enhanced with links to comprehensive documentation
  - Added prominent documentation section
  - Links to tool descriptions, API reference, and examples
  - Emphasized AI agent and automation use cases

### Fixed
- **Phase 4 MCP Tools**: Implemented missing MCP server tools for event subscriptions
  - `sonos_subscribe_events` - Subscribe to real-time device events
  - `sonos_unsubscribe_events` - Unsubscribe from specific subscription
  - `sonos_unsubscribe_all` - Unsubscribe from all device events
  - `sonos_list_subscriptions` - List active subscriptions
  - Fixes test-phase4.ts script which was calling non-existent tools
  - Event subscription system is now fully usable via MCP protocol

### Documentation
- Created `docs/device-resolution.md` with comprehensive device resolution documentation
- Added device resolution guide to README.md documentation section
- Updated README.md features list to highlight intelligent device resolution
- Updated `docs/PHASE-4-COMPLETE.md` with MCP tool documentation and usage examples
- Added Phase 4 event subscription tools to README.md tool listing
- Created `docs/auto-discovery.md` with comprehensive auto-discovery documentation
- Updated implementation guide with auto-discovery notes

### Testing
- Added comprehensive test suite for `DeviceResolver` class (15 tests)
  - Tests for UUID, IP, and name resolution
  - Tests for case-insensitive and partial matching
  - Tests for ambiguity detection and error handling
  - Tests for whitespace handling
- Created `scripts/test-device-resolution.ts` demonstration script
- Added `npm run test:resolution` command to package.json

## [1.4.0] - 2025-10-13 - Phase 4 Complete

### Added

#### Event Subscription System (UPnP GENA Protocol)
- **EventListener** - HTTP server for receiving NOTIFY callbacks from Sonos devices
  - Automatic local IP detection for callback URLs
  - Configurable listening port (default: 4000, via `SONOS_LISTENER_PORT`)
  - XML event parsing for UPnP event properties
  - Graceful start/stop lifecycle management

- **SubscriptionManager** - Complete subscription lifecycle management
  - Subscribe to device events with automatic SID tracking
  - Auto-renewal (5 minutes before expiry)
  - Unsubscribe support (single, device, or all subscriptions)
  - Event handler registration and dispatching
  - Type-safe event handlers with TypeScript generics

- **EventParser** - Intelligent event XML parsing
  - Parses LastChange XML from multiple service endpoints
  - Extracts DIDL-Lite track metadata
  - Converts raw XML to typed TypeScript event objects
  - Supports AVTransport, RenderingControl, Queue, Topology, and Alarm events

- **Event Types** - Comprehensive TypeScript type system
  - `AVTransportEvent` - Transport state, track info, play mode
  - `RenderingControlEvent` - Volume, mute, EQ settings
  - `PlayStateEvent` - Simplified playing/paused/stopped states
  - `VolumeEvent`, `MuteEvent` - Specific audio change events
  - `CurrentTrackEvent`, `NextTrackEvent` - Track metadata
  - `QueueChangedEvent` - Queue modification notifications
  - `ZoneGroupTopologyEvent`, `ZonesChangedEvent` - Group changes
  - `AlarmClockEvent` - Alarm list modifications

#### Service Integration
- Added event subscription methods to `BaseService`:
  - `subscribe(options?)` - Subscribe to service events
  - `unsubscribe(sid)` - Unsubscribe from events
  - `on<T>(eventType, handler)` - Register typed event handler
  - `off<T>(eventType, handler)` - Unregister event handler
- All services (AVTransport, RenderingControl, etc.) now support real-time events

#### Testing & Scripts
- New `scripts/test-events.ts` - Manual event subscription testing
  - Device discovery or manual IP specification
  - Subscribes to AVTransport and RenderingControl events
  - Real-time event display in console
  - Graceful shutdown with Ctrl+C
- Added `npm run test:events` script to package.json

### Changed
- Version bumped to 1.4.0
- Updated README.md with Phase 4 feature status
- Enhanced documentation with event subscription examples

### Documentation
- New `docs/PHASE-4-COMPLETE.md` - Comprehensive phase documentation
  - Event system architecture and flow
  - Usage examples and code snippets
  - Event type reference table
  - Endpoint reference
  - Known limitations and future enhancements
- New `docs/PHASE-4-SUMMARY.md` - Implementation summary

### Technical Details
- Native Node.js HTTP module (no external dependencies)
- Full TypeScript type safety for all events
- Automatic subscription renewal prevents timeouts
- Efficient singleton pattern for listener and manager
- ~1,800 lines of new code across 6 new files

## [1.3.0] - 2025-10-13 - Phase 3 Complete

### Added

#### Enhanced Audio Controls (RenderingControl Service)
- `setLoudness(enabled)` / `getLoudness()` - Loudness compensation toggle
- `setNightMode(enabled)` / `getNightMode()` - Night mode for home theater devices
- `setDialogLevel(enabled)` / `getDialogLevel()` - Dialog enhancement for home theater
- `setSubGain(gain)` / `getSubGain()` - Subwoofer gain control (-15 to 15)
- `setSubEnabled(enabled)` / `getSubEnabled()` - Subwoofer enable/disable
- `rampToVolume(volume, rampType)` - Gradual volume ramping

#### Sleep Timer (AVTransport Service)
- `configureSleepTimer(duration)` - Set automatic playback stop (HH:MM:SS format)
- `getSleepTimerRemaining()` - Get remaining sleep timer duration
- `cancelSleepTimer()` - Cancel the sleep timer

#### Alarm Management (New AlarmClock Service)
- Complete `AlarmClockService` class for alarm management
- `listAlarms()` - Get all configured alarms with full details
- `createAlarm(options)` - Create new alarms with comprehensive configuration:
  - Start time, duration, recurrence (DAILY, ONCE, WEEKDAYS, WEEKENDS, ON_0123456)
  - Volume, play mode, program URI, metadata
  - Linked zones support
- `updateAlarm(id, options)` - Update existing alarms
- `destroyAlarm(id)` - Delete alarms
- `getAlarmListVersion()` - Get alarm list version
- `setFormat(format)` / `getFormat()` - Time format settings (12/24 hour)

#### Snapshot and Restore (New Snapshot Service)
- Complete `SnapshotService` class for state management
- `snapshot()` - Capture complete device state:
  - Transport state (playing/paused/stopped)
  - Current track URI, position, and metadata
  - Play mode (shuffle, repeat, etc.)
  - Volume, mute, bass, treble, loudness
  - Group membership and coordinator status
  - Timestamp
- `restore(snapshot, fade)` - Restore previous state with optional volume fade
- `withSnapshot(action, fade)` - Execute action with automatic state restore
- Perfect for announcements and temporary audio interruptions

#### Party Mode (ZoneGroupTopology Service)
- `partyMode()` - Join all discovered devices to coordinator's group
- Automatic device discovery and joining
- Returns list of successfully joined device UUIDs

#### MCP Tools - Audio/EQ Controls (6 new)
- `sonos_set_bass` - Set bass level (-10 to 10)
- `sonos_set_treble` - Set treble level (-10 to 10)
- `sonos_set_loudness` - Enable/disable loudness compensation
- `sonos_get_eq` - Get all EQ settings
- `sonos_set_night_mode` - Enable/disable night mode
- `sonos_set_dialog_mode` - Enable/disable dialog enhancement

#### MCP Tools - Sleep Timer (3 new)
- `sonos_set_sleep_timer` - Set sleep timer
- `sonos_get_sleep_timer` - Get remaining timer
- `sonos_cancel_sleep_timer` - Cancel sleep timer

#### MCP Tools - Alarms (4 new)
- `sonos_list_alarms` - List all alarms
- `sonos_create_alarm` - Create new alarm
- `sonos_update_alarm` - Update existing alarm
- `sonos_delete_alarm` - Delete alarm

#### MCP Tools - State Management (2 new)
- `sonos_snapshot` - Take device snapshot
- `sonos_restore_snapshot` - Restore from snapshot

#### MCP Tools - Party Mode (1 new)
- `sonos_party_mode` - Join all devices at once

### Changed
- Updated server version to 1.3.0
- Enhanced RenderingControl service with 10 new methods
- Extended AVTransport service with sleep timer functionality
- Improved ZoneGroupTopology with party mode support

### Tests
- Added comprehensive tests for all Phase 3 features
- New test files:
  - `tests/alarm-clock.test.ts` - Alarm service tests
  - `tests/snapshot.test.ts` - Snapshot service tests
  - `tests/rendering-control-phase3.test.ts` - EQ and audio enhancement tests
- Total: 70 tests passing (59 from Phases 1-2, 11 new)

### Documentation
- Added `PHASE-3-COMPLETE.md` with detailed implementation guide
- Updated `implementation-guide.md` with Phase 3 features and examples
- Updated `README.md` to reflect Phase 3 completion
- Added comprehensive use cases and examples for all new features

### Performance & Compatibility
- All Phase 3 features maintain backward compatibility with Phases 1 and 2
- No breaking changes to existing APIs
- Efficient state capture and restoration
- Sequential device joining for party mode to avoid overload

### Known Limitations
- Event subscriptions (GENA) not yet implemented (planned for Phase 4)
- Night mode/dialog enhancement only available on home theater devices
- Subwoofer controls only available when subwoofer is paired
- Snapshot cannot restore cloud queue playback (Alexa queues)

## [1.2.0] - 2025-10-13 - Phase 2 Complete

### Added

#### ContentDirectory Service
- Complete `ContentDirectoryService` class for music library browsing
- Browse operations with pagination:
  - `browse(objectId, options)` - Browse any container
  - `browseMetadata(objectId)` - Get metadata for specific item
  - `getArtists(options)` - Browse all artists
  - `getAlbumArtists(options)` - Browse album artists
  - `getAlbums(options)` - Browse all albums
  - `getGenres(options)` - Browse all genres
  - `getComposers(options)` - Browse all composers
  - `getTracks(options)` - Browse all tracks
  - `getPlaylists(options)` - Browse imported playlists
  - `getSonosPlaylists(options)` - Browse Sonos playlists
  - `getSonosFavorites(options)` - Browse Sonos favorites
  - `getFavoriteRadioStations(options)` - Browse radio stations
  - `getFavoriteRadioShows(options)` - Browse radio shows
- Search functionality:
  - `search(searchType, searchTerm, options)` - Fuzzy search in library
  - Support for artist, album, track, and genre searches
  - Automatic special character escaping
- Advanced features:
  - `browseSubcategory(parentObjectId, options)` - Navigate subcategories
  - `getAll(objectId, maxItems)` - Automatic pagination for all items
  - `getShares()` - List music library shares
  - `isLibraryUpdating()` - Check library update status
  - `startLibraryUpdate()` - Trigger library scan
- SoCo-compatible object ID schema (A:ARTIST, A:ALBUM, SQ:, FV:2, etc.)

#### Group Management
- `join(masterUuid)` - Join device to another device's group
- `unjoin()` - Remove device from its current group
- `isCoordinator()` - Check if device is group coordinator
- `getGroup()` - Get device's current group
- RINCON URI-based group joining
- Standalone group coordination support

#### MCP Tools - Music Library
- `sonos_browse_artists` - Browse all artists with pagination
- `sonos_browse_albums` - Browse all albums with pagination
- `sonos_browse_tracks` - Browse all tracks with pagination
- `sonos_browse_genres` - Browse all genres with pagination
- `sonos_browse_playlists` - Browse Sonos playlists
- `sonos_search_library` - Search music library (artists, albums, tracks, genres)
- `sonos_browse_item` - Browse subcategories (e.g., albums for an artist)

#### MCP Tools - Group Management
- `sonos_join_group` - Join device to another device's group
- `sonos_unjoin` - Remove device from its group

### Changed
- Refactored `AVTransportService.getQueue()` to use `ContentDirectoryService`
- Improved service architecture with clear separation of concerns
- Enhanced test coverage to 59 tests total

### Tests
- Added 19 comprehensive tests for `ContentDirectoryService`
- Tests for browse operations with pagination
- Tests for search functionality with special character handling
- Tests for library update status
- All 59 tests passing (40 from Phase 1, 19 new)

### Documentation
- Added `PHASE-2-COMPLETE.md` with detailed implementation notes
- Updated `implementation-guide.md` with Phase 2 features
- Added comprehensive usage examples for new tools

## [1.1.0] - 2025-10-13 - Phase 1 Complete

### Added

#### DIDL-Lite Implementation
- Complete DIDL-Lite object model based on UPnP ContentDirectory specification
- `DidlObject` base class with Map-based property storage to avoid TypeScript initialization bugs
- `DidlResource` class for playable resource metadata
- Item hierarchy:
  - `DidlItem`, `DidlAudioItem`, `DidlMusicTrack` (most common)
  - `DidlAudioBook`, `DidlAudioBroadcast`, `DidlAudioLineIn`
  - `DidlRecentShow`, `DidlAudioBroadcastFavorite`, `DidlFavorite`
- Container hierarchy:
  - `DidlContainer`, `DidlAlbum`, `DidlMusicAlbum`
  - `DidlMusicAlbumFavorite`, `DidlMusicAlbumCompilation`
  - `DidlPerson`, `DidlComposer`, `DidlMusicArtist`
  - `DidlAlbumList`, `DidlPlaylistContainer`, `DidlSameArtist`
  - `DidlPlaylistContainerFavorite`, `DidlPlaylistContainerTracklist`
  - `DidlGenre`, `DidlMusicGenre`, `DidlRadioShow`
- XML serialization (`toDidlString`, `didlObjectToXml`)
- XML parsing (`fromDidlString`)
- Comprehensive DIDL test suite (17 tests, all passing)

#### Queue Management
- `getQueue(startIndex, count)` - Browse queue with full DIDL metadata
- `addToQueue(options)` - Add tracks with metadata, position, playNext support
- `removeFromQueue(position)` - Remove single track
- `removeRangeFromQueue(start, count)` - Remove multiple tracks
- `reorderQueue(oldPos, newPos)` - Reorder queue tracks
- `saveQueue(title)` - Save queue as Sonos playlist
- `playFromQueue(position)` - Play from specific queue position
- `removeAllTracksFromQueue()` - Clear entire queue
- Queue type definitions (`QueueInfo`, `QueueTrack`, `AddToQueueOptions`)

#### MCP Tools - Queue
- `sonos_get_queue` - Get current queue
- `sonos_add_to_queue` - Add URI to queue
- `sonos_remove_from_queue` - Remove track from queue
- `sonos_clear_queue` - Clear all tracks
- `sonos_play_from_queue` - Play from queue position
- `sonos_save_queue` - Save queue as playlist

#### Playback Properties
- `setShuffle(enabled)` - Enable/disable shuffle
- `getShuffle()` - Get shuffle state
- `setRepeat(mode)` - Set repeat mode (off/all/one)
- `getRepeat()` - Get repeat mode
- `setCrossFade(enabled)` - Enable/disable crossfade
- `getCrossFade()` - Get crossfade state
- `getPlayMode()` - Get raw UPnP play mode
- Smart mode preservation (shuffle + repeat combinations)

#### MCP Tools - Playback Properties
- `sonos_set_shuffle` - Control shuffle
- `sonos_set_repeat` - Control repeat
- `sonos_set_crossfade` - Control crossfade
- `sonos_get_playback_state` - Get all playback properties

#### Enhanced Play URI
- `playUri(uri, options)` - Play with metadata, title/artist/album, autoPlay

#### Documentation
- `PHASE-1-COMPLETE.md` - Phase 1 completion report
- `queue-management-guide.md` - Comprehensive queue usage guide
- `SESSION-SUMMARY.md` - High-level development summary
- Updated README.md with new features and tools

### Changed
- `AVTransportService` expanded from 150 to 400+ lines
- MCP server now has 25 tools (was 14)
- Test count increased to 40 (was 23)

### Dependencies
- Added `xml2js` for XML parsing
- Added `@types/xml2js` for TypeScript support

### Technical Notes
- Solved TypeScript class field initialization bug using Map-based storage
- All tests passing (40/40)
- Zero TypeScript errors
- Zero ESLint warnings
- 100% build success rate

---

## [1.0.0] - Initial Release

### Added
- SSDP device discovery
- Manual device registration
- Basic playback control (play, pause, stop, next, previous)
- Volume control (get, set, mute)
- Transport info retrieval
- Position info retrieval
- Zone group topology
- MCP server implementation with 14 tools
- Complete SOAP/UPnP client implementation
- Device registry
- Comprehensive test suite (23 tests)

### MCP Tools - Initial
- `sonos_discover`
- `sonos_add_device`
- `sonos_list_devices`
- `sonos_play`
- `sonos_pause`
- `sonos_stop`
- `sonos_next`
- `sonos_previous`
- `sonos_set_volume`
- `sonos_get_volume`
- `sonos_set_mute`
- `sonos_get_transport_info`
- `sonos_get_position_info`
- `sonos_get_zone_groups`

---

## Future Releases

### [1.2.0] - Planned (Phase 2)
- Group management (join, unjoin, party mode)
- Playlist management
- Music library browsing
- Event subscriptions
- Enhanced metadata detection

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- MAJOR version: incompatible API changes
- MINOR version: backward-compatible functionality additions
- PATCH version: backward-compatible bug fixes

Current version: **1.1.0** (Phase 1 Complete)
