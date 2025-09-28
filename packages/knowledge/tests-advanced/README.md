# Advanced E2E Test Suite

This directory contains comprehensive end-to-end tests that address critical gaps in system testing coverage. These tests validate system behavior under extreme conditions, ensure compatibility across platforms, and verify resilience during various failure scenarios.

## Test Suites

### 1. Chaos Engineering (`chaos-engineering.test.ts`)

Tests system resilience under various failure conditions:

- **Service Failure Simulation**: Tests behavior when individual services become unavailable
- **Network Partition Recovery**: Validates system recovery after network splits
- **Data Corruption Scenarios**: Tests detection and recovery from data integrity issues
- **Resource Exhaustion**: Validates graceful degradation under memory/CPU/connection pressure
- **Cascading Failure Handling**: Tests system behavior during multiple simultaneous failures

**Key Features:**
- Configurable failure scenarios
- Automatic recovery testing
- Performance monitoring during chaos
- Health status tracking
- Resource cleanup validation

### 2. Data Migration Testing (`data-migration.test.ts`)

Comprehensive testing of data migration scenarios:

- **Version Upgrade/Downgrade**: Tests forward and backward migration paths
- **Schema Migration Rollback**: Validates ability to revert problematic migrations
- **Large Dataset Performance**: Tests migration performance with 10k+ entities
- **Data Integrity Validation**: Ensures no data loss during migrations
- **Backup and Recovery**: Tests backup creation and restoration

**Key Features:**
- Multi-version migration chains
- Performance benchmarking
- Integrity checking
- Rollback capabilities
- Backup validation

### 3. API Versioning (`api-versioning.test.ts`)

Tests backward compatibility and version negotiation:

- **Backward Compatibility Validation**: Ensures old clients work with new APIs
- **Version Negotiation**: Tests automatic version selection
- **Deprecation Pathway Verification**: Validates proper deprecation warnings
- **Breaking Change Isolation**: Ensures breaking changes don't affect old versions
- **Feature Availability Testing**: Validates feature sets across versions

**Key Features:**
- Multi-version API simulation
- Content negotiation
- Deprecation warnings
- Migration guidance
- Client fallback testing

### 4. Performance Edge Cases (`performance-edge-cases.test.ts`)

Tests system behavior under extreme performance conditions:

- **Resource Exhaustion Scenarios**: Memory, CPU, and connection pool exhaustion
- **Cold Start Optimization**: Tests initial system startup performance
- **Memory Leak Detection**: Monitors for memory growth patterns
- **Burst Traffic Handling**: Tests sudden traffic spikes
- **Long-running Stability**: Validates system stability over extended periods

**Key Features:**
- Real-time performance monitoring
- Memory leak detection
- Throughput measurement
- Latency analysis
- Resource cleanup verification

### 5. Cross-Platform Compatibility (`cross-platform-compatibility.test.ts`)

Tests compatibility across different platforms and environments:

- **WebSocket Client Compatibility**: Tests across browsers, Node.js, React Native
- **API Client Library Testing**: Validates SDKs work on all target platforms
- **Platform-Specific Limitations**: Tests handling of platform constraints
- **Feature Detection**: Tests graceful fallbacks for missing features
- **Performance Comparison**: Benchmarks performance across platforms

**Supported Platforms:**
- Modern Browsers (Chrome, Firefox, Safari)
- Legacy Browsers (IE11)
- Mobile Browsers (iOS Safari, Chrome Mobile)
- Node.js
- React Native
- Electron

## Running the Tests

### Prerequisites

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Running Individual Test Suites

```bash
# Chaos engineering tests
pnpm vitest packages/knowledge/tests-advanced/chaos-engineering.test.ts

# Data migration tests
pnpm vitest packages/knowledge/tests-advanced/data-migration.test.ts

# API versioning tests
pnpm vitest packages/knowledge/tests-advanced/api-versioning.test.ts

# Performance edge cases
pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Cross-platform compatibility
pnpm vitest packages/knowledge/tests-advanced/cross-platform-compatibility.test.ts
```

### Running All Advanced E2E Tests

```bash
# Run all advanced E2E tests
pnpm vitest packages/knowledge/tests-advanced/

# Run with specific timeout (for long-running tests)
pnpm vitest packages/knowledge/tests-advanced/ --timeout 60000

# Run with detailed output
pnpm vitest packages/knowledge/tests-advanced/ --reporter=verbose

# Generate coverage report
pnpm vitest packages/knowledge/tests-advanced/ --coverage
```

### Running with Different Configurations

```bash
# Quick smoke tests (reduced duration)
NODE_ENV=test QUICK_MODE=true pnpm vitest packages/knowledge/tests-advanced/

# Full comprehensive tests (extended duration)
NODE_ENV=test COMPREHENSIVE=true pnpm vitest packages/knowledge/tests-advanced/

# Performance benchmarking mode
NODE_ENV=test BENCHMARK=true pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts
```

## Test Configuration

### Environment Variables

- `QUICK_MODE`: Reduces test duration for faster CI runs
- `COMPREHENSIVE`: Enables extended test scenarios
- `BENCHMARK`: Enables performance benchmarking
- `CHAOS_DURATION`: Override chaos test duration (milliseconds)
- `MIGRATION_DATASET_SIZE`: Override migration test dataset size
- `PERFORMANCE_THRESHOLD`: Override performance thresholds

### Configuration Files

```typescript
// packages/knowledge/tests-advanced/config.ts
export const testConfig = {
  chaos: {
    duration: process.env.CHAOS_DURATION || 30000,
    scenarios: ['service-failure', 'network-partition'],
  },
  migration: {
    datasetSize: process.env.MIGRATION_DATASET_SIZE || 1000,
    versions: ['1.0.0', '1.1.0', '2.0.0'],
  },
  performance: {
    thresholds: {
      maxLatency: 1000,
      minThroughput: 10,
    },
  },
};
```

## Test Results and Reporting

### Console Output

Tests provide detailed console output including:
- Performance metrics
- Resource usage statistics
- Error counts and types
- Platform compatibility results
- Migration timing data

### Structured Reports

```bash
# Generate JSON report
pnpm vitest packages/knowledge/tests-advanced/ --reporter=json > test-results.json

# Generate JUnit XML report
pnpm vitest packages/knowledge/tests-advanced/ --reporter=junit > test-results.xml

# Generate HTML report
pnpm vitest packages/knowledge/tests-advanced/ --reporter=html
```

### Custom Reporting

```typescript
import { AdvancedE2ETestRunner } from './index';

const runner = new AdvancedE2ETestRunner();
const results = await runner.runAllSuites();
const htmlReport = runner.generateReport(results.results, 'html');
```

## Performance Benchmarks

### Expected Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| API Latency | < 1000ms | 95th percentile response time |
| Throughput | > 10 RPS | Minimum requests per second |
| Error Rate | < 5% | Maximum acceptable error rate |
| Memory Growth | < 50% | Maximum memory growth during tests |
| Connection Time | < 30s | Maximum connection establishment time |

### Platform Performance Comparison

| Platform | Connection Time | Throughput | Memory Usage |
|----------|----------------|------------|--------------|
| Modern Browser | ~100ms | 50+ RPS | Baseline |
| Legacy Browser | ~500ms | 20+ RPS | +20% |
| Mobile Browser | ~300ms | 30+ RPS | +10% |
| Node.js | ~50ms | 100+ RPS | -30% |
| React Native | ~200ms | 40+ RPS | +15% |

## Troubleshooting

### Common Issues

#### Memory Exhaustion Tests Failing
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Monitor memory usage during tests
MONITOR_MEMORY=true pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Run with memory profiling
node --inspect --max-old-space-size=4096 ./node_modules/.bin/vitest packages/knowledge/tests/advanced/performance-edge-cases.test.ts
```

#### Timeout Issues
```bash
# Increase test timeout
pnpm vitest packages/knowledge/tests-advanced/ --timeout 120000

# Use quick mode for faster execution
QUICK_MODE=true pnpm vitest packages/knowledge/tests-advanced/

# Run specific test with extended timeout
CHAOS_DURATION=300000 pnpm vitest packages/knowledge/tests-advanced/chaos-engineering.test.ts
```

#### Platform Compatibility Issues
```bash
# Run specific platform tests
PLATFORM=nodejs pnpm vitest packages/knowledge/tests-advanced/cross-platform-compatibility.test.ts

# Skip browser-specific tests in CI
SKIP_BROWSER_TESTS=true pnpm vitest packages/knowledge/tests-advanced/cross-platform-compatibility.test.ts

# Test with specific Node.js version
nvm use 18 && pnpm vitest packages/knowledge/tests-advanced/cross-platform-compatibility.test.ts
```

#### Database Connection Issues
```bash
# Check database connectivity
nc -zv localhost 5432  # PostgreSQL
nc -zv localhost 6379  # Redis
nc -zv localhost 7687  # Neo4j
nc -zv localhost 6333  # Qdrant

# Start test databases
pnpm test:e2e:services:up

# Check database logs
pnpm test:e2e:services:logs

# Reset test databases
pnpm test:e2e:services:down && pnpm test:e2e:services:up
```

#### Service Startup Issues
```bash
# Check Docker daemon
docker info

# Check available ports
lsof -i :5432 -i :6379 -i :7687 -i :6333

# Clean up conflicting containers
docker container prune
docker volume prune

# Rebuild containers with latest images
docker-compose -f docker-compose.test.yml pull
docker-compose -f docker-compose.test.yml up --build -d
```

#### Test Flakiness Issues
```bash
# Run with retry mechanism
TEST_RETRY=3 pnpm vitest packages/knowledge/tests-advanced/

# Use deterministic mode
DETERMINISTIC=true pnpm vitest packages/knowledge/tests-advanced/

# Enable test isolation
SINGLE_FORK=true pnpm vitest packages/knowledge/tests-advanced/

# Run tests sequentially
PARALLEL_E2E=false pnpm vitest packages/knowledge/tests-advanced/
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* pnpm vitest packages/knowledge/tests-advanced/

# Enable verbose output
pnpm vitest packages/knowledge/tests-advanced/ --verbose

# Run with test reliability monitoring
MONITOR_RELIABILITY=true pnpm vitest packages/knowledge/tests-advanced/

# Generate detailed performance report
BENCHMARK=true pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Enable resource monitoring
MONITOR_RESOURCES=true pnpm vitest packages/knowledge/tests-advanced/
```

### Performance Debugging

```bash
# Profile memory usage
node --prof --max-old-space-size=4096 ./node_modules/.bin/vitest packages/knowledge/tests/advanced/

# Monitor event loop lag
NODE_OPTIONS="--expose-gc" pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Check for memory leaks
DETECT_MEMORY_LEAKS=true pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts

# Benchmark specific operations
BENCHMARK_OPERATIONS=true pnpm vitest packages/knowledge/tests-advanced/performance-edge-cases.test.ts
```

### Log Analysis

```bash
# Analyze test logs for patterns
grep -E "(ERROR|WARN|FAIL)" logs/advanced-e2e-*.log

# Extract performance metrics
grep -E "(latency|throughput|memory)" logs/performance-edge-cases.log

# Find resource exhaustion events
grep -E "(out of memory|connection pool|timeout)" logs/*.log

# Generate test summary
node scripts/analyze-test-logs.js logs/advanced-e2e-*.log
```

### Environment Validation

```bash
# Validate test environment
node scripts/validate-test-environment.js

# Check system resources
free -h  # Memory
df -h    # Disk space
nproc    # CPU cores

# Validate Node.js configuration
node -p "process.versions"
node -p "process.memoryUsage()"

# Check network connectivity
ping -c 3 localhost
telnet localhost 5432
telnet localhost 6379
telnet localhost 7687
telnet localhost 6333
```

### CI/CD Specific Issues

```bash
# Local reproduction of CI environment
act -j advanced-e2e-tests

# Check GitHub Actions logs
gh run list --workflow="Advanced E2E Tests"
gh run view [run-id] --log

# Debug matrix builds
MATRIX_DEBUG=true gh workflow run advanced-e2e-tests.yml

# Test with exact CI environment variables
CI=true QUICK_MODE=true pnpm vitest packages/knowledge/tests-advanced/
```

### Recovery Procedures

#### Test Database Corruption
```bash
# Reset all test databases
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
./scripts/wait-for-services.sh

# Verify database connectivity
pnpm test:setup
```

#### Resource Exhaustion Recovery
```bash
# Free up system resources
sudo sync && sudo sysctl vm.drop_caches=3

# Kill hanging processes
pkill -f vitest
pkill -f node

# Clean up Docker resources
docker system prune -f
```

#### Test State Corruption
```bash
# Clean test artifacts
rm -rf logs/advanced-e2e-*
rm -rf coverage/

# Reset test environment
pnpm test:cleanup
pnpm test:setup

# Run tests with fresh state
FRESH_STATE=true pnpm vitest packages/knowledge/tests-advanced/
```

## Contributing

### Adding New Test Scenarios

1. Create test file in `packages/knowledge/tests-advanced/`
2. Follow naming convention: `feature-name.test.ts`
3. Include comprehensive documentation
4. Add performance benchmarks
5. Update this README

### Test Guidelines

- Tests should be deterministic and repeatable
- Include both positive and negative test cases
- Provide clear failure messages
- Clean up resources after tests
- Document expected behavior
- Include performance assertions

### Code Review Checklist

- [ ] Tests cover edge cases and failure scenarios
- [ ] Performance thresholds are appropriate
- [ ] Resource cleanup is implemented
- [ ] Documentation is comprehensive
- [ ] Tests are platform-agnostic where possible
- [ ] Error handling is robust

## Integration with CI/CD

### GitHub Actions

```yaml
name: Advanced E2E Tests
on: [push, pull_request]

jobs:
  advanced-e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm vitest packages/knowledge/tests-advanced/ --reporter=junit
        env:
          QUICK_MODE: true
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Advanced E2E Tests
          path: test-results.xml
          reporter: java-junit
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Advanced E2E Tests') {
            steps {
                sh 'pnpm install'
                sh 'pnpm build'
                sh 'pnpm vitest packages/knowledge/tests-advanced/ --reporter=junit'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }
    }
}
```

## Metrics and Monitoring

The test suites generate comprehensive metrics that can be integrated with monitoring systems:

- Response time percentiles
- Error rates by scenario
- Resource utilization patterns
- Platform performance comparisons
- Migration performance trends

These metrics help identify performance regressions and validate system improvements over time.