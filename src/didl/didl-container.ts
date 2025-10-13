/**
 * DIDL Container classes - represent browsable containers
 */

import { DidlObject } from './didl-object.js';

/**
 * Base container class
 */
export class DidlContainer extends DidlObject {
    get upnpClass(): string {
        return 'object.container';
    }

    // Container-specific properties
    get searchable(): boolean | undefined { return this.getProperty('searchable') as boolean | undefined; }
    set searchable(value: boolean | undefined) { this.setProperty('searchable', value); }

    get childCount(): number | undefined { return this.getProperty('childCount') as number | undefined; }
    set childCount(value: number | undefined) { this.setProperty('childCount', value); }

    get createClass(): string | undefined { return this.getProperty('createClass') as string | undefined; }
    set createClass(value: string | undefined) { this.setProperty('createClass', value); }
}

/**
 * Album container
 */
export class DidlAlbum extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.album';
    }

    get description(): string | undefined { return this.getProperty('description') as string | undefined; }
    set description(value: string | undefined) { this.setProperty('description', value); }

    get longDescription(): string | undefined { return this.getProperty('longDescription') as string | undefined; }
    set longDescription(value: string | undefined) { this.setProperty('longDescription', value); }

    get publisher(): string | undefined { return this.getProperty('publisher') as string | undefined; }
    set publisher(value: string | undefined) { this.setProperty('publisher', value); }

    get contributor(): string | undefined { return this.getProperty('contributor') as string | undefined; }
    set contributor(value: string | undefined) { this.setProperty('contributor', value); }

    get date(): string | undefined { return this.getProperty('date') as string | undefined; }
    set date(value: string | undefined) { this.setProperty('date', value); }

    get relation(): string | undefined { return this.getProperty('relation') as string | undefined; }
    set relation(value: string | undefined) { this.setProperty('relation', value); }

    get rights(): string | undefined { return this.getProperty('rights') as string | undefined; }
    set rights(value: string | undefined) { this.setProperty('rights', value); }
}

/**
 * Music album
 */
export class DidlMusicAlbum extends DidlAlbum {
    get upnpClass(): string {
        return 'object.container.album.musicAlbum';
    }

    get artist(): string | undefined { return this.getProperty('artist') as string | undefined; }
    set artist(value: string | undefined) { this.setProperty('artist', value); }

    get genre(): string | undefined { return this.getProperty('genre') as string | undefined; }
    set genre(value: string | undefined) { this.setProperty('genre', value); }

    get producer(): string | undefined { return this.getProperty('producer') as string | undefined; }
    set producer(value: string | undefined) { this.setProperty('producer', value); }

    get albumArtUri(): string | undefined { return this.getProperty('albumArtUri') as string | undefined; }
    set albumArtUri(value: string | undefined) { this.setProperty('albumArtUri', value); }

    get toc(): string | undefined { return this.getProperty('toc') as string | undefined; }
    set toc(value: string | undefined) { this.setProperty('toc', value); }
}

/**
 * Favorite music album
 */
export class DidlMusicAlbumFavorite extends DidlMusicAlbum {
    get upnpClass(): string {
        return 'object.container.album.musicAlbum#FAVORITE';
    }
}

/**
 * Compilation album
 */
export class DidlMusicAlbumCompilation extends DidlMusicAlbum {
    get upnpClass(): string {
        return 'object.container.album.musicAlbum#COMPILATION';
    }
}

/**
 * Person container
 */
export class DidlPerson extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.person';
    }

    get language(): string | undefined { return this.getProperty('language') as string | undefined; }
    set language(value: string | undefined) { this.setProperty('language', value); }
}

/**
 * Composer
 */
export class DidlComposer extends DidlPerson {
    get upnpClass(): string {
        return 'object.container.person.musicArtist#composer';
    }
}

/**
 * Music artist
 */
export class DidlMusicArtist extends DidlPerson {
    get upnpClass(): string {
        return 'object.container.person.musicArtist';
    }

    get genre(): string | undefined { return this.getProperty('genre') as string | undefined; }
    set genre(value: string | undefined) { this.setProperty('genre', value); }

    get artistDiscographyUri(): string | undefined { return this.getProperty('artistDiscographyUri') as string | undefined; }
    set artistDiscographyUri(value: string | undefined) { this.setProperty('artistDiscographyUri', value); }
}

/**
 * Album list
 */
export class DidlAlbumList extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.albumlist';
    }
}

/**
 * Playlist container
 */
export class DidlPlaylistContainer extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.playlistContainer';
    }

    get artist(): string | undefined { return this.getProperty('artist') as string | undefined; }
    set artist(value: string | undefined) { this.setProperty('artist', value); }

    get genre(): string | undefined { return this.getProperty('genre') as string | undefined; }
    set genre(value: string | undefined) { this.setProperty('genre', value); }

    get longDescription(): string | undefined { return this.getProperty('longDescription') as string | undefined; }
    set longDescription(value: string | undefined) { this.setProperty('longDescription', value); }

    get producer(): string | undefined { return this.getProperty('producer') as string | undefined; }
    set producer(value: string | undefined) { this.setProperty('producer', value); }

    get storageMedium(): string | undefined { return this.getProperty('storageMedium') as string | undefined; }
    set storageMedium(value: string | undefined) { this.setProperty('storageMedium', value); }

    get description(): string | undefined { return this.getProperty('description') as string | undefined; }
    set description(value: string | undefined) { this.setProperty('description', value); }

    get contributor(): string | undefined { return this.getProperty('contributor') as string | undefined; }
    set contributor(value: string | undefined) { this.setProperty('contributor', value); }

    get date(): string | undefined { return this.getProperty('date') as string | undefined; }
    set date(value: string | undefined) { this.setProperty('date', value); }

    get language(): string | undefined { return this.getProperty('language') as string | undefined; }
    set language(value: string | undefined) { this.setProperty('language', value); }

    get rights(): string | undefined { return this.getProperty('rights') as string | undefined; }
    set rights(value: string | undefined) { this.setProperty('rights', value); }
}

/**
 * Same artist playlist
 */
export class DidlSameArtist extends DidlPlaylistContainer {
    get upnpClass(): string {
        return 'object.container.playlistContainer.sameArtist';
    }
}

/**
 * Favorite playlist
 */
export class DidlPlaylistContainerFavorite extends DidlPlaylistContainer {
    get upnpClass(): string {
        return 'object.container.playlistContainer#FAVORITE';
    }
}

/**
 * Tracklist
 */
export class DidlPlaylistContainerTracklist extends DidlPlaylistContainer {
    get upnpClass(): string {
        return 'object.container.playlistContainer#TRACKLIST';
    }
}

/**
 * Genre container
 */
export class DidlGenre extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.genre';
    }

    get genre(): string | undefined { return this.getProperty('genre') as string | undefined; }
    set genre(value: string | undefined) { this.setProperty('genre', value); }

    get longDescription(): string | undefined { return this.getProperty('longDescription') as string | undefined; }
    set longDescription(value: string | undefined) { this.setProperty('longDescription', value); }

    get description(): string | undefined { return this.getProperty('description') as string | undefined; }
    set description(value: string | undefined) { this.setProperty('description', value); }
}

/**
 * Music genre
 */
export class DidlMusicGenre extends DidlGenre {
    get upnpClass(): string {
        return 'object.container.genre.musicGenre';
    }
}

/**
 * Radio show
 */
export class DidlRadioShow extends DidlContainer {
    get upnpClass(): string {
        return 'object.container.radioShow';
    }
}
