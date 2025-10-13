import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentDirectoryService } from '../src/services/content-directory.js';
import type { SonosDevice } from '../src/types/sonos.js';

// Type for testing private methods
type TestableContentDirectoryService = ContentDirectoryService & {
    callAction: (action: string, body: string) => Promise<{ success: boolean; body?: string }>;
};

describe('ContentDirectoryService', () => {
    let service: ContentDirectoryService;
    let mockDevice: SonosDevice;

    beforeEach(() => {
        mockDevice = {
            uuid: 'RINCON_TEST123',
            ip: '192.168.1.100',
            port: 1400,
            location: 'http://192.168.1.100:1400/xml/device_description.xml',
        };
        service = new ContentDirectoryService(mockDevice);
    });

    describe('Search Type Object IDs', () => {
        it('should return correct object ID for artists', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getArtists();
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('A:ARTIST')
            );
        });

        it('should return correct object ID for albums', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getAlbums();
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('A:ALBUM')
            );
        });

        it('should return correct object ID for tracks', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getTracks();
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('A:TRACKS')
            );
        });

        it('should return correct object ID for genres', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getGenres();
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('A:GENRE')
            );
        });

        it('should return correct object ID for Sonos playlists', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getSonosPlaylists();
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('SQ:')
            );
        });
    });

    describe('browse', () => {
        it('should browse with default options', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>10</TotalMatches><NumberReturned>10</NumberReturned><UpdateID>5</UpdateID>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.browse('Q:0');

            expect(result.total).toBe(10);
            expect(result.returned).toBe(10);
            expect(result.updateId).toBe(5);
        });

        it('should browse with custom options', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>100</TotalMatches><NumberReturned>20</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.browse('A:ARTIST', {
                startIndex: 10,
                count: 20,
                filter: 'dc:title',
                sortCriteria: '+dc:title',
            });

            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('<StartingIndex>10</StartingIndex>')
            );
        });

        it('should handle empty results', async () => {
            const mockResponse = {
                success: true,
                body: `<Result></Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.browse('Q:0');

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.returned).toBe(0);
        });

        it('should handle failed requests', async () => {
            const mockResponse = {
                success: false,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.browse('Q:0');

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.returned).toBe(0);
        });
    });

    describe('browseMetadata', () => {
        it('should browse metadata for an object', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.browseMetadata('S:1234');

            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Browse',
                expect.stringContaining('BrowseMetadata')
            );
        });
    });

    describe('search', () => {
        it('should search for artists', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>5</TotalMatches><NumberReturned>5</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.search('artists', 'Beatles');

            expect(result.total).toBe(5);
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Search',
                expect.stringContaining('Beatles')
            );
        });

        it('should escape special characters in search term', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.search('artists', 'AC"DC');

            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Search',
                expect.stringContaining('&quot;')
            );
        });

        it('should build correct search criteria for albums', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.search('albums', 'Black Album');

            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'Search',
                expect.stringContaining('dc:title contains')
            );
        });
    });

    describe('getAll', () => {
        it('should stop pagination when no more items', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>150</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.getAll('A:ARTIST');

            expect(result.length).toBe(0);
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledTimes(1);
        });

        it('should respect maxItems limit', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>200</TotalMatches><NumberReturned>100</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            await service.getAll('A:ARTIST', 50);

            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('isLibraryUpdating', () => {
        it('should return true when library is updating', async () => {
            const mockResponse = {
                success: true,
                body: '<IsIndexing>1</IsIndexing>',
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.isLibraryUpdating();

            expect(result).toBe(true);
        });

        it('should return false when library is not updating', async () => {
            const mockResponse = {
                success: true,
                body: '<IsIndexing>0</IsIndexing>',
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.isLibraryUpdating();

            expect(result).toBe(false);
        });
    });

    describe('startLibraryUpdate', () => {
        it('should start library update', async () => {
            const mockResponse = {
                success: true,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.startLibraryUpdate();

            expect(result).toBe(true);
            expect((service as unknown as TestableContentDirectoryService).callAction).toHaveBeenCalledWith(
                'RefreshShareIndex',
                expect.any(String)
            );
        });
    });

    describe('getShares', () => {
        it('should return empty array when no shares found', async () => {
            const mockResponse = {
                success: true,
                body: `<Result>&lt;DIDL-Lite&gt;&lt;/DIDL-Lite&gt;</Result><TotalMatches>0</TotalMatches><NumberReturned>0</NumberReturned>`,
            };

            vi.spyOn(service as unknown as TestableContentDirectoryService, 'callAction').mockResolvedValue(mockResponse);

            const result = await service.getShares();

            expect(result).toEqual([]);
        });
    });
});
