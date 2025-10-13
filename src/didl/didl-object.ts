/**
 * Base class for all DIDL objects (items and containers)
 * Uses internal Map storage to avoid TypeScript field initialization issues
 */

import { DidlResource, type DidlResourceOptions } from './didl-resource.js';

export interface DidlObjectOptions {
    id: string;
    parentId: string;
    title: string;
    restricted?: boolean;
    creator?: string;
    writeStatus?: string;
    resources?: DidlResourceOptions[];
    [key: string]: unknown;
}

/**
 * Base class for DIDL objects - stores properties in a Map to avoid TS initialization issues
 */
export class DidlObject {
    protected _properties: Map<string, unknown>;
    protected _resources: DidlResource[];

    constructor(options: DidlObjectOptions) {
        this._properties = new Map();
        this._resources = [];

        // Set required properties
        this._properties.set('id', options.id);
        this._properties.set('parentId', options.parentId);
        this._properties.set('title', options.title);
        this._properties.set('restricted', options.restricted ?? true);

        // Set optional properties
        if (options.creator) this._properties.set('creator', options.creator);
        if (options.writeStatus) this._properties.set('writeStatus', options.writeStatus);

        // Handle resources
        if (options.resources) {
            this._resources = options.resources.map(r => new DidlResource(r));
        }

        // Handle any additional properties passed in options
        for (const [key, value] of Object.entries(options)) {
            if (!['id', 'parentId', 'title', 'restricted', 'creator', 'writeStatus', 'resources'].includes(key)) {
                this._properties.set(key, value);
            }
        }
    }

    // Required property getters/setters
    get id(): string { return this._properties.get('id') as string; }
    set id(value: string) { this._properties.set('id', value); }

    get parentId(): string { return this._properties.get('parentId') as string; }
    set parentId(value: string) { this._properties.set('parentId', value); }

    get title(): string { return this._properties.get('title') as string; }
    set title(value: string) { this._properties.set('title', value); }

    get restricted(): boolean { return this._properties.get('restricted') as boolean; }
    set restricted(value: boolean) { this._properties.set('restricted', value); }

    // Optional property getters/setters
    get creator(): string | undefined { return this._properties.get('creator') as string | undefined; }
    set creator(value: string | undefined) {
        if (value === undefined) this._properties.delete('creator');
        else this._properties.set('creator', value);
    }

    get writeStatus(): string | undefined { return this._properties.get('writeStatus') as string | undefined; }
    set writeStatus(value: string | undefined) {
        if (value === undefined) this._properties.delete('writeStatus');
        else this._properties.set('writeStatus', value);
    }

    // Resources
    get resources(): DidlResource[] { return this._resources; }
    set resources(value: DidlResource[]) { this._resources = value; }

    /**
     * Get the UPnP class for this object type
     */
    get upnpClass(): string {
        return 'object';
    }

    /**
     * Get a property value
     */
    getProperty(key: string): unknown {
        return this._properties.get(key);
    }

    /**
     * Set a property value
     */
    setProperty(key: string, value: unknown): void {
        if (value === undefined) {
            this._properties.delete(key);
        } else {
            this._properties.set(key, value);
        }
    }

    /**
     * Check if a property exists
     */
    hasProperty(key: string): boolean {
        return this._properties.has(key);
    }

    /**
     * Get all properties as an object
     */
    toDict(): Record<string, unknown> {
        const result: Record<string, unknown> = {};
        for (const [key, value] of this._properties.entries()) {
            result[key] = value;
        }
        if (this._resources.length > 0) {
            result.resources = this._resources.map(r => r.toDict());
        }
        result.upnpClass = this.upnpClass;
        return result;
    }
}
