#!/usr/bin/env tsx
/**
 * SSDP Diagnostic Script
 * Tests multicast UDP communication and SSDP discovery
 */

import dgram from 'node:dgram';
import os from 'node:os';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SEARCH_TARGET = 'urn:schemas-upnp-org:device:ZonePlayer:1';

console.log('=== SSDP Discovery Diagnostics ===\n');

// Step 1: Network Interfaces
console.log('1. Network Interfaces:');
const interfaces = os.networkInterfaces();
for (const [name, addrs] of Object.entries(interfaces)) {
    const ipv4 = addrs?.filter(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4 && ipv4.length > 0) {
        ipv4.forEach(addr => {
            console.log(`   ${name}: ${addr.address} (netmask: ${addr.netmask})`);
        });
    }
}
console.log();

// Step 2: Test UDP Socket Creation
console.log('2. Testing UDP Socket Creation...');
try {
    const testSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    console.log('   ✓ UDP socket created successfully');
    testSocket.close();
} catch (error) {
    console.error('   ✗ Failed to create UDP socket:', error);
    process.exit(1);
}
console.log();

// Step 3: Test Multicast Join
console.log('3. Testing Multicast Group Join...');
const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

socket.on('error', (err) => {
    console.error('   ✗ Socket error:', err.message);
    socket.close();
    process.exit(1);
});

let messageCount = 0;
const receivedDevices = new Map<string, any>();

socket.on('message', (msg, rinfo) => {
    messageCount++;
    const response = msg.toString();

    console.log(`\n   [Message ${messageCount}] Received from ${rinfo.address}:${rinfo.port}`);

    // Parse SSDP response
    const lines = response.split('\r\n');
    const headers: Record<string, string> = {};

    for (const line of lines.slice(1)) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim().toLowerCase();
            const value = line.slice(colonIndex + 1).trim();
            headers[key] = value;
        }
    }

    if (headers.location && headers.st?.includes('ZonePlayer')) {
        console.log('   ✓ Sonos device found!');
        console.log(`     Location: ${headers.location}`);
        console.log(`     USN: ${headers.usn || 'N/A'}`);
        receivedDevices.set(headers.location, headers);
    } else {
        console.log(`   → Non-Sonos response (ST: ${headers.st || 'N/A'})`);
    }
});

socket.on('listening', () => {
    const address = socket.address();
    console.log(`   ✓ Socket bound to ${address.address}:${address.port}`);

    try {
        socket.setBroadcast(true);
        console.log('   ✓ Broadcast enabled');

        socket.setMulticastTTL(4);
        console.log('   ✓ Multicast TTL set to 4');

        socket.addMembership(SSDP_ADDRESS);
        console.log(`   ✓ Joined multicast group ${SSDP_ADDRESS}`);
    } catch (error: any) {
        console.error('   ✗ Multicast configuration failed:', error.message);
        socket.close();
        process.exit(1);
    }

    console.log();

    // Step 4: Send SSDP Discovery
    console.log('4. Sending SSDP M-SEARCH...');

    const searchMessage = [
        'M-SEARCH * HTTP/1.1',
        `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
        'MAN: "ssdp:discover"',
        'MX: 3',
        `ST: ${SEARCH_TARGET}`,
        '',
        '',
    ].join('\r\n');

    const message = Buffer.from(searchMessage, 'utf-8');

    console.log('   Sending to:', `${SSDP_ADDRESS}:${SSDP_PORT}`);
    console.log('   Search Target:', SEARCH_TARGET);
    console.log('   Message Size:', message.length, 'bytes');

    socket.send(message, 0, message.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
        if (err) {
            console.error('   ✗ Send failed:', err.message);
            socket.close();
            process.exit(1);
        }
        console.log('   ✓ M-SEARCH sent successfully');
        console.log('\n5. Waiting for responses (6 seconds)...\n');
    });

    // Wait for responses
    setTimeout(() => {
        console.log('\n=== Results ===');
        console.log(`Total messages received: ${messageCount}`);
        console.log(`Sonos devices found: ${receivedDevices.size}`);

        if (receivedDevices.size > 0) {
            console.log('\nDevices:');
            for (const [location, headers] of receivedDevices) {
                console.log(`  - ${location}`);
                console.log(`    USN: ${headers.usn}`);
            }
        } else if (messageCount === 0) {
            console.log('\n⚠️  No responses received. Possible causes:');
            console.log('   • Windows Firewall blocking multicast traffic');
            console.log('   • Router/network blocking SSDP multicast');
            console.log('   • Sonos devices not on same network segment');
            console.log('   • No Sonos devices powered on');
            console.log('\nRecommendations:');
            console.log('   1. Check Windows Firewall settings for UDP port 1900');
            console.log('   2. Verify Sonos devices are on and connected to network');
            console.log('   3. Try manual device registration using IP address');
        } else {
            console.log('\n⚠️  Received responses but no Sonos devices found');
            console.log('   This suggests multicast is working but Sonos devices');
            console.log('   are not responding to SSDP discovery.');
        }

        socket.close();
        process.exit(0);
    }, 6000);
});

// Bind to random port
try {
    socket.bind();
} catch (error: any) {
    console.error('   ✗ Failed to bind socket:', error.message);
    process.exit(1);
}
