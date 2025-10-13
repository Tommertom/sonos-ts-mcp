import { BaseService } from './base-service.js';
import { RequestBuilder } from '../soap/request-builder.js';
import { XmlParser } from '../soap/response-parser.js';

export interface SonosAlarm {
    id: string;
    startTime: string; // HH:MM:SS format
    duration: string;  // HH:MM:SS format
    recurrence: string; // DAILY, ONCE, WEEKDAYS, WEEKENDS, or ON_0123456 format
    enabled: boolean;
    roomUuid: string;
    programUri: string;
    programMetadata: string;
    playMode: 'NORMAL' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_REPEAT_ONE';
    volume: number;
    includeLinkedZones: boolean;
}

export interface CreateAlarmOptions {
    startTime: string;     // HH:MM:SS format
    duration?: string;     // HH:MM:SS format, defaults to 02:00:00
    recurrence: 'DAILY' | 'ONCE' | 'WEEKDAYS' | 'WEEKENDS' | string; // or ON_0123456 format
    enabled?: boolean;
    programUri?: string;   // URI to play, or null for buzzer
    programMetadata?: string;
    playMode?: 'NORMAL' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE' | 'REPEAT_ALL' | 'REPEAT_ONE' | 'SHUFFLE_REPEAT_ONE';
    volume?: number;
    includeLinkedZones?: boolean;
}

export class AlarmClockService extends BaseService {
    protected getServiceType(): string {
        return 'urn:schemas-upnp-org:service:AlarmClock:1';
    }

    protected getControlEndpoint(): string {
        return '/AlarmClock/Control';
    }

    /**
     * List all alarms configured on the Sonos system
     */
    async listAlarms(): Promise<SonosAlarm[]> {
        const body = RequestBuilder.buildSimpleBody({});

        const response = await this.callAction('ListAlarms', body);
        if (!response.success || !response.body) {
            return [];
        }

        const alarmList = XmlParser.extractValue(response.body, 'CurrentAlarmList') ?? '';
        if (!alarmList) {
            return [];
        }

        const unescapedList = XmlParser.unescapeXml(alarmList);
        return this.parseAlarmList(unescapedList);
    }

    /**
     * Create a new alarm
     */
    async createAlarm(options: CreateAlarmOptions): Promise<string> {
        const body = RequestBuilder.buildSimpleBody({
            StartLocalTime: options.startTime,
            Duration: options.duration ?? '02:00:00',
            Recurrence: options.recurrence,
            Enabled: options.enabled !== false,
            RoomUUID: this.device.uuid,
            ProgramURI: options.programUri ?? 'x-rincon-buzzer:0',
            ProgramMetaData: options.programMetadata ?? '',
            PlayMode: options.playMode ?? 'NORMAL',
            Volume: options.volume ?? 25,
            IncludeLinkedZones: options.includeLinkedZones ?? false,
        });

        const response = await this.callAction('CreateAlarm', body);
        if (!response.success || !response.body) {
            const errorMsg = response.error 
                ? `${response.error.message} (code: ${response.error.code})` 
                : 'Unknown error';
            throw new Error(`Failed to create alarm: ${errorMsg}`);
        }

        const assignedId = XmlParser.extractValue(response.body, 'AssignedID') ?? '';
        if (!assignedId) {
            throw new Error('Failed to create alarm: No alarm ID returned');
        }
        return assignedId;
    }

    /**
     * Update an existing alarm
     */
    async updateAlarm(id: string, options: Partial<CreateAlarmOptions>): Promise<boolean> {
        // First get the current alarm to merge with updates
        const alarms = await this.listAlarms();
        const existingAlarm = alarms.find(a => a.id === id);
        if (!existingAlarm) {
            throw new Error(`Alarm with ID ${id} not found`);
        }

        const body = RequestBuilder.buildSimpleBody({
            ID: id,
            StartLocalTime: options.startTime ?? existingAlarm.startTime,
            Duration: options.duration ?? existingAlarm.duration,
            Recurrence: options.recurrence ?? existingAlarm.recurrence,
            Enabled: options.enabled ?? existingAlarm.enabled,
            RoomUUID: existingAlarm.roomUuid,
            ProgramURI: options.programUri ?? existingAlarm.programUri,
            ProgramMetaData: options.programMetadata ?? existingAlarm.programMetadata,
            PlayMode: options.playMode ?? existingAlarm.playMode,
            Volume: options.volume ?? existingAlarm.volume,
            IncludeLinkedZones: options.includeLinkedZones ?? existingAlarm.includeLinkedZones,
        });

        const response = await this.callAction('UpdateAlarm', body);
        return response.success;
    }

    /**
     * Delete an alarm by ID
     */
    async destroyAlarm(id: string): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            ID: id,
        });

        const response = await this.callAction('DestroyAlarm', body);
        return response.success;
    }

    /**
     * Get the current alarm list version
     * Returns format: RINCON_xxxxx:123
     */
    async getAlarmListVersion(): Promise<string | null> {
        const body = RequestBuilder.buildSimpleBody({});

        const response = await this.callAction('ListAlarms', body);
        if (!response.success || !response.body) {
            return null;
        }

        return XmlParser.extractValue(response.body, 'CurrentAlarmListVersion') ?? null;
    }

    /**
     * Set the time format (12 or 24 hour)
     */
    async setFormat(format: '12' | '24'): Promise<boolean> {
        const body = RequestBuilder.buildSimpleBody({
            DesiredTimeFormat: format === '12' ? '12' : '24',
            DesiredDateFormat: 'YMD', // Year-Month-Day
        });

        const response = await this.callAction('SetFormat', body);
        return response.success;
    }

    /**
     * Get the current time format settings
     */
    async getFormat(): Promise<{ timeFormat: string; dateFormat: string } | null> {
        const body = RequestBuilder.buildSimpleBody({});

        const response = await this.callAction('GetFormat', body);
        if (!response.success || !response.body) {
            return null;
        }

        return {
            timeFormat: XmlParser.extractValue(response.body, 'CurrentTimeFormat') ?? '24',
            dateFormat: XmlParser.extractValue(response.body, 'CurrentDateFormat') ?? 'YMD',
        };
    }

    /**
     * Parse the alarm list XML into structured alarm objects
     */
    private parseAlarmList(xml: string): SonosAlarm[] {
        const alarms: SonosAlarm[] = [];

        // Match all <Alarm> elements
        const alarmRegex = /<Alarm[^>]*>/g;
        const matches = xml.match(alarmRegex);

        if (!matches) {
            return alarms;
        }

        for (const match of matches) {
            const alarm: SonosAlarm = {
                id: this.extractAttribute(match, 'ID'),
                startTime: this.extractAttribute(match, 'StartTime'),
                duration: this.extractAttribute(match, 'Duration'),
                recurrence: this.extractAttribute(match, 'Recurrence'),
                enabled: this.extractAttribute(match, 'Enabled') === '1',
                roomUuid: this.extractAttribute(match, 'RoomUUID'),
                programUri: this.extractAttribute(match, 'ProgramURI'),
                programMetadata: this.extractAttribute(match, 'ProgramMetaData'),
                playMode: this.extractAttribute(match, 'PlayMode') as SonosAlarm['playMode'],
                volume: parseInt(this.extractAttribute(match, 'Volume'), 10),
                includeLinkedZones: this.extractAttribute(match, 'IncludeLinkedZones') === '1',
            };
            alarms.push(alarm);
        }

        return alarms;
    }

    /**
     * Extract an attribute value from an XML tag
     */
    private extractAttribute(xml: string, attrName: string): string {
        const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
        const match = xml.match(regex);
        return match?.[1] ?? '';
    }
}
