import { SoapClient } from '../soap/client.js';
import type {
    MusicServiceDescriptor,
    MusicServiceItem,
    MusicServiceContainer,
    SMAPIResponse,
} from '../types/music-services.js';

/**
 * SMAPI (Sonos Music API) client for communicating with third-party music services
 * This client handles SOAP requests to music service endpoints like Sonos Radio, TuneIn, etc.
 */
export class SMAPIClient {
    private serviceDescriptor: MusicServiceDescriptor;
    private sessionId?: string;

    constructor(serviceDescriptor: MusicServiceDescriptor, sessionId?: string) {
        this.serviceDescriptor = serviceDescriptor;
        this.sessionId = sessionId;
    }

    /**
     * Get metadata for a container or item
     * @param id Container or item ID (e.g., 'root', 'category/rock')
     * @param index Starting index for pagination
     * @param count Number of items to return
     * @returns SMAPI response with items
     */
    async getMetadata(
        id: string,
        index: number = 0,
        count: number = 100
    ): Promise<SMAPIResponse> {
        const soapBody = this.buildGetMetadataRequest(id, index, count);
        const response = await this.sendSoapRequest('getMetadata', soapBody);

        if (!response) {
            return { items: [], total: 0, index: 0, count: 0 };
        }

        return this.parseMetadataResponse(response);
    }

    /**
     * Search for items in the music service
     * @param term Search term
     * @param index Starting index for pagination
     * @param count Number of items to return
     * @returns SMAPI response with matching items
     */
    async search(
        term: string,
        index: number = 0,
        count: number = 100
    ): Promise<SMAPIResponse> {
        const soapBody = this.buildSearchRequest(term, index, count);
        const response = await this.sendSoapRequest('search', soapBody);

        if (!response) {
            return { items: [], total: 0, index: 0, count: 0 };
        }

        return this.parseMetadataResponse(response);
    }

    /**
     * Get extended metadata for a specific item
     * @param id Item ID
     * @returns Item metadata
     */
    async getExtendedMetadata(id: string): Promise<MusicServiceItem | null> {
        const soapBody = this.buildGetExtendedMetadataRequest(id);
        const response = await this.sendSoapRequest('getExtendedMetadata', soapBody);

        if (!response) {
            return null;
        }

        return this.parseExtendedMetadataResponse(response);
    }

    /**
     * Get media URI for playing an item
     * @param id Item ID
     * @returns Playable URI
     */
    async getMediaURI(id: string): Promise<string | null> {
        const soapBody = this.buildGetMediaURIRequest(id);
        const response = await this.sendSoapRequest('getMediaURI', soapBody);

        if (!response) {
            return null;
        }

        return this.parseMediaURIResponse(response);
    }

    /**
     * Build SOAP request for getMetadata
     */
    private buildGetMetadataRequest(id: string, index: number, count: number): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getMetadata xmlns="http://www.sonos.com/Services/1.1">
            <id>${this.escapeXml(id)}</id>
            <index>${index}</index>
            <count>${count}</count>${this.sessionId ? `
            <credentials><sessionId>${this.sessionId}</sessionId></credentials>` : ''}
        </getMetadata>
    </s:Body>
</s:Envelope>`;
    }

    /**
     * Build SOAP request for search
     */
    private buildSearchRequest(term: string, index: number, count: number): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <search xmlns="http://www.sonos.com/Services/1.1">
            <id>search:all</id>
            <term>${this.escapeXml(term)}</term>
            <index>${index}</index>
            <count>${count}</count>${this.sessionId ? `
            <credentials><sessionId>${this.sessionId}</sessionId></credentials>` : ''}
        </search>
    </s:Body>
</s:Envelope>`;
    }

    /**
     * Build SOAP request for getExtendedMetadata
     */
    /**
     * Build SOAP request for getExtendedMetadata
     */
    private buildGetExtendedMetadataRequest(id: string): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getExtendedMetadata xmlns="http://www.sonos.com/Services/1.1">
            <id>${this.escapeXml(id)}</id>${this.sessionId ? `
            <credentials><sessionId>${this.sessionId}</sessionId></credentials>` : ''}
        </getExtendedMetadata>
    </s:Body>
</s:Envelope>`;
    }

    /**
     * Build SOAP request for getMediaURI
     */
    private buildGetMediaURIRequest(id: string): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
    <s:Body>
        <getMediaURI xmlns="http://www.sonos.com/Services/1.1">
            <id>${this.escapeXml(id)}</id>${this.sessionId ? `
            <credentials><sessionId>${this.sessionId}</sessionId></credentials>` : ''}
        </getMediaURI>
    </s:Body>
</s:Envelope>`;
    }

    /**
     * Send SOAP request to music service endpoint
     */
    private async sendSoapRequest(action: string, soapBody: string): Promise<string | null> {
        try {
            const endpoint = this.serviceDescriptor.secureUri || this.serviceDescriptor.uri;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `"http://www.sonos.com/Services/1.1#${action}"`,
                },
                body: soapBody,
            });

            if (!response.ok) {
                console.error(`SMAPI request failed: ${response.status} ${response.statusText}`);
                return null;
            }

            return await response.text();
        } catch (error) {
            console.error('Error sending SMAPI request:', error);
            return null;
        }
    }    /**
     * Parse metadata response (getMetadata or search)
     */
    private parseMetadataResponse(xml: string): SMAPIResponse {
        const items: (MusicServiceItem | MusicServiceContainer)[] = [];
        let total = 0;
        let index = 0;
        let count = 0;

        try {
            // Extract total, index, count (with optional namespace prefix)
            const totalMatch = xml.match(/<(?:\w+:)?total>(\d+)<\/(?:\w+:)?total>/);
            const indexMatch = xml.match(/<(?:\w+:)?index>(\d+)<\/(?:\w+:)?index>/);
            const countMatch = xml.match(/<(?:\w+:)?count>(\d+)<\/(?:\w+:)?count>/);

            total = totalMatch ? parseInt(totalMatch[1] ?? '0') : 0;
            index = indexMatch ? parseInt(indexMatch[1] ?? '0') : 0;
            count = countMatch ? parseInt(countMatch[1] ?? '0') : 0;

            // Parse media collection items (with optional namespace prefix)
            const itemMatches = xml.matchAll(/<(?:\w+:)?mediaCollection>([\s\S]*?)<\/(?:\w+:)?mediaCollection>/g);
            for (const match of itemMatches) {
                const item = this.parseMediaCollection(match[1] ?? '');
                if (item) items.push(item);
            }

            // Parse media metadata items (with optional namespace prefix)
            const metadataMatches = xml.matchAll(/<(?:\w+:)?mediaMetadata>([\s\S]*?)<\/(?:\w+:)?mediaMetadata>/g);
            for (const match of metadataMatches) {
                const item = this.parseMediaMetadata(match[1] ?? '');
                if (item) items.push(item);
            }
        } catch (error) {
            console.error('Error parsing metadata response:', error);
        }

        return { items, total, index, count };
    }

    /**
     * Parse media collection (container)
     */
    private parseMediaCollection(xml: string): MusicServiceContainer | null {
        try {
            const id = this.extractValue(xml, 'id');
            const title = this.extractValue(xml, 'title');

            if (!id || !title) return null;

            const itemType = this.extractValue(xml, 'itemType');
            const canEnumerate = this.extractValue(xml, 'canEnumerate') !== 'false'; // Default to true

            return {
                id,
                title,
                canEnumerate,
                canPlay: this.extractValue(xml, 'canPlay') === 'true',
                itemType: (itemType as MusicServiceContainer['itemType']) || 'container',
                albumArtUri: this.extractValue(xml, 'albumArtURI') || undefined,
                artist: this.extractValue(xml, 'artist') || undefined,
                childCount: this.extractValue(xml, 'childCount') ? parseInt(this.extractValue(xml, 'childCount')!) : undefined,
            };
        } catch (error) {
            console.error('Error parsing media collection:', error);
            return null;
        }
    }

    /**
     * Parse media metadata (item)
     */
    private parseMediaMetadata(xml: string): MusicServiceItem | null {
        try {
            const id = this.extractValue(xml, 'id');
            const title = this.extractValue(xml, 'title');

            if (!id || !title) return null;

            const itemType = this.extractValue(xml, 'itemType');
            const duration = this.extractValue(xml, 'duration');

            return {
                id,
                title,
                mimeType: this.extractValue(xml, 'mimeType') || 'audio/mpeg',
                itemType: (itemType as MusicServiceItem['itemType']) || 'track',
                canPlay: this.extractValue(xml, 'canPlay') !== 'false', // Default to true
                artist: this.extractValue(xml, 'artist') || undefined,
                artistId: this.extractValue(xml, 'artistId') || undefined,
                album: this.extractValue(xml, 'album') || undefined,
                albumId: this.extractValue(xml, 'albumId') || undefined,
                albumArtUri: this.extractValue(xml, 'albumArtURI') || undefined,
                duration: duration ? parseInt(duration) : undefined,
                uri: this.extractValue(xml, 'uri') || undefined,
                trackNumber: this.extractValue(xml, 'trackNumber') ? parseInt(this.extractValue(xml, 'trackNumber')!) : undefined,
            };
        } catch (error) {
            console.error('Error parsing media metadata:', error);
            return null;
        }
    }

    /**
     * Parse extended metadata response
     */
    private parseExtendedMetadataResponse(xml: string): MusicServiceItem | null {
        const metadataMatch = xml.match(/<(?:\w+:)?mediaMetadata>([\s\S]*?)<\/(?:\w+:)?mediaMetadata>/);
        if (!metadataMatch) return null;

        return this.parseMediaMetadata(metadataMatch[1] ?? '');
    }

    /**
     * Parse media URI response
     */
    private parseMediaURIResponse(xml: string): string | null {
        // Try to match getMediaURIResult element (with optional namespace prefix)
        const uriMatch = xml.match(/<(?:\w+:)?getMediaURIResult>([\s\S]*?)<\/(?:\w+:)?getMediaURIResult>/);
        if (!uriMatch) return null;

        const content = uriMatch[1]?.trim() ?? '';

        // First check if the URI is directly in the text content (common case)
        if (content && !content.includes('<')) {
            return content;
        }

        // Otherwise, try to extract from a nested <uri> element
        const nestedUri = this.extractValue(content, 'uri');
        return nestedUri || null;
    }

    /**
     * Extract value from XML element (handles optional namespace prefix)
     */
    private extractValue(xml: string, tagName: string): string | null {
        const match = xml.match(new RegExp(`<(?:\\w+:)?${tagName}>([^<]*)<\\/(?:\\w+:)?${tagName}>`));
        return match ? (match[1] ?? null) : null;
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(unsafe: string): string {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
