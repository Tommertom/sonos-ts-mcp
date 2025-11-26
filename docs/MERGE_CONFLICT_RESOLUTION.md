# Merge Conflict Resolution Recommendation

## Conflict in `.gitignore`

The `.gitignore` file has a conflict between local changes and remote changes.

### Local Change
```
core
```
This ignores a file named `core` which exists locally (likely a core dump or a specific local directory).

### Remote Change
```
# MCP data storage
mcp_data/
```
This ignores a directory `mcp_data/` which was likely added in the remote branch for data storage.

### Recommendation
Both changes are valid and should be preserved. The resolved `.gitignore` should include both entries.

**Recommended Content:**
```gitignore
node_modules/
dist/
*.log
.DS_Store
coverage/
.env
.env.local
*.tsbuildinfo

.npmrc
core

# MCP data storage
mcp_data/
```
