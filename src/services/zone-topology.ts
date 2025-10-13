import { BaseService } from './base-service.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { XmlParser } from '../soap/response-parser.js';
import type { SonosZoneGroup } from '../types/sonos.js';

export class ZoneGroupTopologyService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:ZoneGroupTopology:1';
    }

    protected getControlEndpoint(): string {
        return '/ZoneGroupTopology/Control';
    }

    async getZoneGroupState(): Promise<SonosZoneGroup[] | null> {
        const body = RequestBuilder.buildSimpleBody({});

        const response = await this.callAction('GetZoneGroupState', body);
        if (!response.success || !response.body) {
            return null;
        }

        const stateXml = XmlParser.extractValue(response.body, 'ZoneGroupState');
        if (!stateXml) {
            return null;
        }

        const unescapedXml = XmlParser.unescapeXml(stateXml);
        return this.parseZoneGroups(unescapedXml);
    }

    private parseZoneGroups(xml: string): SonosZoneGroup[] {
        const groups: SonosZoneGroup[] = [];
        const groupRegex = /<ZoneGroup[^>]*Coordinator="([^"]+)"[^>]*>(.*?)<\/ZoneGroup>/gs;
        let groupMatch;

        while ((groupMatch = groupRegex.exec(xml)) !== null) {
            const coordinator = groupMatch[1];
            const groupContent = groupMatch[2];

            if (!coordinator || !groupContent) {
                continue;
            }

            const memberRegex = /UUID="([^"]+)"/g;
            const members: string[] = [];
            let memberMatch;

            while ((memberMatch = memberRegex.exec(groupContent)) !== null) {
                const uuid = memberMatch[1];
                if (uuid) {
                    members.push(uuid);
                }
            }

            groups.push({
                coordinator,
                members,
            });
        }

        return groups;
    }
}
