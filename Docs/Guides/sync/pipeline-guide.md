# High-Throughput Ingestion Pipeline Guide

## Metadata

- Scope: sync
- Status: Draft
- Last Updated: 2025-09-27

## Prerequisites

- Access, roles, and environment assumptions.

## Steps

- Step 1
- Step 2
- Step 3

## Overview

The High-Throughput Ingestion Pipeline is designed to process large codebases efficiently, targeting **10,000+ lines of code per minute** while maintaining data integrity and enabling real-time analysis.

## Architecture

### Core Components

1. **HighThroughputIngestionPipeline** - Main orchestrator
2. **QueueManager** - Partitioned work distribution with backpressure
3. **WorkerPool** - Auto-scaling parallel processing workers
4. **HighThroughputBatchProcessor** - Streaming batch operations with dependency DAG
5. **KnowledgeGraphAdapter** - Integration bridge to existing services

### Data Flow

```
FileWatcher → ChangeEvents → QueueManager → WorkerPool → BatchProcessor → KnowledgeGraph
                    ↓
              ErrorHandler ← PerformanceMonitor ← TelemetryCollector
```

## Quick Start

### Basic Usage

```typescript
import { HighThroughputIngestionPipeline } from './src/ingestion/pipeline.js';
import { createKnowledgeGraphAdapter } from './src/ingestion/knowledge-graph-adapter.js';

// Configure the pipeline
const config = {
  eventBus: { type: 'memory', partitions: 4 },
  workers: {
    parsers: 2,
    entityWorkers: 2,
    relationshipWorkers: 2,
    embeddingWorkers: 1
  },
  batching: {
    entityBatchSize: 50,
    relationshipBatchSize: 100,
    embeddingBatchSize: 25,
    timeoutMs: 5000,
    maxConcurrentBatches: 4
  },
  monitoring: {
    metricsInterval: 1000,
    healthCheckInterval: 5000,
    alertThresholds: {
      queueDepth: 1000,
      latency: 5000,
      errorRate: 0.1
    }
  }
};

// Create knowledge graph adapter
const adapter = createKnowledgeGraphAdapter(knowledgeGraphService);

// Initialize pipeline
const pipeline = new HighThroughputIngestionPipeline(config, adapter);

// Start processing
await pipeline.start();

// Process files
await pipeline.processFile('/path/to/file.ts');

// Process directory
await knowledgeGraphService.processDirectory('/path/to/project', {
  batchSize: 100,
  maxConcurrency: 4,
  fileFilters: ['*.ts', '*.tsx', '*.js', '*.jsx'],
  progressCallback: (progress) => {
    console.log(`Processed ${progress.processed}/${progress.total} files`);
  }
});

// Stop pipeline
await pipeline.stop();
```

### Configuration Options

#### Pipeline Config

- **eventBus**: Configure event routing and partitioning
- **workers**: Set worker pool sizes for different task types
- **batching**: Control batch sizes and concurrency limits
- **queues**: Configure queue behavior and retry policies
- **monitoring**: Set up metrics collection and alerting

#### Processing Options

- **batchSize**: Number of items to process in each batch (default: 100)
- **maxConcurrency**: Maximum parallel workers (default: 4)
- **skipEmbeddings**: Skip embedding generation for faster processing
- **fileFilters**: Array of glob patterns to include specific files
- **progressCallback**: Function to receive processing updates

## Performance Characteristics

### Target Metrics

- **Throughput**: 10,000+ LOC/minute
- **Latency**: P95 < 500ms for core updates
- **Memory**: < 512MB peak usage
- **Error Rate**: < 1% under normal conditions

### Optimization Features

1. **Partitioned Queues**: Distribute work across multiple queues
2. **Auto-scaling Workers**: Dynamically adjust worker count based on load
3. **Batch Processing**: Group operations for efficient database writes
4. **Dependency DAG**: Resolve entity relationships before processing
5. **Idempotent Operations**: Prevent duplicate processing with batch IDs
6. **Streaming Writes**: Use Neo4j UNWIND for bulk operations
7. **Backpressure Control**: Prevent memory overflow during high load

### Memory Management

- **Queue Size Limits**: Maximum 10,000 items per queue
- **Worker Lifecycle**: Automatic restart of failed workers
- **Batch TTL**: Automatic cleanup of expired batches
- **Error Buffer**: Limited retention of error samples

## Monitoring & Observability

### Metrics Collection

The pipeline exposes comprehensive metrics for monitoring:

```typescript
const metrics = pipeline.getMetrics();
console.log(`Queue depth: ${metrics.queueMetrics.queueDepth}`);
console.log(`Throughput: ${metrics.eventsPerSecond} events/sec`);
console.log(`P95 latency: ${metrics.p95Latency}ms`);
console.log(`Error rate: ${metrics.queueMetrics.errorRate}`);
```

### Key Metrics

- **Pipeline Metrics**: Events/sec, latency distribution, error counts
- **Queue Metrics**: Depth, lag, partition utilization, throughput
- **Worker Metrics**: Utilization, task completion rates, error counts
- **Batch Metrics**: Active/completed/failed batch counts
- **Performance**: CPU usage, memory consumption, I/O metrics

### Event Monitoring

```typescript
pipeline.on('pipeline:started', () => console.log('Pipeline started'));
pipeline.on('pipeline:error', (error) => console.error('Pipeline error:', error));
pipeline.on('metrics:updated', (metrics) => updateDashboard(metrics));
pipeline.on('alert:triggered', (alert, value) => sendAlert(alert, value));
```

### Health Checks

The pipeline performs regular health checks:

- Queue depth monitoring
- Worker responsiveness checks
- Error rate tracking
- Memory usage monitoring
- Auto-scaling decisions

## Error Handling

### Error Types

1. **Parse Errors**: Syntax errors, unsupported constructs
2. **Processing Errors**: Database connection issues, validation failures
3. **System Errors**: Memory exhaustion, worker crashes
4. **Timeout Errors**: Tasks exceeding configured timeouts

### Recovery Strategies

- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker**: Prevent cascade failures
- **Worker Restart**: Automatic recovery from worker crashes
- **Graceful Degradation**: Continue processing other files on errors
- **Error Quarantine**: Isolate problematic files for later analysis

### Error Monitoring

```typescript
pipeline.on('parse:error', ({ filePath, error }) => {
  console.warn(`Parse error in ${filePath}: ${error}`);
});

pipeline.on('worker:error', (error) => {
  console.error('Worker error:', error);
});

const telemetry = pipeline.getTelemetry();
console.log(`Error types:`, telemetry.errors.types);
console.log(`Recent errors:`, telemetry.errors.samples);
```

## Testing

### Smoke Tests

Run the provided smoke tests to validate pipeline functionality:

```bash
# Simple smoke test (no dependencies)
pnpm exec tsx scripts/simple-smoke-test.ts

# Full smoke test (requires build)
pnpm exec tsx scripts/smoke-test.ts --verbose

# Stress testing
pnpm exec tsx scripts/smoke-test.ts --stress-test

# Benchmark mode
pnpm exec tsx scripts/smoke-test.ts --benchmark
```

### Integration Testing

The pipeline includes comprehensive integration tests:

```bash
# Run pipeline integration tests
pnpm test tests/integration/pipeline-integration.test.ts

# Run all ingestion tests
pnpm test tests/ingestion/
```

### Performance Testing

Validate performance characteristics:

```typescript
import { SmokeTestRunner } from './scripts/smoke-test.js';

const runner = new SmokeTestRunner({
  stressTest: true,
  verbose: true
});

const result = await runner.run();
console.log(`LOC/minute: ${result.metrics.locPerMinute}`);
console.log(`Memory usage: ${result.metrics.peakMemoryUsageMB}MB`);
```

## Troubleshooting

### Common Issues

#### High Memory Usage

**Symptoms**: Memory usage exceeding 512MB threshold

**Causes**:
- Queue depth too high
- Batch sizes too large
- Memory leaks in workers

**Solutions**:
- Reduce batch sizes: `entityBatchSize: 25`
- Increase worker count to drain queues faster
- Enable backpressure: `enableBackpressure: true`
- Monitor for memory leaks in custom handlers

#### Low Throughput

**Symptoms**: Processing rate below 10k LOC/minute

**Causes**:
- Insufficient worker parallelism
- Database bottlenecks
- Large file processing blocking queues

**Solutions**:
- Increase worker counts: `parsers: 4, entityWorkers: 4`
- Enable auto-scaling: `autoScale: true`
- Optimize batch sizes for your data
- Use file filters to skip large/binary files

#### High Error Rates

**Symptoms**: Error rate > 1%

**Causes**:
- Parse errors in source files
- Database connection issues
- Invalid entity relationships

**Solutions**:
- Check parser error logs for syntax issues
- Validate database connectivity
- Enable relationship endpoint validation
- Review file filter patterns

#### Queue Overflow

**Symptoms**: `QueueOverflowError` exceptions

**Causes**:
- Event ingestion rate exceeding processing capacity
- Worker starvation or crashes
- Database write bottlenecks

**Solutions**:
- Enable backpressure control
- Increase worker pool sizes
- Optimize database write performance
- Implement proper error handling in workers

### Debug Mode

Enable verbose logging for troubleshooting:

```typescript
const pipeline = new HighThroughputIngestionPipeline(config, adapter);

// Enable debug logging
pipeline.on('batch:completed', (result) => {
  console.log('Batch completed:', result);
});

pipeline.on('worker:started', (workerId) => {
  console.log('Worker started:', workerId);
});
```

### Performance Profiling

Profile pipeline performance:

```typescript
const telemetry = pipeline.getTelemetry();

console.log('Performance metrics:', {
  cpu: telemetry.performance.cpu,
  memory: telemetry.performance.memory,
  queueDepth: telemetry.queues.queueDepth,
  workerUtilization: telemetry.workers.length > 0
    ? telemetry.workers.filter(w => w.status === 'busy').length / telemetry.workers.length
    : 0
});
```

### Log Analysis

Key log patterns to monitor:

- `[IngestionPipeline] Queue depth warning` - Queue building up
- `[WorkerPool] Auto-scaling up` - High load detected
- `[BatchProcessor] Returning cached result` - Idempotency working
- `[KnowledgeGraphAdapter] Falling back` - Bulk operations unavailable

## Advanced Configuration

### Custom Worker Handlers

Register custom processing logic:

```typescript
pipeline.workerPool.registerHandler('custom_task', async (task) => {
  // Custom processing logic
  return { success: true, result: 'processed' };
});
```

### Event Bus Integration

For distributed processing, configure Redis or NATS:

```typescript
const config = {
  eventBus: {
    type: 'redis',
    url: 'redis://localhost:6379',
    partitions: 8
  }
  // ... other config
};
```

### Custom Batch Processing

Implement custom batch logic:

```typescript
class CustomBatchProcessor extends HighThroughputBatchProcessor {
  async processCustomBatch(items: any[]): Promise<BatchResult> {
    // Custom batch processing logic
    return { batchId: 'custom', success: true, processedCount: items.length };
  }
}
```

### Alerting Integration

Set up custom alerts:

```typescript
pipeline.addAlert({
  name: 'high_queue_depth',
  condition: 'queue_depth > 500',
  threshold: 500,
  duration: 30000, // 30 seconds
  severity: 'warning',
  channels: ['slack', 'email']
});

pipeline.on('alert:triggered', (alert, value) => {
  if (alert.channels.includes('slack')) {
    sendSlackAlert(alert, value);
  }
});
```

## Best Practices

### Performance Optimization

1. **Right-size Batches**: Start with defaults, tune based on your data
2. **Monitor Queue Depth**: Keep under 1000 items per queue
3. **Use File Filters**: Skip unnecessary files early
4. **Enable Auto-scaling**: Let the pipeline adapt to load
5. **Profile Regularly**: Monitor telemetry for bottlenecks

### Error Resilience

1. **Implement Retries**: Use exponential backoff for transient errors
2. **Monitor Error Rates**: Alert on rates > 1%
3. **Log Context**: Include file paths and entity IDs in error logs
4. **Graceful Degradation**: Continue processing on non-critical errors
5. **Circuit Breakers**: Prevent cascade failures

### Resource Management

1. **Memory Monitoring**: Set alerts for high memory usage
2. **Worker Lifecycle**: Let the pool manage worker restarts
3. **Batch Cleanup**: Enable automatic cleanup of expired batches
4. **Connection Pooling**: Use appropriate database connection limits
5. **Garbage Collection**: Monitor Node.js GC performance

### Operational Excellence

1. **Health Checks**: Implement comprehensive health monitoring
2. **Metrics Dashboard**: Visualize key performance indicators
3. **Alerting Strategy**: Set up graduated alert severities
4. **Documentation**: Keep runbooks for common operational tasks
5. **Testing**: Regularly run performance and integration tests

## Migration Guide

### From Legacy processDirectory

The new pipeline is backward-compatible with the existing `KnowledgeGraphService.processDirectory` method:

```typescript
// Old usage (still works)
await knowledgeGraphService.processDirectory('/path/to/project');

// New pipeline features
await knowledgeGraphService.processDirectory('/path/to/project', {
  batchSize: 100,
  maxConcurrency: 4,
  skipEmbeddings: false,
  fileFilters: ['*.ts', '*.tsx'],
  progressCallback: (progress) => console.log(progress)
});
```

### Configuration Migration

Update existing configurations:

```typescript
// Before
const config = { batchSize: 50 };

// After
const config = {
  batching: {
    entityBatchSize: 50,
    relationshipBatchSize: 100,
    embeddingBatchSize: 25,
    maxConcurrentBatches: 4
  },
  workers: {
    parsers: 2,
    entityWorkers: 2,
    relationshipWorkers: 2,
    embeddingWorkers: 1
  }
};
```

## API Reference

See individual class documentation for detailed API information:

- [HighThroughputIngestionPipeline](./src/ingestion/pipeline.ts)
- [QueueManager](./src/ingestion/queue-manager.ts)
- [WorkerPool](./src/ingestion/worker-pool.ts)
- [HighThroughputBatchProcessor](./src/ingestion/batch-processor.ts)
- [KnowledgeGraphAdapter](./src/ingestion/knowledge-graph-adapter.ts)

## Contributing

When contributing to the pipeline:

1. **Run Tests**: Ensure all tests pass before submitting
2. **Performance Testing**: Validate performance characteristics
3. **Documentation**: Update this guide for new features
4. **Monitoring**: Add appropriate metrics for new components
5. **Error Handling**: Implement comprehensive error recovery