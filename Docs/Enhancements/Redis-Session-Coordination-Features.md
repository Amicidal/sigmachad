# Redis Session Coordination - New Features Documentation

## Overview

This document covers the enhanced Redis session coordination implementation with comprehensive features for production-ready multi-agent session management.

## Table of Contents

1. [Session Replay System](#session-replay-system)
2. [Session Migration Service](#session-migration-service)
3. [Session Analytics](#session-analytics)
4. [Health Check Endpoints](#health-check-endpoints)
5. [Graceful Shutdown](#graceful-shutdown)
6. [Configuration Validation](#configuration-validation)
7. [Performance Monitoring](#performance-monitoring)
8. [API Reference](#api-reference)

## Session Replay System

### Overview

The Session Replay system provides comprehensive recording and playback capabilities for Redis-backed sessions, enabling historical analysis, debugging, and session reconstruction.

### Features

- **Event Recording**: Captures all session events with timestamps and state changes
- **Snapshot System**: Creates periodic snapshots for efficient playback
- **Delta Compression**: Reduces storage requirements through intelligent compression
- **Validation**: Ensures replay integrity with checksum validation
- **Filtering**: Supports playback filtering by time range, agents, and event types

### Usage

```typescript
import { SessionReplay } from '@sigmachad/core';

// Initialize replay service
const replay = new SessionReplay(redisClient, {
  compressionEnabled: true,
  snapshotInterval: 300, // 5 minutes
  enableStateValidation: true,
  enableDeltaCompression: true,
});

// Start recording a session
await replay.startRecording(sessionId, initialState);

// Record events during session
await replay.recordEvent(sessionId, event, sessionState);

// Stop recording and get replay ID
const replayId = await replay.stopRecording(sessionId);

// Play back the session
const replaySession = await replay.startReplay(replayId, {
  speed: 2.0, // 2x speed
  filterEventTypes: ['modified', 'broke'],
});

await replay.playReplay(replaySession, async (frame, index) => {
  console.log(`Frame ${index}:`, frame.event?.type);
});
```

### Configuration Options

```typescript
interface ReplayConfig {
  compressionEnabled: boolean;
  snapshotInterval: number; // seconds
  maxReplayDuration: number; // seconds
  enableStateValidation: boolean;
  enableDeltaCompression: boolean;
}
```

### Storage Management

- **Automatic Cleanup**: Old replays are automatically cleaned up based on age
- **Compression**: Delta compression reduces storage by up to 70%
- **Indexing**: Efficient indexing for fast replay lookup and filtering

## Session Migration Service

### Overview

The Session Migration service provides capabilities for migrating sessions between Redis instances, enabling cross-environment session management and disaster recovery.

### Features

- **Full Migration**: Complete transfer of all sessions
- **Incremental Migration**: Transfer only new/modified sessions
- **Selective Migration**: Transfer specific sessions by ID
- **Cross-Instance Sync**: Real-time synchronization between instances
- **Conflict Resolution**: Automatic conflict detection and resolution
- **Validation**: Post-migration data integrity validation

### Usage

```typescript
import { SessionMigration } from '@sigmachad/core';

const migration = new SessionMigration({
  sourceRedis: {
    host: 'source-redis.example.com',
    port: 6379,
    password: 'source-password',
  },
  targetRedis: {
    host: 'target-redis.example.com',
    port: 6379,
    password: 'target-password',
  },
  batchSize: 100,
  enableValidation: true,
});

await migration.initialize();

// Full migration
const taskId = await migration.startFullMigration({
  validateAfter: true,
});

// Monitor progress
const status = migration.getMigrationStatus(taskId);
console.log(`Progress: ${status.progress.migratedSessions}/${status.progress.totalSessions}`);

// Cross-instance synchronization
await migration.setupCrossInstanceSync(sessionId, 'target-instance', 'real-time');
```

### Migration Types

1. **Full Migration**: Migrates all sessions from source to target
2. **Incremental Migration**: Migrates only sessions modified since a timestamp
3. **Selective Migration**: Migrates specific sessions by ID list

### Validation

```typescript
// Validate migration integrity
const validationResults = await migration.validateMigration(taskId);
console.log(`Validation: ${validationResults.passed}/${validationResults.totalChecked} passed`);
```

## Session Analytics

### Overview

Built-in analytics provide insights into session patterns, performance metrics, and system health.

### Metrics Collected

- **Session Metrics**: Creation rate, duration, event frequency
- **Performance Metrics**: Response times, throughput, error rates
- **Agent Metrics**: Workload distribution, collaboration patterns
- **System Metrics**: Memory usage, Redis performance, connection health

### Usage

```typescript
// Get comprehensive session statistics
const stats = await sessionManager.getStats();
console.log('Active sessions:', stats.activeSessions);
console.log('Average events per session:', stats.averageEventsPerSession);

// Get performance metrics
const health = await sessionManager.healthCheck();
console.log('Average latency:', health.store.latency);
```

## Health Check Endpoints

### Overview

Comprehensive health monitoring system providing detailed insights into system status and performance.

### Features

- **Component Health**: Individual component status monitoring
- **Performance Metrics**: Real-time performance data
- **System Monitoring**: Memory, CPU, and resource utilization
- **Alerting**: Configurable alerts for threshold breaches
- **Multiple Endpoints**: Various health check endpoints for different needs

### Usage

```typescript
import { SessionHealthCheck } from '@sigmachad/core';

const healthCheck = new SessionHealthCheck({
  checkInterval: 30000, // 30 seconds
  enableDetailedMetrics: true,
  enableAlerts: true,
});

await healthCheck.initialize({
  sessionManager,
  redis,
  sessionStore,
});

// Get health status
const health = await healthCheck.getHealthStatus();
console.log('Overall status:', health.overall);

// Get HTTP endpoints for health checks
const endpoints = healthCheck.getHealthCheckEndpoints();
// Use endpoints in your HTTP server
```

### Available Endpoints

- `/health` - Basic health status
- `/health/detailed` - Comprehensive health information
- `/health/metrics` - Performance and system metrics
- `/health/components` - Individual component health
- `/health/redis` - Redis-specific health information
- `/health/sessions` - Session statistics

### Health Status Levels

- **healthy** - All systems operating normally
- **warning** - Minor issues detected, system still functional
- **critical** - Serious issues requiring attention
- **down** - System unavailable

## Graceful Shutdown

### Overview

Comprehensive graceful shutdown system ensuring data integrity and clean resource cleanup during system termination.

### Features

- **Session Preservation**: Checkpoints active sessions before shutdown
- **Resource Cleanup**: Proper cleanup of connections and resources
- **Signal Handling**: Responds to various shutdown signals
- **Recovery Data**: Creates recovery data for restart scenarios
- **Configurable Timeouts**: Flexible timing for different shutdown phases

### Usage

```typescript
import { SessionGracefulShutdown } from '@sigmachad/core';

const gracefulShutdown = new SessionGracefulShutdown({
  gracePeriod: 30000, // 30 seconds
  checkpointActiveSessions: true,
  preserveReplays: true,
  enableRecoveryData: true,
});

await gracefulShutdown.initialize({
  sessionManager,
  redis,
  sessionStore,
  sessionReplay,
});

// Manual shutdown
await gracefulShutdown.shutdown({
  reason: 'Maintenance',
  graceful: true,
  preserveData: true,
});

// Get shutdown status
const status = gracefulShutdown.getShutdownStatus();
console.log('Shutdown phase:', status.phase);
```

### Shutdown Phases

1. **Initiated** - Shutdown process started
2. **Draining** - Stopping new connections and requests
3. **Checkpointing** - Creating checkpoints for active sessions
4. **Cleanup** - Cleaning up components and connections
5. **Complete** - Shutdown finished successfully
6. **Forced** - Forced shutdown after timeout

### Signal Handling

Automatically handles common shutdown signals:
- `SIGTERM` - Graceful shutdown request
- `SIGINT` - Interrupt signal (Ctrl+C)
- `SIGQUIT` - Quit signal

## Configuration Validation

### Overview

Comprehensive configuration validation system ensuring proper setup and optimal performance.

### Features

- **Schema Validation**: Validates configuration structure and types
- **Environment Validation**: Environment-specific checks and recommendations
- **Security Validation**: Security best practices verification
- **Performance Validation**: Performance optimization recommendations
- **Runtime Validation**: Live system validation

### Usage

```typescript
import { SessionConfigValidator } from '@sigmachad/core';

const validator = new SessionConfigValidator(redisClient);

// Validate complete configuration
const validation = await validator.validateConfig(config);
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

// Validate environment setup
const envValidation = await validator.validateEnvironment('production');
console.log('Recommendations:', envValidation.recommendations);

// Validate Redis connection
const redisValidation = await validator.validateRedisConnection(redisConfig);

// Generate comprehensive report
const report = await validator.generateConfigurationReport(config);
```

### Validation Categories

- **Errors**: Critical issues that prevent operation
- **Warnings**: Issues that may cause problems
- **Recommendations**: Suggestions for optimization

### Environment-Specific Validation

Different validation rules for different environments:
- **Development**: Relaxed rules, development-friendly suggestions
- **Staging**: Production-like validation with warnings
- **Production**: Strict validation with security and performance requirements

## Performance Monitoring

### Overview

Built-in performance monitoring provides insights into system performance and bottlenecks.

### Metrics

- **Response Times**: Average, P95, P99 response times
- **Throughput**: Operations per second
- **Error Rates**: Percentage of failed operations
- **Memory Usage**: Heap usage and garbage collection metrics
- **Redis Metrics**: Commands per second, memory usage, connection counts

### Usage

```typescript
// Record operation timing
const startTime = Date.now();
await someOperation();
healthCheck.recordResponseTime(Date.now() - startTime);

// Record errors
try {
  await riskyOperation();
} catch (error) {
  healthCheck.recordError();
  throw error;
}

// Get performance metrics
const health = await healthCheck.getHealthStatus();
console.log('Average response time:', health.metrics.performance.averageResponseTime);
console.log('Throughput:', health.metrics.performance.throughput);
```

## API Reference

### SessionManager

Core session management service with enhanced capabilities.

```typescript
class SessionManager {
  // Session lifecycle
  async createSession(agentId: string, options?: SessionCreationOptions): Promise<string>
  async joinSession(sessionId: string, agentId: string): Promise<void>
  async leaveSession(sessionId: string, agentId: string): Promise<void>

  // Event management
  async emitEvent(sessionId: string, eventData: SessionEvent, actor: string, options?: SessionEventOptions): Promise<void>

  // Checkpointing
  async checkpoint(sessionId: string, options?: CheckpointOptions): Promise<string>

  // Administrative
  async listActiveSessions(): Promise<string[]>
  async getSessionsByAgent(agentId: string): Promise<string[]>
  async getStats(): Promise<SessionStats>
  async healthCheck(): Promise<HealthStatus>

  // Maintenance
  async performMaintenance(): Promise<void>
  async close(): Promise<void>
}
```

### SessionReplay

Session recording and playback service.

```typescript
class SessionReplay {
  // Recording
  async startRecording(sessionId: string, initialState?: SessionDocument): Promise<void>
  async recordEvent(sessionId: string, event: SessionEvent, sessionState?: SessionDocument): Promise<void>
  async stopRecording(sessionId: string): Promise<string>

  // Playback
  async startReplay(replayId: string, options?: ReplayOptions): Promise<ReplaySession>
  async playReplay(replaySession: ReplaySession, onFrame: (frame: ReplayFrame, index: number) => Promise<void> | void, options?: ReplayOptions): Promise<void>

  // Management
  async getReplay(replayId: string): Promise<ReplaySession | null>
  async listReplays(limit?: number): Promise<Array<{ replayId: string; metadata: any }>>
  async deleteReplay(replayId: string): Promise<void>
  async cleanupOldReplays(olderThanDays: number): Promise<number>

  // Statistics
  async getReplayStats(): Promise<ReplayStats>
}
```

### SessionMigration

Session migration and synchronization service.

```typescript
class SessionMigration {
  // Migration
  async startFullMigration(options?: { backupFirst?: boolean; validateAfter?: boolean }): Promise<string>
  async startIncrementalMigration(sinceTimestamp: string, options?: { validateAfter?: boolean }): Promise<string>
  async startSelectiveMigration(sessionIds: string[], options?: { validateAfter?: boolean }): Promise<string>

  // Monitoring
  getMigrationStatus(taskId: string): MigrationTask | null
  async cancelMigration(taskId: string): Promise<void>
  async validateMigration(taskId: string): Promise<ValidationResults>

  // Cross-instance sync
  async setupCrossInstanceSync(sessionId: string, targetInstance: string, syncMode?: 'real-time' | 'periodic' | 'manual'): Promise<void>
  async syncSession(sessionId: string): Promise<void>
  getCrossInstanceStatus(sessionId: string): CrossInstanceSession | null
  listCrossInstanceSessions(): CrossInstanceSession[]
}
```

### SessionHealthCheck

Health monitoring and metrics service.

```typescript
class SessionHealthCheck {
  // Health monitoring
  async getHealthStatus(): Promise<HealthStatus>
  getHealthCheckEndpoints(): HealthCheckEndpoint[]

  // Performance tracking
  recordResponseTime(responseTime: number): void
  recordError(): void

  // Lifecycle
  async initialize(services: { sessionManager?: SessionManager; redis?: RedisClientType; sessionStore?: SessionStore; sessionReplay?: SessionReplay; sessionMigration?: SessionMigration }): Promise<void>
  async shutdown(): Promise<void>
}
```

### SessionGracefulShutdown

Graceful shutdown management service.

```typescript
class SessionGracefulShutdown {
  // Shutdown management
  async shutdown(options?: Partial<ShutdownOptions>): Promise<void>
  getShutdownStatus(): ShutdownStatus | null
  isShutdownInProgress(): boolean

  // Recovery
  async getRecoveryData(): Promise<RecoveryData | null>
  async clearRecoveryData(): Promise<void>

  // Lifecycle
  async initialize(services: { sessionManager?: SessionManager; redis?: RedisClientType; sessionStore?: SessionStore; sessionReplay?: SessionReplay; sessionMigration?: SessionMigration; healthCheck?: SessionHealthCheck }): Promise<void>
}
```

### SessionConfigValidator

Configuration validation service.

```typescript
class SessionConfigValidator {
  // Validation
  async validateConfig(config: any): Promise<ValidationResult>
  validateSessionOptions(options: any): ValidationResult
  async validateEnvironment(environment: 'development' | 'staging' | 'production'): Promise<EnvironmentValidation>
  async validateRedisConnection(config: RedisConfig): Promise<ValidationResult>
  async validateProductionReadiness(config: SessionManagerConfig): Promise<ValidationResult>

  // Reporting
  async generateConfigurationReport(config: SessionManagerConfig): Promise<{ validation: ValidationResult; environment: EnvironmentValidation; recommendations: Recommendation[] }>
}
```

## Examples

### Complete Setup Example

```typescript
import {
  SessionManager,
  SessionReplay,
  SessionMigration,
  SessionHealthCheck,
  SessionGracefulShutdown,
  SessionConfigValidator,
} from '@sigmachad/core';
import { createClient } from 'redis';

// Configuration
const config = {
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
  },
  defaultTTL: 3600,
  checkpointInterval: 10,
  maxEventsPerSession: 1000,
  graceTTL: 300,
  enableFailureSnapshots: true,
};

// Validate configuration
const validator = new SessionConfigValidator();
const validation = await validator.validateConfig(config);
if (!validation.valid) {
  throw new Error('Invalid configuration');
}

// Initialize Redis client
const redis = createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});
await redis.connect();

// Initialize services
const sessionManager = new SessionManager(config);
const sessionReplay = new SessionReplay(redis);
const healthCheck = new SessionHealthCheck();
const gracefulShutdown = new SessionGracefulShutdown();

// Initialize health check and graceful shutdown
await healthCheck.initialize({
  sessionManager,
  redis,
  sessionReplay,
});

await gracefulShutdown.initialize({
  sessionManager,
  redis,
  sessionReplay,
  healthCheck,
});

// Create a session
const sessionId = await sessionManager.createSession('agent-1');

// Start recording
await sessionReplay.startRecording(sessionId);

// Emit events
await sessionManager.emitEvent(sessionId, {
  type: 'modified',
  changeInfo: {
    elementType: 'function',
    entityIds: ['func-1'],
    operation: 'modified',
  },
}, 'agent-1');

// Stop recording
const replayId = await sessionReplay.stopRecording(sessionId);

// Checkpoint session
await sessionManager.checkpoint(sessionId);

console.log('Session coordination system ready!');
```

### Multi-Agent Collaboration Example

```typescript
// Agent 1 creates a session
const sessionId = await sessionManager1.createSession('frontend-agent', {
  metadata: { feature: 'user-authentication' },
});

// Agent 2 joins for backend work
await sessionManager2.joinSession(sessionId, 'backend-agent');

// Both agents work concurrently
await Promise.all([
  // Frontend work
  sessionManager1.emitEvent(sessionId, {
    type: 'modified',
    changeInfo: {
      elementType: 'component',
      entityIds: ['LoginForm.tsx'],
      operation: 'modified',
    },
  }, 'frontend-agent'),

  // Backend work
  sessionManager2.emitEvent(sessionId, {
    type: 'modified',
    changeInfo: {
      elementType: 'function',
      entityIds: ['auth/login.ts'],
      operation: 'modified',
    },
  }, 'backend-agent'),
]);

// Agent 3 joins for testing
await sessionManager3.joinSession(sessionId, 'testing-agent');

// Testing finds an issue
await sessionManager3.emitEvent(sessionId, {
  type: 'broke',
  changeInfo: {
    elementType: 'test',
    entityIds: ['auth.test.ts'],
    operation: 'failed',
  },
  stateTransition: {
    from: 'working',
    to: 'broken',
    verifiedBy: 'test-suite',
    confidence: 0.95,
  },
}, 'testing-agent');

// Frontend agent fixes the issue
await sessionManager1.emitEvent(sessionId, {
  type: 'fixed',
  changeInfo: {
    elementType: 'component',
    entityIds: ['LoginForm.tsx'],
    operation: 'modified',
  },
  stateTransition: {
    from: 'broken',
    to: 'working',
    verifiedBy: 'manual-test',
    confidence: 0.9,
  },
}, 'frontend-agent');

// Final checkpoint
await sessionManager1.checkpoint(sessionId);
```

## Best Practices

### Configuration

1. **Use appropriate TTL values** - Balance memory usage with session requirements
2. **Enable failure snapshots** - For better debugging and recovery
3. **Configure proper Redis authentication** - Always use passwords in production
4. **Set reasonable checkpoint intervals** - Balance performance with recovery time
5. **Validate configuration** - Always validate before deployment

### Performance

1. **Monitor memory usage** - Track Redis and Node.js memory consumption
2. **Use health checks** - Implement comprehensive health monitoring
3. **Optimize checkpoint frequency** - Too frequent impacts performance, too infrequent impacts recovery
4. **Clean up old replays** - Implement retention policies for replay data
5. **Monitor pub/sub latency** - Track message delivery performance

### Security

1. **Use Redis AUTH** - Always configure Redis authentication
2. **Enable TLS** - Use encrypted connections in production
3. **Restrict network access** - Use firewalls and network segmentation
4. **Regular updates** - Keep Redis and Node.js versions current
5. **Monitor for vulnerabilities** - Implement security scanning

### Reliability

1. **Implement graceful shutdown** - Ensure clean termination
2. **Use Redis persistence** - Configure RDB and/or AOF for data durability
3. **Plan for failover** - Consider Redis Sentinel or Cluster for high availability
4. **Monitor system health** - Implement comprehensive monitoring
5. **Test recovery procedures** - Regularly test backup and recovery processes

## Troubleshooting

Common issues and solutions are covered in the [Redis Session Troubleshooting Guide](./Redis-Session-Troubleshooting-Guide.md).

## Migration Guide

For migrating from older session systems, see the [Session Migration Guide](./Session-Migration-Guide.md).

## Performance Tuning

Detailed performance optimization guidelines are available in the [Performance Tuning Guide](./Performance-Tuning-Guide.md).