/**
 * Redis Connection Pool
 *
 * Provides high-performance Redis connection pooling with load balancing,
 * automatic failover, and connection health monitoring
 */

import { EventEmitter } from 'events';
import type { RedisClientType, RedisClientOptions } from 'redis';
import { RedisConfig } from './SessionTypes.js';

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number; // milliseconds
  idleTimeout: number; // milliseconds
  reapInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableHealthCheck: boolean;
  healthCheckInterval: number; // milliseconds
  enableLoadBalancing: boolean;
  preferWriteConnections: boolean;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
  failed: number;
  created: number;
  destroyed: number;
  acquisitionTime: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
}

export interface PooledConnection {
  id: string;
  client: RedisClientType;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  isHealthy: boolean;
  inUse: boolean;
  type: 'read' | 'write' | 'readwrite';
}

export interface AcquisitionRequest {
  id: string;
  timestamp: number;
  resolve: (connection: PooledConnection) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  preferredType?: 'read' | 'write';
}

export class RedisConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private redisConfig: RedisConfig;
  private connections = new Map<string, PooledConnection>();
  private availableConnections = new Set<string>();
  private acquireQueue: AcquisitionRequest[] = [];
  private stats: ConnectionStats;
  private healthCheckTimer?: NodeJS.Timeout;
  private reapTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(redisConfig: RedisConfig, poolConfig: Partial<PoolConfig> = {}) {
    super();
    this.redisConfig = redisConfig;
    this.config = {
      minConnections: poolConfig.minConnections ?? 2,
      maxConnections: poolConfig.maxConnections ?? 10,
      acquireTimeout: poolConfig.acquireTimeout ?? 30000,
      idleTimeout: poolConfig.idleTimeout ?? 300000, // 5 minutes
      reapInterval: poolConfig.reapInterval ?? 60000, // 1 minute
      maxRetries: poolConfig.maxRetries ?? 3,
      retryDelay: poolConfig.retryDelay ?? 1000,
      enableHealthCheck: poolConfig.enableHealthCheck ?? true,
      healthCheckInterval: poolConfig.healthCheckInterval ?? 30000,
      enableLoadBalancing: poolConfig.enableLoadBalancing ?? true,
      preferWriteConnections: poolConfig.preferWriteConnections ?? false,
    };

    this.stats = {
      total: 0,
      active: 0,
      idle: 0,
      pending: 0,
      failed: 0,
      created: 0,
      destroyed: 0,
      acquisitionTime: 0,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    try {
      // Create minimum connections
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      // Start timers
      this.startHealthCheckTimer();
      this.startReapTimer();

      this.emit('pool:initialized', { minConnections: this.config.minConnections });
    } catch (error) {
      this.emit('pool:error', error);
      throw error;
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(preferredType?: 'read' | 'write'): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    // Try to get an available connection immediately
    const availableConnection = this.getAvailableConnection(preferredType);
    if (availableConnection) {
      this.markConnectionInUse(availableConnection);
      return availableConnection;
    }

    // Create new connection if possible
    if (this.connections.size < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection(preferredType === 'write' ? 'write' : 'readwrite');
        this.markConnectionInUse(newConnection);
        return newConnection;
      } catch (error) {
        this.emit('connection:create:error', error);
      }
    }

    // Queue the request
    return this.queueAcquisitionRequest(preferredType);
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: PooledConnection): Promise<void> {
    if (!this.connections.has(connection.id)) {
      this.emit('connection:release:warning', { connectionId: connection.id, reason: 'Connection not in pool' });
      return;
    }

    // Update connection stats
    connection.inUse = false;
    connection.lastUsed = Date.now();
    connection.usageCount++;

    // Add back to available connections
    this.availableConnections.add(connection.id);

    // Update stats
    this.stats.active--;
    this.stats.idle++;

    this.emit('connection:released', { connectionId: connection.id });

    // Process any queued requests
    await this.processAcquisitionQueue();
  }

  /**
   * Execute a command using a pooled connection
   */
  async execute<T>(
    command: (client: RedisClientType) => Promise<T>,
    preferredType?: 'read' | 'write'
  ): Promise<T> {
    const startTime = Date.now();
    const connection = await this.acquire(preferredType);

    try {
      const result = await command(connection.client);
      return result;
    } finally {
      await this.release(connection);
      this.updateAcquisitionTime(Date.now() - startTime);
    }
  }

  /**
   * Execute multiple commands in a pipeline
   */
  async pipeline(
    commands: Array<(client: RedisClientType) => Promise<any>>,
    preferredType?: 'read' | 'write'
  ): Promise<any[]> {
    const connection = await this.acquire(preferredType);

    try {
      // Execute commands in parallel on the same connection
      const results = await Promise.all(commands.map(cmd => cmd(connection.client)));
      return results;
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Execute commands in a transaction
   */
  async transaction(
    commands: Array<(client: RedisClientType) => Promise<any>>
  ): Promise<any[]> {
    const connection = await this.acquire('write');

    try {
      // For Redis transactions, we would use MULTI/EXEC
      // This is a simplified version
      const results: any[] = [];

      for (const command of commands) {
        const result = await command(connection.client);
        results.push(result);
      }

      return results;
    } finally {
      await this.release(connection);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): ConnectionStats {
    this.updateCurrentStats();
    return { ...this.stats };
  }

  /**
   * Get pool status
   */
  getStatus(): {
    isHealthy: boolean;
    connections: Array<{
      id: string;
      type: string;
      inUse: boolean;
      isHealthy: boolean;
      usageCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      type: conn.type,
      inUse: conn.inUse,
      isHealthy: conn.isHealthy,
      usageCount: conn.usageCount,
      age: now - conn.createdAt,
    }));

    const healthyConnections = connections.filter(c => c.isHealthy).length;
    const isHealthy = healthyConnections >= this.config.minConnections;

    return { isHealthy, connections };
  }

  /**
   * Create a new connection
   */
  private async createConnection(type: 'read' | 'write' | 'readwrite' = 'readwrite'): Promise<PooledConnection> {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const Redis = await import('redis');

      const clientOptions: RedisClientOptions = {
        url: this.redisConfig.url,
        socket: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          reconnectStrategy: (retries) => {
            if (retries >= this.config.maxRetries) {
              return false;
            }
            return Math.min(retries * this.config.retryDelay, 5000);
          },
        },
        password: this.redisConfig.password,
        database: this.redisConfig.db || 0,
      };

      const client = Redis.createClient(clientOptions) as RedisClientType;

      // Set up event handlers
      client.on('error', (error) => {
        this.handleConnectionError(connectionId, error);
      });

      client.on('connect', () => {
        this.emit('connection:connected', { connectionId });
      });

      client.on('ready', () => {
        this.emit('connection:ready', { connectionId });
      });

      client.on('end', () => {
        this.handleConnectionEnd(connectionId);
      });

      await client.connect();

      const connection: PooledConnection = {
        id: connectionId,
        client,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        isHealthy: true,
        inUse: false,
        type,
      };

      this.connections.set(connectionId, connection);
      this.availableConnections.add(connectionId);

      // Update stats
      this.stats.total++;
      this.stats.idle++;
      this.stats.created++;

      this.emit('connection:created', { connectionId, type });
      return connection;
    } catch (error) {
      this.stats.failed++;
      this.emit('connection:create:error', { connectionId, error });
      throw error;
    }
  }

  /**
   * Get an available connection with load balancing
   */
  private getAvailableConnection(preferredType?: 'read' | 'write'): PooledConnection | null {
    if (this.availableConnections.size === 0) return null;

    const availableConnIds = Array.from(this.availableConnections);
    const availableConns = availableConnIds.map(id => this.connections.get(id)!).filter(Boolean);

    if (availableConns.length === 0) return null;

    // Filter by type preference if specified
    let candidateConns = availableConns;
    if (preferredType) {
      const typedConns = availableConns.filter(conn =>
        conn.type === preferredType || conn.type === 'readwrite'
      );
      if (typedConns.length > 0) {
        candidateConns = typedConns;
      }
    }

    // Filter healthy connections
    const healthyConns = candidateConns.filter(conn => conn.isHealthy);
    if (healthyConns.length === 0) {
      candidateConns = candidateConns.filter(conn => conn.isHealthy);
      if (candidateConns.length === 0) return null;
    } else {
      candidateConns = healthyConns;
    }

    // Load balancing strategy
    if (this.config.enableLoadBalancing) {
      // Select least used connection
      return candidateConns.reduce((least, current) =>
        current.usageCount < least.usageCount ? current : least
      );
    } else {
      // Return first available
      return candidateConns[0];
    }
  }

  /**
   * Mark connection as in use
   */
  private markConnectionInUse(connection: PooledConnection): void {
    connection.inUse = true;
    connection.lastUsed = Date.now();
    this.availableConnections.delete(connection.id);

    this.stats.active++;
    this.stats.idle--;
  }

  /**
   * Queue acquisition request
   */
  private async queueAcquisitionRequest(preferredType?: 'read' | 'write'): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const timeout = setTimeout(() => {
        const index = this.acquireQueue.findIndex(req => req.id === requestId);
        if (index !== -1) {
          this.acquireQueue.splice(index, 1);
        }
        reject(new Error(`Connection acquisition timeout after ${this.config.acquireTimeout}ms`));
      }, this.config.acquireTimeout);

      const request: AcquisitionRequest = {
        id: requestId,
        timestamp: Date.now(),
        resolve,
        reject,
        timeout,
        preferredType,
      };

      this.acquireQueue.push(request);
      this.stats.pending++;

      this.emit('acquisition:queued', { requestId, queueLength: this.acquireQueue.length });
    });
  }

  /**
   * Process queued acquisition requests
   */
  private async processAcquisitionQueue(): Promise<void> {
    while (this.acquireQueue.length > 0 && this.availableConnections.size > 0) {
      const request = this.acquireQueue.shift()!;
      clearTimeout(request.timeout);
      this.stats.pending--;

      const connection = this.getAvailableConnection(request.preferredType);
      if (connection) {
        this.markConnectionInUse(connection);
        request.resolve(connection);
        this.emit('acquisition:fulfilled', { requestId: request.id });
      } else {
        this.acquireQueue.unshift(request);
        break;
      }
    }
  }

  /**
   * Health check for connections
   */
  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = Array.from(this.connections.values()).map(async (connection) => {
      if (connection.inUse) return; // Skip connections in use

      try {
        await connection.client.ping();
        connection.isHealthy = true;
        this.stats.healthChecksPassed++;
        this.emit('healthcheck:passed', { connectionId: connection.id });
      } catch (error) {
        connection.isHealthy = false;
        this.stats.healthChecksFailed++;
        this.emit('healthcheck:failed', { connectionId: connection.id, error });

        // Remove unhealthy connection if we have enough healthy ones
        const healthyCount = Array.from(this.connections.values()).filter(c => c.isHealthy).length;
        if (healthyCount >= this.config.minConnections) {
          await this.destroyConnection(connection.id);
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Reap idle connections
   */
  private async reapIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToReap: string[] = [];

    for (const connection of Array.from(this.connections.values())) {
      if (connection.inUse) continue;

      const idleTime = now - connection.lastUsed;
      if (idleTime > this.config.idleTimeout && this.connections.size > this.config.minConnections) {
        connectionsToReap.push(connection.id);
      }
    }

    for (const connectionId of connectionsToReap) {
      await this.destroyConnection(connectionId);
    }

    if (connectionsToReap.length > 0) {
      this.emit('connections:reaped', { count: connectionsToReap.length });
    }
  }

  /**
   * Destroy a connection
   */
  private async destroyConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      if (connection.inUse) {
        this.emit('connection:destroy:warning', {
          connectionId,
          reason: 'Destroying connection that is in use'
        });
      }

      await connection.client.quit();
    } catch (error) {
      this.emit('connection:destroy:error', { connectionId, error });
    } finally {
      this.connections.delete(connectionId);
      this.availableConnections.delete(connectionId);

      // Update stats
      this.stats.total--;
      if (connection.inUse) {
        this.stats.active--;
      } else {
        this.stats.idle--;
      }
      this.stats.destroyed++;

      this.emit('connection:destroyed', { connectionId });
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionId: string, error: Error): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isHealthy = false;
    }

    this.emit('connection:error', { connectionId, error });
  }

  /**
   * Handle connection end
   */
  private handleConnectionEnd(connectionId: string): void {
    this.emit('connection:ended', { connectionId });
    this.destroyConnection(connectionId);
  }

  /**
   * Update current stats
   */
  private updateCurrentStats(): void {
    this.stats.total = this.connections.size;
    this.stats.active = Array.from(this.connections.values()).filter(c => c.inUse).length;
    this.stats.idle = this.stats.total - this.stats.active;
    this.stats.pending = this.acquireQueue.length;
  }

  /**
   * Update acquisition time metric
   */
  private updateAcquisitionTime(time: number): void {
    // Simple moving average
    this.stats.acquisitionTime = (this.stats.acquisitionTime * 0.9) + (time * 0.1);
  }

  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    if (!this.config.enableHealthCheck) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.emit('healthcheck:error', error);
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Start reap timer
   */
  private startReapTimer(): void {
    this.reapTimer = setInterval(() => {
      this.reapIdleConnections().catch(error => {
        this.emit('reap:error', error);
      });
    }, this.config.reapInterval);
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Clear timers
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.reapTimer) clearInterval(this.reapTimer);

    // Reject all queued requests
    while (this.acquireQueue.length > 0) {
      const request = this.acquireQueue.shift()!;
      clearTimeout(request.timeout);
      request.reject(new Error('Connection pool is shutting down'));
    }

    // Close all connections
    const shutdownPromises = Array.from(this.connections.keys()).map(id =>
      this.destroyConnection(id)
    );

    await Promise.allSettled(shutdownPromises);

    this.emit('pool:shutdown');
  }
}