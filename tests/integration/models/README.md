# Models Integration Tests

This directory contains comprehensive integration tests for the Memento models system, covering entities, relationships, and type definitions.

## Overview

The integration tests are designed to validate the complete functionality of the models system across all database layers:

- **PostgreSQL**: Relational data storage and complex queries
- **FalkorDB**: Graph database for relationship modeling and traversal
- **Qdrant**: Vector database for semantic search and embeddings
- **Redis**: Caching and high-performance data access

## Test Structure

### 1. Entity Integration Tests (`entities.integration.test.ts`)
Tests comprehensive entity lifecycle management:

- **File Entity CRUD Operations**: Create, read, update, delete operations across all databases
- **Symbol Entity Operations**: Complex symbol entities with relationships
- **Test Entity Integration**: Test entities with execution history and performance metrics
- **Spec Entity Workflow**: Specification entities through their lifecycle
- **Cross-Entity Relationships**: Complex relationship networks and graph operations
- **Type Guards**: Entity type discrimination and validation
- **Performance Testing**: Large dataset operations and concurrent access
- **Error Handling**: Invalid data, constraint violations, and recovery scenarios

### 2. Relationship Integration Tests (`relationships.integration.test.ts`)
Tests relationship modeling and graph operations:

- **Structural Relationships**: BELONGS_TO, CONTAINS, DEFINES relationships
- **Code Relationships**: Dependency analysis and code flow modeling
- **Test and Spec Relationships**: Test coverage and requirement tracing
- **Path Finding**: Complex traversal and shortest path algorithms
- **Relationship Filters**: Advanced querying with constraints
- **Graph Analytics**: Centrality, connectivity, and clustering metrics

### 3. Type Integration Tests (`types.integration.test.ts`)
Tests API types, validation, and data integrity:

- **API Response Types**: Success/error responses and pagination
- **Validation Results**: Detailed issue tracking and error reporting
- **Impact Analysis**: Change impact assessment and recommendations
- **Graph Search Types**: Semantic and structural search operations
- **Vector Search Operations**: Embedding-based similarity search

## Prerequisites

Before running the integration tests, ensure all database services are running:

```bash
# Start all database services
docker-compose up -d falkordb qdrant postgres redis

# Or start all services
docker-compose up -d
```

### Database Configuration

The tests expect the following database connections:

- **FalkorDB**: `redis://localhost:6379`
- **Qdrant**: `http://localhost:6333`
- **PostgreSQL**: `postgresql://memento:memento@localhost:5432/memento`
- **Redis**: `redis://localhost:6379` (different database)

## Running the Tests

### Run All Model Integration Tests
```bash
pnpm test tests/integration/models/
```

### Run Specific Test Files
```bash
# Test entities only
pnpm test tests/integration/models/entities.integration.test.ts

# Test relationships only
pnpm test tests/integration/models/relationships.integration.test.ts

# Test types only
pnpm test tests/integration/models/types.integration.test.ts
```

### Run with Coverage
```bash
pnpm test -- --coverage tests/integration/models/
```

## Test Scenarios Covered

### Entity Lifecycle Management
- ✅ Complete CRUD operations across all database systems
- ✅ Data consistency validation between databases
- ✅ Bulk operations and batch processing
- ✅ Complex entity relationships and dependencies
- ✅ Type safety and validation
- ✅ Performance benchmarking with large datasets
- ✅ Concurrent access patterns
- ✅ Memory usage optimization

### Relationship Modeling
- ✅ Hierarchical relationship structures (directories, inheritance)
- ✅ Code dependency graphs and call chains
- ✅ Test-to-code traceability
- ✅ Impact analysis and change propagation
- ✅ Path finding and graph traversal algorithms
- ✅ Relationship strength and weighting
- ✅ Complex query patterns with filters

### Type System Validation
- ✅ API contract validation
- ✅ Response structure verification
- ✅ Error handling and status codes
- ✅ Pagination and data serialization
- ✅ Validation result processing
- ✅ Impact analysis algorithms
- ✅ Search and retrieval operations
- ✅ Vector similarity matching

### Performance and Scalability
- ✅ Large dataset operations (1000+ entities)
- ✅ Concurrent operations (20+ simultaneous connections)
- ✅ Memory usage monitoring
- ✅ Query performance optimization
- ✅ Database connection pooling
- ✅ Caching strategy validation

### Error Handling and Recovery
- ✅ Invalid data rejection
- ✅ Constraint violation handling
- ✅ Network failure recovery
- ✅ Timeout management
- ✅ Data corruption detection and repair
- ✅ Transaction rollback scenarios
- ✅ Graceful degradation

## Database Schema Requirements

The integration tests require the following database tables to be created:

### PostgreSQL Tables
- `documents` - General document storage
- `test_suites` - Test suite information
- `test_results` - Individual test results
- `test_coverage` - Coverage data
- `test_performance` - Performance metrics
- `flaky_test_analyses` - Flaky test analysis
- `changes` - Change tracking
- `sessions` - Session management

### FalkorDB Graph Structure
- `Entity` nodes for all codebase entities
- Relationship types: `BELONGS_TO`, `CONTAINS`, `DEFINES`, `USES`, `CALLS`, `DEPENDS_ON`, `IMPLEMENTS`, `EXTENDS`, `TESTS`, `VALIDATES`, `REQUIRES`

### Qdrant Collections
- `entities` - Entity embeddings for semantic search
- `code_embeddings` - Code snippet embeddings

## Test Data Management

The tests include comprehensive test data fixtures:

- **Realistic Codebase**: TypeScript/React application structure
- **Complex Dependencies**: Multi-layer dependency chains
- **Performance Benchmarks**: Various load scenarios
- **Error Scenarios**: Edge cases and failure modes
- **Large Datasets**: Scalability testing data

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- **Isolated Execution**: Each test file can run independently
- **Database Setup**: Automatic test database initialization
- **Cleanup**: Automatic test data cleanup between runs
- **Performance Monitoring**: Built-in performance regression detection
- **Comprehensive Reporting**: Detailed test results and metrics

## Troubleshooting

### Common Issues

1. **Database Connection Refused**
   ```bash
   # Ensure databases are running
   docker-compose ps
   docker-compose up -d
   ```

2. **Test Timeouts**
   - Increase timeout in vitest config
   - Check database performance
   - Verify network connectivity

3. **Memory Issues**
   - Reduce concurrent operations in tests
   - Increase Node.js memory limit
   - Check system resources

4. **Schema Mismatches**
   - Ensure database schema is up to date
   - Run database migrations
   - Check table definitions

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* pnpm test tests/integration/models/
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure and patterns
2. Include comprehensive setup and teardown
3. Test both success and failure scenarios
4. Add performance benchmarks where applicable
5. Document test prerequisites and assumptions
6. Ensure tests can run in parallel

## Performance Benchmarks

The tests include performance benchmarks that should be monitored:

- **Entity Creation**: < 100ms per entity
- **Bulk Operations**: < 10 seconds for 1000 entities
- **Complex Queries**: < 1 second response time
- **Graph Traversal**: < 500ms for path finding
- **Vector Search**: < 100ms for similarity search

These benchmarks help detect performance regressions and ensure the system maintains acceptable performance characteristics.
