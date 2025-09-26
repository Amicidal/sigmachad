# OGM Integration Testing

This directory contains comprehensive integration tests for the Neo4j OGM migration in Phase 6.

## Test Files

### 1. OGMServices.integration.test.ts
Comprehensive integration tests comparing OGM vs legacy implementations:

- **Entity Operations**: Create, read, update, delete operations
- **Relationship Operations**: Single and bulk relationship management
- **Search Operations**: Structural and semantic search comparison
- **Data Consistency**: Validates identical behavior between implementations
- **Performance Metrics**: Tracks and compares operation timing
- **Concurrency Testing**: Tests concurrent operations and data integrity
- **Event Validation**: Ensures consistent event emission

### 2. OGMMigration.validation.test.ts
Validates 100% API compatibility and migration readiness:

- **Public API Compatibility**: Ensures identical API behavior
- **Error Handling Consistency**: Validates identical error scenarios
- **Event Emission Validation**: Compares event patterns
- **Feature Flag Switching**: Tests seamless implementation switching
- **Data Consistency**: Validates data integrity across migrations
- **Mixed Implementation Support**: Tests gradual migration scenarios

### 3. ../benchmarks/OGMPerformance.benchmark.ts
Performance benchmark suite for production readiness:

- **CRUD Benchmarks**: Individual operation performance
- **Bulk Operations**: Batch processing performance
- **Search Performance**: Query execution timing
- **Memory Usage**: Memory efficiency and leak detection
- **Stress Testing**: High concurrency and load testing
- **Performance Tracking**: Detailed metrics and reporting

## Test Utilities

### ogm-helpers.ts
Specialized utilities for OGM testing:

- **Service Setup**: Initialize OGM and comparison services
- **Test Data Generation**: Create realistic test datasets
- **Performance Tracking**: Measure and compare operation performance
- **Data Validation**: Compare results between implementations
- **Cleanup Utilities**: Clean test data and resources

### Updated database-helpers.ts
Enhanced database helpers with OGM support:

- **setupIsolatedOGMTest()**: Setup with OGM services only
- **setupIsolatedComparisonTest()**: Setup with both legacy and OGM
- **cleanupIsolatedOGMTest()**: Proper OGM service cleanup
- **cleanupIsolatedComparisonTest()**: Full comparison test cleanup

## Running the Tests

### Prerequisites
Ensure all database services are running:
```bash
pnpm run dev:docker-up
```

### Integration Tests
Run all OGM integration tests:
```bash
pnpm run test:integration -- tests/integration/services/OGMServices.integration.test.ts
pnpm run test:integration -- tests/integration/OGMMigration.validation.test.ts
```

### Performance Benchmarks
Run performance benchmarks (takes 5+ minutes):
```bash
pnpm run test:integration -- tests/benchmarks/OGMPerformance.benchmark.ts
```

### All OGM Tests
Run all OGM-related tests:
```bash
pnpm run test:integration -- tests/integration/services/OGMServices.integration.test.ts tests/integration/OGMMigration.validation.test.ts tests/benchmarks/OGMPerformance.benchmark.ts
```

## Test Configuration

### Environment Variables
- `RUN_INTEGRATION=1`: Required for integration tests
- `NODE_ENV=test`: Recommended for test environment
- `TEST_SILENT=1`: Suppress verbose logging

### Database Configuration
Tests use isolated database contexts to avoid conflicts:
- Each test suite gets unique prefixes
- Automatic cleanup after tests
- No interference between parallel tests

## Performance Expectations

### Baseline Performance
OGM implementation should:
- ✅ Not be more than 10x slower than legacy
- ✅ Use reasonable memory (< 200MB for 500 entities)
- ✅ Handle 80%+ success rate under load
- ✅ Maintain < 50% performance degradation under stress

### Memory Usage
- Individual operations: < 10MB delta
- Bulk operations (500 entities): < 200MB total
- No significant memory leaks over time

### Throughput
- Minimum 10 entities/second for individual operations
- Efficient bulk operations for large datasets
- Reasonable search response times (< 1s for typical queries)

## Test Data Patterns

### Entity Types
- **Files**: TypeScript, JavaScript, Python files
- **Symbols**: Functions, classes, interfaces
- **Tests**: Test files and test cases
- **Modules**: Package and module definitions

### Relationship Types
- **Structural**: CONTAINS, DEFINES, EXPORTS, IMPORTS
- **Code**: CALLS, REFERENCES, IMPLEMENTS, EXTENDS
- **Dependencies**: DEPENDS_ON, TYPE_USES
- **Testing**: TESTS, VALIDATES

### Realistic Scenarios
Tests include realistic codebase patterns:
- File/symbol hierarchies
- Cross-module dependencies
- Test coverage relationships
- Documentation links

## Validation Criteria

### API Compatibility ✅
- All public methods work identically
- Same return types and structures
- Identical error handling patterns
- Consistent event emission

### Data Consistency ✅
- No data loss during migration
- Identical query results
- Proper relationship preservation
- Metadata integrity

### Performance Acceptability ✅
- Reasonable performance (not 10x+ slower)
- Memory efficiency
- Scalability under load
- No performance degradation over time

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Ensure services are running
docker-compose ps
pnpm run health
```

**Memory Issues**
```bash
# Run with garbage collection
node --expose-gc ./node_modules/.bin/vitest run tests/benchmarks/
```

**Test Isolation Problems**
```bash
# Clean all databases
pnpm run db:clear:all
```

### Debug Mode
Enable detailed logging:
```bash
DEBUG=1 pnpm run test:integration -- tests/integration/services/OGMServices.integration.test.ts
```

## Migration Checklist

Before promoting OGM to production:

- [ ] All integration tests pass
- [ ] Migration validation tests pass
- [ ] Performance benchmarks within acceptable ranges
- [ ] Memory usage validated
- [ ] Stress tests pass
- [ ] Feature flag switching works
- [ ] Data consistency validated
- [ ] Error handling matches legacy
- [ ] Event emission consistent
- [ ] Documentation updated

## Reporting

### Test Output
Tests generate detailed reports:
- Performance comparison summaries
- Memory usage analysis
- Validation results
- Error details and recommendations

### Continuous Integration
Include in CI pipeline:
```yaml
- name: Run OGM Integration Tests
  run: |
    pnpm run dev:docker-up
    pnpm run test:integration -- tests/integration/services/OGMServices.integration.test.ts
    pnpm run test:integration -- tests/integration/OGMMigration.validation.test.ts
```

For production validation, also run benchmarks:
```yaml
- name: Run OGM Performance Benchmarks
  run: pnpm run test:integration -- tests/benchmarks/OGMPerformance.benchmark.ts
```
