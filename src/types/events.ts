/**
 * Event subscription and notification types for UPnP GENA protocol
 */

/**
 * Subscription identifier returned by Sonos device
 */
export type SubscriptionId = string;

/**
 * Event type names for different Sonos services
 */
export type EventType =
    | 'AVTransport'
    | 'RenderingControl'
    | 'GroupRenderingControl'
    | 'Queue'
    | 'ZoneGroupTopology'
    | 'AlarmClock'
    | 'ContentDirectory'
    | 'Volume'
    | 'Mute'
    | 'Bass'
    | 'Treble'
    | 'Loudness'
    | 'PlayState'
    | 'CurrentTrack'
    | 'NextTrack'
    | 'PlaybackStopped'
    | 'QueueChanged'
    | 'ZonesChanged';

/**
 * Event endpoint paths for subscriptions
 */
export const EVENT_ENDPOINTS = {
    // Device-specific endpoints
    AV_TRANSPORT: '/MediaRenderer/AVTransport/Event',
    RENDERING_CONTROL: '/MediaRenderer/RenderingControl/Event',
    GROUP_RENDERING_CONTROL: '/MediaRenderer/GroupRenderingControl/Event',
    QUEUE: '/MediaRenderer/Queue/Event',

    // Global endpoints
    ZONE_GROUP_TOPOLOGY: '/ZoneGroupTopology/Event',
    ALARM_CLOCK: '/AlarmClock/Event',
    CONTENT_DIRECTORY: '/MediaServer/ContentDirectory/Event',
} as const;

/**
 * Subscription options when subscribing to events
 */
export interface SubscriptionOptions {
    /** How long the subscription should last (in seconds, default 1800 = 30 minutes) */
    timeout?: number;
    /** Custom callback URL (default is auto-generated) */
    callbackUrl?: string;
}

/**
 * Information about an active subscription
 */
export interface EventSubscription {
    /** Subscription ID assigned by the device */
    sid: SubscriptionId;
    /** Event endpoint path */
    endpoint: string;
    /** Device UUID or IP */
    deviceId: string;
    /** When the subscription should be renewed */
    renewAt: Date;
    /** Timeout duration in seconds */
    timeout: number;
}

/**
 * Base event data structure
 */
export interface BaseEventData {
    /** Event type/name */
    type: EventType;
    /** Device that emitted the event */
    deviceId: string;
    /** Event timestamp */
    timestamp: Date;
}

/**
 * AVTransport event data
 */
export interface AVTransportEvent extends BaseEventData {
    type: 'AVTransport';
    /** Transport state: PLAYING, PAUSED_PLAYBACK, STOPPED, etc. */
    transportState?: string;
    /** Current transport status */
    transportStatus?: string;
    /** Current playback speed */
    currentSpeed?: string;
    /** Number of tracks in queue */
    numberOfTracks?: number;
    /** Current track number */
    currentTrack?: number;
    /** Current track duration */
    currentTrackDuration?: string;
    /** Current track metadata (DIDL-Lite XML) */
    currentTrackMetaData?: string;
    /** Current track URI */
    currentTrackURI?: string;
    /** Play mode: NORMAL, SHUFFLE, REPEAT_ALL, etc. */
    currentPlayMode?: string;
}

/**
 * RenderingControl event data
 */
export interface RenderingControlEvent extends BaseEventData {
    type: 'RenderingControl';
    /** Volume level (0-100) */
    volume?: number;
    /** Mute state */
    mute?: boolean;
    /** Bass level (-10 to 10) */
    bass?: number;
    /** Treble level (-10 to 10) */
    treble?: number;
    /** Loudness enabled */
    loudness?: boolean;
}

/**
 * Volume change event
 */
export interface VolumeEvent extends BaseEventData {
    type: 'Volume';
    volume: number;
    channel?: string;
}

/**
 * Mute change event
 */
export interface MuteEvent extends BaseEventData {
    type: 'Mute';
    mute: boolean;
    channel?: string;
}

/**
 * Play state change event
 */
export interface PlayStateEvent extends BaseEventData {
    type: 'PlayState' | 'PlaybackStopped';
    state: 'playing' | 'paused' | 'stopped' | 'transitioning';
}

/**
 * Current track event
 */
export interface CurrentTrackEvent extends BaseEventData {
    type: 'CurrentTrack';
    title?: string;
    artist?: string;
    album?: string;
    albumArtUri?: string;
    duration?: string;
    uri?: string;
    position?: number;
}

/**
 * Next track event
 */
export interface NextTrackEvent extends BaseEventData {
    type: 'NextTrack';
    title?: string;
    artist?: string;
    album?: string;
    albumArtUri?: string;
    duration?: string;
    uri?: string;
}

/**
 * Queue changed event
 */
export interface QueueChangedEvent extends BaseEventData {
    type: 'QueueChanged';
    updateId?: number;
}

/**
 * Zone group topology event
 */
export interface ZoneGroupTopologyEvent extends BaseEventData {
    type: 'ZoneGroupTopology';
    zones?: Array<{
        uuid: string;
        location: string;
        coordinator?: {
            uuid: string;
            location: string;
        };
        members?: string[];
    }>;
}

/**
 * Zones changed event (simplified zone info)
 */
export interface ZonesChangedEvent extends BaseEventData {
    type: 'ZonesChanged';
    zones: Array<{
        name: string;
        uuid: string;
        coordinator: {
            uuid: string;
            ip: string;
            port: number;
        };
        members: Array<{
            uuid: string;
            ip: string;
            port: number;
        }>;
    }>;
}

/**
 * Alarm clock event
 */
export interface AlarmClockEvent extends BaseEventData {
    type: 'AlarmClock';
    alarmListVersion?: string;
}

/**
 * Union type of all possible event data
 */
export type EventData =
    | AVTransportEvent
    | RenderingControlEvent
    | VolumeEvent
    | MuteEvent
    | PlayStateEvent
    | CurrentTrackEvent
    | NextTrackEvent
    | QueueChangedEvent
    | ZoneGroupTopologyEvent
    | ZonesChangedEvent
    | AlarmClockEvent;

/**
 * Event handler function type
 */
export type EventHandler<T extends EventData = EventData> = (event: T) => void | Promise<void>;

/**
 * Event listener registration
 */
export interface EventListener {
    /** Event type to listen for */
    eventType: EventType;
    /** Handler function */
    handler: EventHandler;
    /** Optional device filter (only events from this device) */
    deviceId?: string;
}

/**
 * Parsed UPnP event from NOTIFY request
 */
export interface ParsedUpnpEvent {
    /** Event properties from the XML */
    properties: Record<string, string>;
    /** Raw XML string */
    rawXml: string;
}
