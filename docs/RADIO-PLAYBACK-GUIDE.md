# Radio Playback Guide

## Overview

This guide explains how to play radio stations on Sonos devices, covering the different approaches and their limitations.

## Quick Start: Play Radio (Recommended Approach)

**Use Favorite Radio Stations First**

The most reliable way to play radio is to use stations the user has already saved in their Sonos Favorites:

```typescript
// 1. Get favorite radio stations
const favorites = await contentDirectory.getFavoriteRadioStations();

// 2. Pick a station (by name or just the first one)
const station = favorites.items[0];

// 3. Extract the URI
const uri = station.resources[0]?.uri;

// 4. Play it
await avTransport.setAVTransportURI(uri, metadata);
await avTransport.play();
```

**Why this works:**
- ✅ No authentication required
- ✅ Stations are pre-configured by the user
- ✅ Works with ANY radio service (TuneIn, BBC, local stations, etc.)
- ✅ URIs are ready to play immediately

## Radio Sources on Sonos

### 1. Favorite Radio Stations (`R:0/0`)

**What it is:** User's saved radio stations from any source

**How to access:**
- Use `ContentDirectoryService.getFavoriteRadioStations()`
- Browse object ID `R:0/0` in ContentDirectory

**Advantages:**
- ✅ Always works (no authentication needed)
- ✅ Pre-configured by user
- ✅ Includes stations from TuneIn, BBC, Sonos Radio, and other services
- ✅ URIs can be played directly

**When to use:**
- User asks to "play a radio station"
- User asks to "play any station"
- First choice for radio playback

**Example stations in favorites:**
```
BBC Radio 1
NPR News
Local FM Station 98.5
Jazz24
```

### 2. Sonos Radio (Service ID: 303)

**What it is:** Sonos's own radio service with curated stations

**Authentication:** DeviceLink (requires account linking in Sonos app)

**Why it fails:**
- ❌ Requires user to link Sonos account via the Sonos mobile app
- ❌ Cannot be authenticated programmatically via API
- ❌ Returns empty results if not authenticated
- ❌ Returns 401/403 errors for protected content

**How users set it up:**
1. Open Sonos app on mobile device
2. Go to Browse → Sonos Radio
3. Link account (if not already linked)
4. Add stations to "My Sonos" favorites

**When browsing works:**
- Only after user has authenticated via Sonos app
- Browse returns categories like "For You", "My Stations", "Genres"

**When to use:**
- Only if user specifically asks for "Sonos Radio"
- After confirming they have linked their account
- Better to use favorites if available

### 3. TuneIn (Service ID: 254)

**What it is:** Directory of internet radio stations worldwide

**Authentication:** Anonymous (should work without auth)

**Current Status:** ⚠️ Returns 500 Internal Server Error

**Why it fails:**
- The SMAPI endpoint may have changed
- Service may require updated SOAP protocol
- Possible regional restrictions

**Workaround:**
- Use favorite radio stations instead
- Stations from TuneIn that user has saved will appear in favorites

**When browsing worked (historically):**
```
Root categories:
- Local Radio
- Music
- News & Talk
- Sports
- Podcasts
- By Location
```

### 4. Other Music Services

Many music services offer radio/station features:
- **Apple Music Radio** - Requires AppLink authentication
- **Spotify Radio** - Requires AppLink authentication  
- **BBC Sounds** - May be Anonymous (regional)
- **SomaFM Radio** - Anonymous (works without auth)
- **CBC Radio & Music** - Anonymous (works without auth)

**Check authentication:**
```typescript
const services = await musicServicesService.listAvailableServices();
services.forEach(service => {
  console.log(`${service.name}: ${service.authType}`);
});
```

## Authentication Types Explained

### Anonymous
- ✅ Works without any authentication
- ✅ Can browse and play immediately
- Examples: SomaFM Radio, CBC Radio & Music, some regional services

### DeviceLink
- ❌ Requires account linking via Sonos app
- ❌ Cannot be authenticated via API
- ❌ Returns empty results until linked
- Examples: Sonos Radio, Apple Music, Spotify
- **User must link account in Sonos mobile app first**

### AppLink
- ❌ Requires app-based authentication
- ❌ Complex OAuth flow
- ❌ Not practical for automated systems
- Examples: Many streaming services

## Implementation Strategy for AI Agents

### Radio Request Flow

```
User: "Play a radio station"
  ↓
1. Call sonos_get_favorite_radio_stations
  ↓
2. If favorites.length > 0:
     → Pick a station
     → Extract URI
     → Call sonos_play_uri
     → SUCCESS ✅
  ↓
3. If favorites.length === 0:
     → Inform user no favorites are saved
     → Suggest adding favorites via Sonos app
     → EXPLAIN: Cannot browse Sonos Radio/TuneIn without authentication
```

### Specific Service Request

```
User: "Play BBC Radio 1"
  ↓
1. Call sonos_get_favorite_radio_stations
  ↓
2. Search for "BBC Radio 1" in results
  ↓
3. If found:
     → Extract URI and play ✅
  ↓
4. If not found:
     → Check sonos_get_sonos_favorites (broader search)
  ↓
5. If still not found:
     → Inform user station not in favorites
     → Suggest adding it via Sonos app
     → Optionally try browsing BBC Sounds service if available
```

### Generic Radio Request

```
User: "Play any radio station from Sonos Radio"
  ↓
1. Call sonos_get_favorite_radio_stations
  ↓
2. Filter for stations from Sonos Radio (check URI pattern)
  ↓
3. If found any:
     → Play first match ✅
  ↓
4. If none found:
     → Try sonos_browse_music_service("Sonos Radio", "root")
     → If returns empty: User has not linked Sonos Radio account
     → Explain: "Please link Sonos Radio in the Sonos app first"
```

## Common Errors and Solutions

### Empty Results from Browse

**Error:** `{ items: [], total: 0, count: 0 }`

**Cause:** Service requires authentication (DeviceLink/AppLink)

**Solution:** 
1. Use favorite radio stations instead
2. Inform user they need to link account in Sonos app
3. Explain which services are authenticated (check authType)

### 500 Internal Server Error

**Error:** `SMAPI request failed: 500 Internal Server Error`

**Cause:** Service endpoint issue, invalid request, or authentication failure

**Solution:**
1. Fall back to favorite radio stations
2. Try alternative services (SomaFM, CBC, etc.)
3. Log error for debugging

### No Favorites Available

**Error:** User has no saved radio stations

**Solution:**
```
"You don't have any radio stations saved in your Sonos Favorites.

To add radio stations:
1. Open the Sonos app on your phone
2. Browse for radio stations (TuneIn, Sonos Radio, etc.)
3. Tap the heart icon to add to 'My Sonos'
4. Then I can play them for you!"
```

## Tools Priority Order

When implementing radio playback features, use tools in this order:

1. **`sonos_get_favorite_radio_stations`** ← START HERE
   - Most reliable
   - No authentication needed
   - Pre-configured by user

2. **`sonos_get_sonos_favorites`** 
   - Broader search (includes playlists, albums, radio)
   - Still no authentication needed
   - Pre-configured by user

3. **`sonos_list_music_services`**
   - Check which services are available
   - Check authType before trying to browse
   - Filter for "Anonymous" services only

4. **`sonos_browse_music_service`** ← LAST RESORT
   - Only for Anonymous services
   - Expect failures for authenticated services
   - Have fallback plan ready

## Best Practices

### DO ✅

- Always try favorites first
- Check authType before browsing music services
- Provide helpful error messages explaining authentication
- Suggest using the Sonos app to add favorites
- Use Anonymous services (SomaFM, CBC) when browsing

### DON'T ❌

- Don't assume Sonos Radio will work without authentication
- Don't try to authenticate services programmatically
- Don't browse authenticated services without checking authType first
- Don't give up if one service fails - try favorites or alternative services
- Don't promise specific services will work without checking first

## Example Code

### Play Any Radio Station (Robust Implementation)

```typescript
async function playAnyRadioStation(deviceId: string): Promise<void> {
    const device = resolver.resolve(deviceId);
    const contentDir = new ContentDirectoryService(device);
    
    // Try to get favorite radio stations
    const favorites = await contentDir.getFavoriteRadioStations();
    
    if (favorites.items.length === 0) {
        throw new Error(
            "No radio stations found in favorites. " +
            "Please add stations via the Sonos app first."
        );
    }
    
    // Pick the first station
    const station = favorites.items[0];
    const uri = station.resources[0]?.uri;
    
    if (!uri) {
        throw new Error("Station URI not available");
    }
    
    // Build metadata
    const didl = `<DIDL-Lite>...</DIDL-Lite>`;
    
    // Play it
    const avTransport = new AVTransportService(device);
    await avTransport.setAVTransportURI(uri, didl);
    await avTransport.play();
    
    console.log(`Now playing: ${station.title}`);
}
```

### Search Favorites by Name

```typescript
function findStationByName(
    favorites: SearchResult, 
    searchTerm: string
): DidlObject | null {
    const lowerSearch = searchTerm.toLowerCase();
    
    return favorites.items.find(item => 
        item.title.toLowerCase().includes(lowerSearch)
    ) || null;
}

// Usage
const favorites = await contentDir.getFavoriteRadioStations();
const station = findStationByName(favorites, "BBC Radio 1");
```

## Summary

**The Golden Rule:** Always start with `sonos_get_favorite_radio_stations` 

This single tool solves 90% of radio playback use cases because:
1. It's pre-configured by the user
2. It requires no authentication
3. It works with stations from ANY service
4. The URIs are ready to play immediately

Only resort to browsing music services when:
- User asks for a specific service by name
- The service has authType === "Anonymous"  
- You have a specific use case that requires browsing
- You're prepared to handle authentication errors gracefully
