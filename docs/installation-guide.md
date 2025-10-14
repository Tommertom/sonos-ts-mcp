# Sonos TypeScript MCP Server - Installation Guide

## Quick Start with npx (Recommended)

The easiest way to use the Sonos TypeScript MCP Server is via npx. This method automatically downloads and runs the latest version without requiring manual installation.

## Configuration for Different MCP Clients

The Sonos TypeScript MCP Server works with any MCP client that supports standard I/O (stdio) as the transport medium. Below are specific configuration instructions for popular tools.

### Claude Desktop

To configure Claude Desktop to use the Sonos MCP server:

1. Open Claude Desktop
2. Go to **Claude > Settings**
3. Select the **Developer** tab
4. Click **Edit Config**
5. Add the following configuration:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

**Configuration File Locations:**
- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

### Cline

To configure Cline to use the Sonos MCP server:

1. Click the **MCP Servers** icon at the top of the Cline pane
2. Click **Configure MCP Servers**
3. Add the following configuration to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"],
      "disabled": false
    }
  }
}
```

### Cursor

To configure Cursor to use the Sonos MCP server, you have two options:

#### Option 1: Project-Specific Configuration

Edit the file `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

#### Option 2: Global Configuration

Edit the file `~/.cursor/mcp.json` to make the MCP server available in all projects:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

### Visual Studio Code Copilot

#### Option 1: Single Project Configuration

Edit the `.vscode/mcp.json` file in your workspace:

```json
{
  "servers": {
    "sonos-ts-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

#### Option 2: Global Configuration

Edit your user settings to make the server available in every project:

```json
{
  "mcp": {
    "servers": {
      "sonos-ts-mcp": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "sonos-ts-mcp@latest"]
      }
    }
  }
}
```

### Windsurf Editor

To configure Windsurf Editor:

1. Edit the file `~/.codeium/windsurf/mcp_config.json`
2. Add the following configuration:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "npx",
      "args": ["-y", "sonos-ts-mcp@latest"]
    }
  }
}
```

## Development Installation

If you want to contribute to the project or run it from source:

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/Tommertom/sonos-ts-mcp.git
cd sonos-ts-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Running from Source

```bash
# Development mode with hot reload
npm run dev

# Production mode
node dist/index.js
```

### MCP Client Configuration for Development

When using a local development build, configure your MCP client to point to the built files:

```json
{
  "mcpServers": {
    "sonos-ts-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/sonos-ts-mcp/dist/index.js"]
    }
  }
}
```

## Verifying Installation

After configuration, verify that the Sonos MCP server is working:

1. Restart your MCP client (Claude Desktop, Cline, etc.)
2. Try using a Sonos tool, such as `sonos_discover`
3. The server should discover Sonos devices on your network

## Troubleshooting

### npx Issues

If `npx` fails to download the package:

1. Check your internet connection
2. Clear npx cache: `npm cache clean --force`
3. Try running `npx -y sonos-ts-mcp@latest` manually in a terminal

### Discovery Issues

If Sonos devices are not discovered:

1. Ensure your computer and Sonos devices are on the same network
2. Check firewall settings (allow UDP port 1900)
3. Try manually adding a device using `sonos_add_device` with the device's IP address

### MCP Client Connection Issues

If the MCP client doesn't connect:

1. Check the configuration file syntax (valid JSON)
2. Verify the path to the executable
3. Check the MCP client logs for error messages
4. Restart the MCP client

## Next Steps

- See [README.md](../README.md) for a list of available tools
- Check out the [API Testing Guide](./api-testing-guide.md) for usage examples
- Review the [Technical Architecture](./technical-architecture.md) for implementation details
