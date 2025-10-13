import type { SonosDevice } from '../types/sonos.js';
import { SoapClient } from '../soap/client.js';
import type { SubscriptionId, SubscriptionOptions, EventHandler, EventData } from '../types/events.js';
import { getDefaultManager } from '../events/subscription-manager.js';

export abstract class BaseService {
    protected soapClient: SoapClient;

    constructor(protected device: SonosDevice) {
        this.soapClient = new SoapClient();
    }

    protected abstract getServiceType(): string;
    protected abstract getControlEndpoint(): string;

    /**
     * Get the event subscription endpoint for this service
     * Override in subclasses if different from control endpoint
     */
    protected getEventEndpoint(): string {
        return this.getControlEndpoint().replace('/Control', '/Event');
    }

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

    /**
     * Subscribe to events for this service
     * @param options Subscription options
     * @returns Subscription ID
     */
    async subscribe(options?: SubscriptionOptions): Promise<SubscriptionId> {
        const manager = getDefaultManager();
        const endpoint = this.getEventEndpoint();
        return manager.subscribe(this.device, endpoint, options);
    }

    /**
     * Unsubscribe from events using subscription ID
     * @param sid Subscription ID
     */
    async unsubscribe(sid: SubscriptionId): Promise<void> {
        const manager = getDefaultManager();
        return manager.unsubscribe(this.device, sid);
    }

    /**
     * Register an event handler for specific event types
     * @param eventType Event type to listen for
     * @param handler Event handler function
     */
    on<T extends EventData>(eventType: T['type'], handler: EventHandler<T>): void {
        const manager = getDefaultManager();
        manager.on(eventType, handler);
    }

    /**
     * Unregister an event handler
     * @param eventType Event type
     * @param handler Event handler function
     */
    off<T extends EventData>(eventType: T['type'], handler: EventHandler<T>): void {
        const manager = getDefaultManager();
        manager.off(eventType, handler);
    }
}

