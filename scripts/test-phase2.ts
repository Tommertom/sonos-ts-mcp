#!/usr/bin/env node
/**
 * Phase 2 API Tests
 * 
 * Tests the following Phase 2 features:
 * - Group Management (join, unjoin)
 * - Music Library Browsing (artists, albums, tracks, genres, playlists)
 * - Content Directory Search
 * 
 * Usage:
 * - With device discovery: npm run test:phase2
 * - With manual device IP: SONOS_DEVICE_IP=192.168.1.100 npm run test:phase2
 * 
 * Note: This test requires a real Sonos device on the network.
 */

import { spawn, type ChildProcess } from 'child_process';
import {
    initializeMcpConnection,
    discoverDevices,
    callTool,
    runTest,
    wait,
} from './test-utils.js';

let mcpProcess: ChildProcess;
let devices: any[] = [];

async function startMcpServer(): Promise<void> {
    console.log('🚀 Starting MCP Server in stdio mode...\n');

    mcpProcess = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
    });

    // Log server output
    mcpProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('"jsonrpc"')) {
            console.log('[Server]', output);
        }
    });

    mcpProcess.stderr?.on('data', (data) => {
        console.error('[Server Error]', data.toString());
    });

    await wait(1000);
}

async function initializeAndDiscover(): Promise<void> {
    console.log('🔌 Initializing MCP connection...\n');
    await initializeMcpConnection(mcpProcess);

    // Check for manual device IP via environment variable
    const manualIp = process.env.SONOS_DEVICE_IP;
    
    if (manualIp) {
        console.log(`📍 Using manual device IP: ${manualIp}\n`);
        // Register the device manually
        await callTool(mcpProcess, {
            name: 'sonos_register_device',
            arguments: { ip: manualIp, port: 1400 },
        });
        devices = [{ ip: manualIp, uuid: manualIp, name: 'Manual Device' }] as any;
        console.log(`✅ Manually registered device: ${manualIp}\n`);
        return;
    }

    console.log('🔍 Discovering Sonos devices...\n');
    devices = await discoverDevices(mcpProcess);

    if (devices.length === 0) {
        throw new Error(
            'No Sonos devices found. Please ensure devices are on the network.\n' +
            'Alternatively, set SONOS_DEVICE_IP environment variable to test with a specific device.'
        );
    }

    console.log(`✅ Found ${devices.length} device(s):`);
    devices.forEach((device, idx) => {
        console.log(`   ${idx + 1}. ${device.name || device.ip} (${device.uuid || device.ip})`);
    });
    console.log();
}

async function testGroupManagement(): Promise<void> {
    console.log('👥 Testing Group Management APIs\n');

    if (devices.length < 2) {
        console.log('⚠️  Skipping group tests (need at least 2 devices)\n');
        return;
    }

    const device1 = devices[0].uuid || devices[0].ip;
    const device2 = devices[1].uuid || devices[1].ip;

    // Test: Join Group
    await runTest('Join Group', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_join_group',
            arguments: {
                deviceId: device2,
                masterDeviceId: device1,
            },
        });

        console.log(`   ${devices[1].name} joined ${devices[0].name}'s group`);
    });

    await wait(2000); // Allow time for group to form

    // Test: Unjoin (make standalone)
    await runTest('Unjoin from Group', async () => {
        await callTool(mcpProcess, {
            name: 'sonos_unjoin',
            arguments: { deviceId: device2 },
        });

        console.log(`   ${devices[1].name} is now standalone`);
    });
}

async function testMusicLibraryBrowsing(): Promise<void> {
    console.log('\n📚 Testing Music Library Browsing APIs\n');

    const deviceId = devices[0].uuid || devices[0].ip;

    // Test: Browse Artists
    await runTest('Browse Artists', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_browse_artists',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || !result.items) {
            throw new Error('Invalid browse response');
        }

        console.log(`   Found ${result.total || 0} artists`);
        if (result.items.length > 0) {
            console.log(`   First artist: ${result.items[0].title}`);
        }
    });

    // Test: Browse Albums
    await runTest('Browse Albums', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_browse_albums',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || !result.items) {
            throw new Error('Invalid browse response');
        }

        console.log(`   Found ${result.total || 0} albums`);
        if (result.items.length > 0) {
            console.log(`   First album: ${result.items[0].title}`);
        }
    });

    // Test: Browse Tracks
    await runTest('Browse Tracks', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_browse_tracks',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || !result.items) {
            throw new Error('Invalid browse response');
        }

        console.log(`   Found ${result.total || 0} tracks`);
        if (result.items.length > 0) {
            console.log(`   First track: ${result.items[0].title}`);
        }
    });

    // Test: Browse Genres
    await runTest('Browse Genres', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_browse_genres',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || !result.items) {
            throw new Error('Invalid browse response');
        }

        console.log(`   Found ${result.total || 0} genres`);
        if (result.items.length > 0) {
            console.log(`   First genre: ${result.items[0].title}`);
        }
    });

    // Test: Browse Playlists
    await runTest('Browse Playlists', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_browse_playlists',
            arguments: { deviceId, startIndex: 0, count: 10 },
        });

        if (!result || !result.items) {
            throw new Error('Invalid browse response');
        }

        console.log(`   Found ${result.total || 0} playlists`);
        if (result.items.length > 0) {
            console.log(`   First playlist: ${result.items[0].title}`);
        }
    });
}

async function testContentDirectorySearch(): Promise<void> {
    console.log('\n🔎 Testing Content Directory Search\n');

    const deviceId = devices[0].uuid || devices[0].ip;

    // Test: Search for Artists
    await runTest('Search Artists', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_search_library',
            arguments: {
                deviceId,
                searchType: 'artists',
                searchTerm: 'the',
                startIndex: 0,
                count: 10,
            },
        });

        if (!result || !result.items) {
            throw new Error('Invalid search response');
        }

        console.log(`   Found ${result.total || 0} matching artists`);
    });

    // Test: Search for Albums
    await runTest('Search Albums', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_search_library',
            arguments: {
                deviceId,
                searchType: 'albums',
                searchTerm: 'greatest',
                startIndex: 0,
                count: 10,
            },
        });

        if (!result || !result.items) {
            throw new Error('Invalid search response');
        }

        console.log(`   Found ${result.total || 0} matching albums`);
    });

    // Test: Search for Tracks
    await runTest('Search Tracks', async () => {
        const result = await callTool(mcpProcess, {
            name: 'sonos_search_library',
            arguments: {
                deviceId,
                searchType: 'tracks',
                searchTerm: 'love',
                startIndex: 0,
                count: 10,
            },
        });

        if (!result || !result.items) {
            throw new Error('Invalid search response');
        }

        console.log(`   Found ${result.total || 0} matching tracks`);
    });
}

async function testBrowseItem(): Promise<void> {
    console.log('\n📂 Testing Browse Item (Subcategories)\n');

    const deviceId = devices[0].uuid || devices[0].ip;

    // First get an artist to browse their albums
    const artists = await callTool(mcpProcess, {
        name: 'sonos_browse_artists',
        arguments: { deviceId, startIndex: 0, count: 1 },
    });

    if (artists && artists.items && artists.items.length > 0) {
        const artistId = artists.items[0].id;

        await runTest('Browse Artist Albums', async () => {
            const result = await callTool(mcpProcess, {
                name: 'sonos_browse_item',
                arguments: {
                    deviceId,
                    objectId: artistId,
                    startIndex: 0,
                    count: 10,
                },
            });

            if (!result || !result.items) {
                throw new Error('Invalid browse response');
            }

            console.log(`   Found ${result.total || 0} albums for artist`);
        });
    } else {
        console.log('⚠️  Skipping browse item test (no artists found)\n');
    }
}

async function cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...\n');

    if (mcpProcess && !mcpProcess.killed) {
        mcpProcess.kill('SIGTERM');

        await new Promise<void>((resolve) => {
            mcpProcess.on('exit', () => resolve());
            setTimeout(() => {
                if (!mcpProcess.killed) {
                    mcpProcess.kill('SIGKILL');
                }
                resolve();
            }, 3000);
        });
    }
}

async function main(): Promise<void> {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     Phase 2 API Test Suite               ║');
    console.log('║  Groups & Music Library Browsing         ║');
    console.log('╚══════════════════════════════════════════╝\n');

    try {
        await startMcpServer();
        await initializeAndDiscover();

        await testGroupManagement();
        await testMusicLibraryBrowsing();
        await testContentDirectorySearch();
        await testBrowseItem();

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║      Phase 2 Tests Complete!             ║');
        console.log('╚══════════════════════════════════════════╝\n');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
