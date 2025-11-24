# Finding Radio Stations by Name Using MCP Tools

## Overview

This guide explains how an AI agent can find a radio station's system identifier (URI) given a user-friendly name like "Radio 2" or "BBC 4" using the existing Sonos MCP tools.

## Problem Statement

When a user asks to "Play Radio 2", the agent needs to:
1. Get a list of all favorite radio stations
2. Find the station matching "Radio 2" (fuzzy matching)
3. Extract the system identifier (URI) needed to play it

## Available MCP Tools

### 1. `sonos_get_favorite_radio_stations`

Retrieves all radio stations saved in the user's Sonos favorites.

**Parameters:**
- `deviceId` (required): The device identifier
- `startIndex` (optional): Starting position for pagination (default: 0)
- `count` (optional): Number of items to return (default: 100)

**Returns:**
```json
{
  "items": [
    {
      "id": "R:0/0/5",
      "parentId": "R:0/0",
      "title": "NPO Radio 2",
      "upnpClass": "object.item.audioItem.audioBroadcast",
      "resources": [
        {
          "uri": "x-sonosapi-stream:s49815?sid=254&flags=8224&sn=0",
          "protocolInfo": "..."
        }
      ]
    }
  ],
  "total": 10,
  "returned": 10
}
```

### 2. `sonos_get_sonos_favorites`

Retrieves all Sonos favorites (includes radio stations, playlists, albums, etc.).

**Parameters:**
- `deviceId` (required): The device identifier
- `startIndex` (optional): Starting position (default: 0)
- `count` (optional): Number of items (default: 100)

**Returns:** Similar structure to `sonos_get_favorite_radio_stations`, but includes all favorite types.

## Step-by-Step Workflow

### Step 1: Retrieve All Favorite Radio Stations

Call the MCP tool to get the complete list of radio stations:

```typescript
// MCP tool call
const result = await mcp.call('sonos_get_favorite_radio_stations', {
  deviceId: 'RINCON_XXX',
  startIndex: 0,
  count: 100
});

const stations = result.items;  // Array of station objects
```

**Example response:**
```json
{
  "items": [
    { "title": "NPO Radio 2", "resources": [{"uri": "x-sonosapi-stream:s49815?sid=254"}] },
    { "title": "BBC Radio 4", "resources": [{"uri": "x-sonosapi-stream:s44491?sid=254"}] },
    { "title": "Jazz FM", "resources": [{"uri": "x-rincon-mp3radio://stream.jazzfm.com"}] }
  ],
  "total": 3
}
```

### Step 2: Fuzzy Match the Station Name

Implement intelligent matching to find the station from the user's query:

```typescript
function findBestMatch(stations: any[], query: string): any | null {
  const queryLower = query.toLowerCase().trim();
  
  // Priority 1: Exact match (case-insensitive)
  const exactMatch = stations.find(s => 
    s.title.toLowerCase() === queryLower
  );
  if (exactMatch) {
    return { station: exactMatch, confidence: 100 };
  }
  
  // Priority 2: Title contains query
  const containsMatches = stations.filter(s =>
    s.title.toLowerCase().includes(queryLower)
  );
  
  if (containsMatches.length === 1) {
    return { station: containsMatches[0], confidence: 90 };
  }
  
  if (containsMatches.length > 1) {
    // Multiple matches - choose shortest title (most specific)
    const best = containsMatches.reduce((a, b) => 
      a.title.length < b.title.length ? a : b
    );
    return { station: best, confidence: 85 };
  }
  
  return null;
}
```

**Example matches:**
- Query: `"Radio 2"` → Matches: `"NPO Radio 2"` (confidence: 90%)
- Query: `"radio 2"` → Matches: `"NPO Radio 2"` (confidence: 90%)
- Query: `"npo radio 2"` → Matches: `"NPO Radio 2"` (confidence: 100%)

### Step 3: Extract the System Identifier

Once you have the matched station, extract the URI from the resources array:

```typescript
function extractSystemIdentifier(station: any): string {
  const resource = station.resources?.[0];
  if (!resource?.uri) {
    throw new Error(`Station "${station.title}" has no playable URI`);
  }
  
  // This is the system identifier
  return resource.uri;
}
```

**System Identifier Examples:**
- TuneIn station: `x-sonosapi-stream:s49815?sid=254&flags=8224&sn=0`
- Direct HTTP stream: `x-rincon-mp3radio://stream.example.com:8000/live`
- Direct HTTPS stream: `x-rincon-mp3radio://stream.example.com:443/live`

### Step 4: Use the System Identifier to Play

Once you have the system identifier (URI), you can use it with `sonos_play_uri`:

```typescript
const match = findBestMatch(stations, "Radio 2");
if (!match) {
  return "Station not found";
}

const uri = extractSystemIdentifier(match.station);

// Play using MCP tool
await mcp.call('sonos_play_uri', {
  deviceId: 'RINCON_XXX',
  uri: uri,
  metadata: createMetadata(match.station)  // See below
});
```

## Complete Implementation Example

```typescript
async function playRadioStationByName(
  deviceId: string,
  stationName: string
): Promise<string> {
  // Step 1: Get all favorite radio stations
  const result = await mcp.call('sonos_get_favorite_radio_stations', {
    deviceId: deviceId,
    startIndex: 0,
    count: 100
  });
  
  const stations = result.items;
  
  if (stations.length === 0) {
    return "No radio stations found in favorites. Please add some using the Sonos app.";
  }
  
  // Step 2: Find best match
  const match = findBestMatch(stations, stationName);
  
  if (!match) {
    const available = stations.map(s => s.title).join(', ');
    return `Station "${stationName}" not found. Available: ${available}`;
  }
  
  // Step 3: Extract system identifier
  const uri = extractSystemIdentifier(match.station);
  
  // Step 4: Play the station
  const metadata = createMetadata(match.station);
  
  await mcp.call('sonos_play_uri', {
    deviceId: deviceId,
    uri: uri,
    metadata: metadata,
    autoPlay: true
  });
  
  return `Now playing "${match.station.title}"`;
}

function createMetadata(station: any): string {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${station.id}" parentID="${station.parentId}" restricted="true">
    <dc:title>${escapeXml(station.title)}</dc:title>
    <upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
    <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON65031_</desc>
  </item>
</DIDL-Lite>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

## Agent Conversation Flow

**User:** "Play Radio 2"

**Agent Workflow:**
1. Call `sonos_get_favorite_radio_stations`
2. Receive list of stations
3. Fuzzy match "Radio 2" → Find "NPO Radio 2"
4. Extract URI: `x-sonosapi-stream:s49815?sid=254`
5. Call `sonos_play_uri` with the URI
6. Respond: "Now playing NPO Radio 2"

## Error Handling

### No Stations Found
```typescript
if (stations.length === 0) {
  return "No radio stations in favorites. Add stations using the Sonos app first.";
}
```

### Station Not Found
```typescript
if (!match) {
  const available = stations.map(s => s.title).join(', ');
  return `Station "${stationName}" not found. Available: ${available}`;
}
```

### Multiple Close Matches
```typescript
if (containsMatches.length > 1) {
  const titles = containsMatches.map(s => s.title).join(', ');
  console.log(`Multiple matches for "${query}": ${titles}. Playing: ${best.title}`);
}
```

## System Identifier Mapping Table

| Pretty Name (User Input) | System Identifier (URI) | Service |
|-------------------------|-------------------------|---------|
| NPO Radio 2 | `x-sonosapi-stream:s49815?sid=254` | TuneIn |
| BBC Radio 4 | `x-sonosapi-stream:s44491?sid=254` | TuneIn |
| Jazz FM 24/7 | `x-rincon-mp3radio://stream.jazzfm.com` | Direct HTTP |

The **system identifier** (URI) is what Sonos needs to play the station. The agent's role is to translate the pretty name to this identifier.

## Key Points

1. **Must Be in Favorites**: You can only play stations that are already saved in Sonos favorites. Direct search of TuneIn catalog is not supported via the API.

2. **Use Fuzzy Matching**: User input may not exactly match the station title (e.g., "radio 2" vs "NPO Radio 2").

3. **URI is the System Identifier**: The `resources[0].uri` field contains the system identifier needed for playback.

4. **Metadata is Required**: When calling `sonos_play_uri`, include proper DIDL-Lite metadata for reliable playback.

5. **Handle Pagination**: If users have many favorites (>100), implement pagination:
   ```typescript
   let allStations = [];
   let startIndex = 0;
   const pageSize = 100;
   
   while (true) {
     const result = await mcp.call('sonos_get_favorite_radio_stations', {
       deviceId, startIndex, count: pageSize
     });
     allStations.push(...result.items);
     if (result.returned < pageSize) break;
     startIndex += pageSize;
   }
   ```

## Quick Reference

**To find a radio station system identifier:**

1. Call `sonos_get_favorite_radio_stations(deviceId)`
2. Fuzzy match user's query against `items[].title`
3. Extract `items[N].resources[0].uri` from matched station
4. This URI is the system identifier

**Example:**
```
User query: "Radio 2"
↓
Get favorites → [{"title": "NPO Radio 2", "resources": [{"uri": "x-sonosapi-stream:s49815?sid=254"}]}]
↓
Match "Radio 2" → "NPO Radio 2"
↓
Extract URI → "x-sonosapi-stream:s49815?sid=254"
↓
System Identifier: "x-sonosapi-stream:s49815?sid=254"
```
