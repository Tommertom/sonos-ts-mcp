# Changelog

All notable changes to the Sonos TypeScript MCP Server project.

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
