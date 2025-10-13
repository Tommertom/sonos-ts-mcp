/**
 * Subscription Manager - Manages UPnP GENA event subscriptions to Sonos devices
 */

import { request as httpRequest } from 'http';
import type {
    SubscriptionId,
    EventSubscription,
    SubscriptionOptions,
    EventData,
    EventHandler,
    EventType,
} from '../types/events.js';
import { EventListener, getDefaultListener } from './event-listener.js';
import { EventParser } from './event-parser.js';
import type { SonosDevice } from '../types/sonos.js';

/**
 * Make an HTTP request using Node.js http module
 */
function makeRequest(
    method: string,
    url: string,
    headers: Record<string, string>
): Promise<{ statusCode: number; headers: Record<string, string | string[] | undefined> }> {
    return new Promise((resolve, reject) => {
        const req = httpRequest(
            url,
            {
                method,
                headers,
            },
            (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers as Record<string, string | string[] | undefined>,
                });
            }
        );

        req.on('error', reject);
        req.end();
    });
}

/**
 * Subscription Manager handles creating, renewing, and canceling subscriptions
 */
export class SubscriptionManager {
    private subscriptions: Map<SubscriptionId, EventSubscription> = new Map();
    private renewTimers: Map<SubscriptionId, NodeJS.Timeout> = new Map();
    private eventListener: EventListener;
    private eventParser: EventParser;
    private eventHandlers: Map<EventType, Set<EventHandler>> = new Map();
    private deviceSubscriptions: Map<string, Set<SubscriptionId>> = new Map();

    constructor(eventListener?: EventListener) {
        this.eventListener = eventListener || getDefaultListener();
        this.eventParser = new EventParser();

        // Listen for notifications from the event listener
        this.eventListener.on('notification', this.handleNotification.bind(this));
    }

    /**
     * Subscribe to events for a specific endpoint on a device
     */
    async subscribe(
        device: SonosDevice,
        endpoint: string,
        options: SubscriptionOptions = {}
    ): Promise<SubscriptionId> {
        // Ensure the event listener is started
        if (!this.eventListener.isListening()) {
            await this.eventListener.start();
        }

        const timeout = options.timeout || 1800; // Default 30 minutes
        const callbackUrl = options.callbackUrl || `<${this.eventListener.getCallbackUrl()}>`;

        // Send SUBSCRIBE request to the device
        const url = `http://${device.ip}:${device.port}${endpoint}`;
        const headers = {
            CALLBACK: callbackUrl,
            NT: 'upnp:event',
            TIMEOUT: `Second-${timeout}`,
        };

        try {
            const response = await makeRequest(
                'SUBSCRIBE',
                url,
                headers
            );

            const sid = response.headers.sid as SubscriptionId;
            if (!sid) {
                throw new Error('No SID returned in SUBSCRIBE response');
            }

            // Calculate renewal time (renew 5 minutes before expiry)
            const renewAt = new Date(Date.now() + (timeout - 300) * 1000);

            // Store subscription info
            const subscription: EventSubscription = {
                sid,
                endpoint,
                deviceId: device.uuid || device.ip,
                renewAt,
                timeout,
            };

            this.subscriptions.set(sid, subscription);

            // Track device subscriptions
            const deviceSubs = this.deviceSubscriptions.get(subscription.deviceId) || new Set();
            deviceSubs.add(sid);
            this.deviceSubscriptions.set(subscription.deviceId, deviceSubs);

            // Schedule automatic renewal
            this.scheduleRenewal(device, sid);

            return sid;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to subscribe: ${message}`);
        }
    }

    /**
     * Renew an existing subscription
     */
    async renew(device: SonosDevice, sid: SubscriptionId): Promise<void> {
        const subscription = this.subscriptions.get(sid);
        if (!subscription) {
            throw new Error(`Subscription ${sid} not found`);
        }

        const url = `http://${device.ip}:${device.port}${subscription.endpoint}`;
        const headers = {
            SID: sid,
            TIMEOUT: `Second-${subscription.timeout}`,
        };

        try {
            await makeRequest(
                'SUBSCRIBE',
                url,
                headers
            );

            // Update renewal time
            subscription.renewAt = new Date(Date.now() + (subscription.timeout - 300) * 1000);
            this.subscriptions.set(sid, subscription);

            // Reschedule renewal
            this.scheduleRenewal(device, sid);
        } catch (error) {
            // If renewal fails, remove the subscription
            this.subscriptions.delete(sid);
            this.clearRenewalTimer(sid);

            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to renew subscription: ${message}`);
        }
    }

    /**
     * Unsubscribe from events
     */
    async unsubscribe(device: SonosDevice, sid: SubscriptionId): Promise<void> {
        const subscription = this.subscriptions.get(sid);
        if (!subscription) {
            return; // Already unsubscribed
        }

        const url = `http://${device.ip}:${device.port}${subscription.endpoint}`;
        const headers = {
            SID: sid,
        };

        try {
            await makeRequest(
                'UNSUBSCRIBE',
                url,
                headers
            );
        } catch (error) {
            // Ignore errors when unsubscribing
            console.error(`Error unsubscribing ${sid}:`, error);
        } finally {
            // Clean up subscription tracking
            this.subscriptions.delete(sid);
            this.clearRenewalTimer(sid);

            // Remove from device subscriptions
            const deviceSubs = this.deviceSubscriptions.get(subscription.deviceId);
            if (deviceSubs) {
                deviceSubs.delete(sid);
                if (deviceSubs.size === 0) {
                    this.deviceSubscriptions.delete(subscription.deviceId);
                }
            }
        }
    }

    /**
     * Unsubscribe from all events for a specific device
     */
    async unsubscribeDevice(device: SonosDevice): Promise<void> {
        const deviceId = device.uuid || device.ip;
        const sids = this.deviceSubscriptions.get(deviceId);

        if (!sids || sids.size === 0) {
            return;
        }

        // Unsubscribe from all device subscriptions
        const promises = Array.from(sids).map(sid => this.unsubscribe(device, sid));
        await Promise.all(promises);
    }

    /**
     * Unsubscribe from all events and stop the event listener
     */
    async unsubscribeAll(): Promise<void> {
        // Cancel all renewal timers
        for (const timer of this.renewTimers.values()) {
            globalThis.clearTimeout(timer);
        }
        this.renewTimers.clear();

        // Clear all subscriptions
        this.subscriptions.clear();
        this.deviceSubscriptions.clear();

        // Stop the event listener
        if (this.eventListener.isListening()) {
            await this.eventListener.stop();
        }
    }

    /**
     * Get all active subscriptions
     */
    getSubscriptions(): EventSubscription[] {
        return Array.from(this.subscriptions.values());
    }

    /**
     * Get subscriptions for a specific device
     */
    getDeviceSubscriptions(deviceId: string): EventSubscription[] {
        const sids = this.deviceSubscriptions.get(deviceId);
        if (!sids) {
            return [];
        }

        return Array.from(sids)
            .map(sid => this.subscriptions.get(sid))
            .filter((sub): sub is EventSubscription => sub !== undefined);
    }

    /**
     * Register an event handler for a specific event type
     */
    on<T extends EventData>(eventType: EventType, handler: EventHandler<T>): void {
        const handlers = this.eventHandlers.get(eventType) || new Set();
        handlers.add(handler as EventHandler);
        this.eventHandlers.set(eventType, handlers);
    }

    /**
     * Unregister an event handler
     */
    off<T extends EventData>(eventType: EventType, handler: EventHandler<T>): void {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            handlers.delete(handler as EventHandler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(eventType);
            }
        }
    }

    /**
     * Handle incoming notification from event listener
     */
    private async handleNotification(notification: {
        sid: SubscriptionId;
        properties: Record<string, string>;
        rawXml: string;
    }): Promise<void> {
        const subscription = this.subscriptions.get(notification.sid);
        if (!subscription) {
            // Unknown subscription - might be from a previous session
            return;
        }

        try {
            // Parse the event data
            const events = await this.eventParser.parse(
                subscription.endpoint,
                notification.properties,
                subscription.deviceId
            );

            // Emit each event to registered handlers
            for (const event of events) {
                const handlers = this.eventHandlers.get(event.type);
                if (handlers) {
                    for (const handler of handlers) {
                        try {
                            await handler(event);
                        } catch (error) {
                            console.error(`Error in event handler for ${event.type}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing event:', error);
        }
    }

    /**
     * Schedule automatic renewal for a subscription
     */
    private scheduleRenewal(device: SonosDevice, sid: SubscriptionId): void {
        // Clear existing timer if any
        this.clearRenewalTimer(sid);

        const subscription = this.subscriptions.get(sid);
        if (!subscription) {
            return;
        }

        const msUntilRenewal = subscription.renewAt.getTime() - Date.now();
        if (msUntilRenewal <= 0) {
            // Should renew immediately
            this.renew(device, sid).catch(err => {
                console.error(`Failed to renew subscription ${sid}:`, err);
            });
            return;
        }

        const timer = globalThis.setTimeout(() => {
            this.renew(device, sid).catch(err => {
                console.error(`Failed to renew subscription ${sid}:`, err);
            });
        }, msUntilRenewal);

        this.renewTimers.set(sid, timer);
    }

    /**
     * Clear renewal timer for a subscription
     */
    private clearRenewalTimer(sid: SubscriptionId): void {
        const timer = this.renewTimers.get(sid);
        if (timer) {
            globalThis.clearTimeout(timer);
            this.renewTimers.delete(sid);
        }
    }
}

// Export a singleton instance
let defaultManager: SubscriptionManager | null = null;

/**
 * Get the default subscription manager instance
 */
export function getDefaultManager(): SubscriptionManager {
    if (!defaultManager) {
        defaultManager = new SubscriptionManager();
    }
    return defaultManager;
}
