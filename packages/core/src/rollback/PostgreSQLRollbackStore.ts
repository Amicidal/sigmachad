/**
 * PostgreSQL persistence adapter for rollback data
 */

import { EventEmitter } from 'events';
import { Client, Pool, PoolConfig } from 'pg';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackConfig,
  RollbackStoreOptions,
  RollbackMetrics,
  RollbackError,
  RollbackNotFoundError,
  RollbackExpiredError
} from './RollbackTypes.js';

export interface PostgreSQLConfig {
  connectionString?: string;
  pool?: PoolConfig;
  schema?: string;
  tablePrefix?: string;
}

/**
 * PostgreSQL-backed rollback store with hybrid memory cache
 */
export class PostgreSQLRollbackStore extends EventEmitter {
  private pool: Pool;
  private memoryCache = new Map<string, RollbackPoint>();
  private operationsCache = new Map<string, RollbackOperation>();
  private expiryTimers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: RollbackMetrics;

  private readonly schema: string;
  private readonly rollbackPointsTable: string;
  private readonly operationsTable: string;
  private readonly snapshotsTable: string;

  constructor(
    private config: RollbackConfig,
    private options: RollbackStoreOptions,
    private pgConfig: PostgreSQLConfig
  ) {
    super();

    this.schema = pgConfig.schema || 'public';
    const prefix = pgConfig.tablePrefix || 'memento_rollback_';
    this.rollbackPointsTable = `${this.schema}.${prefix}points`;
    this.operationsTable = `${this.schema}.${prefix}operations`;
    this.snapshotsTable = `${this.schema}.${prefix}snapshots`;

    // Initialize PostgreSQL connection pool
    this.pool = new Pool(
      pgConfig.connectionString
        ? { connectionString: pgConfig.connectionString }
        : pgConfig.pool
    );

    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    if (config.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Initialize the PostgreSQL schema
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create schema if it doesn't exist
      if (this.schema !== 'public') {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);
      }

      // Create rollback_points table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.rollbackPointsTable} (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          session_id TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Create operations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.operationsTable} (
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
          FOREIGN KEY (target_rollback_point_id) REFERENCES ${this.rollbackPointsTable}(id) ON DELETE CASCADE
        )
      `);

      // Create snapshots table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.snapshotsTable} (
          id UUID PRIMARY KEY,
          rollback_point_id UUID NOT NULL,
          type TEXT NOT NULL,
          data JSONB NOT NULL,
          size_bytes INTEGER NOT NULL,
          checksum TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (rollback_point_id) REFERENCES ${this.rollbackPointsTable}(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_rollback_points_session_id
        ON ${this.rollbackPointsTable}(session_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_rollback_points_expires_at
        ON ${this.rollbackPointsTable}(expires_at);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_operations_status
        ON ${this.operationsTable}(status);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_snapshots_rollback_point_id
        ON ${this.snapshotsTable}(rollback_point_id);
      `);

      // Load recent rollback points into memory cache
      await this.loadRecentPointsIntoCache();

    } finally {
      client.release();
    }
  }

  /**
   * Store a rollback point
   */
  async storeRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert into PostgreSQL
      await client.query(`
        INSERT INTO ${this.rollbackPointsTable}
        (id, name, description, timestamp, expires_at, session_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        rollbackPoint.id,
        rollbackPoint.name,
        rollbackPoint.description,
        rollbackPoint.timestamp,
        rollbackPoint.expiresAt,
        rollbackPoint.sessionId,
        JSON.stringify(rollbackPoint.metadata)
      ]);

      await client.query('COMMIT');

      // Store in memory cache
      this.memoryCache.set(rollbackPoint.id, rollbackPoint);
      this.metrics.totalRollbackPoints++;

      // Set up expiry timer if specified
      if (rollbackPoint.expiresAt) {
        this.setExpiryTimer(rollbackPoint.id, rollbackPoint.expiresAt);
      }

      this.updateMemoryUsage();
      this.emit('rollback-point-stored', { rollbackPoint });

    } catch (error) {
      await client.query('ROLLBACK');
      throw new RollbackError(
        'Failed to store rollback point',
        'STORE_FAILED',
        { rollbackPointId: rollbackPoint.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve a rollback point by ID
   */
  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {
    // Check memory cache first
    let rollbackPoint = this.memoryCache.get(id);

    if (!rollbackPoint) {
      // Fetch from database
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, name, description, timestamp, expires_at, session_id, metadata
          FROM ${this.rollbackPointsTable}
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        rollbackPoint = {
          id: row.id,
          name: row.name,
          description: row.description,
          timestamp: new Date(row.timestamp),
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
          sessionId: row.session_id,
          metadata: row.metadata || {}
        };

        // Cache it for future requests
        this.memoryCache.set(id, rollbackPoint);

      } finally {
        client.release();
      }
    }

    // Check if expired
    if (rollbackPoint && rollbackPoint.expiresAt && rollbackPoint.expiresAt < new Date()) {
      await this.removeRollbackPoint(id);
      throw new RollbackExpiredError(id);
    }

    return rollbackPoint;
  }

  /**
   * Get all rollback points
   */
  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, description, timestamp, expires_at, session_id, metadata
        FROM ${this.rollbackPointsTable}
        WHERE expires_at IS NULL OR expires_at > NOW()
        ORDER BY timestamp DESC
      `);

      const points: RollbackPoint[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        timestamp: new Date(row.timestamp),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        sessionId: row.session_id,
        metadata: row.metadata || {}
      }));

      // Update memory cache with recent points
      points.slice(0, 50).forEach(point => {
        this.memoryCache.set(point.id, point);
      });

      return points;

    } finally {
      client.release();
    }
  }

  /**
   * Get rollback points for a specific session
   */
  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, description, timestamp, expires_at, session_id, metadata
        FROM ${this.rollbackPointsTable}
        WHERE session_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY timestamp DESC
      `, [sessionId]);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        timestamp: new Date(row.timestamp),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        sessionId: row.session_id,
        metadata: row.metadata || {}
      }));

    } finally {
      client.release();
    }
  }

  /**
   * Remove a rollback point
   */
  async removeRollbackPoint(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete from database (snapshots and operations will cascade)
      const result = await client.query(`
        DELETE FROM ${this.rollbackPointsTable}
        WHERE id = $1
      `, [id]);

      await client.query('COMMIT');

      // Remove from memory cache
      this.memoryCache.delete(id);

      // Clear expiry timer
      const timer = this.expiryTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.expiryTimers.delete(id);
      }

      this.updateMemoryUsage();
      this.emit('rollback-point-removed', { rollbackPointId: id });

      return result.rowCount! > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      throw new RollbackError(
        'Failed to remove rollback point',
        'REMOVE_FAILED',
        { rollbackPointId: id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }

  /**
   * Store a rollback operation
   */
  async storeOperation(operation: RollbackOperation): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO ${this.operationsTable}
        (id, type, target_rollback_point_id, status, progress, error_message,
         started_at, completed_at, strategy, log_entries)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        operation.id,
        operation.type,
        operation.targetRollbackPointId,
        operation.status,
        operation.progress,
        operation.error,
        operation.startedAt,
        operation.completedAt,
        operation.strategy,
        JSON.stringify(operation.log)
      ]);

      this.operationsCache.set(operation.id, operation);
      this.emit('operation-stored', { operation });

    } catch (error) {
      throw new RollbackError(
        'Failed to store operation',
        'OPERATION_STORE_FAILED',
        { operationId: operation.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update a rollback operation
   */
  async updateOperation(operation: RollbackOperation): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE ${this.operationsTable}
        SET status = $2, progress = $3, error_message = $4, completed_at = $5,
            log_entries = $6, updated_at = NOW()
        WHERE id = $1
      `, [
        operation.id,
        operation.status,
        operation.progress,
        operation.error,
        operation.completedAt,
        JSON.stringify(operation.log)
      ]);

      if (result.rowCount === 0) {
        throw new RollbackNotFoundError(operation.id);
      }

      this.operationsCache.set(operation.id, operation);
      this.emit('operation-updated', { operation });

      // Update metrics based on operation status
      if (operation.status === 'completed') {
        this.metrics.successfulRollbacks++;
        if (operation.startedAt && operation.completedAt) {
          const duration = operation.completedAt.getTime() - operation.startedAt.getTime();
          this.updateAverageRollbackTime(duration);
        }
      } else if (operation.status === 'failed') {
        this.metrics.failedRollbacks++;
      }

    } catch (error) {
      throw new RollbackError(
        'Failed to update operation',
        'OPERATION_UPDATE_FAILED',
        { operationId: operation.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }

  /**
   * Store snapshot data
   */
  async storeSnapshot(
    rollbackPointId: string,
    type: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    const client = await this.pool.connect();
    try {
      const snapshotId = `${rollbackPointId}_${type}_${Date.now()}`;
      const serializedData = JSON.stringify(data);
      const sizeBytes = Buffer.byteLength(serializedData, 'utf8');

      await client.query(`
        INSERT INTO ${this.snapshotsTable}
        (id, rollback_point_id, type, data, size_bytes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        snapshotId,
        rollbackPointId,
        type,
        data,
        sizeBytes
      ]);

      return snapshotId;

    } catch (error) {
      throw new RollbackError(
        'Failed to store snapshot',
        'SNAPSHOT_STORE_FAILED',
        { rollbackPointId, type, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get snapshots for a rollback point
   */
  async getSnapshots(rollbackPointId: string): Promise<Array<{ id: string; type: string; data: any; sizeBytes: number }>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, type, data, size_bytes
        FROM ${this.snapshotsTable}
        WHERE rollback_point_id = $1
        ORDER BY created_at
      `, [rollbackPointId]);

      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        data: row.data,
        sizeBytes: row.size_bytes
      }));

    } finally {
      client.release();
    }
  }

  /**
   * Clean up expired rollback points and old operations
   */
  async cleanup(): Promise<{ removedPoints: number; removedOperations: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Clean up expired rollback points
      const expiredPointsResult = await client.query(`
        DELETE FROM ${this.rollbackPointsTable}
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
      `);

      // Clean up old completed operations (keep only recent ones)
      const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
      const oldOperationsResult = await client.query(`
        DELETE FROM ${this.operationsTable}
        WHERE (status = 'completed' OR status = 'failed')
        AND completed_at < $1
      `, [cutoffTime]);

      await client.query('COMMIT');

      const removedPoints = expiredPointsResult.rowCount || 0;
      const removedOperations = oldOperationsResult.rowCount || 0;

      // Clear expired items from memory cache
      for (const [id, point] of Array.from(this.memoryCache.entries())) {
        if (point.expiresAt && point.expiresAt < new Date()) {
          this.memoryCache.delete(id);
          const timer = this.expiryTimers.get(id);
          if (timer) {
            clearTimeout(timer);
            this.expiryTimers.delete(id);
          }
        }
      }

      this.metrics.lastCleanup = new Date();
      this.updateMemoryUsage();

      this.emit('cleanup-completed', { removedPoints, removedOperations });

      return { removedPoints, removedOperations };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): RollbackMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Shutdown the store
   */
  async shutdown(): Promise<void> {
    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear all expiry timers
    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();

    // Close database connections
    await this.pool.end();

    this.emit('store-shutdown');
  }

  /**
   * Retrieve a rollback operation
   */
  async getOperation(id: string): Promise<RollbackOperation | null> {
    // Check memory cache first
    let operation = this.operationsCache.get(id);

    if (!operation) {
      // Fetch from database
      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, type, target_rollback_point_id, status, progress, error_message,
                 started_at, completed_at, strategy, log_entries
          FROM ${this.operationsTable}
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        operation = {
          id: row.id,
          type: row.type,
          targetRollbackPointId: row.target_rollback_point_id,
          status: row.status,
          progress: row.progress,
          error: row.error_message,
          startedAt: new Date(row.started_at),
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          strategy: row.strategy,
          log: row.log_entries || []
        };

        // Cache it for future requests
        this.operationsCache.set(id, operation);

      } finally {
        client.release();
      }
    }

    return operation;
  }

  /**
   * Load recent rollback points into memory cache
   */
  private async loadRecentPointsIntoCache(): Promise<void> {
    try {
      const recentPoints = await this.getAllRollbackPoints();
      recentPoints.slice(0, this.options.maxItems).forEach(point => {
        this.memoryCache.set(point.id, point);
        if (point.expiresAt) {
          this.setExpiryTimer(point.id, point.expiresAt);
        }
      });
    } catch (error) {
      // Log error but don't fail initialization
      console.warn('Failed to load rollback points into cache:', error);
    }
  }

  /**
   * Set expiry timer for a rollback point
   */
  private setExpiryTimer(rollbackPointId: string, expiresAt: Date): void {
    const now = Date.now();
    const expiryTime = expiresAt.getTime();
    if (expiryTime > now) {
      const timeout = setTimeout(async () => {
        try {
          await this.removeRollbackPoint(rollbackPointId);
          this.emit('rollback-point-expired', { rollbackPointId });
        } catch (error) {
          console.error(`Failed to expire rollback point ${rollbackPointId}:`, error);
        }
      }, expiryTime - now);
      this.expiryTimers.set(rollbackPointId, timeout);
    }
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    const interval = this.config.cleanupInterval || 5 * 60 * 1000; // 5 minutes default
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('cleanup-error', { error });
      }
    }, interval);
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    const pointsSize = this.memoryCache.size * 1024; // Estimate 1KB per point
    const operationsSize = this.operationsCache.size * 512; // Estimate 512B per operation
    this.metrics.memoryUsage = pointsSize + operationsSize;
  }

  /**
   * Update average rollback time
   */
  private updateAverageRollbackTime(newTime: number): void {
    const currentAvg = this.metrics.averageRollbackTime;
    const count = this.metrics.successfulRollbacks;
    this.metrics.averageRollbackTime = ((currentAvg * (count - 1)) + newTime) / count;
  }
}