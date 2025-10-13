/**
 * Event Parser - Parses UPnP event data into typed event objects
 */

import type {
    EventData,
    AVTransportEvent,
    RenderingControlEvent,
    VolumeEvent,
    MuteEvent,
    PlayStateEvent,
    CurrentTrackEvent,
    QueueChangedEvent,
    ZoneGroupTopologyEvent,
    AlarmClockEvent,
} from '../types/events.js';
import { EVENT_ENDPOINTS } from '../types/events.js';

/**
 * Parse event properties and convert to typed event objects
 */
export class EventParser {
    /**
     * Parse event data from a notification
     */
    async parse(
        endpoint: string,
        properties: Record<string, string>,
        deviceId: string
    ): Promise<EventData[]> {
        const timestamp = new Date();
        const events: EventData[] = [];

        switch (endpoint) {
            case EVENT_ENDPOINTS.AV_TRANSPORT:
                events.push(...this.parseAVTransport(properties, deviceId, timestamp));
                break;

            case EVENT_ENDPOINTS.RENDERING_CONTROL:
            case EVENT_ENDPOINTS.GROUP_RENDERING_CONTROL:
                events.push(...this.parseRenderingControl(properties, deviceId, timestamp));
                break;

            case EVENT_ENDPOINTS.QUEUE:
                events.push(...this.parseQueue(properties, deviceId, timestamp));
                break;

            case EVENT_ENDPOINTS.ZONE_GROUP_TOPOLOGY:
                events.push(...this.parseZoneGroupTopology(properties, deviceId, timestamp));
                break;

            case EVENT_ENDPOINTS.ALARM_CLOCK:
                events.push(...this.parseAlarmClock(properties, deviceId, timestamp));
                break;

            default:
                console.warn(`Unknown event endpoint: ${endpoint}`);
        }

        return events;
    }

    /**
     * Parse AVTransport events
     */
    private parseAVTransport(
        properties: Record<string, string>,
        deviceId: string,
        timestamp: Date
    ): EventData[] {
        const events: EventData[] = [];

        // Main AVTransport event
        const transportEvent: AVTransportEvent = {
            type: 'AVTransport',
            deviceId,
            timestamp,
        };

        // Extract LastChange XML and parse it
        const lastChange = properties.LastChange;
        if (lastChange) {
            const parsed = this.parseLastChange(lastChange);

            if (parsed.TransportState) {
                transportEvent.transportState = parsed.TransportState;

                // Also emit a PlayState event
                const playState = this.mapTransportState(parsed.TransportState);
                events.push({
                    type: 'PlayState',
                    deviceId,
                    timestamp,
                    state: playState,
                } as PlayStateEvent);

                // Emit PlaybackStopped event if stopped
                if (playState === 'stopped') {
                    events.push({
                        type: 'PlaybackStopped',
                        deviceId,
                        timestamp,
                        state: 'stopped',
                    } as PlayStateEvent);
                }
            }

            if (parsed.CurrentTrackURI) transportEvent.currentTrackURI = parsed.CurrentTrackURI;
            if (parsed.CurrentTrackMetaData) transportEvent.currentTrackMetaData = parsed.CurrentTrackMetaData;
            if (parsed.CurrentTrackDuration) transportEvent.currentTrackDuration = parsed.CurrentTrackDuration;
            if (parsed.CurrentTrack) transportEvent.currentTrack = parseInt(parsed.CurrentTrack, 10);
            if (parsed.NumberOfTracks) transportEvent.numberOfTracks = parseInt(parsed.NumberOfTracks, 10);
            if (parsed.CurrentPlayMode) transportEvent.currentPlayMode = parsed.CurrentPlayMode;
            if (parsed.TransportStatus) transportEvent.transportStatus = parsed.TransportStatus;
            if (parsed.CurrentSpeed) transportEvent.currentSpeed = parsed.CurrentSpeed;

            // Parse current track metadata and emit CurrentTrack event
            if (parsed.CurrentTrackMetaData) {
                const trackEvent = this.parseTrackMetadata(parsed.CurrentTrackMetaData, deviceId, timestamp);
                if (trackEvent) {
                    events.push(trackEvent);
                }
            }
        }

        events.push(transportEvent);
        return events;
    }

    /**
     * Parse RenderingControl events
     */
    private parseRenderingControl(
        properties: Record<string, string>,
        deviceId: string,
        timestamp: Date
    ): EventData[] {
        const events: EventData[] = [];

        const renderingEvent: RenderingControlEvent = {
            type: 'RenderingControl',
            deviceId,
            timestamp,
        };

        // Extract LastChange XML and parse it
        const lastChange = properties.LastChange;
        if (lastChange) {
            const parsed = this.parseLastChange(lastChange);

            if (parsed.Volume) {
                const volume = parseInt(parsed.Volume, 10);
                renderingEvent.volume = volume;

                // Also emit a Volume event
                events.push({
                    type: 'Volume',
                    deviceId,
                    timestamp,
                    volume,
                    channel: parsed.Channel || 'Master',
                } as VolumeEvent);
            }

            if (parsed.Mute) {
                const mute = parsed.Mute === '1' || parsed.Mute === 'true';
                renderingEvent.mute = mute;

                // Also emit a Mute event
                events.push({
                    type: 'Mute',
                    deviceId,
                    timestamp,
                    mute,
                    channel: parsed.Channel || 'Master',
                } as MuteEvent);
            }

            if (parsed.Bass) renderingEvent.bass = parseInt(parsed.Bass, 10);
            if (parsed.Treble) renderingEvent.treble = parseInt(parsed.Treble, 10);
            if (parsed.Loudness) renderingEvent.loudness = parsed.Loudness === '1' || parsed.Loudness === 'true';
        }

        events.push(renderingEvent);
        return events;
    }

    /**
     * Parse Queue events
     */
    private parseQueue(
        properties: Record<string, string>,
        deviceId: string,
        timestamp: Date
    ): EventData[] {
        const events: EventData[] = [];

        // Queue change notification
        if (properties.LastChange) {
            const parsed = this.parseLastChange(properties.LastChange);

            events.push({
                type: 'QueueChanged',
                deviceId,
                timestamp,
                updateId: parsed.UpdateID ? parseInt(parsed.UpdateID, 10) : undefined,
            } as QueueChangedEvent);
        }

        return events;
    }

    /**
     * Parse ZoneGroupTopology events
     */
    private parseZoneGroupTopology(
        properties: Record<string, string>,
        deviceId: string,
        timestamp: Date
    ): EventData[] {
        const events: EventData[] = [];

        // Zone topology changed
        events.push({
            type: 'ZoneGroupTopology',
            deviceId,
            timestamp,
            // zones would need to be parsed from the ZoneGroupState XML
        } as ZoneGroupTopologyEvent);

        return events;
    }

    /**
     * Parse AlarmClock events
     */
    private parseAlarmClock(
        properties: Record<string, string>,
        deviceId: string,
        timestamp: Date
    ): EventData[] {
        const events: EventData[] = [];

        if (properties.AlarmListVersion) {
            events.push({
                type: 'AlarmClock',
                deviceId,
                timestamp,
                alarmListVersion: properties.AlarmListVersion,
            } as AlarmClockEvent);
        }

        return events;
    }

    /**
     * Parse LastChange XML into key-value pairs
     * Format: <Event><InstanceID val="0"><Property val="value"/></InstanceID></Event>
     */
    private parseLastChange(xml: string): Record<string, string> {
        const result: Record<string, string> = {};

        // Extract property values with simple regex
        // Match patterns like <PropertyName val="value"/> or <PropertyName>value</PropertyName>
        const valRegex = /<(\w+)\s+val="([^"]*)"/g;
        let match;

        while ((match = valRegex.exec(xml)) !== null) {
            const key = match[1];
            const value = match[2];
            if (key && value !== undefined) {
                result[key] = value;
            }
        }

        // Also match simple tag format
        const tagRegex = /<(\w+)>([^<]*)<\/\1>/g;
        while ((match = tagRegex.exec(xml)) !== null) {
            const key = match[1];
            const value = match[2];
            if (key && value && !result[key]) {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Parse track metadata (DIDL-Lite XML) into a CurrentTrack event
     */
    private parseTrackMetadata(
        metadata: string,
        deviceId: string,
        timestamp: Date
    ): CurrentTrackEvent | null {
        if (!metadata || metadata.trim() === '') {
            return null;
        }

        const trackEvent: CurrentTrackEvent = {
            type: 'CurrentTrack',
            deviceId,
            timestamp,
        };

        // Extract DIDL-Lite elements with simple regex
        const titleMatch = metadata.match(/<dc:title>([^<]*)<\/dc:title>/);
        const artistMatch = metadata.match(/<dc:creator>([^<]*)<\/dc:creator>/);
        const albumMatch = metadata.match(/<upnp:album>([^<]*)<\/upnp:album>/);
        const artMatch = metadata.match(/<upnp:albumArtURI>([^<]*)<\/upnp:albumArtURI>/);
        const durationMatch = metadata.match(/<res[^>]*duration="([^"]*)"/) || metadata.match(/<upnp:duration>([^<]*)<\/upnp:duration>/);
        const resMatch = metadata.match(/<res[^>]*>([^<]*)<\/res>/);

        if (titleMatch) trackEvent.title = titleMatch[1];
        if (artistMatch) trackEvent.artist = artistMatch[1];
        if (albumMatch) trackEvent.album = albumMatch[1];
        if (artMatch) trackEvent.albumArtUri = artMatch[1];
        if (durationMatch) trackEvent.duration = durationMatch[1];
        if (resMatch) trackEvent.uri = resMatch[1];

        return trackEvent;
    }

    /**
     * Map Sonos transport state to simplified play state
     */
    private mapTransportState(transportState: string): 'playing' | 'paused' | 'stopped' | 'transitioning' {
        const state = transportState.toUpperCase();

        if (state === 'PLAYING') return 'playing';
        if (state === 'PAUSED_PLAYBACK') return 'paused';
        if (state === 'STOPPED') return 'stopped';
        if (state === 'TRANSITIONING') return 'transitioning';

        return 'stopped';
    }
}
