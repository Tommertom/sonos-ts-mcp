# CLI Build Behavior

## Overview

The `sonos-agent-cli` command-line tool has specific build behavior to ensure the MCP server is always up-to-date.

## Default Behavior

**By default, the CLI ALWAYS builds the MCP server before running**, regardless of whether `dist/index.js` already exists. This ensures:

1. The latest source code changes are compiled
2. No stale JavaScript files are used
3. Development changes are immediately reflected

## Skip Build Flag

To skip the build step (e.g., when you know the build is up-to-date), use the `--skip-build` flag:

```bash
npx sonos-agent-cli "your prompt" --skip-build
```

This is useful when:
- You've just built the project manually
- You're running multiple commands in quick succession
- You want to save build time during testing

## Build Process

When building, the CLI:

1. Logs: `[CLI] Building Sonos MCP server...`
2. Runs `npm run build` in the project root
3. Waits for the build to complete
4. Logs: `[CLI] Build complete`
5. Proceeds to initialize Mastra and run the agent

If the build fails, the CLI will exit with an error.

## Examples

```bash
# Always builds (default)
npx sonos-agent-cli "Play jazz"

# Skips build
npx sonos-agent-cli "Play jazz" --skip-build

# With model selection, still builds
npx sonos-agent-cli "What's playing?" --model gpt-4o

# Skip build with model selection
npx sonos-agent-cli "What's playing?" --model gpt-4o --skip-build
```

## Implementation

The build logic is in `src/cli/sonos-agent-cli.ts`:

```typescript
async function buildMcpServer(): Promise<void> {
    const projectRoot = join(__dirname, '../..');

    console.error('[CLI] Building Sonos MCP server...');

    try {
        execSync('npm run build', {
            cwd: projectRoot,
            stdio: 'inherit',
        });
        console.error('[CLI] Build complete');
    } catch (error) {
        console.error('[CLI] Build failed:', error);
        throw error;
    }
}

async function runAgent(options: CliOptions): Promise<void> {
    // ...
    if (!options.skipBuild) {
        await buildMcpServer();
    }
    // ...
}
```

## Migration Note

Previous versions of the CLI checked if `dist/index.js` existed and skipped the build if it did. This behavior has been changed to always build by default to prevent issues with stale builds.
