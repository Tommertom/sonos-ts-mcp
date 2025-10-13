import { describe, it, expect } from 'vitest';
import { RequestBuilder } from '../src/soap/request-builder';

describe('RequestBuilder', () => {
    describe('buildSimpleBody', () => {
        it('should build body with string values', () => {
            const params = {
                InstanceID: '0',
                CurrentURI: 'http://example.com/track.mp3',
            };

            const result = RequestBuilder.buildSimpleBody(params);
            expect(result).toContain('<InstanceID>0</InstanceID>');
            expect(result).toContain('<CurrentURI>http://example.com/track.mp3</CurrentURI>');
        });

        it('should build body with number values', () => {
            const params = {
                InstanceID: 0,
                Volume: 50,
            };

            const result = RequestBuilder.buildSimpleBody(params);
            expect(result).toContain('<InstanceID>0</InstanceID>');
            expect(result).toContain('<Volume>50</Volume>');
        });

        it('should build body with boolean values', () => {
            const params = {
                InstanceID: 0,
                DesiredMute: true,
            };

            const result = RequestBuilder.buildSimpleBody(params);
            expect(result).toContain('<InstanceID>0</InstanceID>');
            expect(result).toContain('<DesiredMute>1</DesiredMute>');
        });

        it('should escape XML special characters in strings', () => {
            const params = {
                Title: 'Song & Artist <Test>',
            };

            const result = RequestBuilder.buildSimpleBody(params);
            expect(result).toContain('&amp;');
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
        });
    });

    describe('buildMetadata', () => {
        it('should build DIDL metadata', () => {
            const uri = 'http://example.com/track.mp3';
            const title = 'Test Song';

            const result = RequestBuilder.buildMetadata(uri, title);

            expect(result).toContain('DIDL-Lite');
            expect(result).toContain('Test Song');
        });

        it('should escape URI and title', () => {
            const uri = 'http://example.com/track<test>.mp3';
            const title = 'Song & Artist';

            const result = RequestBuilder.buildMetadata(uri, title);

            expect(result).not.toContain('<test>');
            expect(result).not.toContain('Song & Artist');
        });
    });
});
