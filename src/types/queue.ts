/**
 * Queue-related types and interfaces
 */

import type { DidlObject } from '../didl/index.js';

/**
 * Queue track information
 */
export interface QueueTrack {
    /** Queue position (1-based) */
    position: number;

    /** Track URI */
    uri: string;

    /** DIDL-Lite metadata */
    metadata?: DidlObject;

    /** Track title */
    title?: string;

    /** Artist */
    artist?: string;

    /** Album */
    album?: string;

    /** Album art URI */
    albumArtUri?: string;

    /** Duration */
    duration?: string;
}

/**
 * Queue information
 */
export interface QueueInfo {
    /** Total number of tracks */
    totalTracks: number;

    /** Current track position (1-based) */
    currentTrack?: number;

    /** Queue tracks */
    tracks: QueueTrack[];
}

/**
 * Add to queue options
 */
export interface AddToQueueOptions {
    /** URI to add */
    uri: string;

    /** DIDL-Lite metadata (optional) */
    metadata?: DidlObject | string;

    /** Insert at specific position (1-based), or append if undefined */
    position?: number;

    /** Play immediately after adding */
    playNext?: boolean;
}
