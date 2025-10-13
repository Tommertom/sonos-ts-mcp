import { BaseService } from './base-service.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { XmlParser } from '../soap/response-parser.js';
import type { SonosPlaybackState } from '../types/sonos.js';
import type { QueueInfo, QueueTrack, AddToQueueOptions } from '../types/queue.js';
import { toDidlString, type DidlObject } from '../didl/index.js';
import { ContentDirectoryService } from './content-directory.js';

export class AVTransportService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:AVTransport:1';
    }

    protected getControlEndpoint(): string {
        return '/MediaRenderer/AVTransport/Control';
    }

    async play(speed = '1'): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Speed: speed,
        });

        const response = await this.callAction('Play', body);
        return response.success;
    }

    async pause(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('Pause', body);
        return response.success;
    }

    async stop(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('Stop', body);
        return response.success;
    }

    async next(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('Next', body);
        return response.success;
    }

    async previous(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('Previous', body);
        return response.success;
    }

    async seek(unit: 'TRACK_NR' | 'REL_TIME' | 'TIME_DELTA', target: string): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Unit: unit,
            Target: target,
        });

        const response = await this.callAction('Seek', body);
        return response.success;
    }

    async setAVTransportURI(uri: string, metadata = ''): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            CurrentURI: uri,
            CurrentURIMetaData: metadata,
        });

        const response = await this.callAction('SetAVTransportURI', body);
        return response.success;
    }

    /**
     * Enhanced play URI with automatic metadata generation
     */
    async playUri(uri: string, options?: {
        metadata?: DidlObject | string;
        autoPlay?: boolean;
        title?: string;
        artist?: string;
        album?: string;
    }): Promise<boolean> {
        let metadata = '';

        // Handle metadata
        if (options?.metadata) {
            if (typeof options.metadata === 'string') {
                metadata = options.metadata;
            } else {
                metadata = toDidlString(options.metadata);
            }
        } else if (options?.title || options?.artist || options?.album) {
            // Create simple metadata from provided fields
            const { DidlMusicTrack } = await import('../didl/index.js');
            const track = new DidlMusicTrack({
                id: '-1',
                parentId: '-1',
                title: options.title || 'Unknown',
                artist: options.artist,
                album: options.album,
                resources: [{
                    uri,
                    protocolInfo: 'http-get:*:audio/mpeg:*',
                }],
            });
            metadata = toDidlString(track);
        }

        // Set the URI
        await this.setAVTransportURI(uri, metadata);

        // Auto-play if requested
        if (options?.autoPlay !== false) {
            return this.play();
        }

        return true;
    }

    async getTransportInfo(): Promise<{
        state: string;
        status: string;
        speed: string;
    } | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetTransportInfo', body);
        if (!response.success || !response.body) {
            return null;
        }

        return {
            state: XmlParser.extractValue(response.body, 'CurrentTransportState') ?? 'STOPPED',
            status: XmlParser.extractValue(response.body, 'CurrentTransportStatus') ?? '',
            speed: XmlParser.extractValue(response.body, 'CurrentSpeed') ?? '1',
        };
    }

    async getPositionInfo(): Promise<Partial<SonosPlaybackState> | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetPositionInfo', body);
        if (!response.success || !response.body) {
            return null;
        }

        const trackMetadata = XmlParser.extractValue(response.body, 'TrackMetaData') ?? '';
        const unescapedMetadata = XmlParser.unescapeXml(trackMetadata);

        return {
            track: {
                title: XmlParser.extractValue(unescapedMetadata, 'dc:title') ?? '',
                artist: XmlParser.extractValue(unescapedMetadata, 'dc:creator') ?? '',
                album: XmlParser.extractValue(unescapedMetadata, 'upnp:album') ?? '',
                duration: XmlParser.extractValue(response.body, 'TrackDuration') ?? '',
                uri: XmlParser.extractValue(response.body, 'TrackURI') ?? '',
                albumArtUri: XmlParser.extractValue(unescapedMetadata, 'upnp:albumArtURI') ?? undefined,
            },
            position: XmlParser.extractValue(response.body, 'RelTime') ?? undefined,
        };
    }

    async setPlayMode(
        mode: 'NORMAL' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE'
    ): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            NewPlayMode: mode,
        });

        const response = await this.callAction('SetPlayMode', body);
        return response.success;
    }

    /**
     * Get current play mode
     */
    async getPlayMode(): Promise<string | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetTransportSettings', body);
        if (!response.success || !response.body) {
            return null;
        }

        return XmlParser.extractValue(response.body, 'PlayMode') ?? null;
    }

    /**
     * Enable or disable shuffle
     */
    async setShuffle(shuffle: boolean): Promise<boolean> {
        const currentMode = await this.getPlayMode();
        let newMode: 'NORMAL' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE' = 'NORMAL';

        if (shuffle) {
            // Preserve repeat setting when enabling shuffle
            if (currentMode === 'REPEAT_ALL' || currentMode === 'SHUFFLE') {
                newMode = 'SHUFFLE';
            } else {
                newMode = 'SHUFFLE_NOREPEAT';
            }
        } else {
            // Preserve repeat setting when disabling shuffle
            if (currentMode === 'SHUFFLE') {
                newMode = 'REPEAT_ALL';
            } else {
                newMode = 'NORMAL';
            }
        }

        return this.setPlayMode(newMode);
    }

    /**
     * Set repeat mode
     */
    async setRepeat(mode: 'off' | 'all' | 'one'): Promise<boolean> {
        const currentMode = await this.getPlayMode();
        const isShuffle = currentMode === 'SHUFFLE' || currentMode === 'SHUFFLE_NOREPEAT';

        let newMode: 'NORMAL' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE';

        switch (mode) {
            case 'all':
                newMode = isShuffle ? 'SHUFFLE' : 'REPEAT_ALL';
                break;
            case 'one':
                newMode = 'REPEAT_ONE';
                break;
            case 'off':
            default:
                newMode = isShuffle ? 'SHUFFLE_NOREPEAT' : 'NORMAL';
                break;
        }

        return this.setPlayMode(newMode);
    }

    /**
     * Get shuffle state
     */
    async getShuffle(): Promise<boolean> {
        const mode = await this.getPlayMode();
        return mode === 'SHUFFLE' || mode === 'SHUFFLE_NOREPEAT';
    }

    /**
     * Get repeat mode
     */
    async getRepeat(): Promise<'off' | 'all' | 'one'> {
        const mode = await this.getPlayMode();

        if (mode === 'REPEAT_ONE') return 'one';
        if (mode === 'REPEAT_ALL' || mode === 'SHUFFLE') return 'all';
        return 'off';
    }

    /**
     * Set crossfade mode
     */
    async setCrossFade(enabled: boolean): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            CrossfadeMode: enabled ? 1 : 0,
        });

        const response = await this.callAction('SetCrossfadeMode', body);
        return response.success;
    }

    /**
     * Get crossfade mode
     */
    async getCrossFade(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetCrossfadeMode', body);
        if (!response.success || !response.body) {
            return false;
        }

        const crossfadeMode = XmlParser.extractValue(response.body, 'CrossfadeMode') ?? '0';
        return crossfadeMode === '1';
    }

    async removeAllTracksFromQueue(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('RemoveAllTracksFromQueue', body);
        return response.success;
    }

    /**
     * Get the current queue
     * Uses ContentDirectoryService to browse the queue
     */
    async getQueue(startIndex = 0, count = 100): Promise<QueueInfo> {
        const contentDirectory = new ContentDirectoryService(this.device);
        const result = await contentDirectory.browse('Q:0', { startIndex, count });

        const tracks: QueueTrack[] = result.items.map((obj, index) => ({
            position: startIndex + index + 1,
            uri: obj.resources[0]?.uri ?? '',
            metadata: obj,
            title: obj.title,
            artist: obj.getProperty('artist') as string | undefined,
            album: obj.getProperty('album') as string | undefined,
            albumArtUri: obj.getProperty('albumArtUri') as string | undefined,
            duration: obj.resources[0]?.duration,
        }));

        return {
            totalTracks: result.total,
            tracks,
        };
    }

    /**
     * Add a URI to the queue
     */
    async addToQueue(options: AddToQueueOptions): Promise<number> {
        let metadata = '';

        if (options.metadata) {
            if (typeof options.metadata === 'string') {
                metadata = options.metadata;
            } else {
                // If it's a plain object without required DIDL fields, create a proper DidlObject
                if (!options.metadata.id || !options.metadata.parentId) {
                    const { DidlMusicTrack } = await import('../didl/didl-item.js');
                    const plainObj = options.metadata as unknown as Record<string, unknown>;
                    const track = new DidlMusicTrack({
                        id: '-1',
                        parentId: '-1',
                        title: (plainObj.title as string) || 'Unknown',
                        restricted: true,
                    });

                    // Copy properties from the plain object
                    if (plainObj.artist) track.artist = plainObj.artist as string;
                    if (plainObj.album) track.album = plainObj.album as string;
                    if (plainObj.albumArtUri) track.albumArtUri = plainObj.albumArtUri as string;

                    metadata = toDidlString(track);
                } else {
                    metadata = toDidlString(options.metadata);
                }
            }
        }

        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            EnqueuedURI: options.uri,
            EnqueuedURIMetaData: metadata,
            DesiredFirstTrackNumberEnqueued: options.position ?? 0,
            EnqueueAsNext: options.playNext ? 1 : 0,
        });

        const response = await this.callAction('AddURIToQueue', body);

        if (!response.success || !response.body) {
            throw new Error('Failed to add to queue');
        }

        const firstTrackNumber = parseInt(XmlParser.extractValue(response.body, 'FirstTrackNumberEnqueued') ?? '0');
        return firstTrackNumber;
    }

    /**
     * Remove a track from the queue
     */
    async removeFromQueue(position: number): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            ObjectID: `Q:0/${position}`,
        });

        const response = await this.callAction('RemoveTrackFromQueue', body);
        return response.success;
    }

    /**
     * Remove a range of tracks from the queue
     */
    async removeRangeFromQueue(startPosition: number, count: number): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            StartingIndex: startPosition,
            NumberOfTracks: count,
        });

        const response = await this.callAction('RemoveTrackRangeFromQueue', body);
        return response.success;
    }

    /**
     * Reorder a track in the queue
     */
    async reorderQueue(oldPosition: number, newPosition: number): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            StartingIndex: oldPosition,
            NumberOfTracks: 1,
            InsertBefore: newPosition,
        });

        const response = await this.callAction('ReorderTracksInQueue', body);
        return response.success;
    }

    /**
     * Save the current queue as a Sonos playlist
     */
    async saveQueue(title: string): Promise<number> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Title: title,
            ObjectID: '',
        });

        const response = await this.callAction('SaveQueue', body);

        if (!response.success || !response.body) {
            throw new Error('Failed to save queue');
        }

        const assignedObjectID = XmlParser.extractValue(response.body, 'AssignedObjectID') ?? '';
        // Extract the playlist number from the object ID (format: SQ:XX)
        const match = assignedObjectID.match(/SQ:(\d+)/);
        return match && match[1] ? parseInt(match[1]) : 0;
    }

    /**
     * Play from the queue starting at a specific position
     */
    async playFromQueue(position: number): Promise<boolean> {
        // First, set the queue as the current transport
        await this.setAVTransportURI(`x-rincon-queue:${this.device.ip}#0`, '');

        // Then seek to the track
        await this.seek('TRACK_NR', position.toString());

        // Finally, start playback
        return this.play();
    }

    /**
     * Configure sleep timer (automatic stop after duration)
     * @param duration Duration in HH:MM:SS format (e.g., "00:30:00" for 30 minutes)
     */
    async configureSleepTimer(duration: string): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            NewSleepTimerDuration: duration,
        });

        const response = await this.callAction('ConfigureSleepTimer', body);
        return response.success;
    }

    /**
     * Get remaining sleep timer duration
     * @returns Duration in HH:MM:SS format, or empty string if no timer set
     */
    async getSleepTimerRemaining(): Promise<string | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetRemainingSleepTimerDuration', body);
        if (!response.success || !response.body) {
            return null;
        }

        return XmlParser.extractValue(response.body, 'RemainingSleepTimerDuration') ?? null;
    }

    /**
     * Cancel the sleep timer
     */
    async cancelSleepTimer(): Promise<boolean> {
        return this.configureSleepTimer('');
    }
}

