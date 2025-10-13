export interface SoapRequestOptions {
    ip: string;
    port: number;
    endpoint: string;
    service: string;
    action: string;
    body: string;
}

export interface SoapResponse {
    success: boolean;
    body?: string;
    error?: {
        code: number;
        message: string;
    };
}

export class SoapClient {
    async call(options: SoapRequestOptions): Promise<SoapResponse> {
        const { ip, port, endpoint, service, action, body } = options;
        const url = `http://${ip}:${port}${endpoint}`;

        const envelope = this.buildEnvelope(service, action, body);
        const soapAction = `"${service}#${action}"`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset="utf-8"',
                    SOAPAction: soapAction,
                },
                body: envelope,
            });

            const responseText = await response.text();

            if (!response.ok) {
                return this.parseErrorResponse(responseText, response.status);
            }

            return {
                success: true,
                body: responseText,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: -1,
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }

    private buildEnvelope(service: string, action: string, body: string): string {
        return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="${service}">
      ${body}
    </u:${action}>
  </s:Body>
</s:Envelope>`;
    }

    private parseErrorResponse(responseText: string, statusCode: number): SoapResponse {
        const errorCodeMatch = /<errorCode>(\d+)<\/errorCode>/.exec(responseText);
        const errorCode = errorCodeMatch?.[1] ? parseInt(errorCodeMatch[1], 10) : statusCode;

        return {
            success: false,
            error: {
                code: errorCode,
                message: `SOAP error ${errorCode}`,
            },
        };
    }
}
