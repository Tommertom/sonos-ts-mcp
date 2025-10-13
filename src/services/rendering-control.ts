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

    async getLoudness(channel = 'Master'): Promise<boolean | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
        });

        const response = await this.callAction('GetLoudness', body);
        if (!response.success || !response.body) {
            return null;
        }

        const loudness = XmlParser.extractValue(response.body, 'CurrentLoudness');
        return loudness ? XmlParser.sonosToBoolean(loudness) : null;
    }

    async setLoudness(loudness: boolean, channel = 'Master'): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: channel,
            DesiredLoudness: loudness,
        });

        const response = await this.callAction('SetLoudness', body);
        return response.success;
    }

    /**
     * Get the current night mode setting (for supported devices like Playbar/Beam)
     */
    async getNightMode(): Promise<boolean | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetEQ', body);
        if (!response.success || !response.body) {
            return null;
        }

        const nightMode = XmlParser.extractValue(response.body, 'NightMode');
        return nightMode ? XmlParser.sonosToBoolean(nightMode) : null;
    }

    /**
     * Set night mode (for supported devices like Playbar/Beam)
     * Reduces the intensity of loud sounds
     */
    async setNightMode(enabled: boolean): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            EQType: 'NightMode',
            DesiredValue: enabled ? 1 : 0,
        });

        const response = await this.callAction('SetEQ', body);
        return response.success;
    }

    /**
     * Get the current dialog enhancement setting (for supported devices)
     */
    async getDialogLevel(): Promise<boolean | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetEQ', body);
        if (!response.success || !response.body) {
            return null;
        }

        const dialogLevel = XmlParser.extractValue(response.body, 'DialogLevel');
        return dialogLevel ? XmlParser.sonosToBoolean(dialogLevel) : null;
    }

    /**
     * Set dialog enhancement (for supported devices like Playbar/Beam)
     * Enhances spoken dialog clarity
     */
    async setDialogLevel(enabled: boolean): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            EQType: 'DialogLevel',
            DesiredValue: enabled ? 1 : 0,
        });

        const response = await this.callAction('SetEQ', body);
        return response.success;
    }

    /**
     * Get subwoofer gain (-15 to 15)
     */
    async getSubGain(): Promise<number | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetEQ', body);
        if (!response.success || !response.body) {
            return null;
        }

        const subGain = XmlParser.extractValue(response.body, 'SubGain');
        return subGain ? parseInt(subGain, 10) : null;
    }

    /**
     * Set subwoofer gain (-15 to 15)
     */
    async setSubGain(gain: number): Promise<boolean> {
        const clampedGain = Math.max(-15, Math.min(15, gain));
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            EQType: 'SubGain',
            DesiredValue: clampedGain,
        });

        const response = await this.callAction('SetEQ', body);
        return response.success;
    }

    /**
     * Get subwoofer enabled status
     */
    async getSubEnabled(): Promise<boolean | null> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
        });

        const response = await this.callAction('GetEQ', body);
        if (!response.success || !response.body) {
            return null;
        }

        const subEnabled = XmlParser.extractValue(response.body, 'SubEnabled');
        return subEnabled ? XmlParser.sonosToBoolean(subEnabled) : null;
    }

    /**
     * Set subwoofer enabled status
     */
    async setSubEnabled(enabled: boolean): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            EQType: 'SubEnabled',
            DesiredValue: enabled ? 1 : 0,
        });

        const response = await this.callAction('SetEQ', body);
        return response.success;
    }

    /**
     * Ramp volume to a target level over a specified duration
     * @param volume Target volume (0-100)
     * @param rampType 'SLEEP_TIMER_RAMP_TYPE' or 'ALARM_RAMP_TYPE' or 'AUTOPLAY_RAMP_TYPE'
     */
    async rampToVolume(volume: number, rampType = 'SLEEP_TIMER_RAMP_TYPE'): Promise<boolean> {
        const clampedVolume = Math.max(0, Math.min(100, volume));
        const body = RequestBuilder.buildSimpleBody({
            InstanceID: 0,
            Channel: 'Master',
            RampType: rampType,
            DesiredVolume: clampedVolume,
            ResetVolumeAfter: false,
            ProgramURI: '',
        });

        const response = await this.callAction('RampToVolume', body);
        return response.success;
    }
}

