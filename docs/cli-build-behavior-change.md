# CLI Build Behavior Change Summary

## Changes Made

### Modified Files
- `src/cli/sonos-agent-cli.ts`

### What Changed

#### Before
The CLI checked if `dist/index.js` existed before building:
```typescript
async function buildMcpServer(): Promise<void> {
    const projectRoot = join(__dirname, '../..');
    const distPath = join(projectRoot, 'dist', 'index.js');

    if (existsSync(distPath)) {
        console.error('[CLI] MCP server already built, skipping build...');
        return; // ❌ Skipped build if file existed
    }
    // ... build logic
}
```

#### After
The CLI **always** builds unless `--skip-build` flag is provided:
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
```

Also removed unused import:
```typescript
// Removed: import { existsSync } from 'fs';
```

### Behavior

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| `npx sonos-agent-cli "prompt"` | Skips build if `dist/index.js` exists | ✅ Always builds |
| `npx sonos-agent-cli "prompt" --skip-build` | Skips build | ✅ Skips build |
| First run (no dist/) | Builds | ✅ Builds |
| Subsequent runs | ❌ Skips build (stale code risk) | ✅ Always builds (fresh code) |

## Benefits

1. **Always up-to-date**: Source code changes are immediately compiled
2. **No stale builds**: Eliminates issues from outdated JavaScript files
3. **Developer friendly**: Changes to source code are reflected without manual builds
4. **Explicit control**: Use `--skip-build` when you know the build is current

## Testing

Verified with manual tests:
```bash
# Test 1: Default behavior (builds)
npx tsx src/cli/sonos-agent-cli.ts 'test' 2>&1 | grep "Building"
# Output: [CLI] Building Sonos MCP server...

# Test 2: With --skip-build (skips)
npx tsx src/cli/sonos-agent-cli.ts 'test' --skip-build 2>&1 | grep "Building"
# Output: (no output - build was skipped)
```

## Documentation

Created/updated:
- `docs/cli-build-behavior.md` - Detailed documentation of build behavior
- `scripts/test-cli-build-behavior.ts` - Automated test script for build behavior
- `CHANGELOG.md` - (Should be updated with this change)

## Notes

- The build may fail if there are TypeScript errors in the project (pre-existing issue)
- The `--skip-build` flag provides an escape hatch for users who need faster execution
- This change ensures the MCP server is always compiled with the latest code
