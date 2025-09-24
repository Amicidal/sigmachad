# Enhanced Rollback Capabilities

This module provides comprehensive rollback functionality for the Memento system, enabling safe and intelligent restoration of system state with advanced conflict resolution and integration capabilities.

## Features

### 🔄 Core Rollback Functionality
- **Multiple Storage Backends**: In-memory and PostgreSQL persistence
- **Snapshot Management**: Automatic capture and restoration of system state
- **Change Detection**: Intelligent diff generation and analysis
- **Rollback Strategies**: Multiple strategies for different scenarios

### 🎯 Enhanced Rollback Strategies
- **Partial Rollback**: Selective rollback of specific entities, components, or namespaces
- **Time-based Rollback**: Rollback changes within specific time windows
- **Dry-run Analysis**: Preview rollback operations without executing them
- **Dependency-aware Rollback**: Smart ordering based on entity dependencies

### 🔧 Advanced Conflict Resolution
- **Visual Diff Generation**: Line-by-line, word-by-word, and semantic diffs
- **Smart Merge Strategies**: Intelligent conflict resolution with confidence scoring
- **Interactive Resolution**: UI-friendly conflict resolution options
- **Batch Processing**: Handle multiple related conflicts efficiently

### 🔗 System Integration
- **SessionManager Integration**: Session-aware rollback points and checkpoints
- **Audit Logging**: Comprehensive audit trails for all rollback operations
- **Metrics Collection**: Detailed performance and usage metrics
- **Notification System**: Real-time notifications for critical events

## Quick Start

### Basic Setup

```typescript
import {
  RollbackManager,
  createDefaultRollbackConfig,
  createDefaultStoreOptions
} from '@memento/core/rollback';

// Create basic rollback manager
const rollbackManager = new RollbackManager(
  createDefaultRollbackConfig(),
  createDefaultStoreOptions()
);

// Create a rollback point
const rollbackPoint = await rollbackManager.createRollbackPoint(
  'Before Major Changes',
  'Rollback point before implementing new feature'
);

// Execute rollback if needed
const operation = await rollbackManager.rollback(rollbackPoint.id);
```

### PostgreSQL Persistence

```typescript
import { PostgreSQLRollbackStore } from '@memento/core/rollback';

// Create PostgreSQL-backed store
const pgStore = new PostgreSQLRollbackStore(
  createDefaultRollbackConfig(),
  createDefaultStoreOptions(),
  {
    connectionString: 'postgresql://user:pass@localhost:5432/memento',
    schema: 'rollback',
    tablePrefix: 'memento_'
  }
);

await pgStore.initialize();
```

### Partial Rollback

```typescript
import { PartialRollbackStrategy } from '@memento/core/rollback';

const partialStrategy = new PartialRollbackStrategy();

// Define what to rollback
const partialContext = {
  // ... base context
  partialSelections: [
    {
      type: 'entity',
      identifiers: ['user-service', 'auth-service'],
      priority: 10
    },
    {
      type: 'component',
      identifiers: ['auth'],
      includePattern: /auth/,
      priority: 5
    }
  ]
};

// Generate preview first
const preview = await partialStrategy.generatePreview(partialContext);
console.log(`Will rollback ${preview.totalChanges} changes`);

// Execute partial rollback
await partialStrategy.execute(partialContext);
```

### Time-based Rollback

```typescript
import { TimebasedRollbackStrategy } from '@memento/core/rollback';

const timebasedStrategy = new TimebasedRollbackStrategy();

const timebasedContext = {
  // ... base context
  timebasedFilter: {
    rollbackToTimestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    maxChangeAge: 30 * 60 * 1000 // Only rollback changes from last 30 min
  }
};

await timebasedStrategy.execute(timebasedContext);
```

### Advanced Conflict Resolution

```typescript
import { ConflictResolutionEngine } from '@memento/core/rollback';

const conflictEngine = new ConflictResolutionEngine({
  preferNewer: true,
  preserveStructure: true,
  allowPartialMerge: true,
  semanticAnalysis: true
});

// Generate visual diff for a conflict
const conflict = {
  path: 'entity:config-service',
  type: 'VALUE_MISMATCH',
  currentValue: { port: 8080, env: 'prod' },
  rollbackValue: { port: 3000, env: 'dev' }
};

const visualDiff = await conflictEngine.generateVisualDiff(conflict);
console.log(`Similarity: ${visualDiff.metadata.similarity}%`);

// Get resolution options
const conflictUI = await conflictEngine.generateConflictUI(conflict);
console.log('Available options:', conflictUI.options.map(o => o.name));

// Perform smart merge
const mergeResult = await conflictEngine.smartMerge(conflict);
if (mergeResult.success) {
  console.log('Merged successfully with', mergeResult.confidence, '% confidence');
}
```

### Full Integration

```typescript
import { IntegratedRollbackManager } from '@memento/core/rollback';

const integratedManager = new IntegratedRollbackManager(rollbackManager, {
  sessionIntegration: {
    enabled: true,
    autoCreateCheckpoints: true,
    checkpointThreshold: 5,
    sessionRollbackLimit: 20
  },
  auditLogging: {
    enabled: true,
    logLevel: 'info',
    retentionDays: 30,
    sensitiveDataMask: true
  },
  metrics: {
    enabled: true,
    collectInterval: 60000,
    customMetrics: true
  },
  notifications: {
    enabled: true,
    rollbackCreated: true,
    rollbackFailed: true,
    criticalConflicts: true,
    channels: ['ui', 'webhook']
  }
});

// Set integrations
integratedManager.setIntegrations({
  sessionManager: mySessionManager,
  auditLogger: myAuditLogger,
  metricsCollector: myMetricsCollector,
  notificationService: myNotificationService
});
```

## Rollback Strategies

### Available Strategies

1. **ImmediateRollbackStrategy**: Fast rollback for simple scenarios
2. **GradualRollbackStrategy**: Batch processing with delays for large rollbacks
3. **SafeRollbackStrategy**: Extensive validation and backup creation
4. **ForceRollbackStrategy**: No safety checks for emergency situations
5. **PartialRollbackStrategy**: Selective rollback of specific items
6. **TimebasedRollbackStrategy**: Rollback within time windows
7. **DryRunRollbackStrategy**: Analysis without execution

### Strategy Selection

The system can automatically recommend the best strategy:

```typescript
import { RollbackStrategyFactory } from '@memento/core/rollback';

const recommendedStrategy = RollbackStrategyFactory.getRecommendedStrategy({
  operation,
  targetRollbackPoint,
  snapshots,
  diff: changes,
  conflictResolution: { strategy: ConflictStrategy.MERGE }
});
```

## Conflict Resolution

### Conflict Types

- **VALUE_MISMATCH**: Different values for the same property
- **TYPE_MISMATCH**: Type changes (string → number, object → array)
- **MISSING_TARGET**: Target entity/relationship no longer exists
- **PERMISSION_DENIED**: Insufficient permissions for rollback
- **DEPENDENCY_CONFLICT**: Circular or missing dependencies

### Resolution Strategies

- **ABORT**: Stop rollback on first conflict
- **SKIP**: Skip conflicted items and continue
- **OVERWRITE**: Replace current values with rollback values
- **MERGE**: Intelligently combine current and rollback values
- **ASK_USER**: Request human intervention

### Visual Diff Types

- **Line Diff**: Line-by-line comparison for text content
- **Word Diff**: Word-by-word comparison for shorter text
- **Character Diff**: Character-by-character comparison for small changes
- **JSON Diff**: Structured comparison for objects
- **Semantic Diff**: High-level comparison focusing on meaning

## Database Schema

### PostgreSQL Tables

When using PostgreSQL persistence, the following tables are created:

```sql
-- Rollback points
CREATE TABLE memento_rollback_points (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rollback operations
CREATE TABLE memento_rollback_operations (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  target_rollback_point_id UUID NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  strategy TEXT NOT NULL,
  log_entries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (target_rollback_point_id) REFERENCES memento_rollback_points(id) ON DELETE CASCADE
);

-- Snapshots
CREATE TABLE memento_rollback_snapshots (
  id UUID PRIMARY KEY,
  rollback_point_id UUID NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (rollback_point_id) REFERENCES memento_rollback_points(id) ON DELETE CASCADE
);
```

## Configuration

### RollbackConfig

```typescript
interface RollbackConfig {
  maxRollbackPoints: number;        // Maximum rollback points to keep
  defaultTTL: number;              // Default time-to-live in milliseconds
  autoCleanup: boolean;            // Enable automatic cleanup
  cleanupInterval: number;         // Cleanup interval in milliseconds
  maxSnapshotSize: number;         // Maximum snapshot size in bytes
  enablePersistence: boolean;      // Enable persistent storage
  persistenceType: 'memory' | 'redis' | 'postgresql';
  requireDatabaseReady: boolean;   // Require database readiness check
}
```

### Integration Config

```typescript
interface RollbackIntegrationConfig {
  sessionIntegration: {
    enabled: boolean;
    autoCreateCheckpoints: boolean;
    checkpointThreshold: number;
    sessionRollbackLimit: number;
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'all';
    retentionDays: number;
    sensitiveDataMask: boolean;
  };
  metrics: {
    enabled: boolean;
    collectInterval: number;
    customMetrics: boolean;
  };
  notifications: {
    enabled: boolean;
    rollbackCreated: boolean;
    rollbackFailed: boolean;
    criticalConflicts: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  };
}
```

## Performance Considerations

### Memory Usage

- In-memory store uses LRU eviction to control memory usage
- PostgreSQL store maintains a small memory cache for frequently accessed data
- Snapshots can be large - configure `maxSnapshotSize` appropriately

### Database Performance

- Use appropriate indexes on frequently queried columns
- Consider partitioning large tables by date
- Monitor query performance and adjust as needed

### Network and I/O

- Large rollbacks may generate significant database traffic
- Consider using gradual strategy for large operations
- Monitor disk space when using snapshot features

## Error Handling

The rollback system provides comprehensive error handling:

```typescript
try {
  const operation = await rollbackManager.rollback(rollbackPointId);
} catch (error) {
  if (error instanceof RollbackError) {
    console.log('Rollback failed:', error.code, error.context);
  } else if (error instanceof RollbackConflictError) {
    console.log('Conflicts detected:', error.conflicts);
  } else if (error instanceof DatabaseNotReadyError) {
    console.log('Database not ready for rollback operations');
  }
}
```

## Monitoring and Metrics

### Built-in Metrics

- Total rollback points created
- Successful/failed rollback operations
- Average rollback time
- Memory usage
- Conflict resolution rates

### Custom Metrics

Implement `MetricsCollector` interface to capture custom metrics:

```typescript
interface MetricsCollector {
  recordRollbackCreation(rollbackPoint: RollbackPoint, duration: number): void;
  recordRollbackExecution(operation: RollbackOperation, result: RollbackResult, duration: number): void;
  recordConflictResolution(conflicts: number, resolved: number, duration: number): void;
  recordSystemMetric(name: string, value: number, tags?: Record<string, string>): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
}
```

## Best Practices

### Rollback Point Management

1. **Create rollback points before major operations**
2. **Use descriptive names and descriptions**
3. **Set appropriate TTL values**
4. **Monitor storage usage**
5. **Regular cleanup of old points**

### Conflict Resolution

1. **Test rollback strategies in development**
2. **Use dry-run for complex rollbacks**
3. **Implement custom conflict resolvers for domain-specific conflicts**
4. **Monitor conflict rates and patterns**

### Performance

1. **Use partial rollback for large systems**
2. **Consider time-based rollback for temporal data**
3. **Monitor rollback operation duration**
4. **Use appropriate database indexes**

### Security

1. **Mask sensitive data in audit logs**
2. **Implement proper access controls**
3. **Monitor rollback operations for anomalies**
4. **Regular security audits of rollback data**

## Examples

See the [examples directory](./examples/) for comprehensive usage examples:

- `EnhancedRollbackUsage.ts`: Complete examples of all features
- `BasicSetup.ts`: Simple setup and usage
- `ConflictResolution.ts`: Advanced conflict resolution
- `IntegrationExamples.ts`: Full system integration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure database service is running and accessible
2. **Memory Issues**: Configure appropriate limits and enable cleanup
3. **Performance Issues**: Use appropriate strategies and monitor metrics
4. **Conflict Resolution**: Implement domain-specific resolvers

### Debug Logging

Enable debug logging to troubleshoot issues:

```typescript
// Set log level in configuration
const config = {
  ...createDefaultRollbackConfig(),
  logLevel: 'debug'
};
```

### Health Checks

Implement health checks for rollback system:

```typescript
const health = {
  rollbackManager: rollbackManager.isHealthy(),
  persistence: await pgStore.healthCheck(),
  metrics: metricsCollector.getHealth()
};
```

## Contributing

When contributing to the rollback system:

1. **Add tests for new features**
2. **Update documentation**
3. **Follow existing patterns**
4. **Consider backward compatibility**
5. **Add examples for new functionality**

## License

This module is part of the Memento system and follows the project's licensing terms.