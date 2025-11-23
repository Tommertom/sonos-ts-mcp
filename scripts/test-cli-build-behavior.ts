#!/usr/bin/env tsx
/**
 * Test script to verify agent CLI build behavior
 * 
 * This script tests that:
 * 1. The CLI always builds by default
 * 2. The CLI skips build when --skip-build is provided
 */

import { spawn } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const projectRoot = join(process.cwd());
const distFile = join(projectRoot, 'dist', 'index.js');

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
        const child = spawn('tsx', ['src/cli/sonos-agent-cli.ts', ...args], {
            cwd: projectRoot,
            env: {
                ...process.env,
                OPENAI_API_KEY: 'sk-test-key-for-testing',
            },
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({
                stdout,
                stderr,
                exitCode: code || 0,
            });
        });

        // Kill after 2 seconds to prevent hanging on agent execution
        setTimeout(() => {
            child.kill('SIGTERM');
        }, 2000);
    });
}

async function test1_AlwaysBuildsByDefault() {
    console.log('\n=== Test 1: CLI always builds by default ===\n');
    
    // Remove dist/index.js if it exists
    if (existsSync(distFile)) {
        console.log('Removing existing dist/index.js...');
        unlinkSync(distFile);
    }

    console.log('Running CLI without --skip-build flag...');
    const result = await runCli(['test prompt']);

    if (result.stderr.includes('Building Sonos MCP server')) {
        console.log('✅ PASS: CLI triggered build as expected');
        return true;
    } else {
        console.log('❌ FAIL: CLI did not trigger build');
        console.log('STDERR:', result.stderr);
        return false;
    }
}

async function test2_SkipsBuildWithFlag() {
    console.log('\n=== Test 2: CLI skips build with --skip-build ===\n');
    
    console.log('Running CLI with --skip-build flag...');
    const result = await runCli(['test prompt', '--skip-build']);

    if (!result.stderr.includes('Building Sonos MCP server')) {
        console.log('✅ PASS: CLI skipped build as expected');
        return true;
    } else {
        console.log('❌ FAIL: CLI built even with --skip-build flag');
        console.log('STDERR:', result.stderr);
        return false;
    }
}

async function test3_BuildsEvenWhenDistExists() {
    console.log('\n=== Test 3: CLI builds even when dist/index.js exists ===\n');
    
    // Ensure dist/index.js exists
    if (!existsSync(distFile)) {
        console.log('dist/index.js does not exist, running build first...');
        const { execSync } = await import('child_process');
        execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    }

    console.log('Running CLI with existing dist/index.js...');
    const result = await runCli(['test prompt']);

    if (result.stderr.includes('Building Sonos MCP server')) {
        console.log('✅ PASS: CLI triggered build even with existing dist/index.js');
        return true;
    } else {
        console.log('❌ FAIL: CLI did not build when dist/index.js already existed');
        console.log('STDERR:', result.stderr);
        return false;
    }
}

async function main() {
    console.log('Testing CLI build behavior...\n');

    const test1 = await test1_AlwaysBuildsByDefault();
    const test2 = await test2_SkipsBuildWithFlag();
    const test3 = await test3_BuildsEvenWhenDistExists();

    console.log('\n=== Test Results ===');
    console.log(`Test 1 (Always builds by default): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (Skips with --skip-build): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (Builds even when dist exists): ${test3 ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = test1 && test2 && test3;
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
});
