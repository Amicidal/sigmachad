# @memento/api

The Memento API package provides a comprehensive REST API, tRPC interface, WebSocket support, and MCP (Model Context Protocol) integration for the Memento knowledge graph system.

## Features

- **REST API**: Traditional HTTP endpoints for all operations
- **tRPC**: Type-safe API with automatic client generation
- **WebSocket**: Real-time updates and subscriptions
- **MCP Integration**: Model Context Protocol support for AI assistants
- **Vector Database**: Semantic search and embedding operations
- **Authentication**: API key and scope-based authorization
- **Rate Limiting**: Configurable rate limits per endpoint
- **Error Handling**: Comprehensive error handling with detailed responses

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

## API Endpoints

### Core Operations

#### Knowledge Graph
- `GET /api/graph` - Retrieve graph data
- `POST /api/graph/query` - Execute graph queries
- `GET /api/graph/subgraph` - Get subgraph data
- `POST /api/graph/analyze` - Analyze graph structure

#### Code Analysis
- `POST /api/code/analyze` - Analyze code files
- `POST /api/code/changes` - Propose code changes
- `GET /api/code/dependencies` - Get dependency information
- `POST /api/code/validate` - Validate code changes

#### Design & Specifications
- `GET /api/design/specs` - List specifications
- `POST /api/design/specs` - Create new specification
- `PUT /api/design/specs/:id` - Update specification
- `DELETE /api/design/specs/:id` - Delete specification

#### Testing
- `POST /api/tests/plan` - Generate test plans
- `POST /api/tests/run` - Execute tests
- `GET /api/tests/results` - Get test results
- `POST /api/tests/coverage` - Analyze test coverage

#### Vector Database Operations
- `POST /api/vdb/vdb-search` - Semantic search
- `POST /api/vdb/embed` - Generate embeddings
- `POST /api/vdb/index` - Index entities
- `POST /api/vdb/similarity` - Find similar entities
- `GET /api/vdb/stats` - Vector database statistics
- `DELETE /api/vdb/entities/:id` - Remove entity from index

#### Documentation
- `POST /api/docs/sync` - Sync documentation
- `GET /api/docs/search` - Search documentation
- `POST /api/docs/analyze` - Analyze documentation quality

#### Source Control Management
- `GET /api/scm/status` - Git repository status
- `POST /api/scm/commit` - Create commits
- `POST /api/scm/push` - Push changes
- `POST /api/scm/conflicts/resolve` - Resolve conflicts

#### Impact Analysis
- `POST /api/impact/analyze` - Analyze change impact
- `GET /api/impact/history` - Get impact history

#### Security
- `POST /api/security/scan` - Security vulnerability scan
- `GET /api/security/report` - Security report

#### History & Versioning
- `GET /api/history/versions` - Get version history
- `GET /api/history/changes` - Get change history
- `POST /api/history/rollback` - Rollback changes

#### Administrative
- `GET /api/admin/health` - System health check
- `GET /api/admin/metrics` - System metrics
- `POST /api/admin/sync/pause` - Pause synchronization
- `POST /api/admin/sync/resume` - Resume synchronization
- `GET /api/admin/logs` - System logs

### tRPC Routes

Type-safe API endpoints available through tRPC:

- **Admin Router**: System administration operations
- **Code Router**: Code analysis and manipulation
- **Design Router**: Design specification management
- **Graph Router**: Knowledge graph operations
- **History Router**: Version and change history

## Authentication

The API supports multiple authentication methods:

### API Key Authentication
```http
Authorization: Bearer your-api-key
```

### Scope-based Authorization
Different endpoints require different scopes:
- `admin`: Administrative operations
- `read`: Read-only access
- `write`: Write operations
- `security`: Security operations

## Rate Limiting

Default rate limits:
- **General**: 1000 requests per hour
- **Search**: 100 requests per hour
- **Admin**: 50 requests per hour

## WebSocket API

Real-time updates via WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to file changes
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'file-changes',
  filters: { path: '/src/**' }
}));

// Subscribe to graph updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'graph-updates',
  filters: { entityType: 'function' }
}));
```

### WebSocket Events
- `file-changes`: File system changes
- `graph-updates`: Knowledge graph updates
- `test-results`: Test execution results
- `build-status`: Build status changes
- `sync-events`: Synchronization events

## MCP Integration

Model Context Protocol support for AI assistants:

### Available Tools
- `analyze-code`: Analyze code structure and relationships
- `search-knowledge`: Search the knowledge graph
- `get-dependencies`: Get dependency information
- `run-tests`: Execute test suites
- `generate-specs`: Generate specifications
- `scan-security`: Perform security scans

### Resources
- Code files and their analysis
- Test results and coverage reports
- Documentation and specifications
- Dependency graphs and relationships

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: Authentication missing
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error
- `NOT_FOUND`: Resource not found

## Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `API_KEY`: Default API key
- `RATE_LIMIT_WINDOW`: Rate limit window in seconds
- `RATE_LIMIT_MAX`: Maximum requests per window

### Service Dependencies
The API package depends on:
- `@memento/knowledge`: Knowledge graph operations
- `@memento/core`: Core services and types
- `@memento/testing`: Test execution services
- `@memento/sync`: Synchronization services
- `@memento/backup`: Backup operations

## Development

### Project Structure
```
src/
├── APIGateway.ts          # Main API gateway
├── middleware/            # Authentication, validation, rate limiting
├── routes/               # REST API route handlers
├── trpc/                 # tRPC router and procedures
├── websocket/            # WebSocket handlers
├── mcp-router.ts         # MCP protocol implementation
└── websocket-router.ts   # WebSocket routing
```

### Adding New Routes

1. Create route handler in `src/routes/`
2. Register route in `APIGateway.ts`
3. Add authentication/authorization as needed
4. Update API documentation

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/routes/code.test.ts
```

### Building

```bash
# Build for production
pnpm build

# Build and watch for changes
pnpm dev
```

## Production Deployment

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Monitoring
- Prometheus metrics available at `/metrics`
- OpenAPI documentation at `/docs`
- Request logging with structured format

### Security
- CORS configuration for production
- Helmet.js security headers
- Input validation on all endpoints
- API key authentication required

## API Examples

### Semantic Search
```javascript
const response = await fetch('/api/vdb/vdb-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    query: 'authentication middleware',
    limit: 10,
    similarity: 0.8
  })
});

const { data } = await response.json();
console.log('Search results:', data.results);
```

### Code Analysis
```javascript
const analysis = await fetch('/api/code/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    files: ['src/auth.ts', 'src/middleware.ts'],
    includeRelationships: true
  })
});

const { data } = await analysis.json();
console.log('Code analysis:', data);
```

### Graph Query
```javascript
const graph = await fetch('/api/graph/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    cypher: 'MATCH (n:Function) RETURN n LIMIT 10'
  })
});

const { data } = await graph.json();
console.log('Graph data:', data);
```

## Troubleshooting

### Common Issues

#### Import/Export Errors
If you encounter module import errors after refactoring:
```bash
# Clear build artifacts
rm -rf dist/
pnpm build

# Check for circular dependencies
pnpm build 2>&1 | grep -i circular
```

#### WebSocket Connection Issues
```bash
# Check WebSocket endpoint
curl -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:3000/ws
```

#### Rate Limiting Errors (429)
- Check `X-RateLimit-*` headers in response
- Implement exponential backoff in clients
- Use different API keys for different services

#### Authentication Issues (401/403)
```bash
# Verify API key format
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/api/health

# Check token expiration
jwt-cli decode your-jwt-token
```

#### Database Connection Issues
```bash
# Check database health
curl http://localhost:3000/health/detailed

# Verify environment variables
echo $NEO4J_URI $POSTGRES_URL $QDRANT_URL
```

#### Build/TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit --skipLibCheck

# Fix import paths after package restructuring
pnpm run fix-imports
```

### Performance Issues

#### High Memory Usage
- Monitor `GET /metrics` for memory metrics
- Check for WebSocket connection leaks
- Review rate limiting configuration

#### Slow Response Times
- Enable debug logging: `DEBUG=api:* npm start`
- Check database query performance
- Review middleware execution order

### Debug Mode

Enable verbose logging:
```bash
NODE_ENV=development DEBUG=api:*,kg:*,ws:* npm start
```

Monitor metrics:
```bash
# API metrics
curl http://localhost:3000/metrics

# Health check with details
curl http://localhost:3000/health/detailed
```

### Support

For additional support:
1. Check existing GitHub issues
2. Review API documentation at `/docs`
3. Enable debug logging and collect logs
4. Include reproduction steps and environment details

## License

This package is part of the Memento project and follows the project's licensing terms.