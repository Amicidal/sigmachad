---

## Metadata

- Scope: root
- Status: Draft
- Last Updated: 2025-09-27

## Prerequisites

- Access, roles, and environment assumptions.

## Steps

- Step 1
- Step 2
- Step 3

title: Redis Session Coordination - Performance Tuning Guide
category: guide
created: 2025-09-23
updated: 2025-09-23
status: draft
authors:
  - unknown
---

# Redis Session Coordination - Performance Tuning Guide

## Overview

This guide provides comprehensive performance optimization strategies for the Redis session coordination system, covering Redis configuration, application-level optimizations, monitoring, and capacity planning.

## Table of Contents

1. [Redis Performance Optimization](#redis-performance-optimization)
2. [Application-Level Optimizations](#application-level-optimizations)
3. [Network and Infrastructure](#network-and-infrastructure)
4. [Memory Management](#memory-management)
5. [Connection Pooling](#connection-pooling)
6. [Monitoring and Metrics](#monitoring-and-metrics)
7. [Scaling Strategies](#scaling-strategies)
8. [Capacity Planning](#capacity-planning)
9. [Performance Testing](#performance-testing)
10. [Troubleshooting Performance Issues](#troubleshooting-performance-issues)

## Redis Performance Optimization

### Redis Configuration Tuning

#### Essential Configuration Parameters

```conf
# redis.conf - Performance optimizations

# Memory settings
maxmemory 8gb
maxmemory-policy allkeys-lru

# Network settings
tcp-keepalive 60
tcp-backlog 511
timeout 0

# Persistence settings (production)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Performance settings
lazy-free-lazy-eviction yes
lazy-free-lazy-expire yes
lazy-free-lazy-server-del yes
replica-lazy-flush yes

# Connection settings
maxclients 10000

# Threading (Redis 6+)
io-threads 4
io-threads-do-reads yes

# Memory compression
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

#### Environment-Specific Configurations

```conf
# Development Environment
maxmemory 1gb
save ""  # Disable persistence for faster development
appendonly no

# Staging Environment
maxmemory 4gb
save 300 10
appendonly yes
appendfsync everysec

# Production Environment
maxmemory 16gb
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
# Enable clustering if needed
# cluster-enabled yes
# cluster-config-file nodes.conf
# cluster-node-timeout 15000
```

### Redis Memory Optimization

#### Memory-Efficient Data Structures

```typescript
// Optimize session data structure
class OptimizedSessionStore {
  // Use hashes for session metadata (memory efficient for small objects)
  async storeSessionMetadata(sessionId: string, metadata: any): Promise<void> {
    const key = `session:${sessionId}`;
    await redis.hMSet(key, {
      agentIds: JSON.stringify(metadata.agentIds),
      state: metadata.state,
      created: metadata.created,
      updated: Date.now().toString(),
    });
  }

  // Use sorted sets for events (efficient range operations)
  async storeEvent(sessionId: string, event: SessionEvent): Promise<void> {
    const key = `events:${sessionId}`;
    await redis.zAdd(key, {
      score: event.seq,
      value: JSON.stringify(event),
    });

    // Limit event history to prevent unbounded growth
    await redis.zRemRangeByRank(key, 0, -1001); // Keep last 1000 events
  }

  // Use sets for agent tracking
  async addAgent(sessionId: string, agentId: string): Promise<void> {
    await redis.sAdd(`agents:${sessionId}`, agentId);
  }

  // Use TTL for automatic cleanup
  async setSessionTTL(sessionId: string, ttl: number): Promise<void> {
    const keys = [`session:${sessionId}`, `events:${sessionId}`, `agents:${sessionId}`];
    const pipeline = redis.multi();

    keys.forEach(key => pipeline.expire(key, ttl));
    await pipeline.exec();
  }
}
```

#### Memory Usage Monitoring

```typescript
class RedisMemoryMonitor {
  async getMemoryStats(): Promise<{
    used: number;
    peak: number;
    available: number;
    fragmentation: number;
  }> {
    const info = await redis.info('memory');
    const stats = this.parseRedisInfo(info);

    return {
      used: parseInt(stats.used_memory),
      peak: parseInt(stats.used_memory_peak),
      available: parseInt(stats.maxmemory) - parseInt(stats.used_memory),
      fragmentation: parseFloat(stats.mem_fragmentation_ratio),
    };
  }

  async optimizeMemory(): Promise<void> {
    const stats = await this.getMemoryStats();

    // Check fragmentation
    if (stats.fragmentation > 1.5) {
      console.warn('High memory fragmentation detected:', stats.fragmentation);
      // Consider MEMORY PURGE command (Redis 4.0+)
      try {
        await redis.memory('PURGE');
      } catch (error) {
        console.log('Memory purge not available');
      }
    }

    // Check memory usage
    if (stats.available < stats.used * 0.2) { // Less than 20% available
      console.warn('Low memory available, consider cleanup');
      await this.performMemoryCleanup();
    }
  }

  private async performMemoryCleanup(): Promise<void> {
    // Find and clean expired sessions
    const expiredSessions = await this.findExpiredSessions();
    for (const sessionId of expiredSessions) {
      await this.cleanupSession(sessionId);
    }

    // Compact event histories
    await this.compactEventHistories();
  }
}
```

### Redis Clustering and High Availability

#### Redis Cluster Setup

```conf
# Redis Cluster Configuration
cluster-enabled yes
cluster-config-file nodes-6379.conf
cluster-node-timeout 15000
cluster-announce-ip 192.168.1.100
cluster-announce-port 6379
cluster-announce-bus-port 16379
```

```typescript
// Cluster-aware session management
class ClusterAwareSessionManager {
  private clusterClient: RedisClusterType;

  constructor(clusterNodes: Array<{ host: string; port: number }>) {
    this.clusterClient = createCluster({
      rootNodes: clusterNodes,
      defaults: {
        password: process.env.REDIS_PASSWORD,
      },
      useReplicas: true, // Read from replicas
    });
  }

  // Use hash tags to ensure related keys are on same node
  private getSessionKey(sessionId: string): string {
    return `{session:${sessionId}}:data`;
  }

  private getEventsKey(sessionId: string): string {
    return `{session:${sessionId}}:events`;
  }

  async createSession(sessionId: string, agentId: string): Promise<void> {
    const pipeline = this.clusterClient.multi();

    // All session-related keys use same hash tag
    pipeline.hSet(this.getSessionKey(sessionId), {
      agentIds: JSON.stringify([agentId]),
      state: 'working',
      created: Date.now().toString(),
    });

    pipeline.zAdd(this.getEventsKey(sessionId), {
      score: 0,
      value: 'INIT',
    });

    await pipeline.exec();
  }
}
```

## Application-Level Optimizations

### Connection Management

#### Optimal Connection Configuration

```typescript
class OptimizedRedisClient {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),

        // Connection optimization
        keepAlive: true,
        connectTimeout: 10000,
        commandTimeout: 5000,

        // Reconnection settings
        reconnectStrategy: (retries) => {
          if (retries > 10) return false; // Stop after 10 retries
          return Math.min(retries * 100, 3000); // Exponential backoff, max 3s
        },
      },

      // Connection pooling
      pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },

      // Performance settings
      lazyConnect: true,
      enableAutoPipelining: true,
    });
  }

  async initialize(): Promise<void> {
    // Set up event handlers for monitoring
    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('ready', () => {
      console.log('Redis ready');
    });

    this.client.on('error', (error) => {
      console.error('Redis error:', error);
    });

    this.client.on('reconnecting', () => {
      console.log('Redis reconnecting');
    });

    await this.client.connect();
  }
}
```

### Batching and Pipelining

#### Efficient Batch Operations

```typescript
class BatchOptimizedSessionManager {
  private pendingOperations = new Map<string, any[]>();
  private batchTimer?: NodeJS.Timeout;

  // Batch session updates
  async batchEmitEvent(sessionId: string, event: SessionEvent, actor: string): Promise<void> {
    if (!this.pendingOperations.has(sessionId)) {
      this.pendingOperations.set(sessionId, []);
    }

    this.pendingOperations.get(sessionId)!.push({ event, actor });

    // Schedule batch processing
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, 50); // 50ms batch window
    }
  }

  private async processBatch(): Promise<void> {
    const batch = new Map(this.pendingOperations);
    this.pendingOperations.clear();
    this.batchTimer = undefined;

    const pipeline = redis.multi();

    for (const [sessionId, operations] of batch) {
      for (const { event, actor } of operations) {
        // Add all operations to pipeline
        pipeline.hSet(`session:${sessionId}`, 'updated', Date.now().toString());
        pipeline.zAdd(`events:${sessionId}`, {
          score: event.seq,
          value: JSON.stringify(event),
        });
      }
    }

    await pipeline.exec();
  }

  // Efficient bulk session creation
  async createSessionsBulk(requests: Array<{ agentId: string; options?: any }>): Promise<string[]> {
    const pipeline = redis.multi();
    const sessionIds: string[] = [];

    for (const request of requests) {
      const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionIds.push(sessionId);

      pipeline.hSet(`session:${sessionId}`, {
        agentIds: JSON.stringify([request.agentId]),
        state: 'working',
        created: Date.now().toString(),
      });

      pipeline.expire(`session:${sessionId}`, request.options?.ttl || 3600);
    }

    await pipeline.exec();
    return sessionIds;
  }
}
```

### Caching Strategies

#### Multi-Level Caching

```typescript
class MultiLevelSessionCache {
  private l1Cache = new Map<string, any>(); // In-memory cache
  private l2Cache = new LRUCache<string, any>({ max: 10000 }); // LRU cache
  private redis: RedisClientType;

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    // L1 cache (fastest)
    if (this.l1Cache.has(sessionId)) {
      return this.l1Cache.get(sessionId);
    }

    // L2 cache (fast)
    if (this.l2Cache.has(sessionId)) {
      const session = this.l2Cache.get(sessionId);
      this.l1Cache.set(sessionId, session);
      return session;
    }

    // Redis (slower but persistent)
    const session = await this.getSessionFromRedis(sessionId);
    if (session) {
      this.l2Cache.set(sessionId, session);
      this.l1Cache.set(sessionId, session);
    }

    return session;
  }

  async updateSession(sessionId: string, updates: any): Promise<void> {
    // Update all cache levels
    const currentSession = await this.getSession(sessionId);
    if (currentSession) {
      const updatedSession = { ...currentSession, ...updates };

      // Update caches
      this.l1Cache.set(sessionId, updatedSession);
      this.l2Cache.set(sessionId, updatedSession);

      // Update Redis asynchronously
      setImmediate(() => {
        this.updateSessionInRedis(sessionId, updates);
      });
    }
  }

  // Cache invalidation on TTL
  private setupCacheInvalidation(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Every minute
  }

  private async cleanupExpiredSessions(): Promise<void> {
    for (const [sessionId] of this.l1Cache) {
      const ttl = await redis.ttl(`session:${sessionId}`);
      if (ttl <= 0) {
        this.l1Cache.delete(sessionId);
        this.l2Cache.delete(sessionId);
      }
    }
  }
}
```

## Network and Infrastructure

### Network Optimization

#### Connection Tuning

```typescript
// Optimized Redis client for high-throughput scenarios
const createOptimizedClient = () => {
  return createClient({
    socket: {
      // TCP tuning
      keepAlive: true,
      initialDelay: 0,

      // Buffer sizes
      noDelay: true, // Disable Nagle's algorithm

      // Timeouts
      connectTimeout: 5000,
      commandTimeout: 3000,

      // Connection pool optimization
      family: 4, // Force IPv4 for better performance in some environments
    },

    // Enable compression for large payloads
    compression: 'gzip',

    // Connection multiplexing
    enableAutoPipelining: true,
    maximumAutoPipelineLength: 1000,
  });
};
```

#### Load Balancing

```typescript
class LoadBalancedRedisCluster {
  private nodes: RedisClientType[] = [];
  private currentIndex = 0;

  constructor(nodeConfigs: Array<{ host: string; port: number }>) {
    this.nodes = nodeConfigs.map(config => createClient({
      socket: { host: config.host, port: config.port },
    }));
  }

  // Round-robin load balancing for read operations
  getReadClient(): RedisClientType {
    const client = this.nodes[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.nodes.length;
    return client;
  }

  // Use master for write operations
  getWriteClient(): RedisClientType {
    return this.nodes[0]; // Assume first node is master
  }

  // Intelligent routing based on operation type
  async executeOperation<T>(
    operation: 'read' | 'write',
    command: (client: RedisClientType) => Promise<T>
  ): Promise<T> {
    const client = operation === 'read' ? this.getReadClient() : this.getWriteClient();

    try {
      return await command(client);
    } catch (error) {
      // Fallback to master on read failure
      if (operation === 'read') {
        return await command(this.getWriteClient());
      }
      throw error;
    }
  }
}
```

### Infrastructure Optimization

#### Redis Deployment Patterns

```yaml
# Docker Compose for optimized Redis deployment
version: '3.8'

services:
  redis-master:
    image: redis:7-alpine
    command: >
      redis-server
      --maxmemory 8gb
      --maxmemory-policy allkeys-lru
      --tcp-keepalive 60
      --tcp-backlog 511
      --save 900 1
      --save 300 10
      --save 60 10000
      --appendonly yes
      --appendfsync everysec
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - redis-net

  redis-replica:
    image: redis:7-alpine
    command: >
      redis-server
      --replicaof redis-master 6379
      --replica-read-only yes
      --tcp-keepalive 60
    depends_on:
      - redis-master
    networks:
      - redis-net
    deploy:
      replicas: 2

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel.conf:/etc/redis/sentinel.conf
    networks:
      - redis-net
    deploy:
      replicas: 3

volumes:
  redis-data:

networks:
  redis-net:
    driver: bridge
```

## Memory Management

### Session Data Optimization

#### Efficient Data Serialization

```typescript
class EfficientSessionSerializer {
  // Use MessagePack for better compression than JSON
  private msgpack = require('msgpack-lite');

  serialize(data: any): Buffer {
    return this.msgpack.encode(data);
  }

  deserialize(buffer: Buffer): any {
    return this.msgpack.decode(buffer);
  }

  // Optimize event serialization
  serializeEvent(event: SessionEvent): string {
    // Only store essential fields
    const minimal = {
      t: event.type,
      s: event.seq,
      ts: event.timestamp,
      a: event.actor,
      c: {
        e: event.changeInfo.elementType,
        i: event.changeInfo.entityIds,
        o: event.changeInfo.operation,
      },
      // Optional fields
      ...(event.impact && { imp: event.impact }),
      ...(event.stateTransition && { st: event.stateTransition }),
    };

    return JSON.stringify(minimal);
  }

  deserializeEvent(data: string): SessionEvent {
    const minimal = JSON.parse(data);

    return {
      type: minimal.t,
      seq: minimal.s,
      timestamp: minimal.ts,
      actor: minimal.a,
      changeInfo: {
        elementType: minimal.c.e,
        entityIds: minimal.c.i,
        operation: minimal.c.o,
      },
      ...(minimal.imp && { impact: minimal.imp }),
      ...(minimal.st && { stateTransition: minimal.st }),
    };
  }
}
```

#### Memory-Efficient Data Structures

```typescript
class CompactSessionStore {
  // Use bit fields for boolean flags
  private encodeSessionFlags(session: SessionDocument): number {
    let flags = 0;
    if (session.state === 'broken') flags |= 1;
    if (session.state === 'working') flags |= 2;
    if (session.state === 'completed') flags |= 4;
    return flags;
  }

  private decodeSessionFlags(flags: number): string {
    if (flags & 1) return 'broken';
    if (flags & 2) return 'working';
    if (flags & 4) return 'completed';
    return 'unknown';
  }

  // Use compact string representation for agent IDs
  private encodeAgentIds(agentIds: string[]): string {
    return agentIds.join(',');
  }

  private decodeAgentIds(encoded: string): string[] {
    return encoded ? encoded.split(',') : [];
  }

  // Store session in compact format
  async storeSessionCompact(sessionId: string, session: SessionDocument): Promise<void> {
    const compact = {
      a: this.encodeAgentIds(session.agentIds),
      s: this.encodeSessionFlags(session),
      c: Date.now(),
      e: session.events.length,
    };

    await redis.hMSet(`session:${sessionId}`, compact);
  }
}
```

### Garbage Collection Optimization

#### Node.js GC Tuning

```bash
# Production Node.js flags for optimal GC
NODE_OPTIONS="--max-old-space-size=4096 --gc-interval=100 --expose-gc"

# Or in package.json
{
  "scripts": {
    "start:prod": "node --max-old-space-size=4096 --gc-interval=100 dist/index.js"
  }
}
```

```typescript
// Memory monitoring and GC triggering
class MemoryManager {
  private gcThreshold = 1024 * 1024 * 1024; // 1GB

  startMemoryMonitoring(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();

      if (memUsage.heapUsed > this.gcThreshold) {
        console.log('Triggering GC due to high memory usage');
        if (global.gc) {
          global.gc();
        }
      }

      // Log memory stats
      console.log('Memory usage:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      });
    }, 30000); // Every 30 seconds
  }

  // Clean up old data periodically
  startDataCleanup(): void {
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 300000); // Every 5 minutes
  }

  private async cleanupExpiredData(): Promise<void> {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    // Find and remove old session data
    const pattern = 'session:*';
    const keys = await redis.keys(pattern);

    for (const key of keys) {
      const created = await redis.hGet(key, 'created');
      if (created && parseInt(created) < cutoff) {
        await redis.del(key);
      }
    }
  }
}
```

## Connection Pooling

### Advanced Connection Pool Configuration

```typescript
class AdvancedConnectionPool {
  private pools = new Map<string, any>();

  createPool(name: string, config: any) {
    const pool = createPool({
      create: async () => {
        const client = createClient(config);
        await client.connect();
        return client;
      },

      destroy: async (client) => {
        await client.quit();
      },

      validate: async (client) => {
        try {
          await client.ping();
          return true;
        } catch {
          return false;
        }
      },

      // Pool configuration
      min: 2,                 // Minimum connections
      max: 20,                // Maximum connections
      acquireTimeoutMillis: 30000,  // Timeout for acquiring connection
      createTimeoutMillis: 30000,   // Timeout for creating connection
      destroyTimeoutMillis: 5000,   // Timeout for destroying connection
      idleTimeoutMillis: 30000,     // Idle timeout
      reapIntervalMillis: 1000,     // Cleanup interval

      // Advanced options
      autostart: true,
      evictionRunIntervalMillis: 1000,
      numTestsPerEvictionRun: 3,
      softIdleTimeoutMillis: 5000,
      testOnBorrow: true,
      testOnReturn: false,
      testWhileIdle: true,
    });

    this.pools.set(name, pool);
    return pool;
  }

  async executeWithPool<T>(
    poolName: string,
    operation: (client: RedisClientType) => Promise<T>
  ): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const client = await pool.acquire();
    try {
      return await operation(client);
    } finally {
      pool.release(client);
    }
  }

  // Monitor pool health
  getPoolStats(poolName: string) {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    return {
      size: pool.size,
      available: pool.available,
      borrowed: pool.borrowed,
      pending: pool.pending,
      max: pool.max,
      min: pool.min,
    };
  }
}
```

## Monitoring and Metrics

### Performance Metrics Collection

```typescript
class PerformanceMetrics {
  private metrics = {
    operations: new Map<string, number>(),
    latencies: new Map<string, number[]>(),
    errors: new Map<string, number>(),
  };

  recordOperation(operation: string, latency: number, success: boolean): void {
    // Count operations
    this.metrics.operations.set(
      operation,
      (this.metrics.operations.get(operation) || 0) + 1
    );

    // Record latency
    if (!this.metrics.latencies.has(operation)) {
      this.metrics.latencies.set(operation, []);
    }
    this.metrics.latencies.get(operation)!.push(latency);

    // Keep only last 1000 latencies
    const latencies = this.metrics.latencies.get(operation)!;
    if (latencies.length > 1000) {
      latencies.shift();
    }

    // Count errors
    if (!success) {
      this.metrics.errors.set(
        operation,
        (this.metrics.errors.get(operation) || 0) + 1
      );
    }
  }

  getMetrics() {
    const result: any = {
      operations: {},
      latencies: {},
      errors: {},
    };

    // Calculate operation stats
    for (const [op, count] of this.metrics.operations) {
      result.operations[op] = count;
    }

    // Calculate latency stats
    for (const [op, latencies] of this.metrics.latencies) {
      if (latencies.length > 0) {
        const sorted = [...latencies].sort((a, b) => a - b);
        result.latencies[op] = {
          avg: latencies.reduce((a, b) => a + b) / latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies),
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
        };
      }
    }

    // Error rates
    for (const [op, errors] of this.metrics.errors) {
      const total = this.metrics.operations.get(op) || 0;
      result.errors[op] = {
        count: errors,
        rate: total > 0 ? (errors / total) * 100 : 0,
      };
    }

    return result;
  }

  // Export metrics in Prometheus format
  exportPrometheus(): string {
    let output = '';

    for (const [op, count] of this.metrics.operations) {
      output += `redis_operations_total{operation="${op}"} ${count}\n`;
    }

    for (const [op, latencies] of this.metrics.latencies) {
      if (latencies.length > 0) {
        const avg = latencies.reduce((a, b) => a + b) / latencies.length;
        output += `redis_operation_duration_seconds{operation="${op}"} ${avg / 1000}\n`;
      }
    }

    return output;
  }
}
```

### Real-time Monitoring

```typescript
class RealTimeMonitor {
  private readonly metrics = new PerformanceMetrics();

  // Wrap Redis operations with monitoring
  wrapRedisClient(client: RedisClientType): RedisClientType {
    return new Proxy(client, {
      get: (target, prop) => {
        const original = target[prop as keyof typeof target];

        if (typeof original === 'function' && typeof prop === 'string') {
          return async (...args: any[]) => {
            const start = Date.now();
            let success = true;

            try {
              const result = await original.apply(target, args);
              return result;
            } catch (error) {
              success = false;
              throw error;
            } finally {
              const latency = Date.now() - start;
              this.metrics.recordOperation(prop, latency, success);
            }
          };
        }

        return original;
      },
    });
  }

  // Start monitoring dashboard
  startDashboard(port = 3001): void {
    const express = require('express');
    const app = express();

    app.get('/metrics', (req, res) => {
      res.type('text/plain');
      res.send(this.metrics.exportPrometheus());
    });

    app.get('/metrics/json', (req, res) => {
      res.json(this.metrics.getMetrics());
    });

    app.listen(port, () => {
      console.log(`Metrics dashboard available at http://localhost:${port}/metrics`);
    });
  }
}
```

## Scaling Strategies

### Horizontal Scaling

#### Redis Cluster Configuration

```typescript
class RedisClusterManager {
  private cluster: RedisClusterType;

  constructor(nodes: Array<{ host: string; port: number }>) {
    this.cluster = createCluster({
      rootNodes: nodes,
      defaults: {
        password: process.env.REDIS_PASSWORD,
      },
      useReplicas: true,
      enableReadyCheck: true,
      redisOptions: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 500,
        enableOfflineQueue: false,
      },
    });
  }

  // Distribute sessions across cluster nodes
  async createSessionDistributed(sessionId: string, data: any): Promise<void> {
    // Use hash tags to control key distribution
    const hashTag = this.getHashTag(sessionId);

    const pipeline = this.cluster.multi();
    pipeline.hSet(`{${hashTag}}:session:${sessionId}`, data);
    pipeline.zAdd(`{${hashTag}}:events:${sessionId}`, { score: 0, value: 'INIT' });

    await pipeline.exec();
  }

  private getHashTag(sessionId: string): string {
    // Distribute based on agent or session characteristics
    return sessionId.substring(0, 8); // Use first 8 chars as hash tag
  }

  // Monitor cluster health
  async getClusterHealth(): Promise<any> {
    const info = await this.cluster.cluster('INFO');
    const nodes = await this.cluster.cluster('NODES');

    return {
      state: this.parseClusterState(info),
      nodes: this.parseClusterNodes(nodes),
    };
  }
}
```

### Vertical Scaling

#### Memory and CPU Optimization

```typescript
class VerticalScaleOptimizer {
  // Optimize for high memory scenarios
  configureHighMemory(): any {
    return {
      redis: {
        maxmemory: '32gb',
        'maxmemory-policy': 'allkeys-lru',
        'maxmemory-samples': 10,
        'lazy-free-lazy-eviction': 'yes',
        'lazy-free-lazy-expire': 'yes',
      },
      node: {
        'max-old-space-size': 8192,
        'optimize-for-size': false,
      },
    };
  }

  // Optimize for high CPU scenarios
  configureHighCPU(): any {
    return {
      redis: {
        'io-threads': 8,
        'io-threads-do-reads': 'yes',
        'tcp-backlog': 2048,
      },
      node: {
        'max-workers': require('os').cpus().length,
      },
    };
  }

  // Dynamic configuration based on system resources
  async configureBasedOnResources(): Promise<any> {
    const totalMemory = require('os').totalmem();
    const cpuCount = require('os').cpus().length;

    const config: any = {};

    // Memory-based configuration
    if (totalMemory > 32 * 1024 * 1024 * 1024) { // 32GB+
      config.redis = this.configureHighMemory().redis;
    }

    // CPU-based configuration
    if (cpuCount > 8) {
      Object.assign(config.redis || {}, this.configureHighCPU().redis);
    }

    return config;
  }
}
```

## Capacity Planning

### Performance Modeling

```typescript
class CapacityPlanner {
  // Model session capacity based on hardware
  calculateSessionCapacity(hardware: {
    memory: number; // GB
    cpu: number;    // cores
    network: number; // Mbps
  }): {
    maxSessions: number;
    eventsPerSecond: number;
    recommendedLimits: any;
  } {
    // Memory-based calculation
    const avgSessionSize = 50 * 1024; // 50KB per session
    const memoryBasedSessions = (hardware.memory * 1024 * 1024 * 1024 * 0.7) / avgSessionSize;

    // CPU-based calculation
    const cpuBasedEvents = hardware.cpu * 1000; // 1000 events/sec per core

    // Network-based calculation
    const avgEventSize = 1024; // 1KB per event
    const networkBasedEvents = (hardware.network * 1024 * 1024 * 0.8) / avgEventSize;

    return {
      maxSessions: Math.floor(memoryBasedSessions),
      eventsPerSecond: Math.min(cpuBasedEvents, networkBasedEvents),
      recommendedLimits: {
        sessionTTL: this.calculateOptimalTTL(memoryBasedSessions),
        checkpointInterval: this.calculateOptimalCheckpointInterval(cpuBasedEvents),
        maxEventsPerSession: this.calculateMaxEventsPerSession(avgSessionSize),
      },
    };
  }

  // Load testing for capacity validation
  async validateCapacity(targetSessions: number, targetEventsPerSecond: number): Promise<boolean> {
    console.log(`Validating capacity: ${targetSessions} sessions, ${targetEventsPerSecond} events/sec`);

    const loadTest = new LoadTestRunner();
    const results = await loadTest.run({
      sessions: targetSessions,
      eventsPerSecond: targetEventsPerSecond,
      duration: 300000, // 5 minutes
    });

    return results.success && results.errorRate < 1;
  }

  private calculateOptimalTTL(maxSessions: number): number {
    // Longer TTL for higher capacity systems
    return Math.min(maxSessions / 100, 3600); // Max 1 hour
  }

  private calculateOptimalCheckpointInterval(eventsPerSecond: number): number {
    // More frequent checkpoints for high-throughput systems
    return Math.max(Math.floor(1000 / eventsPerSecond), 5);
  }

  private calculateMaxEventsPerSession(sessionSize: number): number {
    // Limit events to keep session size reasonable
    return Math.floor(1024 * 1024 / sessionSize); // 1MB per session max
  }
}
```

### Resource Monitoring

```typescript
class ResourceMonitor {
  async getCurrentUsage(): Promise<{
    cpu: number;
    memory: number;
    network: number;
    redis: any;
  }> {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const redisInfo = await redis.info();

    return {
      cpu: this.calculateCPUPercentage(cpuUsage),
      memory: memUsage.heapUsed / (1024 * 1024), // MB
      network: await this.getNetworkUsage(),
      redis: this.parseRedisInfo(redisInfo),
    };
  }

  // Predictive scaling
  async predictResourceNeeds(currentLoad: number, projectedGrowth: number): Promise<{
    recommendedResources: any;
    scaleUpTrigger: number;
    estimatedCapacity: number;
  }> {
    const current = await this.getCurrentUsage();
    const futureLoad = currentLoad * (1 + projectedGrowth);

    const memoryNeeded = (current.memory / currentLoad) * futureLoad * 1.2; // 20% buffer
    const cpuNeeded = (current.cpu / currentLoad) * futureLoad * 1.1; // 10% buffer

    return {
      recommendedResources: {
        memory: Math.ceil(memoryNeeded / 1024), // GB
        cpu: Math.ceil(cpuNeeded / 100), // cores
      },
      scaleUpTrigger: currentLoad * 0.8, // Scale at 80% capacity
      estimatedCapacity: Math.floor(futureLoad),
    };
  }
}
```

## Performance Testing

### Comprehensive Benchmark Suite

```typescript
class PerformanceBenchmark {
  async runComprehensiveBenchmark(): Promise<void> {
    const tests = [
      () => this.benchmarkSessionCreation(),
      () => this.benchmarkEventEmission(),
      () => this.benchmarkSessionQueries(),
      () => this.benchmarkConcurrentAccess(),
      () => this.benchmarkMemoryUsage(),
      () => this.benchmarkNetworkLatency(),
    ];

    const results = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
      } catch (error) {
        console.error('Benchmark test failed:', error);
        results.push({ error: error.message });
      }
    }

    this.generateBenchmarkReport(results);
  }

  async benchmarkSessionCreation(): Promise<any> {
    const iterations = 10000;
    const batchSizes = [1, 10, 100, 1000];
    const results: any = {};

    for (const batchSize of batchSizes) {
      const batches = Math.ceil(iterations / batchSize);
      const startTime = Date.now();

      for (let i = 0; i < batches; i++) {
        const batch = Array.from({ length: Math.min(batchSize, iterations - i * batchSize) },
          (_, j) => ({ agentId: `bench-agent-${i}-${j}` })
        );

        await this.sessionManager.createSessionsBulk(batch);
      }

      const duration = Date.now() - startTime;
      const throughput = iterations / (duration / 1000);

      results[`batch_${batchSize}`] = {
        duration,
        throughput: Math.round(throughput),
        avgLatency: duration / iterations,
      };
    }

    return { test: 'session_creation', results };
  }

  async benchmarkConcurrentAccess(): Promise<any> {
    const concurrentUsers = [10, 50, 100, 200, 500];
    const results: any = {};

    for (const users of concurrentUsers) {
      const startTime = Date.now();
      const promises = Array.from({ length: users }, (_, i) =>
        this.simulateUser(`concurrent-user-${i}`, 10000) // 10 second simulation
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      results[`users_${users}`] = {
        duration,
        successRate: await this.calculateSuccessRate(),
        avgResponseTime: await this.getAverageResponseTime(),
      };
    }

    return { test: 'concurrent_access', results };
  }

  private async simulateUser(userId: string, duration: number): Promise<void> {
    const endTime = Date.now() + duration;
    let sessionId: string | null = null;

    while (Date.now() < endTime) {
      try {
        if (!sessionId) {
          sessionId = await this.sessionManager.createSession(userId);
        }

        // Simulate various operations
        const operation = Math.random();
        if (operation < 0.7) {
          // Emit event
          await this.sessionManager.emitEvent(sessionId, {
            type: 'modified',
            changeInfo: {
              elementType: 'function',
              entityIds: [`func-${Math.random().toString(36).substr(2, 9)}`],
              operation: 'modified',
            },
          }, userId);
        } else if (operation < 0.9) {
          // Query session
          await this.sessionManager.getSession(sessionId);
        } else {
          // Checkpoint
          await this.sessionManager.checkpoint(sessionId);
        }

        // Random delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      } catch (error) {
        // Log error but continue
        console.error(`User ${userId} error:`, error.message);
      }
    }
  }
}
```

## Troubleshooting Performance Issues

### Performance Diagnostic Tools

```typescript
class PerformanceDiagnostics {
  async diagnosePerformanceIssue(): Promise<{
    issue: string;
    cause: string;
    solutions: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[]> {
    const issues = [];

    // Check Redis performance
    const redisLatency = await this.checkRedisLatency();
    if (redisLatency > 100) {
      issues.push({
        issue: 'High Redis latency',
        cause: `Redis response time: ${redisLatency}ms`,
        solutions: [
          'Check Redis memory usage and eviction policy',
          'Optimize Redis configuration',
          'Consider Redis clustering',
          'Check network connectivity',
        ],
        priority: redisLatency > 500 ? 'critical' : 'high',
      });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 85) {
      issues.push({
        issue: 'High memory usage',
        cause: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        solutions: [
          'Implement more aggressive session cleanup',
          'Reduce session TTL',
          'Optimize data structures',
          'Increase memory limit',
        ],
        priority: memoryUsagePercent > 95 ? 'critical' : 'high',
      });
    }

    // Check connection pool
    const poolStats = await this.getConnectionPoolStats();
    if (poolStats.utilization > 90) {
      issues.push({
        issue: 'Connection pool exhaustion',
        cause: `Pool utilization: ${poolStats.utilization}%`,
        solutions: [
          'Increase connection pool size',
          'Optimize connection usage patterns',
          'Implement connection pooling',
          'Check for connection leaks',
        ],
        priority: 'high',
      });
    }

    return issues;
  }

  async generatePerformanceReport(): Promise<string> {
    const issues = await this.diagnosePerformanceIssue();
    const metrics = await this.getCurrentPerformanceMetrics();

    let report = '# Performance Diagnostic Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Current Metrics\n';
    report += `- CPU Usage: ${metrics.cpu}%\n`;
    report += `- Memory Usage: ${metrics.memory}MB\n`;
    report += `- Redis Latency: ${metrics.redisLatency}ms\n`;
    report += `- Active Sessions: ${metrics.activeSessions}\n`;
    report += `- Events/Second: ${metrics.eventsPerSecond}\n\n`;

    if (issues.length > 0) {
      report += '## Issues Detected\n\n';
      issues.forEach((issue, index) => {
        report += `### ${index + 1}. ${issue.issue} (${issue.priority})\n`;
        report += `**Cause:** ${issue.cause}\n\n`;
        report += '**Solutions:**\n';
        issue.solutions.forEach(solution => {
          report += `- ${solution}\n`;
        });
        report += '\n';
      });
    } else {
      report += '## No Issues Detected\n\nSystem performance is within normal parameters.\n';
    }

    return report;
  }
}
```

### Automated Performance Tuning

```typescript
class AutoPerformanceTuner {
  async autoTune(): Promise<void> {
    const metrics = await this.getCurrentMetrics();
    const recommendations = this.generateRecommendations(metrics);

    for (const recommendation of recommendations) {
      if (recommendation.autoApply) {
        await this.applyRecommendation(recommendation);
      } else {
        console.log(`Manual intervention required: ${recommendation.description}`);
      }
    }
  }

  private generateRecommendations(metrics: any): any[] {
    const recommendations = [];

    // Memory optimization
    if (metrics.memoryUsage > 80) {
      recommendations.push({
        type: 'memory',
        description: 'Reduce session TTL to decrease memory usage',
        autoApply: true,
        action: () => this.adjustSessionTTL(0.8), // Reduce by 20%
      });
    }

    // Connection pool optimization
    if (metrics.connectionPoolUtilization > 85) {
      recommendations.push({
        type: 'connections',
        description: 'Increase connection pool size',
        autoApply: true,
        action: () => this.adjustConnectionPool(1.2), // Increase by 20%
      });
    }

    // Checkpoint frequency optimization
    if (metrics.checkpointLatency > 1000) {
      recommendations.push({
        type: 'checkpoints',
        description: 'Reduce checkpoint frequency',
        autoApply: true,
        action: () => this.adjustCheckpointInterval(1.5), // Increase interval by 50%
      });
    }

    return recommendations;
  }

  private async applyRecommendation(recommendation: any): Promise<void> {
    try {
      await recommendation.action();
      console.log(`Applied recommendation: ${recommendation.description}`);
    } catch (error) {
      console.error(`Failed to apply recommendation: ${error.message}`);
    }
  }
}
```

This comprehensive performance tuning guide covers all aspects of optimizing the Redis session coordination system. The optimizations range from low-level Redis configuration to high-level application architecture, providing a complete toolkit for achieving optimal performance in production environments.