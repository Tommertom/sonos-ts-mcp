#!/usr/bin/env node
import { SSDPClient } from '../src/discovery/ssdp-client.js';
import { AlarmClockService } from '../src/services/alarm-clock.js';

async function main() {
    console.log('Discovering devices...');
    const ssdp = new SSDPClient();
    const devices = await ssdp.discover(5000);
    
    if (devices.length === 0) {
        console.error('No devices found');
        return;
    }
    
    const device = devices[0];
    console.log('Using device:', device.name || device.ip);
    
    const alarmService = new AlarmClockService(device);
    
    console.log('\nListing alarms...');
    try {
        const alarms = await alarmService.listAlarms();
        console.log('Found', alarms.length, 'alarms');
    } catch (error) {
        console.error('List error:', error);
    }
    
    console.log('\nCreating alarm...');
    try {
        const alarmId = await alarmService.createAlarm({
            startTime: '07:00:00',
            recurrence: 'ONCE',
            enabled: false,
            volume: 25,
            duration: '01:00:00',
        });
        console.log('Created alarm:', alarmId);
    } catch (error) {
        console.error('Create error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
    }
}

main().catch(console.error);
