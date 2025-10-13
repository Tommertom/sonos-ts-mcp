export interface SonosDevice {
    uuid: string;
    ip: string;
    port: number;
    name?: string;
    location: string;
    modelName?: string;
    modelNumber?: string;
    softwareVersion?: string;
}

export interface SonosDiscoveryResponse {
    location: string;
    server: string;
    usn: string;
    st: string;
    ext?: string;
    cacheControl?: string;
}

export interface SonosServiceAction {
    name: string;
    inputs: Record<string, string | number | boolean>;
    outputs?: Record<string, string | number | boolean>;
}

export interface SonosPlaybackState {
    state: 'PLAYING' | 'PAUSED_PLAYBACK' | 'STOPPED' | 'TRANSITIONING';
    track?: {
        title: string;
        artist: string;
        album: string;
        duration: string;
        uri: string;
        albumArtUri?: string;
    };
    position?: string;
    volume?: number;
    mute?: boolean;
}

export interface SonosZoneGroup {
    coordinator: string;
    members: string[];
}

export interface SonosError extends Error {
    code?: number;
    upnpError?: number;
}
