#!/usr/bin/env node
import dgram from 'node:dgram';

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;

const message = [
    'M-SEARCH * HTTP/1.1',
    `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
    'MAN: "ssdp:discover"',
    'MX: 3',
    'ST: urn:schemas-upnp-org:device:ZonePlayer:1',
    '',
    '',
].join('\r\n');

console.log('Testing raw SSDP discovery...');
console.log('Sending message:');
console.log(message);
console.log('\n---\n');

socket.on('error', (err) => {
    console.error('Socket error:', err);
    socket.close();
});

socket.on('message', (msg, rinfo) => {
    console.log(`\nReceived response from ${rinfo.address}:${rinfo.port}`);
    console.log(msg.toString());
    console.log('---');
});

socket.bind(() => {
    console.log('Socket bound, sending multicast...\n');

    const buf = Buffer.from(message, 'utf-8');
    socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
        if (err) {
            console.error('Send error:', err);
            socket.close();
        } else {
            console.log('Message sent successfully');
            console.log('Waiting 5 seconds for responses...\n');
        }
    });

    setTimeout(() => {
        console.log('\nDiscovery timeout - closing socket');
        socket.close();
        process.exit(0);
    }, 5000);
});
