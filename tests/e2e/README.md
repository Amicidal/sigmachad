# End-to-End (E2E) Tests

This directory contains comprehensive end-to-end tests for the Memento knowledge graph system. These tests validate critical user workflows using real services and simulate production-like scenarios.

## Overview

The E2E test suite covers:

- **Authentication Flows**: API key management, JWT tokens, session handling, multi-agent handoffs
- **Search Operations**: Text search, semantic search, entity search, impact analysis
- **Real-time Updates**: WebSocket subscriptions, file change notifications, agent monitoring
- **Knowledge Graph Operations**: Code parsing, indexing, traversal, analysis, maintenance
- **API Gateway Flows**: Rate limiting, error handling, CORS, security headers
- **Integration Scenarios**: Full workflows, concurrent operations, failure recovery

## Test Structure

```
tests/e2e/
├── auth/                    # Authentication flow tests
├── search/                  # Search operation tests
├── realtime/               # Real-time update tests
├── knowledge-graph/        # Graph operation tests
├── api-gateway/           # Gateway and middleware tests
├── utils/                 # Test utilities and helpers
├── fixtures/              # Sample data and test fixtures
├── vitest.config.ts       # Test configuration
├── setup.ts               # Global test setup
├── docker-compose.test.yml # Test services
└── README.md              # This file
```

## Prerequisites

Before running E2E tests, ensure you have:

1. **Docker and Docker Compose** installed
2. **Node.js 18+** and **pnpm**
3. All project dependencies installed: `pnpm install`

## Running Tests

### Quick Start

```bash
# Run all E2E tests with automatic service management
pnpm test:e2e:full
```

This command will:
1. Start all required services (Neo4j, Qdrant, PostgreSQL, Redis)
2. Run the complete E2E test suite
3. Clean up services when finished

### Manual Service Management

If you prefer to manage services manually:

```bash
# Start test services
pnpm test:e2e:services:up

# Run tests
pnpm test:e2e

# Stop services
pnpm test:e2e:services:down
```

### Running Specific Test Suites

```bash
# Authentication tests only
pnpm test:e2e:auth

# Search functionality tests
pnpm test:e2e:search

# Real-time updates tests
pnpm test:e2e:realtime

# Knowledge graph operations
pnpm test:e2e:graph

# API gateway and middleware
pnpm test:e2e:gateway

# Full integration scenarios
pnpm test:e2e:integration
```

### Development Mode

For development and debugging:

```bash
# Watch mode - re-run tests on file changes
pnpm test:e2e:watch

# View service logs
pnpm test:e2e:services:logs
```

## Test Environment

### Services

The E2E tests use dedicated test instances of all services:

- **Neo4j**: Graph database (port 7687, 7474)
- **Qdrant**: Vector database (port 6333)
- **PostgreSQL**: Metadata store (port 5432)
- **Redis**: Session cache (port 6379)

### Configuration

Test services are isolated from development/production:
- Separate Docker containers with test-specific names
- Dedicated test databases and schemas
- Custom configuration for faster test execution
- Automatic cleanup between test runs

### Data Management

- **Fresh State**: Each test file starts with clean databases
- **Test Isolation**: Tests within a file share state but are isolated from other files
- **Mock Data**: Realistic test data generated via `MockDataGenerator`
- **Fixtures**: Pre-defined sample projects and data sets

## Test Utilities

### TestEnvironment

Global test environment manager that:
- Sets up and tears down services
- Manages database connections
- Provides client factories
- Handles WebSocket connections

### TestClient

Type-safe API client with:
- Automatic authentication handling
- Request/response validation
- Built-in retry logic
- Performance monitoring

### MockDataGenerator

Generates realistic test data:
- Code files with proper TypeScript syntax
- Entity and relationship structures
- User accounts and authentication tokens
- Search queries and embeddings

### TestAssertions

Specialized assertions for:
- HTTP response validation
- Authentication token verification
- Knowledge graph structure validation
- Search result quality checks
- WebSocket message validation

## Writing New Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('My Feature E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;

  beforeEach(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;

    // Set up authentication if needed
    const keyResponse = await client.post('/api/auth/api-keys', {
      name: 'Test Key',
      permissions: ['read', 'write'],
    });
    client.setApiKey(keyResponse.body.apiKey);
  });

  it('should perform my feature workflow', async () => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use Real Services**: Tests use actual database connections, not mocks
2. **Test Complete Workflows**: Focus on user journeys, not individual functions
3. **Assert Meaningful Outcomes**: Verify business value, not just technical success
4. **Handle Async Operations**: Use proper waiting mechanisms for eventual consistency
5. **Clean State**: Ensure tests don't depend on specific execution order
6. **Realistic Data**: Use representative data sizes and complexity
7. **Error Scenarios**: Test both happy paths and error conditions

### Performance Considerations

- Tests run sequentially to avoid resource conflicts
- Use shorter timeouts for faster feedback
- Generate appropriate data volumes (not too large, not too small)
- Monitor test execution times and optimize slow tests

## Debugging

### Common Issues

1. **Service Startup Failures**
   ```bash
   # Check service status
   docker compose -f tests/e2e/docker-compose.test.yml ps

   # View service logs
   pnpm test:e2e:services:logs
   ```

2. **Test Timeouts**
   - Increase timeout values in test configuration
   - Check if services are properly initialized
   - Verify network connectivity between containers

3. **Authentication Errors**
   - Ensure API keys are properly created and used
   - Check token expiration times
   - Verify permission levels

4. **Database Connection Issues**
   - Confirm all services are healthy
   - Check connection strings and credentials
   - Verify database initialization scripts

### Debugging Individual Tests

```typescript
// Add detailed logging
console.log('Response:', response.body);

// Use longer timeouts for debugging
await assertions.assertEventuallyTrue(condition, 30000); // 30 seconds

// Inspect database state
const services = globalThis.testEnvironment.getServices();
const session = services.neo4j.session();
const result = await session.run('MATCH (n) RETURN count(n)');
console.log('Node count:', result.records[0].get(0).toNumber());
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: corepack prepare pnpm@latest --activate
      - run: pnpm install
      - run: pnpm test:e2e:full
```

### Local CI Simulation

```bash
# Run tests in CI-like environment
docker run --rm -v $(pwd):/workspace -w /workspace node:18 \
  bash -c "corepack prepare pnpm@latest --activate && pnpm install && pnpm test:e2e:full"
```

## Maintenance

### Updating Test Data

1. **Sample Projects**: Update `fixtures/sample-project.ts` for new language features
2. **Mock Generators**: Enhance generators for new entity types or relationships
3. **Test Scenarios**: Add new workflows as features are developed

### Performance Monitoring

- Monitor test execution times
- Profile resource usage during tests
- Optimize slow operations
- Consider parallel execution for independent test suites

### Service Updates

When updating service versions:
1. Update Docker images in `docker-compose.test.yml`
2. Test compatibility with new versions
3. Update initialization scripts if needed
4. Verify all health checks pass

## Troubleshooting

### Port Conflicts

If services fail to start due to port conflicts:

```bash
# Check what's using ports
netstat -tulpn | grep :7687  # Neo4j
netstat -tulpn | grep :6333  # Qdrant
netstat -tulpn | grep :5432  # PostgreSQL
netstat -tulpn | grep :6379  # Redis

# Update ports in docker-compose.test.yml if needed
```

### Cleanup Issues

If tests leave behind resources:

```bash
# Force cleanup
docker compose -f tests/e2e/docker-compose.test.yml down -v
docker system prune -f

# Manual database cleanup
pnpm db:clear:all
```

### Memory Issues

For large test suites:
- Increase Docker memory limits
- Use streaming operations for large datasets
- Implement proper cleanup in test teardown
- Monitor memory usage during test execution

## Contributing

When adding new E2E tests:

1. Follow the established patterns and utilities
2. Add appropriate documentation
3. Ensure tests are reliable and not flaky
4. Consider both positive and negative test cases
5. Update this README if adding new test categories

For questions or issues with E2E tests, please create an issue with the `testing` label.
