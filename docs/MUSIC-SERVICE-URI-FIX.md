# Music Service Media URI Parsing Fix

## Issue

When attempting to play music service items (e.g., radio stations from SomaFM, TuneIn, etc.), the system was failing with the error:

```
Failed to get media URI for item
```

## Root Cause

The SMAPI (Sonos Music API) `getMediaURI` SOAP response format varies between music services. The original parser in `SMAPIClient.parseMediaURIResponse()` only handled responses where the URI was nested in a child `<uri>` element:

```xml
<getMediaURIResult>
  <uri>http://example.com/stream.mp3</uri>
</getMediaURIResult>
```

However, many music services (like SomaFM) return the URI directly as text content:

```xml
<tns:getMediaURIResult>http://api.somafm.com/groovesalad130.pls</tns:getMediaURIResult>
```

## Solution

Updated `SMAPIClient.parseMediaURIResponse()` in `src/services/smapi-client.ts` to handle both response formats:

1. **Primary check**: Extract text content directly from `<getMediaURIResult>` (most common)
2. **Fallback**: Look for nested `<uri>` element if the text content contains XML

```typescript
private parseMediaURIResponse(xml: string): string | null {
    // Try to match getMediaURIResult element (with optional namespace prefix)
    const uriMatch = xml.match(/<(?:\w+:)?getMediaURIResult>([\s\S]*?)<\/(?:\w+:)?getMediaURIResult>/);
    if (!uriMatch) return null;

    const content = uriMatch[1]?.trim() ?? '';
    
    // First check if the URI is directly in the text content (common case)
    if (content && !content.includes('<')) {
        return content;
    }
    
    // Otherwise, try to extract from a nested <uri> element
    const nestedUri = this.extractValue(content, 'uri');
    return nestedUri || null;
}
```

## Testing

Created test script `scripts/test-somafm-playback.ts` to verify the fix:

```bash
tsx scripts/test-somafm-playback.ts
```

The script:
1. Discovers Sonos devices
2. Browses SomaFM Radio service
3. Attempts to play a station
4. Shows the raw SOAP response for debugging

## Example Usage

After the fix, users can now successfully play radio stations from music services:

```bash
npm run agent -- "Play any radio station from the Sonos Radio service on the Kitchen"
```

The agent will:
1. List available music services
2. Browse the service to find playable items
3. Successfully retrieve the media URI
4. Start playback

## Services Affected

This fix enables playback from various music services including:
- SomaFM Radio
- TuneIn
- Other anonymous/free radio services

Services requiring authentication may still have additional requirements.

## Related Files

- `src/services/smapi-client.ts` - Main fix location
- `src/mcp/handlers/music-service-handlers.ts` - Handler that calls getMediaURI
- `scripts/test-somafm-playback.ts` - Test script for debugging
