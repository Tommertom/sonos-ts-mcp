# Queue Management Guide

This guide explains how to use the queue management features in the Sonos TypeScript MCP server.

## Overview

The queue is Sonos's central playback concept. Tracks are added to the queue, and the speaker plays through them sequentially. You can add tracks, remove them, reorder them, and save the queue as a playlist.

## Basic Queue Operations

### Get the Queue

Retrieve the current queue with full metadata:

```typescript
// Get first 100 tracks
const queue = await avTransport.getQueue(0, 100);

console.log(`Total tracks: ${queue.totalTracks}`);
queue.tracks.forEach(track => {
    console.log(`${track.position}. ${track.title} - ${track.artist}`);
});
```

**MCP Tool**:
```json
{
  "name": "sonos_get_queue",
  "arguments": {
    "deviceId": "192.168.1.100",
    "startIndex": 0,
    "count": 100
  }
}
```

### Add to Queue

Add a track to the end of the queue:

```typescript
await avTransport.addToQueue({
    uri: 'x-file-cifs://server/music/song.mp3',
});
```

Add with metadata:

```typescript
import { DidlMusicTrack, toDidlString } from './didl/index.js';

const track = new DidlMusicTrack({
    id: '-1',
    parentId: '-1',
    title: 'Amazing Song',
    artist: 'Great Artist',
    album: 'Best Album',
    resources: [{
        uri: 'x-file-cifs://server/music/song.mp3',
        protocolInfo: 'http-get:*:audio/mpeg:*',
        duration: '0:03:45',
    }],
});

await avTransport.addToQueue({
    uri: track.resources[0].uri,
    metadata: track,
});
```

**MCP Tool**:
```json
{
  "name": "sonos_add_to_queue",
  "arguments": {
    "deviceId": "192.168.1.100",
    "uri": "x-file-cifs://server/music/song.mp3"
  }
}
```

### Play Next

Add a track to play immediately after the current track:

```typescript
await avTransport.addToQueue({
    uri: 'x-file-cifs://server/music/urgent.mp3',
    playNext: true,
});
```

### Remove from Queue

Remove a specific track:

```typescript
await avTransport.removeFromQueue(5); // Remove track at position 5
```

**MCP Tool**:
```json
{
  "name": "sonos_remove_from_queue",
  "arguments": {
    "deviceId": "192.168.1.100",
    "position": 5
  }
}
```

### Clear Queue

Remove all tracks:

```typescript
await avTransport.removeAllTracksFromQueue();
```

**MCP Tool**:
```json
{
  "name": "sonos_clear_queue",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}
```

### Reorder Queue

Move a track to a different position:

```typescript
// Move track from position 10 to position 3
await avTransport.reorderQueue(10, 3);
```

## Advanced Queue Operations

### Play from Queue

Start playing from a specific queue position:

```typescript
await avTransport.playFromQueue(15); // Play track 15
```

This does three things:
1. Sets the queue as the active transport source
2. Seeks to the specified track
3. Starts playback

**MCP Tool**:
```json
{
  "name": "sonos_play_from_queue",
  "arguments": {
    "deviceId": "192.168.1.100",
    "position": 15
  }
}
```

### Save Queue as Playlist

Save the current queue as a Sonos playlist:

```typescript
const playlistId = await avTransport.saveQueue('My Awesome Mix');
console.log(`Saved as playlist ID: ${playlistId}`);
```

**MCP Tool**:
```json
{
  "name": "sonos_save_queue",
  "arguments": {
    "deviceId": "192.168.1.100",
    "title": "My Awesome Mix"
  }
}
```

## Playback Properties

### Shuffle

Enable shuffle:

```typescript
await avTransport.setShuffle(true);
const isShuffled = await avTransport.getShuffle();
```

**MCP Tool**:
```json
{
  "name": "sonos_set_shuffle",
  "arguments": {
    "deviceId": "192.168.1.100",
    "shuffle": true
  }
}
```

### Repeat

Set repeat mode:

```typescript
await avTransport.setRepeat('all');  // Repeat all tracks
await avTransport.setRepeat('one');  // Repeat current track
await avTransport.setRepeat('off');  // No repeat

const repeatMode = await avTransport.getRepeat();
```

**MCP Tool**:
```json
{
  "name": "sonos_set_repeat",
  "arguments": {
    "deviceId": "192.168.1.100",
    "mode": "all"
  }
}
```

### Crossfade

Enable smooth transitions between tracks:

```typescript
await avTransport.setCrossFade(true);
const isCrossfadeEnabled = await avTransport.getCrossFade();
```

**MCP Tool**:
```json
{
  "name": "sonos_set_crossfade",
  "arguments": {
    "deviceId": "192.168.1.100",
    "enabled": true
  }
}
```

### Get All Playback State

Get everything at once:

```typescript
// Using MCP tool
{
  "name": "sonos_get_playback_state",
  "arguments": {
    "deviceId": "192.168.1.100"
  }
}

// Returns:
{
  "shuffle": true,
  "repeat": "all",
  "crossfade": true,
  "playbackState": "PLAYING",
  "speed": "1"
}
```

## Enhanced Play URI

Play a URI with automatic metadata:

```typescript
await avTransport.playUri('http://example.com/song.mp3', {
    title: 'My Song',
    artist: 'My Artist',
    album: 'My Album',
    autoPlay: true,
});
```

With custom DIDL metadata:

```typescript
import { DidlMusicTrack } from './didl/index.js';

const track = new DidlMusicTrack({
    id: '-1',
    parentId: '-1',
    title: 'Custom Track',
    artist: 'Custom Artist',
    resources: [{
        uri: 'http://example.com/track.mp3',
        protocolInfo: 'http-get:*:audio/mpeg:*',
    }],
});

await avTransport.playUri(track.resources[0].uri, {
    metadata: track,
    autoPlay: true,
});
```

## Queue Metadata

The queue returns rich metadata for each track:

```typescript
const queue = await avTransport.getQueue();

queue.tracks.forEach(track => {
    console.log({
        position: track.position,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        albumArtUri: track.albumArtUri,
        uri: track.uri,
        // Full DIDL object available:
        metadata: track.metadata,
    });
});
```

## Common Patterns

### Building a Queue from Scratch

```typescript
// Clear existing queue
await avTransport.removeAllTracksFromQueue();

// Add tracks
const tracks = [
    { uri: 'x-file-cifs://server/music/track1.mp3', title: 'Song 1', artist: 'Artist 1' },
    { uri: 'x-file-cifs://server/music/track2.mp3', title: 'Song 2', artist: 'Artist 2' },
    { uri: 'x-file-cifs://server/music/track3.mp3', title: 'Song 3', artist: 'Artist 3' },
];

for (const track of tracks) {
    await avTransport.addToQueue({
        uri: track.uri,
        // Metadata will be auto-generated in future versions
    });
}

// Start playing
await avTransport.playFromQueue(1);

// Enable shuffle
await avTransport.setShuffle(true);
```

### Party Mode Queue

```typescript
// Enable shuffle and repeat
await avTransport.setShuffle(true);
await avTransport.setRepeat('all');
await avTransport.setCrossFade(true);

// Start the party!
await avTransport.playFromQueue(1);
```

### Queue Backup and Restore

```typescript
// Save current queue
const playlistId = await avTransport.saveQueue('Backup ' + new Date().toISOString());

// Later, restore by loading the playlist
// (This requires playlist loading - coming in Phase 2)
```

## URI Formats

Sonos supports various URI formats:

- **Local files**: `x-file-cifs://server/path/to/file.mp3`
- **Sonos playlists**: `file:///jffs/settings/savedqueues.rsq#5`
- **Spotify**: `x-sonos-spotify:spotify%3atrack%3a...`
- **Radio streams**: `x-sonosapi-stream:s12345?sid=254&flags=8224&sn=0`
- **Line-in**: `x-rincon-stream:RINCON_xxxx`
- **Queue reference**: `x-rincon-queue:RINCON_xxxx#0`

See the ContentDirectory specification for complete URI format documentation.

## Testing

Run the DIDL tests:

```bash
npm test didl
```

All 17 tests should pass, including:
- Resource creation and serialization
- Track property handling
- XML escaping/unescaping
- Multiple items
- Round-trip serialization/parsing
- Album container serialization

## Limitations

- **Queue browsing**: Currently limited to 100 items per call (use pagination)
- **Metadata auto-detection**: Simple fields only - full smart detection coming in Phase 2
- **Playlist loading**: Save implemented, but loading playlists into queue is Phase 2

## Future Enhancements (Phase 2+)

- Smart URI metadata detection (Spotify, Apple Music, etc.)
- Bulk queue operations
- Queue search and filter
- Playlist integration
- Music library integration
