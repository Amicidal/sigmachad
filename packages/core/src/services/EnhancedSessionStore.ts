// TODO(2025-09-30.35): Migrate dynamic session key access to typed Maps.
/**
 * Enhanced Session Store with Performance Optimizations
 *
 * High-performance Redis session store with connection pooling,
 * pipelining, lazy loading, and advanced caching strategies
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  SessionError,
  SessionNotFoundError,
  ISessionStore,
  SessionStats,
  EnhancedSessionConfig,
  BatchOperation,
  CacheEntry,
  SessionStorePerformanceMetrics as PerformanceMetrics,
} from '@memento/shared-types';
import { RedisConnectionPool, PoolConfig } from './RedisConnectionPool.js';

export class EnhancedSessionStore
  extends EventEmitter
  implements ISessionStore
{
  private connectionPool: RedisConnectionPool;
  private config: EnhancedSessionConfig;
  private localCache = new Map<string, CacheEntry>();
  private pendingOperations: BatchOperation[] = [];
  private pipelineTimer?: NodeJS.Timeout;
  private cacheCleanupTimer?: NodeJS.Timeout;
  private metrics: PerformanceMetrics;

  constructor(config: EnhancedSessionConfig) {
    super();
    this.config = {
      ...config,
    };
    // Set defaults for properties not provided in config
    this.config.enableLazyLoading ??= true;
    this.config.enableCompression ??= false;
    this.config.enableLocalCache ??= true;
    this.config.localCacheSize ??= 1000;
    this.config.localCacheTTL ??= 30000; // 30 seconds
    this.config.batchSize ??= 50;
    this.config.pipelineTimeout ??= 100; // 100ms
    // Force enable pipelining for performance
    this.config.enablePipelining = true;

    this.connectionPool = new RedisConnectionPool(config.redis, config.pool);
    this.metrics = {
      totalOperations: 0,
      averageLatency: 0,
      cacheHitRate: 0,
      pipelineOperations: 0,
      compressionRatio: 1,
      connectionPoolStats: {},
    };

    this.initializeTimers();
  }

  /**
   * Create a new session with optimized operations
   */
  async createSession(
    sessionId: string,
    agentId: string,
    options: SessionCreationOptions = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'create',
          sessionId,
          data: { agentId, options },
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.createSessionDirect(sessionId, agentId, options);
      }

      this.updateMetrics('create', Date.now() - startTime);
      this.emit('session:created', { sessionId, agentId, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get session with caching and lazy loading
   */
  async getSession(sessionId: string): Promise<SessionDocument | null> {
    const startTime = Date.now();

    try {
      // Check local cache first
      if (this.config.enableLocalCache) {
        const cached = this.getFromCache(sessionId);
        if (cached) {
          this.updateMetrics('get', Date.now() - startTime, true);
          return cached;
        }
      }

      // Load from Redis
      const session = await this.loadSessionFromRedis(sessionId);

      // Cache the result
      if (session && this.config.enableLocalCache) {
        this.addToCache(sessionId, session);
      }

      this.updateMetrics('get', Date.now() - startTime, false);
      return session;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Update session with batching
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionDocument>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'update',
          sessionId,
          data: updates,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.updateSessionDirect(sessionId, updates);
      }

      // Invalidate cache
      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('update', Date.now() - startTime);
      this.emit('session:updated', { sessionId, updates });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Delete session with cleanup
   */
  async deleteSession(sessionId: string): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'delete',
          sessionId,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.deleteSessionDirect(sessionId);
      }

      // Remove from cache
      if (this.config.enableLocalCache) {
        this.localCache.delete(sessionId);
      }

      this.updateMetrics('delete', Date.now() - startTime);
      this.emit('session:deleted', { sessionId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add event with batching optimization
   */
  async addEvent(sessionId: string, event: SessionEvent): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'addEvent',
          sessionId,
          data: event,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.addEventDirect(sessionId, event);
      }

      // Invalidate cache to force reload
      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('addEvent', Date.now() - startTime);
      this.emit('event:added', { sessionId, event });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get events with lazy loading
   */
  async getEvents(
    sessionId: string,
    fromSeq?: number,
    toSeq?: number
  ): Promise<SessionEvent[]> {
    const startTime = Date.now();

    try {
      const events = await this.connectionPool.execute(async (client) => {
        const eventsKey = this.getEventsKey(sessionId);

        let eventData;
        if (fromSeq !== undefined && toSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, fromSeq, toSeq);
        } else if (fromSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, fromSeq, '+inf');
        } else if (toSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, '-inf', toSeq);
        } else {
          eventData = await client.zRange(eventsKey, 0, -1);
        }

        return eventData
          .filter((event) => event !== 'INIT')
          .map((eventStr) => this.deserializeData(eventStr))
          .sort((a, b) => a.seq - b.seq);
      }, 'read');

      this.updateMetrics('getEvents', Date.now() - startTime);
      return events;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get recent events with optimized loading
   */
  async getRecentEvents(
    sessionId: string,
    limit: number = 20
  ): Promise<SessionEvent[]> {
    const startTime = Date.now();

    try {
      const events = await this.connectionPool.execute(async (client) => {
        const eventsKey = this.getEventsKey(sessionId);
        const eventData = await client.zRange(eventsKey, -limit, -1);

        return eventData
          .filter((event) => event !== 'INIT')
          .map((eventStr) => this.deserializeData(eventStr))
          .sort((a, b) => a.seq - b.seq);
      }, 'read');

      this.updateMetrics('getRecentEvents', Date.now() - startTime);
      return events;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add agent to session
   */
  async addAgent(sessionId: string, agentId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const sessionData = await client.hGetAll(sessionKey);

        if (!sessionData.agentIds) {
          throw new SessionNotFoundError(sessionId);
        }

        const agents = new Set(JSON.parse(sessionData.agentIds));
        agents.add(agentId);

        await client.hSet(
          sessionKey,
          'agentIds',
          JSON.stringify(Array.from(agents))
        );
      }, 'write');

      // Invalidate cache
      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('addAgent', Date.now() - startTime);
      this.emit('agent:added', { sessionId, agentId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove agent from session
   */
  async removeAgent(sessionId: string, agentId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const sessionData = await client.hGetAll(sessionKey);

        if (!sessionData.agentIds) {
          throw new SessionNotFoundError(sessionId);
        }

        const agents = new Set(JSON.parse(sessionData.agentIds));
        agents.delete(agentId);

        if (agents.size === 0) {
          await this.setTTL(sessionId, 300); // 5 minutes grace period
        } else {
          await client.hSet(
            sessionKey,
            'agentIds',
            JSON.stringify(Array.from(agents))
          );
        }
      }, 'write');

      // Invalidate cache
      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('removeAgent', Date.now() - startTime);
      this.emit('agent:removed', { sessionId, agentId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set TTL for session
   */
  async setTTL(sessionId: string, ttl: number): Promise<void> {
    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const eventsKey = this.getEventsKey(sessionId);

        await Promise.all([
          client.expire(sessionKey, ttl),
          client.expire(eventsKey, ttl),
        ]);
      }, 'write');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if session exists
   */
  async exists(sessionId: string): Promise<boolean> {
    try {
      return await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        return (await client.exists(sessionKey)) === 1;
      }, 'read');
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      connectionPoolStats: this.connectionPool.getStats(),
    };
  }

  /**
   * Bulk operations with pipelining
   */
  async bulkOperation(operations: BatchOperation[]): Promise<void> {
    const startTime = Date.now();

    try {
      // Group operations by type for optimal processing
      const grouped = this.groupOperationsByType(operations);

      await this.connectionPool.execute(async (client) => {
        // Process each group of operations
        for (const [type, ops] of Array.from(grouped.entries())) {
          await this.processBulkOperationType(client, type, ops);
        }
      }, 'write');

      this.metrics.pipelineOperations += operations.length;
      this.updateMetrics('bulk', Date.now() - startTime);
      this.emit('bulk:completed', { operationCount: operations.length });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Flush pending operations
   */
  async flush(): Promise<void> {
    if (this.pendingOperations.length > 0) {
      await this.processBatch();
    }
  }

  // Private methods

  /**
   * Create session directly (non-batched)
   */
  private async createSessionDirect(
    sessionId: string,
    agentId: string,
    options: SessionCreationOptions
  ): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);
      const ttl = options.ttl || 3600;

      const exists = await client.exists(sessionKey);
      if (exists) {
        throw new SessionError(
          `Session already exists: ${sessionId}`,
          'SESSION_EXISTS',
          sessionId
        );
      }

      const sessionData = {
        agentIds: JSON.stringify([agentId]),
        state: 'working',
        events: '0',
        metadata: options.metadata
          ? this.serializeData(options.metadata)
          : undefined,
      };

      const redisData = Object.fromEntries(
        (Object.entries(sessionData) as Array<[
          string,
          string | number | undefined
        ]>)
          .filter(([, value]) => value !== undefined)
          .map(([k, v]) => [k, v as string | number])
      );

      await client.hSet(sessionKey, redisData as Record<string, string | number>);
      await client.expire(sessionKey, ttl);
      await client.zAdd(eventsKey, { score: 0, value: 'INIT' });
      await client.expire(eventsKey, ttl);

      if (options.initialEntityIds?.length) {
        const initialEvent: SessionEvent = {
          seq: 1,
          type: 'start',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'session',
            entityIds: options.initialEntityIds,
            operation: 'init',
          },
          actor: agentId,
        };
        await this.addEventDirect(sessionId, initialEvent);
      }
    }, 'write');
  }

  /**
   * Update session directly (non-batched)
   */
  private async updateSessionDirect(
    sessionId: string,
    updates: Partial<SessionDocument>
  ): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await client.exists(sessionKey);

      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }

      const updateEntries: Array<[string, string]> = [];
      if (updates.agentIds) {
        updateEntries.push(['agentIds', JSON.stringify(updates.agentIds)]);
      }
      if (updates.state) {
        updateEntries.push(['state', updates.state]);
      }
      if (updates.metadata) {
        updateEntries.push(['metadata', this.serializeData(updates.metadata)]);
      }

      if (updateEntries.length > 0) {
        await client.hSet(
          sessionKey,
          Object.fromEntries(updateEntries) as Record<string, string>
        );
      }
    }, 'write');
  }

  /**
   * Delete session directly (non-batched)
   */
  private async deleteSessionDirect(sessionId: string): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);

      await Promise.all([client.del(sessionKey), client.del(eventsKey)]);
    }, 'write');
  }

  /**
   * Add event directly (non-batched)
   */
  private async addEventDirect(
    sessionId: string,
    event: SessionEvent
  ): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const eventsKey = this.getEventsKey(sessionId);
      const sessionKey = this.getSessionKey(sessionId);

      const exists = await client.exists(sessionKey);
      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }

      const eventJson = this.serializeData(event);
      await client.zAdd(eventsKey, { score: event.seq, value: eventJson });

      if (event.stateTransition?.to) {
        await client.hSet(sessionKey, 'state', event.stateTransition.to);
      }
    }, 'write');
  }

  /**
   * Load session from Redis
   */
  private async loadSessionFromRedis(
    sessionId: string
  ): Promise<SessionDocument | null> {
    return await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await client.exists(sessionKey);

      if (!exists) return null;

      const sessionData = await client.hGetAll(sessionKey);
      if (!sessionData || Object.keys(sessionData).length === 0) {
        return null;
      }

      let events: SessionEvent[] = [];
      if (!this.config.enableLazyLoading) {
        events = await this.getRecentEvents(sessionId, 50);
      }

      return {
        sessionId,
        agentIds: JSON.parse(sessionData.agentIds || '[]'),
        state: sessionData.state as any,
        events,
        metadata: sessionData.metadata
          ? this.deserializeData(sessionData.metadata)
          : undefined,
      };
    }, 'read');
  }

  /**
   * Add operation to batch
   */
  private addToBatch(operation: BatchOperation): void {
    this.pendingOperations.push(operation);
  }

  /**
   * Process batch if needed
   */
  private async processBatchIfNeeded(): Promise<void> {
    if (this.pendingOperations.length >= this.config.batchSize) {
      await this.processBatch();
    }
  }

  /**
   * Process pending batch operations
   */
  private async processBatch(): Promise<void> {
    if (this.pendingOperations.length === 0) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    await this.bulkOperation(operations);
  }

  /**
   * Group operations by type
   */
  private groupOperationsByType(
    operations: BatchOperation[]
  ): Map<string, BatchOperation[]> {
    const grouped = new Map<string, BatchOperation[]>();

    for (const op of operations) {
      if (!grouped.has(op.type)) {
        grouped.set(op.type, []);
      }
      grouped.get(op.type)!.push(op);
    }

    return grouped;
  }

  /**
   * Process bulk operations of a specific type
   */
  private async processBulkOperationType(
    client: RedisClientType,
    type: string,
    operations: BatchOperation[]
  ): Promise<void> {
    switch (type) {
      case 'create':
        for (const op of operations) {
          await this.createSessionDirect(
            op.sessionId,
            op.data.agentId,
            op.data.options
          );
        }
        break;

      case 'update':
        for (const op of operations) {
          await this.updateSessionDirect(op.sessionId, op.data);
        }
        break;

      case 'delete': {
        const deletePromises = operations.map((op) =>
          Promise.all([
            client.del(this.getSessionKey(op.sessionId)),
            client.del(this.getEventsKey(op.sessionId)),
          ])
        );
        await Promise.all(deletePromises);
        break;
      }

      case 'addEvent':
        for (const op of operations) {
          await this.addEventDirect(op.sessionId, op.data);
        }
        break;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(sessionId: string): SessionDocument | null {
    const entry = this.localCache.get(sessionId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.localCache.delete(sessionId);
      return null;
    }

    return entry.data;
  }

  private addToCache(sessionId: string, session: SessionDocument): void {
    if (this.localCache.size >= this.config.localCacheSize) {
      // Remove oldest entry
      const oldestKey = this.localCache.keys().next().value;
      if (oldestKey) {
        this.localCache.delete(oldestKey);
      }
    }

    this.localCache.set(sessionId, {
      data: session,
      timestamp: Date.now(),
      ttl: this.config.localCacheTTL,
    });
  }

  private invalidateCache(sessionId: string): void {
    this.localCache.delete(sessionId);
  }

  /**
   * Data serialization/deserialization
   */
  private serializeData(data: any): string {
    if (this.config.enableCompression) {
      // Implement compression here
      return JSON.stringify(data);
    }
    return JSON.stringify(data);
  }

  private deserializeData(data: string): any {
    if (this.config.enableCompression) {
      // Implement decompression here
      return JSON.parse(data);
    }
    return JSON.parse(data);
  }

  /**
   * Metrics management
   */
  private updateMetrics(
    operation: string,
    latency: number,
    cacheHit: boolean = false
  ): void {
    this.metrics.totalOperations++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalOperations - 1) +
        latency) /
      this.metrics.totalOperations;

    if (operation === 'get') {
      const currentCacheHits =
        this.metrics.cacheHitRate * (this.metrics.totalOperations - 1);
      this.metrics.cacheHitRate =
        (currentCacheHits + (cacheHit ? 1 : 0)) / this.metrics.totalOperations;
    }
  }

  /**
   * Key management
   */
  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getEventsKey(sessionId: string): string {
    return `events:${sessionId}`;
  }

  /**
   * Initialize timers
   */
  private initializeTimers(): void {
    if (this.config.enablePipelining) {
      this.pipelineTimer = setInterval(() => {
        this.processBatch().catch((error) => {
          this.emit('error', error);
        });
      }, this.config.pipelineTimeout);
    }

    if (this.config.enableLocalCache) {
      this.cacheCleanupTimer = setInterval(() => {
        this.cleanupCache();
      }, 60000); // Every minute
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.localCache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.localCache.delete(key);
      }
    }
  }

  /**
   * Shutdown the store
   */
  async shutdown(): Promise<void> {
    // Clear timers
    if (this.pipelineTimer) clearInterval(this.pipelineTimer);
    if (this.cacheCleanupTimer) clearInterval(this.cacheCleanupTimer);

    // Flush any pending operations
    await this.flush();

    // Shutdown connection pool
    await this.connectionPool.shutdown();

    this.emit('shutdown');
  }

  // Implement missing interface methods for compatibility

  async publishSessionUpdate(sessionId: string, message: any): Promise<void> {
    try {
      await this.connectionPool.execute(async (client) => {
        const channel = `session:${sessionId}`;
        await client.publish(channel, JSON.stringify(message));
      }, 'write');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async subscribeToSession(
    sessionId: string,
    _callback: (message: any) => void
  ): Promise<void> {
    // Implementation would depend on having a dedicated subscription client
    // This is a placeholder for the interface
    this.emit('subscription:not-implemented', { sessionId });
  }

  async getStats(): Promise<SessionStats> {
    const _poolStats = this.connectionPool.getStats();

    return {
      activeSessions: 0, // Would need to be calculated
      totalEvents: 0, // Would need to be calculated
      totalRelationships: 0, // Would need to be calculated
      totalChanges: 0, // Would need to be calculated
      averageEventsPerSession: 0,
      checkpointsCreated: 0,
      failureSnapshots: 0,
      agentsActive: 0,
      redisMemoryUsage: 0,
      byType: {},
      bySeverity: {},
    };
  }

  async listActiveSessions(): Promise<string[]> {
    try {
      return await this.connectionPool.execute(async (client) => {
        const keys = await client.keys('session:*');
        return keys.map((key) => key.replace('session:', ''));
      }, 'read');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // Implementation for cleanup logic
    this.emit('cleanup:completed', { sessions: 0 });
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      const poolStatus = this.connectionPool.getStatus();
      return {
        healthy: poolStatus.isHealthy,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async close(): Promise<void> {
    await this.shutdown();
  }
}
 
// TODO(2025-09-30.35): Migrate dynamic session key access to typed Maps.
