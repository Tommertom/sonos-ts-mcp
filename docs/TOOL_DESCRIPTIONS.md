# Sonos MCP Server Tool Descriptions

This document provides comprehensive descriptions for all Sonos MCP Server tools, designed to help AI coding agents understand and effectively use the Sonos control API.

## Server Description

Sonos Multi-Room Audio Control Server. Specifically designed for coding agents and AI-driven home audio automation workflows. Provides comprehensive tools for discovering, controlling, and automating Sonos wireless speaker systems. Enables coding agents to build intelligent multi-room audio experiences, music library management, zone grouping, queue management, and integration with smart home platforms. Supports network discovery, real-time playback control, volume management, EQ settings, alarms, sleep timers, group coordination, and event subscriptions for building responsive audio applications.

**Device Identification**: All tools require a deviceId parameter which can be:
- Device name (e.g., "Kitchen", "Living Room") - most user-friendly
- Device UUID (e.g., "RINCON_xxxxx") - most reliable  
- IP address (e.g., "192.168.1.150") - direct access

**Always start with** `sonos_discover` or `sonos_list_devices` to find available devices before controlling them.

## Core Capabilities

- **Discovery & Registration**: Network scanning, manual device addition, device inventory
- **Playback Control**: Play, pause, stop, next, previous, queue management
- **Volume & Audio**: Volume control, mute, bass, treble, loudness, night mode, dialog enhancement
- **Multi-Room**: Zone grouping, party mode, synchronized playback
- **Music Library**: Browse artists, albums, tracks, genres, playlists, search
- **Queue Management**: Add, remove, clear, reorder, save as playlist
- **Playback Modes**: Shuffle, repeat, crossfade
- **Advanced Features**: Alarms, sleep timer, snapshots, event subscriptions

## Tool Categories

### 1. Discovery & Device Management

#### sonos_discover
**Purpose**: Discover Sonos devices on the local network using SSDP

**Coding Agent Benefits**:
- Build device discovery and setup interfaces
- Create automated device inventory systems
- Develop network scanning utilities
- Generate device lists for user selection
- Build multi-location audio system discovery
- Create device health monitoring tools

**Best Practices**:
- Always run discovery first in new environments
- Use 5000ms timeout for small networks, 10000ms for large homes
- Re-run discovery after adding/moving devices
- Handle zero devices gracefully
- Ensure same subnet as Sonos devices

#### sonos_add_device
**Purpose**: Manually add a Sonos device by IP address (fallback when SSDP fails)

**When to Use**:
- SSDP discovery blocked by firewall
- Devices on different VLAN/subnet
- Corporate networks with UPnP disabled
- Known static IP addresses preferred
- Remote access through VPN

**IP Discovery Guidance**:
- Check router's DHCP client list
- Use Sonos app: Settings → System → About My System
- Network scanner tools (nmap, Fing)
- mDNS/Bonjour browser (_sonos._tcp)

#### sonos_list_devices
**Purpose**: List all discovered and registered Sonos devices

**Use Cases**:
- Build device selector UI components
- Create system status dashboards
- Generate device inventory reports
- Validate device availability before control
- Build zone-based automation logic

### 2. Playback Control

#### sonos_play
**Purpose**: Start or resume playback

**Intelligent Automation Examples**:
- Morning Routine: 7:00 AM → sonos_play ("Kitchen")
- Motion Detected: Entry sensor → sonos_play ("Hallway")
- Voice Command: "Play music" → sonos_play (current room)
- Scene: "Dinner party" → sonos_play (all downstairs)
- Geofencing: Arrive home → sonos_play ("Living Room")

**Multi-Room Behavior**:
- If device is group coordinator: all group members play
- If device is group member: entire group plays

#### sonos_pause
**Purpose**: Pause playback (maintains position for resume)

**Automation Examples**:
- Phone call detected → sonos_pause (all rooms)
- Doorbell rings → sonos_pause → announce visitor
- Motion absence 10 min → sonos_pause (energy saving)
- Meeting starts → sonos_pause ("Office")
- All people leave → sonos_pause (entire home)

**Pause vs Stop**:
- Pause: Maintains state, quick resume, keeps position
- Stop: May reset position, clears some state

#### sonos_stop
**Purpose**: Stop playback completely

**When to Use**:
- End of automation routine
- Complete audio shutdown
- Before switching to different source
- Group ungrouping scenarios

#### sonos_next / sonos_previous
**Purpose**: Skip to next/previous track

**Use Cases**:
- Skip button implementations
- Voice commands ("next song", "previous track")
- Automated skip (skip ads, explicit content filtering)
- Gesture controls (swipe to skip)

### 3. Volume Control

#### sonos_set_volume
**Purpose**: Set device volume (0-100)

**Smart Volume Features**:
- Time-based: Lower volume at night
- Presence-based: Adjust by occupancy
- Content-based: Different levels for music vs podcasts
- Multi-room: Coordinate volumes across zones

**Safety Considerations**:
- Validate range 0-100
- Gradual changes for automation (avoid jarring jumps)
- Store previous volume for restore
- Consider quiet hours

**Volume Automation Examples**:
```
Morning: 6:30 AM → volume 30 (gentle wake)
Daytime: 9:00 AM → volume 50 (normal)
Evening: 6:00 PM → volume 60 (higher energy)
Night: 10:00 PM → volume 20 (quiet time)
```

#### sonos_get_volume
**Purpose**: Get current volume level

**Use Cases**:
- Display current volume in UI
- Store volume before temporary change
- Validate volume before playing
- Generate volume usage analytics

#### sonos_set_mute
**Purpose**: Mute or unmute device

**Quick Mute Scenarios**:
- Emergency silence button
- Phone call priority
- Doorbell mute automation
- Presentation mode

### 4. Queue Management

#### sonos_get_queue
**Purpose**: Retrieve current playback queue

**Returns**: Track list with metadata (title, artist, album, duration, URI)

**Use Cases**:
- Display "now playing" and "up next"
- Build queue editor interfaces
- Generate playlist summaries
- Track playback history

#### sonos_add_to_queue
**Purpose**: Add track/album/playlist to queue

**URI Formats**:
- Local library: `x-file-cifs://server/path/to/file.mp3`
- Spotify: `x-sonos-spotify:track:xxxxx`
- Radio: `x-sonosapi-stream:...`
- Line-in: `x-rincon-stream:RINCON_xxxxx`

**Options**:
- `position`: Insert at specific position
- `playNext`: Add as next track
- `metadata`: DIDL-Lite metadata XML

#### sonos_remove_from_queue
**Purpose**: Remove track at specific position

**Use Cases**:
- Queue editor "delete" button
- Smart filtering (remove duplicates)
- Auto-cleanup of played tracks

#### sonos_clear_queue
**Purpose**: Remove all tracks from queue

**When to Use**:
- Start fresh playlist
- Switch music mode completely
- End of party/event cleanup

#### sonos_play_from_queue
**Purpose**: Jump to specific queue position and start playing

**Use Cases**:
- "Play this track" from queue display
- Shuffle restart from specific track
- Resume from bookmarked position

#### sonos_save_queue
**Purpose**: Save current queue as a Sonos playlist

**Workflow**:
1. Build queue with desired tracks
2. sonos_save_queue with title
3. Playlist created and accessible from library

**Use Cases**:
- Save "liked" queue for later
- Create occasion-specific playlists
- Backup favorite combinations

### 5. Playback Modes

#### sonos_set_shuffle
**Purpose**: Enable or disable shuffle mode

**Smart Shuffle**:
- Auto-enable for party mode
- Disable for albums/curated playlists
- User preference learning

#### sonos_set_repeat
**Purpose**: Set repeat mode (off/all/one)

**Modes**:
- `off`: Play once through
- `all`: Repeat entire queue
- `one`: Repeat current track

**Use Cases**:
- Sleep sounds: repeat one track
- Party: repeat all (continuous music)
- Album listening: off (play through once)

#### sonos_set_crossfade
**Purpose**: Enable smooth transitions between tracks

**Benefits**:
- Professional DJ-style transitions
- Seamless music flow for parties
- Better for continuous listening

**When to Disable**:
- Podcasts and audiobooks
- Albums with intentional gaps
- Classical music (respects composition)

#### sonos_get_playback_state
**Purpose**: Get comprehensive playback state

**Returns**: shuffle, repeat, crossfade, playback state, speed

**Use Cases**:
- Display all playback settings in UI
- Sync settings across devices
- Restore playback state after changes

### 6. Multi-Room & Grouping

#### sonos_get_zone_groups
**Purpose**: Get current zone group topology

**Returns**: Groups with coordinator and members

**Use Cases**:
- Display room grouping in UI
- Plan group modifications
- Understand multi-room setup
- Identify group coordinators

#### sonos_join_group
**Purpose**: Join device to another device's group

**Workflow**:
```
sonos_join_group(
  deviceId: "Bedroom",
  masterDeviceId: "Living Room"
)
→ Bedroom now plays same audio as Living Room
```

**Multi-Room Scenarios**:
- Party mode: join all to main room
- Follow me: join rooms as you move
- Whole home audio: group all devices

#### sonos_unjoin
**Purpose**: Remove device from its group (make standalone)

**Use Cases**:
- End multi-room session
- Independent room control
- Split party into zones
- Reset group topology

#### sonos_party_mode
**Purpose**: Join ALL devices to one coordinator (whole-home audio)

**One Command**: Replaces multiple join operations

**Perfect For**:
- House parties
- Holiday music
- Cleaning/workout sessions
- Special events

**Cleanup**: Use sonos_unjoin on each device to restore independence

### 7. Music Library Browsing

#### sonos_browse_artists / sonos_browse_albums / sonos_browse_tracks
**Purpose**: Browse music library by category

**Pagination**:
- `startIndex`: Starting position (0-based)
- `count`: Number of items to return (default 100)

**Use Cases**:
- Build music library browsers
- Search/filter local music
- Generate "play artist" commands
- Music discovery interfaces

#### sonos_browse_genres
**Purpose**: Browse music by genre

**Use Cases**:
- Mood-based music selection
- Genre filter interfaces
- Smart playlists by genre

#### sonos_browse_playlists
**Purpose**: List Sonos playlists

**Returns**: User-created and imported playlists

**Use Cases**:
- Playlist selector UI
- Quick playlist playback
- Playlist management interfaces

#### sonos_search_library
**Purpose**: Search music library

**Search Types**: artists, albums, tracks, genres

**Intelligent Search**:
- Fuzzy matching support
- Partial name searches
- Artist + album combo searches

#### sonos_browse_item
**Purpose**: Browse into a specific item (get albums for artist, tracks for album)

**Workflow**:
```
1. sonos_browse_artists → get artist list
2. User selects artist
3. sonos_browse_item(artistId) → get artist's albums
4. User selects album  
5. sonos_browse_item(albumId) → get album's tracks
6. sonos_add_to_queue(trackUri) → play track
```

### 8. Audio Quality & EQ

#### sonos_set_bass / sonos_set_treble
**Purpose**: Adjust bass or treble level (-10 to +10)

**Recommendations**:
- Bass: -10 (thin) to +10 (boomy)
- Treble: -10 (muffled) to +10 (bright)
- Default: 0 (flat/neutral)

**Use Cases**:
- Room acoustic compensation
- Content type optimization (movies vs music)
- User preference profiles
- Hearing accessibility

#### sonos_set_loudness
**Purpose**: Enable loudness compensation (boosts bass at low volumes)

**When to Enable**:
- Low volume listening
- Background music
- Night time use

**When to Disable**:
- High volume listening
- Critical listening sessions
- Studio monitoring

#### sonos_get_eq
**Purpose**: Get current EQ settings (bass, treble, loudness)

**Use Cases**:
- Display current EQ in UI
- Save EQ presets
- Compare settings across devices

#### sonos_set_night_mode
**Purpose**: Reduce loud sounds for late night viewing (soundbars/home theater)

**Benefits**:
- Compresses dynamic range
- Quieter explosions/action
- Clearer dialog at low volume
- Neighbor-friendly

**Devices**: Sonos Beam, Arc, Playbar, Playbase

#### sonos_set_dialog_mode
**Purpose**: Enhance speech clarity (soundbars/home theater)

**Benefits**:
- Boosts center channel
- Clearer dialog in movies
- Better for speech-heavy content
- Accessibility feature

**Use Cases**:
- Movie watching
- News/podcasts on TV
- Hearing assistance

### 9. Sleep Timer & Alarms

#### sonos_set_sleep_timer
**Purpose**: Auto-stop playback after duration

**Duration Format**: "HH:MM:SS" (e.g., "00:30:00" for 30 minutes)

**Use Cases**:
- Bedtime music/podcast
- Meditation timer
- Nap time background sound
- Auto-off for efficiency

#### sonos_get_sleep_timer
**Purpose**: Get remaining sleep timer duration

**Returns**: Time remaining or null if no timer active

#### sonos_cancel_sleep_timer
**Purpose**: Cancel active sleep timer

**Use Cases**:
- User wants to continue listening
- Automation override
- Manual control takeover

#### sonos_list_alarms
**Purpose**: List all configured alarms

**Returns**: Alarm ID, time, recurrence, enabled state, volume

**Use Cases**:
- Alarm management UI
- Display upcoming alarms
- Alarm inventory for editing

#### sonos_create_alarm
**Purpose**: Create new alarm

**Parameters**:
- `startTime`: "HH:MM:SS" (e.g., "07:00:00")
- `recurrence`: DAILY, ONCE, WEEKDAYS, WEEKENDS, ON_0123456
- `enabled`: true/false
- `volume`: 0-100
- `duration`: How long to play

**Recurrence Examples**:
- `DAILY`: Every day
- `ONCE`: One-time alarm
- `WEEKDAYS`: Monday-Friday
- `WEEKENDS`: Saturday-Sunday  
- `ON_0123456`: Custom days (0=Sunday, 6=Saturday)
- `ON_135`: Monday, Wednesday, Friday

**Use Cases**:
- Wake-up alarms
- Scheduled music sessions
- Reminder sounds
- Automation triggers

#### sonos_update_alarm
**Purpose**: Modify existing alarm

**Updatable Fields**: startTime, recurrence, enabled, volume

**Use Cases**:
- Change alarm time
- Enable/disable alarm
- Adjust alarm volume
- Update recurrence pattern

#### sonos_delete_alarm
**Purpose**: Remove alarm

**Use Cases**:
- Delete one-time alarm after use
- Remove unwanted alarms
- Alarm management cleanup

### 10. Snapshot & Restore

#### sonos_snapshot
**Purpose**: Capture current device state

**Captured State**:
- Current track and position
- Queue contents
- Volume and mute state
- Playback mode (shuffle, repeat, crossfade)
- EQ settings

**Use Cases**:
- Temporary interruption (doorbell, announcement)
- Save state before party mode
- A/B testing audio settings
- Bookmark listening session

**Workflow**:
```
1. sonos_snapshot → save current state
2. Make changes (play announcement, adjust settings)
3. sonos_restore_snapshot → return to previous state
```

#### sonos_restore_snapshot
**Purpose**: Restore previously saved snapshot

**Parameters**:
- `snapshot`: JSON snapshot data
- `fade`: Gradually restore volume (smooth transition)

**Smart Restore**:
- Optionally fade volume up
- Resume at exact playback position
- Restore all playback modes
- Re-apply EQ settings

**Use Cases**:
- Return from interruption
- Cancel temporary changes
- Restore after test/demo
- Multi-state switching

### 11. Event Subscriptions (Advanced)

#### sonos_subscribe_events
**Purpose**: Subscribe to real-time device events

**Services**:
- `AVTransport`: Playback state, track changes
- `RenderingControl`: Volume, mute, EQ changes
- `Queue`: Queue modifications
- `ZoneGroupTopology`: Group changes
- `AlarmClock`: Alarm events

**Benefits**:
- Real-time UI updates
- Event-driven automation
- State change detection
- Responsive applications

**Timeout**: Default 30 minutes (1800s)

**Use Cases**:
- Live "now playing" displays
- Sync UI with physical controls
- Event-based automation triggers
- Multi-client coordination

#### sonos_unsubscribe_events
**Purpose**: Cancel specific subscription

**When to Unsubscribe**:
- No longer need event updates
- Clean up before shutdown
- Switch to polling mode
- Resource management

#### sonos_unsubscribe_all
**Purpose**: Cancel all subscriptions for a device

**Use Cases**:
- Application shutdown
- Reset all subscriptions
- Start fresh subscription state

#### sonos_list_subscriptions
**Purpose**: List active subscriptions for device

**Returns**: Subscription ID, endpoint, service, timeout, renewal time

**Use Cases**:
- Monitor subscription health
- Debug subscription issues
- Subscription management UI

## Common Workflows

### Setup New System
```
1. sonos_discover (timeout: 10000)
2. sonos_list_devices
3. Display devices to user
4. User selects device
5. Begin control operations
```

### Play Music from Library
```
1. sonos_browse_artists
2. User selects artist
3. sonos_browse_item (artistId) → get albums
4. User selects album
5. sonos_browse_item (albumId) → get tracks
6. sonos_add_to_queue (track URIs)
7. sonos_play
```

### Multi-Room Party Mode
```
1. sonos_list_devices → show all rooms
2. User selects master room
3. sonos_party_mode (master room) → join all devices
4. sonos_set_volume (master, 60) → set party volume
5. sonos_play → start music
... party time ...
6. Foreach device: sonos_unjoin → restore independence
```

### Morning Routine
```
1. Alarm triggers at 7:00 AM
2. sonos_set_volume ("Bedroom", 25) → gentle volume
3. sonos_browse_playlists → find "Morning Mix"
4. sonos_add_to_queue ("Morning Mix" URI)
5. sonos_set_shuffle (true)
6. sonos_play
7. sonos_set_sleep_timer ("00:30:00") → auto-stop after 30 min
```

### Doorbell Announcement
```
1. Doorbell rings (external trigger)
2. sonos_snapshot → save current state
3. sonos_set_volume (40) → announcement volume
4. sonos_add_to_queue ("doorbell_chime.mp3")
5. sonos_play → play chime
6. Wait for chime to finish
7. sonos_restore_snapshot (fade: true) → resume previous state
```

### Dynamic Volume by Time
```
Morning (6-9 AM): volume 30
Daytime (9 AM-6 PM): volume 50
Evening (6-10 PM): volume 60
Night (10 PM-6 AM): volume 20
```

## Best Practices for AI Agents

### 1. Device Discovery
- Always discover before first use
- Cache device list for performance
- Re-discover periodically (every 5-10 minutes)
- Handle discovery failures gracefully
- Provide manual add fallback

### 2. Error Handling
- Validate device exists before control
- Handle network timeouts
- Graceful degradation for offline devices
- Clear error messages to users
- Retry logic with exponential backoff

### 3. User Experience
- Confirm actions with feedback
- Show current state before changes
- Preview changes when possible
- Provide undo/restore options
- Smooth transitions (fade, gradual changes)

### 4. Multi-Room Awareness
- Check group topology before control
- Communicate group effects to user
- Handle group coordinator changes
- Coordinate multi-device operations

### 5. State Management
- Track device states locally
- Use events for real-time updates
- Validate state before assumptions
- Handle state conflicts gracefully

### 6. Performance
- Cache device information
- Batch operations when possible
- Use event subscriptions vs polling
- Minimize redundant API calls

### 7. Safety
- Validate volume ranges
- Gradual volume changes
- Check volume before playing
- Quiet hours enforcement
- User confirmation for disruptive actions

## URI Format Reference

### Local Music Library
```
x-file-cifs://server/music/Artist/Album/Track.mp3
x-file-cifs://nas.local/music/Beatles/Abbey%20Road/01%20Come%20Together.mp3
```

### Streaming Services
```
Spotify Track: x-sonos-spotify:track:xxxxx
Spotify Playlist: x-rincon-cpcontainer:1006206cspotify:user:xxxxx:playlist:yyyyy
Apple Music: x-sonos-http:track:xxxxx.mp4
```

### Radio
```
TuneIn: x-sonosapi-stream:sxxxxx
Radio Paradise: x-rincon-mp3radio://stream.radioparadise.com/aac-320
```

### Line-In
```
x-rincon-stream:RINCON_B8E9373C90DC01400
```

## Recurrence Pattern Reference

### Standard Patterns
- `DAILY`: Every day
- `ONCE`: One-time only
- `WEEKDAYS`: Monday through Friday
- `WEEKENDS`: Saturday and Sunday

### Custom Patterns (ON_XXXXXXX)
Format: `ON_` followed by day numbers (0=Sunday, 6=Saturday)

Examples:
- `ON_0123456`: Every day (same as DAILY)
- `ON_12345`: Monday-Friday (same as WEEKDAYS)  
- `ON_06`: Saturday and Sunday (same as WEEKENDS)
- `ON_135`: Monday, Wednesday, Friday
- `ON_0`: Sundays only
- `ON_26`: Tuesday and Saturday

## Troubleshooting Guide

### Device Not Found
1. Verify device powered on
2. Check network connectivity
3. Ensure same subnet
4. Try manual add with IP
5. Check firewall/UPnP settings

### Playback Not Working
1. Check if queue is empty
2. Verify device not muted
3. Check volume level
4. Verify group topology
5. Check audio source availability

### Group Issues
1. Get current zone groups
2. Verify device UUIDs
3. Check network stability
4. Try unjoin then rejoin
5. Restart affected devices

### Event Subscription Failures
1. Check network accessibility
2. Verify callback URL reachable
3. Check subscription timeout
4. Review firewall rules
5. Try shorter timeout value

## Additional Resources

- [Sonos UPnP Documentation](http://musicpartners.sonos.com/)
- [DIDL-Lite Specification](http://www.upnp.org/)
- [UPnP Device Architecture](http://www.upnp.org/specs/arch/UPnP-arch-DeviceArchitecture-v1.0.pdf)
