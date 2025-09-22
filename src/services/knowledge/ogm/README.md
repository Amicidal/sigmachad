# Neo4j OGM Migration Phase 2

This directory contains the implementation of Phase 2 of the Neo4j OGM migration, which integrates the newly created OGM services with the main KnowledgeGraphService using a feature flag system.

## Overview

The migration provides:
- **Feature flag-controlled switching** between OGM and legacy implementations
- **Comprehensive error handling** with automatic fallback capabilities
- **Performance monitoring** and migration metrics tracking
- **Backward compatibility** ensuring all existing APIs continue to work
- **Comprehensive testing** to validate API consistency

## Architecture

### Core Components

1. **FeatureFlags.ts** - Controls which implementation to use
2. **ServiceAdapter.ts** - Provides unified API with fallback support
3. **MigrationTracker.ts** - Monitors migration metrics and performance
4. **ErrorHandler.ts** - Handles errors and determines fallback strategies
5. **MigrationCompatibilityTest.ts** - Validates API consistency

### Key Features

- **Gradual Migration**: Enable OGM for specific services independently
- **Automatic Fallback**: Falls back to legacy implementation on OGM errors
- **Performance Comparison**: Side-by-side performance testing capabilities
- **Migration Metrics**: Detailed tracking of operation success rates and response times
- **Error Classification**: Intelligent error handling based on error types

## Configuration

### Environment Variables

```bash
# Main feature flag
NEO4J_USE_OGM=true

# Service-specific flags (optional)
NEO4J_USE_OGM_ENTITY_SERVICE=true
NEO4J_USE_OGM_RELATIONSHIP_SERVICE=false  # Not implemented yet
NEO4J_USE_OGM_EMBEDDING_SERVICE=false     # Not implemented yet
NEO4J_USE_OGM_SEARCH_SERVICE=false        # Not implemented yet
NEO4J_USE_OGM_HISTORY_SERVICE=false       # Not implemented yet
NEO4J_USE_OGM_ANALYSIS_SERVICE=false      # Not implemented yet

# Migration control
NEO4J_OGM_ENABLE_FALLBACK=true            # Enable fallback to legacy on errors
NEO4J_LOG_MIGRATION_METRICS=false         # Log detailed migration metrics
NEO4J_ENABLE_PERFORMANCE_COMPARISON=false # Run both implementations for comparison
```

### Recommended Settings

#### Development Environment
```bash
NEO4J_USE_OGM=true
NEO4J_OGM_ENABLE_FALLBACK=true
NEO4J_LOG_MIGRATION_METRICS=true
NEO4J_ENABLE_PERFORMANCE_COMPARISON=false
```

#### Testing Environment
```bash
NEO4J_USE_OGM=true
NEO4J_OGM_ENABLE_FALLBACK=true
NEO4J_LOG_MIGRATION_METRICS=true
NEO4J_ENABLE_PERFORMANCE_COMPARISON=true
```

#### Production Environment (Gradual Rollout)
```bash
NEO4J_USE_OGM=false                        # Start with legacy
NEO4J_USE_OGM_ENTITY_SERVICE=true         # Enable only entity service
NEO4J_OGM_ENABLE_FALLBACK=true
NEO4J_LOG_MIGRATION_METRICS=true
NEO4J_ENABLE_PERFORMANCE_COMPARISON=false
```

## Usage

### Basic Usage

The KnowledgeGraphService automatically uses the feature flags to determine which implementation to use. No code changes are required for existing consumers.

```typescript
import { KnowledgeGraphService } from './KnowledgeGraphService.js';

const kgs = new KnowledgeGraphService();

// This will use OGM or legacy based on feature flags
const entity = await kgs.createEntity({
  id: 'test-entity',
  type: 'test',
  name: 'Test Entity'
});
```

### Migration Monitoring

```typescript
import { KnowledgeGraphService } from './KnowledgeGraphService.js';

const kgs = new KnowledgeGraphService();

// Get migration status
const status = kgs.getMigrationStatus();
console.log('Migration Status:', status);

// Get migration health
const health = kgs.getMigrationHealth();
console.log('Migration Health:', health);

// Get detailed metrics
const stats = await kgs.getStats();
console.log('Migration Metrics:', stats.migration);
```

### Manual Control (for testing/debugging)

```typescript
import { KnowledgeGraphService } from './KnowledgeGraphService.js';

const kgs = new KnowledgeGraphService();

// Force legacy mode
kgs.forceLegacyMode();

// Force OGM mode
kgs.forceOGMMode();

// Reset migration metrics
kgs.resetMigrationMetrics();
```

### Running Compatibility Tests

```typescript
import { MigrationCompatibilityTest } from './ogm/MigrationCompatibilityTest.js';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';

const test = new MigrationCompatibilityTest();
const kgs = new KnowledgeGraphService();

const report = await test.runCompatibilityTests(kgs);
console.log('Compatibility Report:', report);
```

## Error Handling

The migration includes comprehensive error handling:

### Error Types and Strategies

1. **Connection Errors**: Retry with fallback
2. **Validation Errors**: Fallback without retry
3. **Constraint Violations**: Fallback without retry
4. **Timeout Errors**: Retry with longer delay, then fallback
5. **Not Found Errors**: No fallback (expected behavior)
6. **OGM-Specific Errors**: Immediate fallback to legacy

### Error Monitoring

```typescript
import { getMigrationErrorHandler } from './ogm/ErrorHandler.js';

const errorHandler = getMigrationErrorHandler();

// Get error statistics
const errorStats = errorHandler.getErrorStats();

// Get recommendations
const recommendations = errorHandler.getThresholdRecommendations();

// Listen for error events
errorHandler.on('migration:error', (data) => {
  console.log('Migration error:', data);
});

errorHandler.on('migration:alert', (data) => {
  console.log('Migration alert:', data);
});
```

## Monitoring and Metrics

### Key Metrics Tracked

- **Operation success rates** (OGM vs Legacy)
- **Response times** (OGM vs Legacy)
- **Error frequencies** by service and operation
- **Fallback occurrences**
- **Migration progress** percentage

### Accessing Metrics

```typescript
import { getMigrationTracker } from './ogm/MigrationTracker.js';

const tracker = getMigrationTracker();

// Get current metrics
const metrics = tracker.getMetrics();

// Get recent operations
const recentOps = tracker.getRecentOperations(50);

// Get migration health summary
const health = tracker.getMigrationHealth();
```

## Migration Phases

### Phase 1: Setup (Completed)
- ✅ Created OGM models and base services
- ✅ Implemented EntityServiceOGM
- ✅ Created NeogmaService wrapper

### Phase 2: Integration (Current)
- ✅ Feature flag system
- ✅ Service adapter with fallback
- ✅ Error handling and monitoring
- ✅ Migration metrics tracking
- ✅ Compatibility testing
- ✅ KnowledgeGraphService integration

### Phase 3: Rollout (Next)
- [ ] Gradual feature flag rollout
- [ ] Production monitoring
- [ ] Performance optimization
- [ ] Legacy service deprecation

### Phase 4: Complete Migration (Future)
- [ ] Remove legacy implementations
- [ ] Clean up feature flags
- [ ] Optimize OGM queries
- [ ] Final performance tuning

## Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check error logs for specific error types
   - Consider enabling fallback mode
   - Verify Neo4j connection and configuration

2. **Performance Issues**
   - Enable performance comparison mode
   - Check migration metrics for response times
   - Consider optimizing OGM model relationships

3. **API Inconsistencies**
   - Run compatibility tests
   - Check for missing method implementations
   - Verify event forwarding is working

### Debug Commands

```typescript
// Get detailed migration status
const status = kgs.getMigrationStatus();

// Get error recommendations
const adapter = kgs.entities; // EntityServiceAdapter
const recommendations = adapter.getErrorRecommendations();

// Reset all tracking (for clean testing)
kgs.resetMigrationMetrics();
adapter.resetErrorTracking();
```

## Best Practices

1. **Start with fallback enabled** in production
2. **Monitor error rates closely** during rollout
3. **Use gradual service-by-service enablement**
4. **Run compatibility tests** before deployment
5. **Keep legacy implementation** until migration is complete
6. **Document any API differences** discovered during testing

## Future Enhancements

- Additional service migrations (Relationships, Search, etc.)
- Real-time monitoring dashboard
- Automated rollback based on error thresholds
- A/B testing framework for performance comparison
- Integration with observability tools (Prometheus, Grafana)