export class XmlParser {
    static extractValue(xml: string, tag: string): string | null {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
        const match = regex.exec(xml);
        return match?.[1] ?? null;
    }

    static extractAllValues(xml: string, tag: string): string[] {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
        const matches = [];
        let match;
        while ((match = regex.exec(xml)) !== null) {
            if (match[1]) {
                matches.push(match[1]);
            }
        }
        return matches;
    }

    static parseKeyValuePairs(xml: string): Record<string, string> {
        const result: Record<string, string> = {};
        const tagRegex = /<(\w+)>(.*?)<\/\1>/gs;
        let match;

        while ((match = tagRegex.exec(xml)) !== null) {
            const key = match[1];
            const value = match[2];
            if (key && value !== undefined) {
                result[key] = value;
            }
        }

        return result;
    }

    static escapeXml(unsafe: string): string {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    static unescapeXml(safe: string): string {
        return safe
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
    }

    static booleanToSonos(value: boolean): string {
        return value ? '1' : '0';
    }

    static sonosToBoolean(value: string): boolean {
        return value === '1' || value.toLowerCase() === 'true';
    }
}
