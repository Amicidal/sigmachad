# Memento Applications

This directory contains the applications that make up the Memento system.

## Applications

### 1. MCP Server (`apps/mcp-server`)

The MCP (Model Context Protocol) server provides AI agents with structured access to your codebase knowledge graph.

**Features:**
- MCP protocol implementation with tools for code analysis
- Codebase search and navigation
- Dependency analysis
- Security scanning
- Documentation extraction
- Knowledge graph synchronization

**Running the MCP server:**
```bash
# Development mode
pnpm run dev:mcp

# Production build
pnpm run build:mcp
node dist/apps/mcp-server/main.js
```

**Connecting AI agents:**
Configure your AI assistant (like Claude Desktop) to connect to the MCP server by adding this configuration:

```json
{
  "mcpServers": {
    "memento": {
      "command": "node",
      "args": ["path/to/dist/apps/mcp-server/main.js"]
    }
  }
}
```

### 2. Web Application (`apps/web`)

A React-based web interface for visualizing and interacting with your codebase knowledge graph.

**Features:**
- Real-time system status monitoring
- Code analysis dashboard
- Knowledge graph visualization
- Quick actions for synchronization and analysis
- WebSocket support for real-time updates

**Running the web app:**
```bash
# Development mode
pnpm run dev:web

# Production build
pnpm run build:web
npx serve dist/apps/web
```

### 3. API Server

The API server provides HTTP and WebSocket endpoints for the web application.

**Running the API server:**
```bash
# Run API server (port 3001)
nx run mcp-server:serve:api

# Or directly
API_PORT=3001 tsx apps/mcp-server/src/api-server.ts
```

## Development Workflow

### Running Everything Together

To run both the web app and API server in development:

```bash
# Start all services
pnpm run dev:all

# Or run them separately in different terminals
pnpm run dev:web    # Terminal 1: Web app on port 5173
nx run mcp-server:serve:api  # Terminal 2: API server on port 3001
```

### Building for Production

```bash
# Build all applications
pnpm run build

# Build specific apps
pnpm run build:web
pnpm run build:mcp
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│ API Server  │────▶│  Services   │
│  (React)    │     │ (Fastify)   │     │  (Core)     │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │ MCP Server  │
                    │  (Protocol) │
                    └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │  AI Agents  │
                    │   (Claude)  │
                    └─────────────┘
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/memento
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
QDRANT_URL=http://localhost:6333

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

## Docker Support

Start required services:

```bash
# Start databases
pnpm run dev:docker-up

# Stop databases
pnpm run docker:down
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific app tests
nx test web
nx test mcp-server
```

## Troubleshooting

### Web app can't connect to API
- Ensure API server is running on port 3001
- Check CORS settings in API server
- Verify no firewall blocking the connection

### MCP server not responding
- Check that all required services (databases) are running
- Verify environment variables are set correctly
- Check logs for initialization errors

### Build errors
- Clear Nx cache: `nx reset`
- Clean and rebuild: `pnpm run clean && pnpm run build`
- Update dependencies: `pnpm install`
