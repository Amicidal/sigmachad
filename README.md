# Memento - AI Coding Assistant with Knowledge Graph

Memento is an AI-first coding assistant that provides comprehensive codebase awareness through a knowledge graph system. It enables AI agents to have full context of code changes and architectural decisions, preventing context drift and ensuring code quality.

## Features

- 🧠 **Knowledge Graph**: Maintains comprehensive understanding of your codebase
- 🤖 **AI-Native**: Designed specifically for AI coding assistants (Claude, GPT, etc.)
- 🔍 **Real-time Monitoring**: File watching with automatic graph updates
- 📊 **Multi-Database**: Graph (FalkorDB), Vector (Qdrant), and Relational (PostgreSQL)
- 🌐 **Multiple APIs**: REST, WebSocket, MCP, and GraphQL support
- 🐳 **Docker-Native**: Easy deployment with Docker Compose
- ⚡ **High Performance**: Built with Fastify and optimized for speed

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- pnpm (recommended) or npm

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd memento
pnpm install
```

2. **Start the services:**
```bash
# Start all services (databases + API)
pnpm run docker:up

# Or start just the databases
docker-compose up -d falkordb qdrant postgres
```

3. **Start the application:**
```bash
# Development mode with hot reload
pnpm dev

# Or build and run
pnpm build && pnpm start
```

4. **Check health:**
```bash
curl http://localhost:3000/health
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Code   │    │   OpenAI        │    │   VS Code       │
│   (MCP)         │    │   (HTTP)        │    │   (WebSocket)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   MCP Server    │ │   REST API     │ │   GraphQL       │ │
│  │   (Local)       │ │   (Local)      │ │   (Local)       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ Knowledge Graph │ │   Test Engine   │ │ Security Scanner│ │
│  │   Service       │ │                 │ │                 │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Data Storage Layer                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   Graph DB      │ │   Vector DB     │ │   Document      │ │
│  │   (FalkorDB)    │ │   (Qdrant)      │ │   Store         │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Design & Specifications
```bash
# Create a new specification
POST /api/v1/design/create-spec
{
  "title": "User Authentication",
  "description": "Implement secure user login",
  "acceptanceCriteria": [
    "Users can register with email/password",
    "Users can login with valid credentials"
  ]
}

# Get specification details
GET /api/v1/design/specs/{specId}

# List specifications
GET /api/v1/design/specs
```

### Graph Operations
```bash
# Search the knowledge graph
POST /api/v1/graph/search
{
  "query": "authentication",
  "entityTypes": ["function", "class"]
}

# Get entity examples
GET /api/v1/graph/examples/{entityId}
```

### Real-time Updates
```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to file changes
ws.send(JSON.stringify({
  type: 'subscribe',
  event: 'file_change',
  filter: { type: 'modify' }
}));
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `HOST` | `0.0.0.0` | API server host |
| `NODE_ENV` | `development` | Environment mode |
| `FALKORDB_URL` | `redis://localhost:6379` | FalkorDB connection URL |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant connection URL |
| `DATABASE_URL` | `postgresql://memento:memento@localhost:5432/memento` | PostgreSQL connection URL |
| `LOG_LEVEL` | `info` | Logging level |

### Docker Configuration

The `docker-compose.yml` includes:
- **FalkorDB**: Graph database on port 6379
- **Qdrant**: Vector database on ports 6333/6334
- **PostgreSQL**: Relational database on port 5432
- **Redis**: Caching layer on port 6378

## Development

### Project Structure
```
src/
├── api/                 # API endpoints and routes
├── services/           # Core business logic
├── models/             # TypeScript type definitions
├── utils/              # Utility functions
└── index.ts            # Application entry point

tests/                  # Test suites
docker/                 # Docker configuration
docs/                   # Documentation
```

### Available Scripts

```bash
# Development
pnpm dev              # Start with hot reload
pnpm start            # Start production server
pnpm build            # Build for production

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Docker
pnpm docker:build     # Build Docker image
pnpm docker:up        # Start all services
pnpm docker:down      # Stop all services

# Utilities
pnpm lint             # Run ESLint
pnpm health           # Health check
pnpm sync             # Manual knowledge graph sync
```

### Adding New Features

1. **Create a new route:**
```typescript
// src/api/routes/new-feature.ts
export function registerNewFeatureRoutes(app: FastifyInstance, services) {
  app.get('/new-feature', async (request, reply) => {
    // Implementation
  });
}
```

2. **Add to API Gateway:**
```typescript
// src/api/APIGateway.ts
import { registerNewFeatureRoutes } from './routes/new-feature.js';

// In setupRoutes():
registerNewFeatureRoutes(app, this.services);
```

3. **Add tests:**
```typescript
// tests/routes/new-feature.test.ts
describe('New Feature Routes', () => {
  // Tests
});
```

## Integration with AI Assistants

### Claude Code (MCP)

Memento provides a Model Context Protocol (MCP) server for seamless Claude integration:

```bash
# The MCP server runs automatically with the main application
# Claude will discover and use available tools
```

Available MCP Tools:
- `design.create_spec` - Create feature specifications
- `tests.plan_and_generate` - Generate test plans
- `graph.search` - Search the knowledge graph
- `graph.examples` - Get usage examples
- `code.propose_diff` - Propose code changes
- `validate.run` - Run validation checks

### OpenAI Assistants

Use the REST API endpoints directly in your OpenAI function calls:

```javascript
const response = await fetch('http://localhost:3000/api/v1/design/create-spec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(specData)
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
```bash
# Check if services are running
docker-compose ps

# Restart services
pnpm docker:down && pnpm docker:up
```

2. **Port Already in Use**
```bash
# Use a different port
PORT=3001 pnpm dev
```

3. **Build Errors**
```bash
# Clear dependencies and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Logs

```bash
# View application logs
pnpm dev  # Shows logs in development

# View Docker logs
docker-compose logs -f memento-api

# View database logs
docker-compose logs -f falkordb
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] GraphQL API implementation
- [ ] Advanced security scanning
- [ ] Performance monitoring dashboard
- [ ] Multi-language support expansion
- [ ] Cloud deployment templates
- [ ] IDE plugin ecosystem

---

For more detailed documentation, see the [docs](./docs/) directory.
