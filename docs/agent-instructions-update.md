# Mastra Agent Instructions Update

## Summary

Updated the Sonos Mastra agent instructions to include guidance on how to find and play content by name using favorites lookup.

## Changes Made

### 1. Agent Instructions (`src/mastra/agents/sonos-agent.ts`)

**Added section:**

When users want to PLAY content by name (e.g., "Play Radio 2", "Play my Jazz playlist"):
1. First call sonos_discover to get the deviceId
2. Then search through favorites using the appropriate tool:
   - sonos_get_favorite_radio_stations for radio stations
   - sonos_get_sonos_favorites for all favorites (playlists, albums, radio, etc.)
3. Fuzzy match the user's query against the titles in the results
4. Extract the URI from resources[0].uri of the matched item
5. Use sonos_play_uri with the extracted URI and proper metadata

**Added example:**
- "Play Radio 2 in Badkamer" → discover devices → get favorite radio stations → fuzzy match → extract URI → play

### 2. Documentation (`docs/mastra-agent-guide.md`)

**Updated System Prompt Summary:**
- Added: "For playback requests by name, searches favorites and fuzzy matches user query"
- Added: "Extracts URI from matched item and plays using sonos_play_uri"

**Added New Example:**
```bash
npm run agent "Play Radio 2 in the kitchen"
```

With detailed agent flow showing the favorites search process.

## Why This Change?

Previously, the agent didn't have explicit guidance on how to handle requests like "Play Radio 2" where the user provides a friendly name rather than a direct URI or content ID.

Now the agent knows to:
1. Search through favorites first
2. Use fuzzy matching to find content by name
3. Extract the system identifier (URI) from the matched favorite
4. Use that URI with the play command

This matches the workflow documented in `docs/sonos-radio-metadata-research.md`.

## Testing

Build completed successfully with no errors.

## Related Documentation

- `docs/sonos-radio-metadata-research.md` - Detailed guide on finding radio stations by name
- `docs/mastra-agent-guide.md` - Complete Mastra agent guide with examples
