/**
 * DIDL Item classes - represent playable items
 */

import { DidlObject } from './didl-object.js';

/**
 * Base item class
 */
export class DidlItem extends DidlObject {
    get upnpClass(): string {
        return 'object.item';
    }
}

/**
 * Audio item
 */
export class DidlAudioItem extends DidlItem {
    get upnpClass(): string {
        return 'object.item.audioItem';
    }

    // Audio-specific properties
    get genre(): string | undefined { return this.getProperty('genre') as string | undefined; }
    set genre(value: string | undefined) { this.setProperty('genre', value); }

    get description(): string | undefined { return this.getProperty('description') as string | undefined; }
    set description(value: string | undefined) { this.setProperty('description', value); }

    get longDescription(): string | undefined { return this.getProperty('longDescription') as string | undefined; }
    set longDescription(value: string | undefined) { this.setProperty('longDescription', value); }

    get publisher(): string | undefined { return this.getProperty('publisher') as string | undefined; }
    set publisher(value: string | undefined) { this.setProperty('publisher', value); }

    get language(): string | undefined { return this.getProperty('language') as string | undefined; }
    set language(value: string | undefined) { this.setProperty('language', value); }

    get relation(): string | undefined { return this.getProperty('relation') as string | undefined; }
    set relation(value: string | undefined) { this.setProperty('relation', value); }

    get rights(): string | undefined { return this.getProperty('rights') as string | undefined; }
    set rights(value: string | undefined) { this.setProperty('rights', value); }
}

/**
 * Music track - the most commonly used DIDL type
 */
export class DidlMusicTrack extends DidlAudioItem {
    get upnpClass(): string {
        return 'object.item.audioItem.musicTrack';
    }

    // Music track specific properties
    get artist(): string | undefined { return this.getProperty('artist') as string | undefined; }
    set artist(value: string | undefined) { this.setProperty('artist', value); }

    get album(): string | undefined { return this.getProperty('album') as string | undefined; }
    set album(value: string | undefined) { this.setProperty('album', value); }

    get originalTrackNumber(): number | undefined { return this.getProperty('originalTrackNumber') as number | undefined; }
    set originalTrackNumber(value: number | undefined) { this.setProperty('originalTrackNumber', value); }

    get playlist(): string | undefined { return this.getProperty('playlist') as string | undefined; }
    set playlist(value: string | undefined) { this.setProperty('playlist', value); }

    get albumArtUri(): string | undefined { return this.getProperty('albumArtUri') as string | undefined; }
    set albumArtUri(value: string | undefined) { this.setProperty('albumArtUri', value); }

    get contributor(): string | undefined { return this.getProperty('contributor') as string | undefined; }
    set contributor(value: string | undefined) { this.setProperty('contributor', value); }

    get date(): string | undefined { return this.getProperty('date') as string | undefined; }
    set date(value: string | undefined) { this.setProperty('date', value); }
}

/**
 * Audio book
 */
export class DidlAudioBook extends DidlAudioItem {
    get upnpClass(): string {
        return 'object.item.audioItem.audioBook';
    }

    get storageMedium(): string | undefined { return this.getProperty('storageMedium') as string | undefined; }
    set storageMedium(value: string | undefined) { this.setProperty('storageMedium', value); }

    get producer(): string | undefined { return this.getProperty('producer') as string | undefined; }
    set producer(value: string | undefined) { this.setProperty('producer', value); }

    get contributor(): string | undefined { return this.getProperty('contributor') as string | undefined; }
    set contributor(value: string | undefined) { this.setProperty('contributor', value); }

    get date(): string | undefined { return this.getProperty('date') as string | undefined; }
    set date(value: string | undefined) { this.setProperty('date', value); }
}

/**
 * Audio broadcast (radio stream)
 */
export class DidlAudioBroadcast extends DidlAudioItem {
    get upnpClass(): string {
        return 'object.item.audioItem.audioBroadcast';
    }

    get region(): string | undefined { return this.getProperty('region') as string | undefined; }
    set region(value: string | undefined) { this.setProperty('region', value); }

    get radioCallSign(): string | undefined { return this.getProperty('radioCallSign') as string | undefined; }
    set radioCallSign(value: string | undefined) { this.setProperty('radioCallSign', value); }

    get radioStationId(): string | undefined { return this.getProperty('radioStationId') as string | undefined; }
    set radioStationId(value: string | undefined) { this.setProperty('radioStationId', value); }

    get radioBand(): string | undefined { return this.getProperty('radioBand') as string | undefined; }
    set radioBand(value: string | undefined) { this.setProperty('radioBand', value); }

    get channelNr(): number | undefined { return this.getProperty('channelNr') as number | undefined; }
    set channelNr(value: number | undefined) { this.setProperty('channelNr', value); }
}

/**
 * Line-in input
 */
export class DidlAudioLineIn extends DidlAudioItem {
    get upnpClass(): string {
        return 'object.item.audioItem.audioLineIn';
    }
}

/**
 * Recent show
 */
export class DidlRecentShow extends DidlAudioItem {
    get upnpClass(): string {
        return 'object.item.audioItem.recentShow';
    }
}

/**
 * Favorite audio broadcast
 */
export class DidlAudioBroadcastFavorite extends DidlAudioBroadcast {
    get upnpClass(): string {
        return 'object.item.audioItem.audioBroadcast#FAVORITE';
    }
}

/**
 * Generic favorite item
 */
export class DidlFavorite extends DidlItem {
    get upnpClass(): string {
        return 'object.itemobject.item.sonos-favorite';
    }

    get description(): string | undefined { return this.getProperty('description') as string | undefined; }
    set description(value: string | undefined) { this.setProperty('description', value); }

    get resourceMetaData(): string | undefined { return this.getProperty('resourceMetaData') as string | undefined; }
    set resourceMetaData(value: string | undefined) { this.setProperty('resourceMetaData', value); }
}
