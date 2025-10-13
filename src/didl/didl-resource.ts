/**
 * DIDL Resource - represents a playable resource (audio file, stream, etc.)
 * Based on UPnP ContentDirectory spec
 */

export interface DidlResourceOptions {
    uri: string;
    protocolInfo: string;
    duration?: string;
    size?: number;
    bitrate?: number;
    sampleFrequency?: number;
    nrAudioChannels?: number;
    resolution?: string;
    colorDepth?: number;
    importUri?: string;
}

export class DidlResource {
    public uri: string;
    public protocolInfo: string;
    public duration?: string;
    public size?: number;
    public bitrate?: number;
    public sampleFrequency?: number;
    public nrAudioChannels?: number;
    public resolution?: string;
    public colorDepth?: number;
    public importUri?: string;

    constructor(options: DidlResourceOptions) {
        this.uri = options.uri;
        this.protocolInfo = options.protocolInfo;
        if (options.duration !== undefined) this.duration = options.duration;
        if (options.size !== undefined) this.size = options.size;
        if (options.bitrate !== undefined) this.bitrate = options.bitrate;
        if (options.sampleFrequency !== undefined) this.sampleFrequency = options.sampleFrequency;
        if (options.nrAudioChannels !== undefined) this.nrAudioChannels = options.nrAudioChannels;
        if (options.resolution !== undefined) this.resolution = options.resolution;
        if (options.colorDepth !== undefined) this.colorDepth = options.colorDepth;
        if (options.importUri !== undefined) this.importUri = options.importUri;
    }

    /**
     * Convert to plain object for serialization
     */
    toDict(): Record<string, unknown> {
        const result: Record<string, unknown> = {
            uri: this.uri,
            protocolInfo: this.protocolInfo,
        };

        if (this.duration !== undefined) result.duration = this.duration;
        if (this.size !== undefined) result.size = this.size;
        if (this.bitrate !== undefined) result.bitrate = this.bitrate;
        if (this.sampleFrequency !== undefined) result.sampleFrequency = this.sampleFrequency;
        if (this.nrAudioChannels !== undefined) result.nrAudioChannels = this.nrAudioChannels;
        if (this.resolution !== undefined) result.resolution = this.resolution;
        if (this.colorDepth !== undefined) result.colorDepth = this.colorDepth;
        if (this.importUri !== undefined) result.importUri = this.importUri;

        return result;
    }

    /**
     * Create from plain object
     */
    static fromDict(data: Record<string, unknown>): DidlResource {
        return new DidlResource({
            uri: data.uri as string,
            protocolInfo: data.protocolInfo as string,
            duration: data.duration as string | undefined,
            size: data.size as number | undefined,
            bitrate: data.bitrate as number | undefined,
            sampleFrequency: data.sampleFrequency as number | undefined,
            nrAudioChannels: data.nrAudioChannels as number | undefined,
            resolution: data.resolution as string | undefined,
            colorDepth: data.colorDepth as number | undefined,
            importUri: data.importUri as string | undefined,
        });
    }

    /**
     * Check equality with another resource
     */
    equals(other: DidlResource): boolean {
        return this.uri === other.uri &&
            this.protocolInfo === other.protocolInfo;
    }
}
