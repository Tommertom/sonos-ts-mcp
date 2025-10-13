/**
 * Tests for DIDL-Lite implementation
 */

import { describe, it, expect } from 'vitest';
import {
    DidlMusicTrack,
    DidlMusicAlbum,
    DidlResource,
    toDidlString,
    fromDidlString,
} from '../src/didl/index.js';

describe('DIDL-Lite', () => {
    describe('DidlResource', () => {
        it('should create a resource with required properties', () => {
            const resource = new DidlResource({
                uri: 'http://example.com/track.mp3',
                protocolInfo: 'http-get:*:audio/mpeg:*',
            });

            expect(resource.uri).toBe('http://example.com/track.mp3');
            expect(resource.protocolInfo).toBe('http-get:*:audio/mpeg:*');
        });

        it('should create a resource with all properties', () => {
            const resource = new DidlResource({
                uri: 'http://example.com/track.mp3',
                protocolInfo: 'http-get:*:audio/mpeg:*',
                duration: '0:03:45',
                bitrate: 320000,
                sampleFrequency: 44100,
                nrAudioChannels: 2,
            });

            expect(resource.duration).toBe('0:03:45');
            expect(resource.bitrate).toBe(320000);
            expect(resource.sampleFrequency).toBe(44100);
            expect(resource.nrAudioChannels).toBe(2);
        });

        it('should convert to and from dict', () => {
            const original = new DidlResource({
                uri: 'http://example.com/track.mp3',
                protocolInfo: 'http-get:*:audio/mpeg:*',
                duration: '0:03:45',
            });

            const dict = original.toDict();
            const restored = DidlResource.fromDict(dict);

            expect(restored.uri).toBe(original.uri);
            expect(restored.protocolInfo).toBe(original.protocolInfo);
            expect(restored.duration).toBe(original.duration);
        });
    });

    describe('DidlMusicTrack', () => {
        it('should create a music track with Map-based storage', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
                artist: 'Test Artist',
                album: 'Test Album',
                genre: 'Rock',
            });

            expect(track.id).toBe('123');
            expect(track.parentId).toBe('456');
            expect(track.title).toBe('Test Song');
            expect(track.artist).toBe('Test Artist');
            expect(track.album).toBe('Test Album');
            expect(track.genre).toBe('Rock');
            expect(track.upnpClass).toBe('object.item.audioItem.musicTrack');
        });

        it('should handle property setters correctly', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
            });

            track.artist = 'New Artist';
            track.album = 'New Album';
            track.genre = 'Jazz';

            expect(track.artist).toBe('New Artist');
            expect(track.album).toBe('New Album');
            expect(track.genre).toBe('Jazz');
        });

        it('should handle resources', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
                resources: [
                    {
                        uri: 'http://example.com/track.mp3',
                        protocolInfo: 'http-get:*:audio/mpeg:*',
                        duration: '0:03:45',
                    }
                ],
            });

            expect(track.resources.length).toBe(1);
            expect(track.resources[0].uri).toBe('http://example.com/track.mp3');
            expect(track.resources[0].duration).toBe('0:03:45');
        });
    });

    describe('DIDL Serialization', () => {
        it('should serialize a simple track to XML', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
                artist: 'Test Artist',
                album: 'Test Album',
            });

            const xml = toDidlString(track);

            expect(xml).toContain('<DIDL-Lite');
            expect(xml).toContain('<item id="123"');
            expect(xml).toContain('parentID="456"');
            expect(xml).toContain('<dc:title>Test Song</dc:title>');
            expect(xml).toContain('<upnp:artist>Test Artist</upnp:artist>');
            expect(xml).toContain('<upnp:album>Test Album</upnp:album>');
            expect(xml).toContain('<upnp:class>object.item.audioItem.musicTrack</upnp:class>');
        });

        it('should serialize a track with resources', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
                resources: [
                    {
                        uri: 'http://example.com/track.mp3',
                        protocolInfo: 'http-get:*:audio/mpeg:*',
                        duration: '0:03:45',
                    }
                ],
            });

            const xml = toDidlString(track);

            expect(xml).toContain('<res');
            expect(xml).toContain('protocolInfo="http-get:*:audio/mpeg:*"');
            expect(xml).toContain('duration="0:03:45"');
            expect(xml).toContain('http://example.com/track.mp3');
        });

        it('should escape XML special characters', () => {
            const track = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Song with <special> & "characters"',
            });

            const xml = toDidlString(track);

            expect(xml).toContain('&lt;special&gt;');
            expect(xml).toContain('&amp;');
            expect(xml).toContain('&quot;');
            expect(xml).not.toContain('<special>');
        });

        it('should serialize multiple items', () => {
            const track1 = new DidlMusicTrack({
                id: '1',
                parentId: '0',
                title: 'Track 1',
            });

            const track2 = new DidlMusicTrack({
                id: '2',
                parentId: '0',
                title: 'Track 2',
            });

            const xml = toDidlString([track1, track2]);

            expect(xml).toContain('<item id="1"');
            expect(xml).toContain('<item id="2"');
            expect(xml).toContain('Track 1');
            expect(xml).toContain('Track 2');
        });
    });

    describe('DIDL Parsing', () => {
        it('should parse a simple track from XML', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" 
           xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" 
           xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
    <item id="123" parentID="456" restricted="true">
        <dc:title>Test Song</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
        <upnp:artist>Test Artist</upnp:artist>
        <upnp:album>Test Album</upnp:album>
    </item>
</DIDL-Lite>`;

            const items = await fromDidlString(xml);

            expect(items.length).toBe(1);
            const track = items[0] as DidlMusicTrack;
            expect(track.id).toBe('123');
            expect(track.parentId).toBe('456');
            expect(track.title).toBe('Test Song');
            expect(track.artist).toBe('Test Artist');
            expect(track.album).toBe('Test Album');
            expect(track.upnpClass).toBe('object.item.audioItem.musicTrack');
        });

        it('should parse a track with resources', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" 
           xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" 
           xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
    <item id="123" parentID="456" restricted="true">
        <res protocolInfo="http-get:*:audio/mpeg:*" duration="0:03:45">http://example.com/track.mp3</res>
        <dc:title>Test Song</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    </item>
</DIDL-Lite>`;

            const items = await fromDidlString(xml);
            const track = items[0] as DidlMusicTrack;

            expect(track.resources.length).toBe(1);
            expect(track.resources[0].uri).toBe('http://example.com/track.mp3');
            expect(track.resources[0].protocolInfo).toBe('http-get:*:audio/mpeg:*');
            expect(track.resources[0].duration).toBe('0:03:45');
        });

        it('should unescape XML entities', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" 
           xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" 
           xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
    <item id="123" parentID="456" restricted="true">
        <dc:title>Song with &lt;special&gt; &amp; &quot;characters&quot;</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    </item>
</DIDL-Lite>`;

            const items = await fromDidlString(xml);
            const track = items[0] as DidlMusicTrack;

            expect(track.title).toBe('Song with <special> & "characters"');
        });

        it('should parse multiple items', async () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" 
           xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" 
           xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
    <item id="1" parentID="0" restricted="true">
        <dc:title>Track 1</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    </item>
    <item id="2" parentID="0" restricted="true">
        <dc:title>Track 2</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    </item>
</DIDL-Lite>`;

            const items = await fromDidlString(xml);

            expect(items.length).toBe(2);
            expect((items[0] as DidlMusicTrack).title).toBe('Track 1');
            expect((items[1] as DidlMusicTrack).title).toBe('Track 2');
        });
    });

    describe('DIDL Round-trip', () => {
        it('should survive serialization and parsing round-trip', async () => {
            const original = new DidlMusicTrack({
                id: '123',
                parentId: '456',
                title: 'Test Song',
                artist: 'Test Artist',
                album: 'Test Album',
                genre: 'Rock',
                resources: [
                    {
                        uri: 'http://example.com/track.mp3',
                        protocolInfo: 'http-get:*:audio/mpeg:*',
                        duration: '0:03:45',
                    }
                ],
            });

            const xml = toDidlString(original);
            const parsed = await fromDidlString(xml);

            expect(parsed.length).toBe(1);
            const restored = parsed[0] as DidlMusicTrack;

            expect(restored.id).toBe(original.id);
            expect(restored.parentId).toBe(original.parentId);
            expect(restored.title).toBe(original.title);
            expect(restored.artist).toBe(original.artist);
            expect(restored.album).toBe(original.album);
            expect(restored.genre).toBe(original.genre);
            expect(restored.resources.length).toBe(1);
            expect(restored.resources[0].uri).toBe(original.resources[0].uri);
        });
    });

    describe('DidlMusicAlbum', () => {
        it('should create a music album container', () => {
            const album = new DidlMusicAlbum({
                id: '789',
                parentId: '0',
                title: 'Test Album',
                artist: 'Test Artist',
                genre: 'Rock',
            });

            expect(album.id).toBe('789');
            expect(album.title).toBe('Test Album');
            expect(album.artist).toBe('Test Artist');
            expect(album.genre).toBe('Rock');
            expect(album.upnpClass).toBe('object.container.album.musicAlbum');
        });

        it('should serialize album to XML', () => {
            const album = new DidlMusicAlbum({
                id: '789',
                parentId: '0',
                title: 'Test Album',
                artist: 'Test Artist',
            });

            const xml = toDidlString(album);

            expect(xml).toContain('<container');
            expect(xml).toContain('id="789"');
            expect(xml).toContain('<dc:title>Test Album</dc:title>');
            expect(xml).toContain('<upnp:artist>Test Artist</upnp:artist>');
            expect(xml).toContain('object.container.album.musicAlbum');
        });
    });
});
