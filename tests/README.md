# Memento Database Service Tests

This directory contains comprehensive tests for the Memento DatabaseService, including unit tests and integration tests.

## Test Structure

### Unit Tests (`tests/unit/**`)
- **Purpose**: Test individual components in isolation
- **Scope**: Method behavior, error handling, configuration, and edge cases
- **Mocking**: Uses realistic, deterministic mocks for external dependencies

### Integration Tests (`tests/integration/**`)
- **Purpose**: Test real-world scenarios and cross-service/database operations
- **Scope**: Complex workflows, performance, data consistency, analytics
- **Mocking**: No mocking - full end-to-end testing with test containers

### Test Utilities (`tests/test-utils/database-helpers.ts`)
- **Purpose**: Shared utilities for database test setup and teardown
- **Features**: Database health checks, fixture loading, cleanup utilities

## Database Setup

Tests require the following test databases to be running:

### Using Docker Compose (Recommended)
```bash
# Start test databases
npm run docker:test-up

# Run tests
npm run test

# Stop test databases
npm run docker:test-down
```

### Manual Setup
If you prefer to run databases manually, ensure these services are available:

- **FalkorDB**: `redis://localhost:6380` (database 1)
- **Qdrant**: `http://localhost:6335`
- **PostgreSQL**: `postgresql://memento_test:memento_test@localhost:5433/memento_test`
- **Redis**: `redis://localhost:6381`

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test -- tests/unit/services/DatabaseService.test.ts
```

### Integration Tests Only
```bash
npm run test -- tests/integration/services/DatabaseService.integration.test.ts
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Coverage

The tests cover:

### Core Functionality
- ✅ Database initialization and configuration
- ✅ Singleton pattern and instance management
- ✅ Connection health checks
- ✅ Schema setup and migrations

### FalkorDB Operations
- ✅ Basic Cypher queries
- ✅ Parameterized queries
- ✅ Node/relationship creation and querying
- ✅ Index management
- ✅ Raw Redis commands

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
# FalkorDB/Redis
FALKORDB_URL=redis://localhost:6380

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
1. Ensure test databases are running: `npm run docker:test-up`
2. Wait for databases to be fully ready (may take 30-60 seconds)
3. Check database logs: `docker-compose -f docker-compose.test.yml logs`

### Test Timeouts
- Database operations may take longer than unit test timeouts
- Tests are configured with 30-60 second timeouts for setup operations
- Integration tests may take several minutes to complete

### Port Conflicts
- Ensure no other services are using test ports (6379-6381, 5433, 6335-6336)
- Use `docker:test-down` to clean up previous test runs

### Database Schema Issues
- Tests automatically create required schemas
- If schema creation fails, check database permissions
- Test databases are ephemeral and recreated on each run

## Contributing

When adding new tests:
1. Follow the existing patterns (no mocking, real database operations)
2. Add appropriate setup/teardown for new test scenarios
3. Include both success and failure cases
4. Update this README if adding new test categories
5. Ensure tests work with the test database containers
