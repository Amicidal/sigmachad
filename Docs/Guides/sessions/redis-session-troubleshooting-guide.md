# Redis Session Coordination - Troubleshooting Guide

## Metadata

- Scope: sessions
- Status: Draft
- Last Updated: 2025-09-27

## Prerequisites

- Access, roles, and environment assumptions.

## Steps

- Step 1
- Step 2
- Step 3

## Overview

This guide provides solutions for common issues encountered when using the Redis session coordination system, including connection problems, performance issues, and operational challenges.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Performance Problems](#performance-problems)
3. [Memory Issues](#memory-issues)
4. [Session Management Problems](#session-management-problems)
5. [Pub/Sub Issues](#pubsub-issues)
6. [Migration Problems](#migration-problems)
7. [Health Check Failures](#health-check-failures)
8. [Graceful Shutdown Issues](#graceful-shutdown-issues)
9. [Configuration Problems](#configuration-problems)
10. [Monitoring and Debugging](#monitoring-and-debugging)

## Connection Issues

### Redis Connection Failures

#### Symptoms
- `ECONNREFUSED` errors
- Timeout errors during connection
- Health checks failing

#### Diagnosis
```typescript
// Test Redis connection
const testConnection = async () => {
  try {
    await redis.ping();
    console.log('Redis connection successful');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
};
```

#### Solutions

1. **Check Redis Server Status**
   ```bash
   # Check if Redis is running
   redis-cli ping

   # Check Redis logs
   tail -f /var/log/redis/redis-server.log
   ```

2. **Verify Connection Configuration**
   ```typescript
   const config = {
     host: 'localhost', // Correct host
     port: 6379,        // Correct port
     password: 'your-password', // If AUTH is enabled
     db: 0,            // Correct database number
   };
   ```

3. **Network Connectivity**
   ```bash
   # Test network connectivity
   telnet redis-host 6379

   # Check firewall rules
   sudo ufw status
   ```

4. **Connection Pool Issues**
   ```typescript
   // Increase connection timeout
   const redis = createClient({
     socket: {
       connectTimeout: 10000, // 10 seconds
       commandTimeout: 5000,  // 5 seconds
     },
     // Maximum retries
     retry_unfulfilled_commands: true,
   });
   ```

### Authentication Failures

#### Symptoms
- `NOAUTH Authentication required` errors
- `ERR invalid password` errors

#### Solutions

1. **Verify Redis AUTH Configuration**
   ```bash
   # Check Redis configuration
   redis-cli CONFIG GET requirepass

   # Test authentication
   redis-cli -a your-password ping
   ```

2. **Update Application Configuration**
   ```typescript
   const config = {
     password: process.env.REDIS_PASSWORD, // Use environment variables
     // or
     password: 'your-actual-password',
   };
   ```

3. **ACL Issues (Redis 6+)**
   ```bash
   # Check ACL users
   redis-cli ACL LIST

   # Create specific user for application
   redis-cli ACL SETUSER myapp +@all ~* &your-password
   ```

## Performance Problems

### High Latency

#### Symptoms
- Slow session operations
- High response times in health checks
- Timeout errors

#### Diagnosis
```typescript
// Monitor operation timing
const measureLatency = async (operation) => {
  const start = Date.now();
  try {
    await operation();
    const latency = Date.now() - start;
    console.log(`Operation latency: ${latency}ms`);
    return latency;
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
};

// Test Redis latency
await measureLatency(() => redis.ping());
```

#### Solutions

1. **Check Redis Performance**
   ```bash
   # Redis latency monitoring
   redis-cli --latency

   # Slow log analysis
   redis-cli SLOWLOG GET 10
   ```

2. **Optimize Redis Configuration**
   ```conf
   # redis.conf optimizations
   tcp-keepalive 60
   timeout 0
   tcp-backlog 511

   # Disable expensive operations in production
   save ""  # Disable RDB if using AOF
   ```

3. **Connection Pooling**
   ```typescript
   // Use connection pooling
   const redis = createClient({
     socket: {
       keepAlive: true,
       initialDelay: 0,
     },
     // Pool settings
     pool: {
       min: 2,
       max: 10,
     },
   });
   ```

4. **Optimize Session Operations**
   ```typescript
   // Use pipelines for multiple operations
   const pipeline = redis.multi();
   pipeline.hSet(sessionKey, sessionData);
   pipeline.zAdd(eventsKey, eventEntries);
   pipeline.expire(sessionKey, ttl);
   await pipeline.exec();
   ```

### Low Throughput

#### Symptoms
- Low operations per second
- Backlog of pending operations
- CPU or memory bottlenecks

#### Solutions

1. **Batch Operations**
   ```typescript
   // Process sessions in batches
   const processBatch = async (sessionIds, batchSize = 100) => {
     for (let i = 0; i < sessionIds.length; i += batchSize) {
       const batch = sessionIds.slice(i, i + batchSize);
       await Promise.all(batch.map(processSession));
     }
   };
   ```

2. **Async Processing**
   ```typescript
   // Use async processing for non-critical operations
   const processAsync = async (operation) => {
     setImmediate(async () => {
       try {
         await operation();
       } catch (error) {
         console.error('Async operation failed:', error);
       }
     });
   };
   ```

3. **Reduce Checkpoint Frequency**
   ```typescript
   const config = {
     checkpointInterval: 50, // Reduce from default
     // Only checkpoint on critical events
     autoCheckpoint: false,
   };
   ```

## Memory Issues

### High Memory Usage

#### Symptoms
- Redis memory warnings
- Node.js heap out of memory errors
- System performance degradation

#### Diagnosis
```typescript
// Monitor memory usage
const monitorMemory = () => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
  });
};

// Check Redis memory
const checkRedisMemory = async () => {
  const info = await redis.info('memory');
  console.log('Redis memory info:', info);
};
```

#### Solutions

1. **Configure Redis Memory Limits**
   ```conf
   # redis.conf
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

2. **Optimize Session TTL**
   ```typescript
   const config = {
     defaultTTL: 1800, // 30 minutes instead of hours
     graceTTL: 180,    // 3 minutes for cleanup
   };
   ```

3. **Clean Up Old Data**
   ```typescript
   // Regular cleanup of expired sessions
   const cleanup = async () => {
     const expiredSessions = await redis.keys('session:*');
     for (const sessionKey of expiredSessions) {
       const ttl = await redis.ttl(sessionKey);
       if (ttl <= 0) {
         await redis.del(sessionKey);
       }
     }
   };

   // Run cleanup every hour
   setInterval(cleanup, 3600000);
   ```

4. **Optimize Event Storage**
   ```typescript
   // Limit events per session
   const addEvent = async (sessionId, event) => {
     const eventsKey = `events:${sessionId}`;

     // Add new event
     await redis.zAdd(eventsKey, { score: event.seq, value: JSON.stringify(event) });

     // Keep only last 1000 events
     await redis.zRemRangeByRank(eventsKey, 0, -1001);
   };
   ```

### Memory Leaks

#### Symptoms
- Continuously increasing memory usage
- Performance degradation over time
- EventEmitter memory warnings

#### Solutions

1. **Proper Event Listener Cleanup**
   ```typescript
   class SessionService extends EventEmitter {
     private listeners = new Map();

     addSessionListener(sessionId, callback) {
       this.listeners.set(sessionId, callback);
       this.on(`session:${sessionId}`, callback);
     }

     removeSessionListener(sessionId) {
       const callback = this.listeners.get(sessionId);
       if (callback) {
         this.removeListener(`session:${sessionId}`, callback);
         this.listeners.delete(sessionId);
       }
     }

     cleanup() {
       // Remove all listeners
       this.listeners.forEach((callback, sessionId) => {
         this.removeListener(`session:${sessionId}`, callback);
       });
       this.listeners.clear();
     }
   }
   ```

2. **Use WeakMaps for Caching**
   ```typescript
   // Use WeakMap to prevent memory leaks
   const sessionCache = new WeakMap();

   const cacheSession = (sessionObj, data) => {
     sessionCache.set(sessionObj, data);
   };
   ```

3. **Regular Garbage Collection**
   ```typescript
   // Force garbage collection periodically (development only)
   if (process.env.NODE_ENV === 'development') {
     setInterval(() => {
       if (global.gc) {
         global.gc();
         console.log('Manual GC triggered');
       }
     }, 60000);
   }
   ```

## Session Management Problems

### Session State Inconsistencies

#### Symptoms
- Sessions showing wrong state
- Events missing or out of order
- Agent lists incorrect

#### Diagnosis
```typescript
// Validate session integrity
const validateSession = async (sessionId) => {
  const session = await sessionManager.getSession(sessionId);
  if (!session) return { valid: false, error: 'Session not found' };

  const issues = [];

  // Check event sequence
  const events = session.events.sort((a, b) => a.seq - b.seq);
  for (let i = 1; i < events.length; i++) {
    if (events[i].seq !== events[i-1].seq + 1) {
      issues.push(`Event sequence gap: ${events[i-1].seq} -> ${events[i].seq}`);
    }
  }

  // Check agent consistency
  const eventActors = new Set(events.map(e => e.actor));
  const sessionAgents = new Set(session.agentIds);

  return { valid: issues.length === 0, issues };
};
```

#### Solutions

1. **Implement Event Sequence Validation**
   ```typescript
   const addEventWithValidation = async (sessionId, event) => {
     const lastEvent = await getLastEvent(sessionId);
     if (lastEvent && event.seq !== lastEvent.seq + 1) {
       throw new Error(`Invalid sequence: expected ${lastEvent.seq + 1}, got ${event.seq}`);
     }

     await sessionStore.addEvent(sessionId, event);
   };
   ```

2. **Use Atomic Operations**
   ```typescript
   // Use Redis transactions for consistency
   const updateSessionAtomic = async (sessionId, updates) => {
     const multi = redis.multi();

     // All updates in single transaction
     multi.hSet(`session:${sessionId}`, updates.sessionData);
     multi.zAdd(`events:${sessionId}`, updates.events);
     multi.sAdd(`agents:${sessionId}`, updates.agents);

     await multi.exec();
   };
   ```

3. **Implement Session Recovery**
   ```typescript
   const recoverSession = async (sessionId) => {
     // Get all session data
     const sessionData = await redis.hGetAll(`session:${sessionId}`);
     const events = await redis.zRange(`events:${sessionId}`, 0, -1);
     const agents = await redis.sMembers(`agents:${sessionId}`);

     // Rebuild session state from events
     const rebuiltSession = rebuildFromEvents(events);

     // Compare and fix inconsistencies
     if (sessionData.state !== rebuiltSession.state) {
       await redis.hSet(`session:${sessionId}`, 'state', rebuiltSession.state);
     }
   };
   ```

### Lost Sessions

#### Symptoms
- Sessions disappearing unexpectedly
- Cannot find active sessions
- Data loss during operations

#### Solutions

1. **Implement Session Persistence**
   ```typescript
   // Create persistent backup
   const backupSession = async (sessionId) => {
     const session = await sessionManager.getSession(sessionId);
     if (session) {
       await redis.set(
         `backup:session:${sessionId}`,
         JSON.stringify(session),
         { EX: 86400 } // 24 hour backup
       );
     }
   };
   ```

2. **Monitor Session Expiration**
   ```typescript
   // Track session TTL
   const monitorSessionTTL = async (sessionId) => {
     const ttl = await redis.ttl(`session:${sessionId}`);
     if (ttl < 300) { // Less than 5 minutes
       console.warn(`Session ${sessionId} expires in ${ttl} seconds`);
       // Extend TTL if session is active
       await redis.expire(`session:${sessionId}`, 3600);
     }
   };
   ```

3. **Implement Session Recovery from Backup**
   ```typescript
   const recoverFromBackup = async (sessionId) => {
     const backupData = await redis.get(`backup:session:${sessionId}`);
     if (backupData) {
       const session = JSON.parse(backupData);
       await sessionStore.createSession(sessionId, session.agentIds[0], {
         ttl: 3600,
         restoreData: session,
       });
       return true;
     }
     return false;
   };
   ```

## Pub/Sub Issues

### Message Delivery Problems

#### Symptoms
- Messages not received by all subscribers
- Delayed message delivery
- Connection drops during pub/sub

#### Diagnosis
```typescript
// Test pub/sub connectivity
const testPubSub = async () => {
  const publisher = createClient(redisConfig);
  const subscriber = createClient(redisConfig);

  await Promise.all([publisher.connect(), subscriber.connect()]);

  let messageReceived = false;
  const testChannel = 'test:pubsub';

  await subscriber.subscribe(testChannel, (message) => {
    console.log('Message received:', message);
    messageReceived = true;
  });

  await publisher.publish(testChannel, 'test message');

  // Wait for message
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!messageReceived) {
    throw new Error('Pub/sub message not received');
  }

  await Promise.all([publisher.quit(), subscriber.quit()]);
};
```

#### Solutions

1. **Use Separate Connections for Pub/Sub**
   ```typescript
   // Dedicated pub/sub connections
   const pubClient = createClient(redisConfig);
   const subClient = createClient(redisConfig);

   await Promise.all([pubClient.connect(), subClient.connect()]);

   // Use pubClient only for publishing
   // Use subClient only for subscribing
   ```

2. **Implement Message Acknowledgment**
   ```typescript
   // Add message acknowledgment
   const publishWithAck = async (channel, message) => {
     const messageId = generateId();
     const messageWithId = { id: messageId, ...message };

     await pubClient.publish(channel, JSON.stringify(messageWithId));

     // Wait for acknowledgment
     return new Promise((resolve, reject) => {
       const timeout = setTimeout(() => {
         reject(new Error('Message acknowledgment timeout'));
       }, 5000);

       // Listen for acknowledgment
       subClient.subscribe(`ack:${messageId}`, () => {
         clearTimeout(timeout);
         resolve(messageId);
       });
     });
   };
   ```

3. **Handle Connection Reconnection**
   ```typescript
   // Reconnection handling
   subClient.on('error', async (error) => {
     console.error('Subscriber error:', error);

     // Attempt reconnection
     try {
       await subClient.disconnect();
       await subClient.connect();

       // Resubscribe to channels
       await subClient.subscribe(requiredChannels, messageHandler);
     } catch (reconnectError) {
       console.error('Reconnection failed:', reconnectError);
     }
   });
   ```

### Channel Conflicts

#### Symptoms
- Receiving messages for wrong sessions
- Cross-session message pollution
- Unexpected message handlers

#### Solutions

1. **Use Unique Channel Names**
   ```typescript
   // Include process ID and random component
   const generateChannelName = (base) => {
     return `${base}:${process.pid}:${Math.random().toString(36).substr(2, 9)}`;
   };

   const sessionChannel = generateChannelName(`session:${sessionId}`);
   ```

2. **Implement Channel Namespacing**
   ```typescript
   const config = {
     pubSubChannels: {
       global: `${environment}:global:sessions`,
       session: `${environment}:session:`,
     },
   };
   ```

3. **Message Filtering**
   ```typescript
   // Filter messages by metadata
   const messageHandler = (message, channel) => {
     try {
       const data = JSON.parse(message);

       // Validate message format
       if (!data.sessionId || !data.type) return;

       // Filter by session ownership
       if (!isSessionOwned(data.sessionId)) return;

       // Process valid message
       processSessionMessage(data);
     } catch (error) {
       console.error('Invalid message format:', error);
     }
   };
   ```

## Migration Problems

### Migration Failures

#### Symptoms
- Migration tasks stuck in "running" state
- Data corruption during migration
- Source/target inconsistencies

#### Diagnosis
```typescript
// Check migration status
const diagnoseMigration = async (taskId) => {
  const task = migration.getMigrationStatus(taskId);
  console.log('Migration status:', task);

  if (task?.status === 'running') {
    const elapsed = Date.now() - new Date(task.startTime).getTime();
    console.log(`Migration running for ${elapsed}ms`);

    if (elapsed > 300000) { // 5 minutes
      console.warn('Migration taking longer than expected');
    }
  }

  // Check for errors
  if (task?.errors?.length > 0) {
    console.error('Migration errors:', task.errors);
  }
};
```

#### Solutions

1. **Implement Migration Resume**
   ```typescript
   const resumeMigration = async (taskId) => {
     const task = migration.getMigrationStatus(taskId);
     if (!task || task.status !== 'running') return;

     // Get list of already migrated sessions
     const migratedSessions = await getMigratedSessions(taskId);

     // Continue with remaining sessions
     const remainingSessions = task.filters?.sessionIds?.filter(
       id => !migratedSessions.includes(id)
     ) || [];

     if (remainingSessions.length > 0) {
       await migration.startSelectiveMigration(remainingSessions);
     }
   };
   ```

2. **Add Migration Validation**
   ```typescript
   const validateMigrationData = async (sessionId) => {
     const source = await getSessionFromSource(sessionId);
     const target = await getSessionFromTarget(sessionId);

     if (!source || !target) {
       throw new Error(`Session ${sessionId} missing in source or target`);
     }

     // Compare critical fields
     const mismatches = [];
     if (source.state !== target.state) {
       mismatches.push('state');
     }
     if (source.events.length !== target.events.length) {
       mismatches.push('events');
     }

     return { valid: mismatches.length === 0, mismatches };
   };
   ```

3. **Implement Rollback Capability**
   ```typescript
   const rollbackMigration = async (taskId) => {
     const task = migration.getMigrationStatus(taskId);
     if (!task) return;

     // Get migrated sessions
     const migratedSessions = await getMigratedSessions(taskId);

     // Remove from target
     for (const sessionId of migratedSessions) {
       await redis.del(`session:${sessionId}`);
       await redis.del(`events:${sessionId}`);
     }

     console.log(`Rolled back ${migratedSessions.length} sessions`);
   };
   ```

## Health Check Failures

### Component Health Issues

#### Symptoms
- Health checks returning "critical" status
- Individual components showing as "down"
- High latency in health responses

#### Solutions

1. **Implement Component Isolation**
   ```typescript
   // Isolate failing components
   const isolateComponent = async (componentName) => {
     if (componentName === 'redis') {
       // Switch to fallback storage
       await switchToFallbackStorage();
     } else if (componentName === 'sessionManager') {
       // Stop accepting new sessions
       sessionManager.setReadOnlyMode(true);
     }
   };
   ```

2. **Add Detailed Health Diagnostics**
   ```typescript
   const detailedHealthCheck = async () => {
     const results = {};

     // Test each component individually
     results.redis = await testRedisHealth();
     results.sessionStore = await testSessionStoreHealth();
     results.pubsub = await testPubSubHealth();

     return results;
   };
   ```

3. **Implement Health Check Circuit Breaker**
   ```typescript
   class HealthCheckCircuitBreaker {
     private failures = 0;
     private lastFailure = 0;
     private state = 'closed'; // closed, open, half-open

     async execute(healthCheck) {
       if (this.state === 'open') {
         if (Date.now() - this.lastFailure > 60000) { // 1 minute
           this.state = 'half-open';
         } else {
           throw new Error('Circuit breaker open');
         }
       }

       try {
         const result = await healthCheck();
         this.reset();
         return result;
       } catch (error) {
         this.recordFailure();
         throw error;
       }
     }

     private recordFailure() {
       this.failures++;
       this.lastFailure = Date.now();

       if (this.failures >= 5) {
         this.state = 'open';
       }
     }

     private reset() {
       this.failures = 0;
       this.state = 'closed';
     }
   }
   ```

## Graceful Shutdown Issues

### Incomplete Shutdowns

#### Symptoms
- Process hanging during shutdown
- Sessions not properly checkpointed
- Resources not cleaned up

#### Solutions

1. **Add Shutdown Timeout**
   ```typescript
   const shutdownWithTimeout = async (timeout = 30000) => {
     const shutdownPromise = gracefulShutdown.shutdown();
     const timeoutPromise = new Promise((_, reject) => {
       setTimeout(() => reject(new Error('Shutdown timeout')), timeout);
     });

     try {
       await Promise.race([shutdownPromise, timeoutPromise]);
     } catch (error) {
       console.error('Shutdown failed:', error);
       process.exit(1);
     }
   };
   ```

2. **Force Cleanup After Timeout**
   ```typescript
   const forceCleanup = async () => {
     // Force close all connections
     await Promise.allSettled([
       redis.quit(),
       sessionStore.close(),
       sessionManager.close(),
     ]);

     // Exit process
     process.exit(0);
   };
   ```

3. **Track Shutdown Progress**
   ```typescript
   const trackShutdown = () => {
     gracefulShutdown.on('shutdown:phase', ({ phase }) => {
       console.log(`Shutdown phase: ${phase}`);
     });

     gracefulShutdown.on('shutdown:progress', ({ progress }) => {
       console.log('Shutdown progress:', progress);
     });

     gracefulShutdown.on('shutdown:error', ({ component, error }) => {
       console.error(`Shutdown error in ${component}:`, error);
     });
   };
   ```

## Configuration Problems

### Invalid Configuration

#### Symptoms
- Application failing to start
- Configuration validation errors
- Runtime configuration issues

#### Solutions

1. **Use Environment-Specific Validation**
   ```typescript
   const validateEnvironment = async () => {
     const env = process.env.NODE_ENV || 'development';
     const validation = await configValidator.validateEnvironment(env);

     if (env === 'production') {
       const prodValidation = await configValidator.validateProductionReadiness(config);
       if (!prodValidation.valid) {
         throw new Error('Configuration not production-ready');
       }
     }
   };
   ```

2. **Implement Configuration Hot-Reload**
   ```typescript
   const watchConfig = () => {
     const configFile = path.join(__dirname, 'config.json');

     fs.watchFile(configFile, async () => {
       try {
         const newConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
         const validation = await configValidator.validateConfig(newConfig);

         if (validation.valid) {
           await updateConfiguration(newConfig);
           console.log('Configuration updated');
         } else {
           console.error('Invalid configuration:', validation.errors);
         }
       } catch (error) {
         console.error('Configuration reload failed:', error);
       }
     });
   };
   ```

## Monitoring and Debugging

### Debug Logging

```typescript
// Enable debug logging
const debug = require('debug');
const sessionDebug = debug('session:manager');
const redisDebug = debug('session:redis');
const eventsDebug = debug('session:events');

// Use throughout application
sessionDebug('Creating session for agent %s', agentId);
redisDebug('Redis operation: %s', operation);
eventsDebug('Event emitted: %o', event);
```

### Performance Profiling

```typescript
// Profile function execution
const profile = (name) => {
  const start = process.hrtime.bigint();

  return {
    end: () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Usage
const timer = profile('session-creation');
await sessionManager.createSession(agentId);
timer.end();
```

### Metrics Collection

```typescript
// Collect and export metrics
const metrics = {
  sessionCreations: 0,
  sessionDeletions: 0,
  eventsEmitted: 0,
  errors: 0,
};

const incrementMetric = (metric) => {
  metrics[metric]++;
};

// Export metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

### Redis Monitoring

```bash
# Monitor Redis in real-time
redis-cli MONITOR

# Check Redis statistics
redis-cli INFO

# Monitor specific keys
redis-cli --scan --pattern session:*

# Check slow queries
redis-cli SLOWLOG GET 10
```

## Common Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `ECONNREFUSED` | Redis connection refused | Check Redis server status and network |
| `NOAUTH` | Authentication required | Configure Redis password |
| `READONLY` | Redis in read-only mode | Check Redis configuration and replication |
| `OOM` | Out of memory | Increase memory or optimize data usage |
| `TIMEOUT` | Operation timeout | Increase timeout values or optimize queries |
| `CROSSSLOT` | Keys not in same slot | Use hashtags for Redis Cluster |
| `MOVED` | Key moved in cluster | Handle cluster redirections |
| `LOADING` | Redis loading dataset | Wait for Redis to finish loading |

## Emergency Procedures

### Data Recovery

1. **Session Recovery from Backup**
   ```bash
   # Restore from Redis backup
   redis-cli --rdb /path/to/backup.rdb

   # Or restore from AOF
   redis-cli --eval restore-aof.lua
   ```

2. **Manual Session Reconstruction**
   ```typescript
   const reconstructSession = async (sessionId) => {
     // Gather all available data
     const backupData = await redis.get(`backup:session:${sessionId}`);
     const events = await redis.zRange(`events:${sessionId}`, 0, -1);

     // Rebuild session from events
     const session = rebuildFromEvents(events);

     // Restore session
     await sessionStore.createSession(sessionId, session.agentIds[0], {
       restoreData: session,
     });
   };
   ```

### Emergency Shutdown

```bash
# Emergency Redis shutdown
redis-cli SHUTDOWN NOSAVE

# Force kill if necessary
pkill -f redis-server

# Emergency application shutdown
pkill -f node
```

### Disaster Recovery

1. **Failover to Backup Instance**
   ```typescript
   const failoverToBackup = async () => {
     // Switch Redis endpoint
     process.env.REDIS_HOST = 'backup-redis.example.com';

     // Reinitialize connections
     await redis.quit();
     redis = createClient(newConfig);
     await redis.connect();

     // Resume operations
     await sessionManager.initialize();
   };
   ```

2. **Data Migration to New Instance**
   ```bash
   # Migrate data using Redis replication
   redis-cli --rdb-only --save dump.rdb

   # Transfer to new instance
   scp dump.rdb new-server:/var/lib/redis/

   # Restart Redis on new server
   systemctl restart redis
   ```

## Getting Help

### Log Analysis

Always include these logs when seeking help:

```bash
# Application logs
tail -f /var/log/app/session-manager.log

# Redis logs
tail -f /var/log/redis/redis-server.log

# System logs
tail -f /var/log/syslog | grep redis
```

### Diagnostic Information

Gather this information for support:

```typescript
const gatherDiagnostics = async () => {
  return {
    nodeVersion: process.version,
    redisVersion: await redis.info('server'),
    memoryUsage: process.memoryUsage(),
    configuration: sanitizeConfig(config),
    healthStatus: await healthCheck.getHealthStatus(),
    recentErrors: getRecentErrors(),
  };
};
```

### Contact Information

- Create GitHub issues with diagnostic information
- Include logs, configuration (sanitized), and steps to reproduce
- Specify environment details and version numbers