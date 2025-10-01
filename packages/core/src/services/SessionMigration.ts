// TODO(2025-09-30.35): Validate dynamic state key access; move to typed Maps.
/**
 * Session Migration Service
 *
 * Provides capabilities for migrating sessions between Redis instances,
 * session data transformation, and cross-environment session management
 */

import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  RedisConfig,
  SessionError,
} from './SessionTypes.js';

export interface MigrationConfig {
  sourceRedis: RedisConfig;
  targetRedis: RedisConfig;
  batchSize: number;
  migrationTimeout: number; // seconds
  enableValidation: boolean;
  enableCompression: boolean;
  retryAttempts: number;
  backupBeforeMigration: boolean;
}

export interface MigrationTask {
  id: string;
  type: 'full' | 'incremental' | 'selective';
  source: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalSessions: number;
    migratedSessions: number;
    failedSessions: number;
    currentSession?: string;
  };
  startTime?: string;
  endTime?: string;
  error?: string;
  filters?: {
    sessionIds?: string[];
    agentIds?: string[];
    states?: string[];
    dateRange?: { from: string; to: string };
  };
}

export interface MigrationResult {
  taskId: string;
  success: boolean;
  migratedSessions: number;
  failedSessions: number;
  duration: number;
  errors: Array<{ sessionId: string; error: string }>;
  validationResults?: ValidationResults;
}

export interface ValidationResults {
  totalChecked: number;
  passed: number;
  failed: number;
  details: Array<{
    sessionId: string;
    passed: boolean;
    mismatches?: string[];
  }>;
}

export interface CrossInstanceSession {
  sessionId: string;
  sourceInstance: string;
  targetInstance: string;
  syncMode: 'real-time' | 'periodic' | 'manual';
  lastSyncTime: string;
  conflicts: Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    resolution: 'source' | 'target' | 'merge' | 'manual';
  }>;
}

export class SessionMigration extends EventEmitter {
  private config: MigrationConfig;
  private sourceRedis!: RedisClientType;
  private targetRedis!: RedisClientType;
  private activeTasks = new Map<string, MigrationTask>();
  private crossInstanceSessions = new Map<string, CrossInstanceSession>();

  constructor(config: MigrationConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize migration service with Redis connections
   */
  async initialize(): Promise<void> {
    try {
      const Redis = await import('redis');

      // Create source Redis connection
      this.sourceRedis = Redis.createClient({
        url: this.config.sourceRedis.url,
        socket: {
          host: this.config.sourceRedis.host,
          port: this.config.sourceRedis.port,
        },
        password: this.config.sourceRedis.password,
        database: this.config.sourceRedis.db || 0,
      }) as RedisClientType;

      // Create target Redis connection
      this.targetRedis = Redis.createClient({
        url: this.config.targetRedis.url,
        socket: {
          host: this.config.targetRedis.host,
          port: this.config.targetRedis.port,
        },
        password: this.config.targetRedis.password,
        database: this.config.targetRedis.db || 0,
      }) as RedisClientType;

      await Promise.all([
        this.sourceRedis.connect(),
        this.targetRedis.connect(),
      ]);

      this.emit('initialized');
    } catch (error) {
      throw new SessionError(
        'Failed to initialize migration service',
        'MIGRATION_INIT_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Start a full migration of all sessions
   */
  async startFullMigration(
    options: {
      backupFirst?: boolean;
      validateAfter?: boolean;
    } = {}
  ): Promise<string> {
    const taskId = `migration-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'full',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: 0,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
    };

    this.activeTasks.set(taskId, task);

    // Execute migration in background
    this.executeMigration(task, options).catch((error) => {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      this.emit('migration:failed', { taskId, error });
    });

    return taskId;
  }

  /**
   * Start incremental migration (only new/modified sessions)
   */
  async startIncrementalMigration(
    sinceTimestamp: string,
    options: { validateAfter?: boolean } = {}
  ): Promise<string> {
    const taskId = `incremental-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'incremental',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: 0,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
      filters: {
        dateRange: { from: sinceTimestamp, to: new Date().toISOString() },
      },
    };

    this.activeTasks.set(taskId, task);

    this.executeIncrementalMigration(task, sinceTimestamp, options).catch(
      (error) => {
        task.status = 'failed';
        task.error = error.message;
        task.endTime = new Date().toISOString();
        this.emit('migration:failed', { taskId, error });
      }
    );

    return taskId;
  }

  /**
   * Start selective migration of specific sessions
   */
  async startSelectiveMigration(
    sessionIds: string[],
    options: { validateAfter?: boolean } = {}
  ): Promise<string> {
    const taskId = `selective-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'selective',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: sessionIds.length,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
      filters: {
        sessionIds,
      },
    };

    this.activeTasks.set(taskId, task);

    this.executeSelectiveMigration(task, sessionIds, options).catch((error) => {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      this.emit('migration:failed', { taskId, error });
    });

    return taskId;
  }

  /**
   * Get migration task status
   */
  getMigrationStatus(taskId: string): MigrationTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * Cancel a running migration
   */
  async cancelMigration(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Migration task not found: ${taskId}`);
    }

    if (task.status === 'running') {
      task.status = 'cancelled';
      task.endTime = new Date().toISOString();
      this.emit('migration:cancelled', { taskId });
    }
  }

  /**
   * Validate migrated data
   */
  async validateMigration(taskId: string): Promise<ValidationResults> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Migration task not found: ${taskId}`);
    }

    const results: ValidationResults = {
      totalChecked: 0,
      passed: 0,
      failed: 0,
      details: [],
    };

    // Get sessions to validate based on task type
    const sessionIds = await this.getSessionIdsForValidation(task);

    for (const sessionId of sessionIds) {
      try {
        const sourceSession = await this.getSessionFromSource(sessionId);
        const targetSession = await this.getSessionFromTarget(sessionId);

        results.totalChecked++;

        if (!sourceSession && !targetSession) {
          continue; // Both don't exist, skip
        }

        if (!sourceSession || !targetSession) {
          results.failed++;
          results.details.push({
            sessionId,
            passed: false,
            mismatches: ['Session exists in only one instance'],
          });
          continue;
        }

        const mismatches = this.compareSessionData(
          sourceSession,
          targetSession
        );
        if (mismatches.length === 0) {
          results.passed++;
          results.details.push({ sessionId, passed: true });
        } else {
          results.failed++;
          results.details.push({ sessionId, passed: false, mismatches });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          sessionId,
          passed: false,
          mismatches: [
            `Validation error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
        });
      }
    }

    this.emit('validation:completed', { taskId, results });
    return results;
  }

  /**
   * Setup cross-instance session synchronization
   */
  async setupCrossInstanceSync(
    sessionId: string,
    targetInstance: string,
    syncMode: 'real-time' | 'periodic' | 'manual' = 'periodic'
  ): Promise<void> {
    const crossSession: CrossInstanceSession = {
      sessionId,
      sourceInstance: this.config.sourceRedis.host || 'source',
      targetInstance,
      syncMode,
      lastSyncTime: new Date().toISOString(),
      conflicts: [],
    };

    this.crossInstanceSessions.set(sessionId, crossSession);

    if (syncMode === 'real-time') {
      await this.setupRealTimeSync(sessionId);
    } else if (syncMode === 'periodic') {
      await this.setupPeriodicSync(sessionId);
    }

    this.emit('cross-instance:setup', { sessionId, syncMode });
  }

  /**
   * Sync session data between instances
   */
  async syncSession(sessionId: string): Promise<void> {
    const crossSession = this.crossInstanceSessions.get(sessionId);
    if (!crossSession) {
      throw new Error(`Cross-instance session not found: ${sessionId}`);
    }

    try {
      const sourceSession = await this.getSessionFromSource(sessionId);
      if (!sourceSession) {
        throw new Error(`Source session not found: ${sessionId}`);
      }

      const targetSession = await this.getSessionFromTarget(sessionId);

      if (targetSession) {
        // Detect conflicts
        const conflicts = this.detectConflicts(sourceSession, targetSession);
        if (conflicts.length > 0) {
          crossSession.conflicts = conflicts;
          this.emit('sync:conflicts', { sessionId, conflicts });

          // Auto-resolve conflicts based on strategy
          await this.resolveConflicts(sessionId, conflicts);
        }
      }

      // Migrate the session
      await this.migrateSession(sessionId, sourceSession);
      crossSession.lastSyncTime = new Date().toISOString();

      this.emit('sync:completed', { sessionId });
    } catch (error) {
      this.emit('sync:failed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Get cross-instance session status
   */
  getCrossInstanceStatus(sessionId: string): CrossInstanceSession | null {
    return this.crossInstanceSessions.get(sessionId) || null;
  }

  /**
   * List all cross-instance sessions
   */
  listCrossInstanceSessions(): CrossInstanceSession[] {
    return Array.from(this.crossInstanceSessions.values());
  }

  private isTaskCancelled(task: MigrationTask): boolean {
    return task.status === 'cancelled';
  }

  /**
   * Execute full migration
   */
  private async executeMigration(
    task: MigrationTask,
    options: { backupFirst?: boolean; validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {
      // Create backup if requested
      if (options.backupFirst && this.config.backupBeforeMigration) {
        await this.createBackup(task.id);
      }

      // Get all session keys
      const sessionKeys = await this.sourceRedis.keys('session:*');
      task.progress.totalSessions = sessionKeys.length;

      const errors: Array<{ sessionId: string; error: string }> = [];

      // Process sessions in batches
      for (let i = 0; i < sessionKeys.length; i += this.config.batchSize) {
        if (this.isTaskCancelled(task)) {
          break;
        }

        const batch = sessionKeys.slice(i, i + this.config.batchSize);

        for (const sessionKey of batch) {
          if (this.isTaskCancelled(task)) {
            break;
          }

          const sessionId = sessionKey.replace('session:', '');
          task.progress.currentSession = sessionId;

          try {
            const session = await this.getSessionFromSource(sessionId);
            if (session) {
              await this.migrateSession(sessionId, session);
              task.progress.migratedSessions++;
            }
          } catch (error) {
            task.progress.failedSessions++;
            errors.push({
              sessionId,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          this.emit('migration:progress', {
            taskId: task.id,
            progress: task.progress,
          });
        }
      }

      if (!this.isTaskCancelled(task)) {
        task.status = 'completed';
      }
      task.endTime = new Date().toISOString();

      // Validate after migration if requested
      let validationResults: ValidationResults | undefined;
      if (options.validateAfter && this.config.enableValidation) {
        validationResults = await this.validateMigration(task.id);
      }

      const result: MigrationResult = {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
        duration:
          new Date(task.endTime!).getTime() -
          new Date(task.startTime!).getTime(),
        errors,
        validationResults,
      };

      this.emit('migration:completed', result);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Execute incremental migration
   */
  private async executeIncrementalMigration(
    task: MigrationTask,
    sinceTimestamp: string,
    _options: { validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {
      // Get sessions modified since timestamp
      const since = new Date(sinceTimestamp).getTime();
      const sessionKeys = await this.sourceRedis.keys('session:*');
      const recentSessions: string[] = [];

      for (const sessionKey of sessionKeys) {
        const _sessionData = await this.sourceRedis.hGetAll(sessionKey);
        // Check if session has events newer than timestamp
        const eventsKey = sessionKey.replace('session:', 'events:');
        const recentEvents = await this.sourceRedis.zRangeByScore(
          eventsKey,
          since,
          '+inf'
        );

        if (recentEvents.length > 0) {
          recentSessions.push(sessionKey.replace('session:', ''));
        }
      }

      task.progress.totalSessions = recentSessions.length;

      // Process incremental sessions
      for (const sessionId of recentSessions) {
        if (this.isTaskCancelled(task)) {
          break;
        }

        try {
          const session = await this.getSessionFromSource(sessionId);
          if (session) {
            await this.migrateSession(sessionId, session);
            task.progress.migratedSessions++;
          }
        } catch (error) {
          task.progress.failedSessions++;
        }

        this.emit('migration:progress', {
          taskId: task.id,
          progress: task.progress,
        });
      }

      if (!this.isTaskCancelled(task)) {
        task.status = 'completed';
      }
      task.endTime = new Date().toISOString();

      this.emit('migration:completed', {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Execute selective migration
   */
  private async executeSelectiveMigration(
    task: MigrationTask,
    sessionIds: string[],
    _options: { validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {
      for (const sessionId of sessionIds) {
        if (this.isTaskCancelled(task)) {
          break;
        }

        task.progress.currentSession = sessionId;

        try {
          const session = await this.getSessionFromSource(sessionId);
          if (session) {
            await this.migrateSession(sessionId, session);
            task.progress.migratedSessions++;
          }
        } catch (error) {
          task.progress.failedSessions++;
        }

        this.emit('migration:progress', {
          taskId: task.id,
          progress: task.progress,
        });
      }

      if (!this.isTaskCancelled(task)) {
        task.status = 'completed';
      }
      task.endTime = new Date().toISOString();

      this.emit('migration:completed', {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Migrate a single session
   */
  private async migrateSession(
    sessionId: string,
    session: SessionDocument
  ): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const eventsKey = `events:${sessionId}`;

    // Migrate session data
    const sessionData = {
      agentIds: JSON.stringify(session.agentIds),
      state: session.state,
      events: session.events.length.toString(),
      metadata: session.metadata ? JSON.stringify(session.metadata) : undefined,
    };

    const redisData = Object.fromEntries(
      (Object.entries(sessionData) as Array<[
        string,
        string | number | undefined
      ]>)
        .filter(([, value]) => value !== undefined)
        .map(([k, v]) => [k, v as string | number])
    );

    await this.targetRedis.hSet(
      sessionKey,
      redisData as Record<string, string | number>
    );

    // Migrate events
    if (session.events.length > 0) {
      const eventEntries = session.events.map((event) => ({
        score: event.seq,
        value: JSON.stringify(event),
      }));

      await this.targetRedis.zAdd(eventsKey, eventEntries);
    }

    // Set TTL if exists on source
    const ttl = await this.sourceRedis.ttl(sessionKey);
    if (ttl > 0) {
      await this.targetRedis.expire(sessionKey, ttl);
      await this.targetRedis.expire(eventsKey, ttl);
    }
  }

  /**
   * Get session from source Redis
   */
  private async getSessionFromSource(
    sessionId: string
  ): Promise<SessionDocument | null> {
    return this.getSessionFromRedis(this.sourceRedis, sessionId);
  }

  /**
   * Get session from target Redis
   */
  private async getSessionFromTarget(
    sessionId: string
  ): Promise<SessionDocument | null> {
    return this.getSessionFromRedis(this.targetRedis, sessionId);
  }

  /**
   * Get session from specific Redis instance
   */
  private async getSessionFromRedis(
    redis: RedisClientType,
    sessionId: string
  ): Promise<SessionDocument | null> {
    const sessionKey = `session:${sessionId}`;
    const exists = await redis.exists(sessionKey);

    if (!exists) return null;

    const sessionData = await redis.hGetAll(sessionKey);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }

    // Get events
    const eventsKey = `events:${sessionId}`;
    const eventData = await redis.zRange(eventsKey, 0, -1);
    const events = eventData
      .filter((event) => event !== 'INIT')
      .map((eventStr) => JSON.parse(eventStr))
      .sort((a, b) => a.seq - b.seq);

    return {
      sessionId,
      agentIds: JSON.parse(sessionData.agentIds || '[]'),
      state: sessionData.state as any,
      events,
      metadata: sessionData.metadata
        ? JSON.parse(sessionData.metadata)
        : undefined,
    };
  }

  /**
   * Compare session data for validation
   */
  private compareSessionData(
    source: SessionDocument,
    target: SessionDocument
  ): string[] {
    const mismatches: string[] = [];

    if (source.state !== target.state) {
      mismatches.push(
        `State mismatch: source=${source.state}, target=${target.state}`
      );
    }

    if (
      JSON.stringify(source.agentIds.sort()) !==
      JSON.stringify(target.agentIds.sort())
    ) {
      mismatches.push('Agent IDs mismatch');
    }

    if (source.events.length !== target.events.length) {
      mismatches.push(
        `Event count mismatch: source=${source.events.length}, target=${target.events.length}`
      );
    }

    // Compare metadata
    const sourceMetadata = JSON.stringify(source.metadata || {});
    const targetMetadata = JSON.stringify(target.metadata || {});
    if (sourceMetadata !== targetMetadata) {
      mismatches.push('Metadata mismatch');
    }

    return mismatches;
  }

  /**
   * Get session IDs for validation based on task
   */
  private async getSessionIdsForValidation(
    task: MigrationTask
  ): Promise<string[]> {
    if (task.filters?.sessionIds) {
      return task.filters.sessionIds;
    }

    // Get all migrated sessions
    const sessionKeys = await this.targetRedis.keys('session:*');
    return sessionKeys.map((key) => key.replace('session:', ''));
  }

  /**
   * Detect conflicts between source and target sessions
   */
  private detectConflicts(
    source: SessionDocument,
    target: SessionDocument
  ): Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    resolution: 'source' | 'target' | 'merge' | 'manual';
  }> {
    const conflicts: Array<{
      field: string;
      sourceValue: any;
      targetValue: any;
      resolution: 'source' | 'target' | 'merge' | 'manual';
    }> = [];

    if (source.state !== target.state) {
      conflicts.push({
        field: 'state',
        sourceValue: source.state,
        targetValue: target.state,
        resolution: 'source' as const, // Default resolution strategy
      });
    }

    if (source.events.length !== target.events.length) {
      conflicts.push({
        field: 'events',
        sourceValue: source.events.length,
        targetValue: target.events.length,
        resolution: 'merge' as const,
      });
    }

    return conflicts;
  }

  /**
   * Resolve conflicts automatically
   */
  private async resolveConflicts(
    sessionId: string,
    conflicts: any[]
  ): Promise<void> {
    // Implement conflict resolution strategies
    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'source':
          // Use source value
          break;
        case 'target':
          // Keep target value
          break;
        case 'merge':
          // Implement merge logic
          break;
        case 'manual':
          // Require manual intervention
          this.emit('conflict:manual-required', { sessionId, conflict });
          break;
      }
    }
  }

  /**
   * Setup real-time synchronization
   */
  private async setupRealTimeSync(sessionId: string): Promise<void> {
    // Subscribe to session changes in source Redis
    // This would require pub/sub implementation
    this.emit('sync:realtime:setup', { sessionId });
  }

  /**
   * Setup periodic synchronization
   */
  private async setupPeriodicSync(sessionId: string): Promise<void> {
    // Setup periodic sync timer
    setInterval(async () => {
      try {
        await this.syncSession(sessionId);
      } catch (error) {
        this.emit('sync:periodic:error', { sessionId, error });
      }
    }, 60000); // Every minute
  }

  /**
   * Create backup before migration
   */
  private async createBackup(taskId: string): Promise<void> {
    // Implement backup creation logic
    this.emit('backup:created', { taskId });
  }

  /**
   * Shutdown migration service
   */
  async shutdown(): Promise<void> {
    // Cancel all active migrations
    for (const taskId of this.activeTasks.keys()) {
      await this.cancelMigration(taskId);
    }

    // Close Redis connections
    await Promise.all([this.sourceRedis?.quit(), this.targetRedis?.quit()]);

    this.emit('shutdown');
  }
}
