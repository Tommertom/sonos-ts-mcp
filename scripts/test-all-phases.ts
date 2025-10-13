#!/usr/bin/env node
/**
 * All Phases Test Runner
 * 
 * Runs all phase test suites sequentially:
 * - Phase 1: Queue, DIDL, Playback Properties
 * - Phase 2: Groups & Music Library Browsing
 * - Phase 3: Audio, Sleep, Alarms, Snapshots
 * - Phase 4: UPnP GENA Event Subscriptions
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
    phase: string;
    success: boolean;
    duration: number;
    error?: string;
}

const phases = [
    { name: 'Phase 1', script: 'test-phase1.ts', description: 'Queue, DIDL, Playback' },
    { name: 'Phase 2', script: 'test-phase2.ts', description: 'Groups & Library' },
    { name: 'Phase 3', script: 'test-phase3.ts', description: 'Audio, Alarms, Snapshots' },
    { name: 'Phase 4', script: 'test-phase4.ts', description: 'Event Subscriptions' },
];

async function runPhaseTest(phase: { name: string; script: string; description: string }): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Running ${phase.name}: ${phase.description}`);
        console.log('='.repeat(60) + '\n');

        const scriptPath = join(__dirname, phase.script);
        const testProcess = spawn('tsx', [scriptPath], {
            stdio: 'inherit',
            shell: false,
            env: process.env, // Pass through environment variables including MOCK_DEVICES
        });

        testProcess.on('exit', (code) => {
            const duration = Date.now() - startTime;

            if (code === 0) {
                resolve({
                    phase: phase.name,
                    success: true,
                    duration,
                });
            } else {
                resolve({
                    phase: phase.name,
                    success: false,
                    duration,
                    error: `Exited with code ${code}`,
                });
            }
        });

        testProcess.on('error', (error) => {
            const duration = Date.now() - startTime;
            resolve({
                phase: phase.name,
                success: false,
                duration,
                error: error.message,
            });
        });
    });
}

async function main(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              Sonos MCP Server - All Phases Test           ║');
    console.log('║                  Complete API Test Suite                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const results: TestResult[] = [];
    const startTime = Date.now();

    // Run each phase sequentially
    for (const phase of phases) {
        const result = await runPhaseTest(phase);
        results.push(result);

        if (!result.success) {
            console.log(`\n❌ ${phase.name} failed. Stopping test suite.\n`);
            break;
        }
    }

    const totalDuration = Date.now() - startTime;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60) + '\n');

    results.forEach((result) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        const duration = (result.duration / 1000).toFixed(2);
        console.log(`${status} - ${result.phase} (${duration}s)`);
        if (result.error) {
            console.log(`         Error: ${result.error}`);
        }
    });

    console.log('\n' + '-'.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalTime = (totalDuration / 1000).toFixed(2);

    console.log(`Total: ${passed} passed, ${failed} failed in ${totalTime}s`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
        console.log('❌ Some tests failed. Please review the output above.\n');
        process.exit(1);
    } else {
        console.log('✅ All test phases completed successfully!\n');
        console.log('🎉 The Sonos MCP Server API is fully functional.\n');
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
