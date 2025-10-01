# Memento Database Service Tests

This directory contains comprehensive tests for the Memento workspace, including fast offline unit tests and opt-in integration/e2e suites.

## Test Structure

### Unit Tests (`tests/unit/**`)
- Purpose: Test components in isolation (no network/services)
- Scope: Method behavior, error handling, configuration, edge cases
- Mocking: Realistic deterministic doubles via Vitest + `tests/test-utils/*`
- Offline by default: `vitest.config.ts` excludes `tests/integration/**` unless `RUN_INTEGRATION=1`.

### Integration Tests (`tests/integration/**`)
- Purpose: Real service/database interactions and cross-module flows
- Scope: Complex workflows, data consistency, analytics
- Mocking: None (uses dockerized test stack)
- Gating: Only included when `RUN_INTEGRATION=1`.

### Test Utilities (`tests/test-utils/database-helpers.ts`)
- **Purpose**: Shared utilities for database test setup and teardown
- **Features**: Database health checks, fixture loading, cleanup utilities

## Database Setup (Integration Only)

Unit tests do not require any services. For integration runs, use the provided compose stack:

```bash
# Start integration services (Neo4j, Postgres, Redis, Qdrant)
docker compose -f tests/e2e/docker-compose.test.yml up -d

# Run integration tests
RUN_INTEGRATION=1 pnpm -s vitest run tests/integration

# Tear down
docker compose -f tests/e2e/docker-compose.test.yml down -v
```

## Running Tests

### Offline Unit Tests
```bash
pnpm -s vitest run tests/unit
```

### Targeted Unit Files
```bash
pnpm -s vitest run tests/unit/services/DatabaseService.test.ts
```

### Integration Tests
```bash
RUN_INTEGRATION=1 pnpm -s vitest run tests/integration
```

### With Coverage
```bash
pnpm run test:coverage
```

### Watch Mode
```bash
pnpm run test:watch
```

## Test Coverage

The tests cover:

### Core Functionality
- ✅ Database initialization and configuration
- ✅ Singleton pattern and instance management
- ✅ Connection health checks
- ✅ Schema setup and migrations

### Neo4j Operations
- ✅ Cypher queries (basic + parameterized)
- ✅ Node/relationship creation and querying
- ✅ Index management
- ✅ Vector index bootstrap

### Qdrant Operations
- ✅ Collection creation and management
- ✅ Vector storage and retrieval
- ✅ Distance metrics and search

### PostgreSQL Operations
- ✅ Basic SQL queries
- ✅ Parameterized queries
- ✅ Transactions and rollback
- ✅ Connection pooling
- ✅ JSONB operations

### Redis Operations
- ✅ Key-value storage
- ✅ TTL (time-to-live) functionality
- ✅ Key deletion and management

### Test Data Management
- ✅ Test suite result storage
- ✅ Performance metrics tracking
- ✅ Coverage data storage
- ✅ Flaky test analysis
- ✅ Historical data retrieval

### Error Handling
- ✅ Connection failures
- ✅ Invalid queries
- ✅ Transaction rollbacks
- ✅ Pool exhaustion
- ✅ Malformed data

### Integration Scenarios
- ✅ Cross-database workflows
- ✅ Concurrent operations
- ✅ Large dataset handling
- ✅ Data consistency
- ✅ Search and analytics
- ✅ Backup/recovery simulation

## Test Philosophy

Following the user's requirements, these tests:
- **Deterministic Unit Tests**: Unit tests use deterministic, realistic mocks—no network or real DBs
- **Real Integration**: Integration tests use real test databases via containers
- **Comprehensive Coverage**: Tests both success and failure scenarios
- **Performance Aware**: Includes load testing and performance benchmarks where applicable
- **Data Integrity**: Verifies data consistency across all databases in integration

## Environment Variables

The tests respect these environment variables for database configuration:

```bash
# Neo4j
NEO4J_URI=bolt://localhost:7688
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Qdrant
QDRANT_URL=http://localhost:6335
QDRANT_API_KEY=your_api_key

# PostgreSQL
DATABASE_URL=postgresql://memento_test:memento_test@localhost:5433/memento_test
DB_MAX_CONNECTIONS=5
DB_IDLE_TIMEOUT=30000

# Redis (caching)
REDIS_URL=redis://localhost:6381

# Test environment
NODE_ENV=test
```

## Troubleshooting

### Database Connection Issues
1. Ensure test databases are running: `pnpm run docker:test-up`
2. Wait for databases to be fully ready (may take 30-60 seconds)
3. Check database logs: `docker-compose -f docker-compose.test.yml logs`

### Test Timeouts
- Unit tests default to 30s per test and run offline.
- Integration tests may take several minutes; ensure services are healthy.

### Port Conflicts
- Ensure no other services are using test ports (6379-6381, 5433, 6335-6336)
- Use `docker:test-down` to clean up previous test runs

### Database Schema Issues
- Tests automatically create required schemas
- If schema creation fails, check database permissions
- Test databases are ephemeral and recreated on each run

## Contributing

When adding new tests:
1. Prefer unit tests with deterministic doubles; avoid sleeps.
2. Use `testUtils.useFakeTimers()` and `testUtils.waitFor(...)` helpers.
3. Reserve `tests/integration/**` for real service interactions.
4. Document any new flows briefly here if novel.
5. For integration, ensure compose stack covers new requirements.
