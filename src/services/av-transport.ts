import { BaseService } from './base-service.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { XmlParser } from '../soap/response-parser.js';
import type { SonosPlaybackState } from '../types/sonos.js';

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

    async removeAllTracksFromQueue(): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('RemoveAllTracksFromQueue', body);
        return response.success;
    }
}
