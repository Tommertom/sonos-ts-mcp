import { BaseService } from './base-service.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { XmlParser } from '../soap/response-parser.js';

export class RenderingControlService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:RenderingControl:1';
    }

    protected getControlEndpoint(): string {
        return '/MediaRenderer/RenderingControl/Control';
    }

    async getVolume(channel = 'Master'): Promise<number | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
        });

        const response = await this.callAction('GetVolume', body);
        if (!response.success || !response.body) {
            return null;
        }

        const volume = XmlParser.extractValue(response.body, 'CurrentVolume');
        return volume ? parseInt(volume, 10) : null;
    }

    async setVolume(volume: number, channel = 'Master'): Promise<boolean> {
        const clampedVolume = Math.max(0, Math.min(100, volume));
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
            DesiredVolume: clampedVolume,
        });

        const response = await this.callAction('SetVolume', body);
        return response.success;
    }

    async getMute(channel = 'Master'): Promise<boolean | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
        });

        const response = await this.callAction('GetMute', body);
        if (!response.success || !response.body) {
            return null;
        }

        const mute = XmlParser.extractValue(response.body, 'CurrentMute');
        return mute ? XmlParser.sonosToBoolean(mute) : null;
    }

    async setMute(mute: boolean, channel = 'Master'): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
            DesiredMute: mute,
        });

        const response = await this.callAction('SetMute', body);
        return response.success;
    }

    async getBass(): Promise<number | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetBass', body);
        if (!response.success || !response.body) {
            return null;
        }

        const bass = XmlParser.extractValue(response.body, 'CurrentBass');
        return bass ? parseInt(bass, 10) : null;
    }

    async setBass(bass: number): Promise<boolean> {
        const clampedBass = Math.max(-10, Math.min(10, bass));
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            DesiredBass: clampedBass,
        });

        const response = await this.callAction('SetBass', body);
        return response.success;
    }

    async getTreble(): Promise<number | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetTreble', body);
        if (!response.success || !response.body) {
            return null;
        }

        const treble = XmlParser.extractValue(response.body, 'CurrentTreble');
        return treble ? parseInt(treble, 10) : null;
    }

    async setTreble(treble: number): Promise<boolean> {
        const clampedTreble = Math.max(-10, Math.min(10, treble));
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            DesiredTreble: clampedTreble,
        });

        const response = await this.callAction('SetTreble', body);
        return response.success;
    }
}
