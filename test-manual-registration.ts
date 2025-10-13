#!/usr/bin/env node
import { DeviceRegistry } from './src/discovery/device-registry.js';
import { AVTransportService } from './src/services/av-transport.js';
import { RenderingControlService } from './src/services/rendering-control.js';

const KITCHEN_IP = '192.168.178.149';

async function testManualRegistration() {
  console.log('Testing manual device registration...\n');
  
  const registry = new DeviceRegistry();
  
  console.log('1. Manually adding Kitchen device...');
  const device = registry.addManualDevice(KITCHEN_IP, 1400, 'Kitchen');
  console.log(`✓ Device added: ${device.name} (${device.uuid})`);
  console.log(`  IP: ${device.ip}:${device.port}\n`);
  
  console.log('2. Verifying device can be retrieved...');
  const retrieved = registry.getDeviceByIp(KITCHEN_IP);
  console.log(`✓ Retrieved device: ${retrieved?.name}\n`);
  
  console.log('3. Getting transport info...');
  const avTransport = new AVTransportService(device);
  const transportInfo = await avTransport.getTransportInfo();
  console.log(`✓ Transport State: ${transportInfo.CurrentTransportState}`);
  console.log(`✓ Transport Status: ${transportInfo.CurrentTransportStatus}\n`);
  
  if (transportInfo.CurrentTransportState === 'PLAYING') {
    console.log('4. Getting current track info...');
    const positionInfo = await avTransport.getPositionInfo();
    console.log(`✓ Now Playing:`);
    console.log(`  Title: ${positionInfo.TrackMetaData?.title || 'Unknown'}`);
    console.log(`  Artist: ${positionInfo.TrackMetaData?.artist || 'Unknown'}`);
    console.log(`  Album: ${positionInfo.TrackMetaData?.album || 'Unknown'}`);
    console.log(`  Position: ${positionInfo.RelTime} / ${positionInfo.TrackDuration}\n`);
  }
  
  console.log('5. Getting volume controls...');
  const rendering = new RenderingControlService(device);
  const volume = await rendering.getVolume();
  const muted = await rendering.getMute();
  console.log(`✓ Volume: ${volume}%`);
  console.log(`✓ Muted: ${muted}\n`);
  
  console.log('✅ All manual registration tests passed!');
}

testManualRegistration().catch(console.error);
