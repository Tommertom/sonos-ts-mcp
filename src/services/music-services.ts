import { BaseService } from './base-service.js';
import { XmlParser } from '../soap/response-parser.js';
import { RequestBuilder } from '../soap/request-builder.js';
import type { MusicServiceDescriptor } from '../types/music-services.js';

/**
 * MusicServices UPnP service for discovering and managing third-party music services
 * This service allows access to services like Spotify, Apple Music, Sonos Radio, TuneIn, etc.
 */
export class MusicServicesService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:MusicServices:1';
    }

    protected getControlEndpoint(): string {
        return '/MusicServices/Control';
    }

    /**
     * List all available music services registered with this Sonos system
     * @returns Array of music service descriptors
     */
    async listAvailableServices(): Promise<MusicServiceDescriptor[]> {
        const body = RequestBuilder.buildSimpleBody({});
        const response = await this.callAction('ListAvailableServices', body);

        if (!response.success || !response.body) {
            return [];
        }

        // Extract the service descriptor list XML
        const descriptorListXml = XmlParser.extractValue(response.body, 'AvailableServiceDescriptorList');
        if (!descriptorListXml) {
            return [];
        }

        // Decode HTML entities (Sonos returns XML encoded as HTML entities)
        const decodedXml = this.decodeHtmlEntities(descriptorListXml);

        return this.parseServiceDescriptors(decodedXml);
    }

    /**
     * Get session ID for an authenticated service
     * @param serviceId Service ID
     * @param username Username for the service
     * @returns Session ID
     */
    async getSessionId(serviceId: number, username: string): Promise<string | null> {
        const body = RequestBuilder.buildSimpleBody({
            ServiceId: serviceId,
            Username: username,
        });

        const response = await this.callAction('GetSessionId', body);

        if (!response.success || !response.body) {
            return null;
        }

        return XmlParser.extractValue(response.body, 'SessionId');
    }

    /**
     * Parse service descriptors from XML
     */
    private parseServiceDescriptors(xml: string): MusicServiceDescriptor[] {
        const services: MusicServiceDescriptor[] = [];

        try {
            // Parse the XML to find all Service elements
            const serviceMatches = xml.matchAll(/<Service[^>]*>[\s\S]*?<\/Service>/g);

            for (const match of serviceMatches) {
                const serviceXml = match[0];
                const descriptor = this.parseServiceDescriptor(serviceXml);
                if (descriptor) {
                    services.push(descriptor);
                }
            }
        } catch (error) {
            console.error('Error parsing service descriptors:', error);
        }

        return services;
    }

    /**
     * Parse a single service descriptor
     */
    private parseServiceDescriptor(xml: string): MusicServiceDescriptor | null {
        try {
            // Extract attributes from Service tag
            const idMatch = xml.match(/Id="(\d+)"/);
            const nameMatch = xml.match(/Name="([^"]+)"/);
            const versionMatch = xml.match(/Version="([^"]+)"/);
            const uriMatch = xml.match(/Uri="([^"]+)"/);
            const secureUriMatch = xml.match(/SecureUri="([^"]+)"/);
            const containerTypeMatch = xml.match(/ContainerType="([^"]+)"/);
            const capabilitiesMatch = xml.match(/Capabilities="(\d+)"/);

            if (!idMatch || !nameMatch) {
                return null;
            }

            // Extract Policy element for auth type
            const policyMatch = xml.match(/<Policy[^>]*Auth="([^"]+)"[^>]*(?:PollInterval="(\d+)")?/);

            // Extract Presentation element
            const presentationMapMatch = xml.match(/<PresentationMap[^>]*Uri="([^"]+)"/);
            const stringsMatch = xml.match(/<Strings[^>]*Uri="([^"]+)"/);

            const descriptor: MusicServiceDescriptor = {
                id: parseInt(idMatch[1] ?? '0'),
                name: nameMatch[1] ?? '',
                version: versionMatch?.[1] ?? '1.0',
                uri: uriMatch?.[1] ?? '',
                secureUri: secureUriMatch?.[1] ?? uriMatch?.[1] ?? '',
                containerType: containerTypeMatch?.[1] ?? 'MService',
                capabilities: capabilitiesMatch ? parseInt(capabilitiesMatch[1] ?? '0') : 0,
                authType: this.parseAuthType(policyMatch?.[1] ?? 'Anonymous'),
                pollInterval: policyMatch?.[2] ? parseInt(policyMatch[2]) : 30,
                presentationMapUri: presentationMapMatch?.[1],
                stringsUri: stringsMatch?.[1],
                serviceType: this.generateServiceType(parseInt(idMatch[1] ?? '0')),
            };

            return descriptor;
        } catch (error) {
            console.error('Error parsing service descriptor:', error);
            return null;
        }
    }

    /**
     * Parse authentication type
     */
    private parseAuthType(auth: string): 'Anonymous' | 'DeviceLink' | 'UserId' | 'AppLink' {
        const authLower = auth.toLowerCase();
        if (authLower.includes('devicelink')) return 'DeviceLink';
        if (authLower.includes('userid')) return 'UserId';
        if (authLower.includes('applink')) return 'AppLink';
        return 'Anonymous';
    }

    /**
     * Generate service type string for DIDL metadata
     * Format: SA_RINCON{serviceId}_
     */
    private generateServiceType(serviceId: number): string {
        return `${serviceId}`;
    }

    /**
     * Decode HTML entities
     */
    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
    }
}
