import { describe, it, expect } from 'vitest';
import { XmlParser } from '../src/soap/response-parser';

describe('XmlParser', () => {
    describe('extractValue', () => {
        it('should extract simple tag value', () => {
            const xml = '<root><name>Test</name></root>';
            const result = XmlParser.extractValue(xml, 'name');
            expect(result).toBe('Test');
        });

        it('should return null for non-existent tag', () => {
            const xml = '<root><name>Test</name></root>';
            const result = XmlParser.extractValue(xml, 'missing');
            expect(result).toBeNull();
        });

        it('should handle multiline content', () => {
            const xml = '<root><data>\n  Value\n</data></root>';
            const result = XmlParser.extractValue(xml, 'data');
            expect(result).toBe('\n  Value\n');
        });
    });

    describe('booleanToSonos', () => {
        it('should convert true to 1', () => {
            expect(XmlParser.booleanToSonos(true)).toBe('1');
        });

        it('should convert false to 0', () => {
            expect(XmlParser.booleanToSonos(false)).toBe('0');
        });
    });

    describe('sonosToBoolean', () => {
        it('should convert 1 to true', () => {
            expect(XmlParser.sonosToBoolean('1')).toBe(true);
        });

        it('should convert 0 to false', () => {
            expect(XmlParser.sonosToBoolean('0')).toBe(false);
        });

        it('should convert true string to true', () => {
            expect(XmlParser.sonosToBoolean('true')).toBe(true);
        });

        it('should convert false string to false', () => {
            expect(XmlParser.sonosToBoolean('false')).toBe(false);
        });
    });

    describe('escapeXml', () => {
        it('should escape special characters', () => {
            const input = '<tag attr="value">text & more</tag>';
            const result = XmlParser.escapeXml(input);
            expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;text &amp; more&lt;/tag&gt;');
        });
    });

    describe('unescapeXml', () => {
        it('should unescape XML entities', () => {
            const input = '&lt;tag attr=&quot;value&quot;&gt;text &amp; more&lt;/tag&gt;';
            const result = XmlParser.unescapeXml(input);
            expect(result).toBe('<tag attr="value">text & more</tag>');
        });
    });
});
