import { XmlParser } from './response-parser.js';

export class RequestBuilder {
    static buildSimpleBody(params: Record<string, string | number | boolean>): string {
        const parts: string[] = [];

        for (const [key, value] of Object.entries(params)) {
            let stringValue: string;

            if (typeof value === 'boolean') {
                stringValue = XmlParser.booleanToSonos(value);
            } else if (typeof value === 'number') {
                stringValue = value.toString();
            } else {
                stringValue = XmlParser.escapeXml(value);
            }

            parts.push(`<${key}>${stringValue}</${key}>`);
        }

        return parts.join('\n      ');
    }

    static buildMetadata(uri: string, title?: string, parentId = '-1'): string {
        const escapedTitle = title ? XmlParser.escapeXml(title) : '';

        return XmlParser.escapeXml(`<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" 
      xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" 
      xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" 
      xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
      <item id="-1" parentID="${parentId}" restricted="true">
        <dc:title>${escapedTitle}</dc:title>
        <upnp:class>object.item.audioItem.musicTrack</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">RINCON_AssociatedZPUDN</desc>
      </item>
    </DIDL-Lite>`);
    }
}
