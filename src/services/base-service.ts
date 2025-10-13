import type { SonosDevice } from '../types/sonos.js';
import { SoapClient } from '../soap/client.js';

export abstract class BaseService {
    protected soapClient: SoapClient;

    constructor(protected device: SonosDevice) {
        this.soapClient = new SoapClient();
    }

    protected abstract getServiceType(): string;
    protected abstract getControlEndpoint(): string;

    protected async callAction(
        action: string,
        body: string
    ): Promise<{ success: boolean; body?: string; error?: { code: number; message: string } }> {
        return this.soapClient.call({
            ip: this.device.ip,
            port: this.device.port,
            endpoint: this.getControlEndpoint(),
            service: this.getServiceType(),
            action,
            body,
        });
    }
}
