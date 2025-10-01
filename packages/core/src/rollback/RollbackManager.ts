/**
 * Main rollback orchestration manager
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy,
  RollbackConfig,
  RollbackStoreOptions,
  Snapshot,
  SnapshotType,
  ConflictResolution,
  ConflictStrategy,
  RollbackDiff,
  RollbackLogEntry,
  RollbackMetrics,
  RollbackError,
  RollbackNotFoundError,
  DatabaseNotReadyError,
  RollbackEvents
} from './RollbackTypes.js';
import { SnapshotManager } from './Snapshot.js';
import { DiffEngine } from './DiffEngine.js';
import { RollbackStore } from './RollbackStore.js';
import { RollbackStrategyFactory } from './RollbackStrategies.js';

/**
 * Integration interfaces for external services
 */
interface DatabaseService {
  isReady(): Promise<boolean>;
}

interface KnowledgeGraphService {
  getEntities(): Promise<any[]>;
  getRelationships(): Promise<any[]>;
  restoreEntities(entities: any[]): Promise<void>;
  restoreRelationships(relationships: any[]): Promise<void>;
}

interface FileSystemService {
  getFileContents(path: string): Promise<string>;
  writeFileContents(path: string, contents: string): Promise<void>;
  listFiles(directory: string): Promise<string[]>;
}

interface SessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<any>;
  restoreSessionData(sessionId: string, data: any): Promise<void>;
}

/**
 * Main rollback manager that orchestrates all rollback operations
 */
export class RollbackManager extends EventEmitter {
  private snapshotManager: SnapshotManager;
  private diffEngine: DiffEngine;
  private store: RollbackStore;
  private activeOperations = new Map<string, RollbackOperation>();

  // Service integrations (optional)
  private databaseService?: DatabaseService;
  private knowledgeGraphService?: KnowledgeGraphService;
  private fileSystemService?: FileSystemService;
  private sessionManager?: SessionManager;

  constructor(
    private config: RollbackConfig,
    storeOptions?: RollbackStoreOptions
  ) {
    super();

    // Initialize components
    this.snapshotManager = new SnapshotManager(config);
    this.diffEngine = new DiffEngine();
    this.store = new RollbackStore(
      config,
      storeOptions || {
        maxItems: config.maxRollbackPoints,
        defaultTTL: config.defaultTTL,
        enableLRU: true,
        enablePersistence: config.enablePersistence
      }
    );

    // Forward store events
    this.store.on('rollback-point-stored', (data) => this.emit('rollback-point-created', data.rollbackPoint));
    this.store.on('rollback-point-expired', (data) => this.emit('rollback-point-expired', data.rollbackPointId));
    this.store.on('cleanup-completed', (data) => this.emit('cleanup-completed', data.removedCount));
  }

  /**
   * Set service integrations
   */
  setServices(services: {
    databaseService?: DatabaseService;
    knowledgeGraphService?: KnowledgeGraphService;
    fileSystemService?: FileSystemService;
    sessionManager?: SessionManager;
  }): void {
    this.databaseService = services.databaseService;
    this.knowledgeGraphService = services.knowledgeGraphService;
    this.fileSystemService = services.fileSystemService;
    this.sessionManager = services.sessionManager;
  }

  /**
   * Create a new rollback point
   */
  async createRollbackPoint(
    name: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<RollbackPoint> {
    // Check database readiness if required
    if (this.config.requireDatabaseReady && this.databaseService) {
      const isReady = await this.databaseService.isReady();
      if (!isReady) {
        throw new DatabaseNotReadyError();
      }
    }

    const sessionId = this.sessionManager?.getCurrentSessionId() || undefined;
    const expiresAt = new Date(Date.now() + this.config.defaultTTL);

    const rollbackPoint: RollbackPoint = {
      id: uuidv4(),
      operationId: `create_${Date.now()}`,
      name,
      description: description || '',
      timestamp: new Date(),
      entities: [],
      relationships: [],
      metadata: metadata || {},
      sessionId,
      expiresAt
    };

    // Create snapshots of current state
    await this.captureSnapshots(rollbackPoint.id);

    // Store the rollback point
    await this.store.storeRollbackPoint(rollbackPoint);

    this.emit('rollback-point-created', rollbackPoint);

    return rollbackPoint;
  }

  /**
   * Get a rollback point by ID
   */
  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {
    return this.store.getRollbackPoint(id);
  }

  /**
   * Get all rollback points
   */
  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    return this.store.getAllRollbackPoints();
  }

  /**
   * Get rollback points for a specific session
   */
  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    return this.store.getRollbackPointsForSession(sessionId);
  }

  /**
   * Create a snapshot at the current state
   */
  async createSnapshot(rollbackPointId: string): Promise<void> {
    await this.captureSnapshots(rollbackPointId);
  }

  /**
   * Generate diff between current state and a rollback point
   */
  async generateDiff(rollbackPointId: string): Promise<RollbackDiff> {
    const rollbackPoint = await this.store.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new RollbackNotFoundError(rollbackPointId);
    }

    // Get snapshots for the rollback point
    const snapshots = this.snapshotManager.getSnapshotsForRollbackPoint(rollbackPointId);
    if (snapshots.length === 0) {
      throw new RollbackError(
        `No snapshots found for rollback point: ${rollbackPointId}`,
        'NO_SNAPSHOTS_FOUND',
        { rollbackPointId }
      );
    }

    // Create snapshots of current state for comparison
    const currentStateId = `temp_${uuidv4()}`;
    await this.captureSnapshots(currentStateId);
    const currentSnapshots = this.snapshotManager.getSnapshotsForRollbackPoint(currentStateId);

    // Generate diff between states
    const changes: any[] = [];
    for (const snapshot of snapshots) {
      const currentSnapshot = currentSnapshots.find(s => s.type === snapshot.type);
      if (currentSnapshot) {
        const snapshotDiff = await this.diffEngine.generateSnapshotDiff(currentSnapshot, snapshot);
        changes.push(...snapshotDiff.changes);
      }
    }

    // Clean up temporary snapshots
    this.snapshotManager.deleteSnapshotsForRollbackPoint(currentStateId);

    return {
      from: 'current',
      to: rollbackPointId,
      changes,
      changeCount: changes.length,
      generatedAt: new Date()
    };
  }

  /**
   * Perform a rollback operation
   */
  async rollback(
    rollbackPointId: string,
    options?: {
      type?: RollbackOperationType;
      strategy?: RollbackStrategy;
      conflictResolution?: ConflictResolution;
      dryRun?: boolean;
    }
  ): Promise<RollbackOperation> {
    const rollbackPoint = await this.store.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new RollbackNotFoundError(rollbackPointId);
    }

    // Create rollback operation
    const operation: RollbackOperation = {
      id: uuidv4(),
      type: options?.type || RollbackOperationType.FULL,
      targetRollbackPointId: rollbackPointId,
      status: RollbackStatus.PENDING,
      progress: 0,
      startedAt: new Date(),
      strategy: options?.strategy || RollbackStrategy.IMMEDIATE,
      log: []
    };

    // Store operation
    await this.store.storeOperation(operation);
    this.activeOperations.set(operation.id, operation);

    // Start rollback execution
    this.executeRollback(operation, rollbackPoint, options).catch(error => {
      this.handleRollbackError(operation, error);
    });

    return operation;
  }

  /**
   * Get rollback operation status
   */
  async getRollbackOperation(operationId: string): Promise<RollbackOperation | null> {
    return this.store.getOperation(operationId);
  }

  /**
   * Cancel a rollback operation
   */
  async cancelRollback(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.status !== RollbackStatus.IN_PROGRESS) {
      return false;
    }

    operation.status = RollbackStatus.CANCELLED;
    operation.completedAt = new Date();
    await this.store.updateOperation(operation);
    this.activeOperations.delete(operationId);

    this.emit('rollback-completed', operation);
    return true;
  }

  /**
   * Delete a rollback point and its snapshots
   */
  async deleteRollbackPoint(id: string): Promise<boolean> {
    // Delete snapshots
    this.snapshotManager.deleteSnapshotsForRollbackPoint(id);

    // Delete rollback point
    return this.store.removeRollbackPoint(id);
  }

  /**
   * Clean up expired rollback points and operations
   */
  async cleanup(): Promise<{ removedPoints: number; removedOperations: number; removedSnapshots: number }> {
    const storeCleanup = await this.store.cleanup();
    const removedSnapshots = await this.snapshotManager.cleanup();

    this.emit('cleanup-completed', storeCleanup.removedPoints + storeCleanup.removedOperations + removedSnapshots);

    return {
      removedPoints: storeCleanup.removedPoints,
      removedOperations: storeCleanup.removedOperations,
      removedSnapshots
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): RollbackMetrics {
    const storeMetrics = this.store.getMetrics();
    const snapshotUsage = this.snapshotManager.getMemoryUsage();

    return {
      ...storeMetrics,
      memoryUsage: storeMetrics.memoryUsage + snapshotUsage.totalSize
    };
  }

  /**
   * Shutdown the rollback manager
   */
  async shutdown(): Promise<void> {
    // Cancel all active operations
    for (const operation of Array.from(this.activeOperations.values())) {
      await this.cancelRollback(operation.id);
    }

    // Shutdown store
    await this.store.shutdown();

    // Clear snapshots
    this.snapshotManager.clear();
  }

  /**
   * Execute a rollback operation
   */
  private async executeRollback(
    operation: RollbackOperation,
    rollbackPoint: RollbackPoint,
    options?: {
      conflictResolution?: ConflictResolution;
      dryRun?: boolean;
    }
  ): Promise<void> {
    try {
      // Update operation status
      operation.status = RollbackStatus.IN_PROGRESS;
      operation.progress = 0;
      await this.store.updateOperation(operation);

      this.emit('rollback-started', operation);

      // Generate diff
      const diff = await this.generateDiff(rollbackPoint.id);

      // Get snapshots
      const snapshots = this.snapshotManager.getSnapshotsForRollbackPoint(rollbackPoint.id);

      // Determine strategy if not specified
      let strategy = operation.strategy;
      if (!strategy || strategy === RollbackStrategy.IMMEDIATE) {
        strategy = RollbackStrategyFactory.getRecommendedStrategy({
          operation,
          targetRollbackPoint: rollbackPoint,
          snapshots,
          diff: diff.changes,
          conflictResolution:
            options?.conflictResolution ||
            ({ strategy: ConflictStrategy.ABORT, timestamp: new Date(), resolvedBy: 'system' } as unknown as ConflictResolution)
        });
      }

      // Create strategy instance
      const strategyInstance = RollbackStrategyFactory.createStrategy(strategy);

      // Set up progress and logging handlers
      const context = {
        operation,
        targetRollbackPoint: rollbackPoint,
        snapshots,
        diff: diff.changes,
        conflictResolution:
          options?.conflictResolution ||
          ({ strategy: ConflictStrategy.ABORT, timestamp: new Date(), resolvedBy: 'system' } as unknown as ConflictResolution),
        onProgress: (progress: number) => {
          operation.progress = progress;
          this.store.updateOperation(operation);
          this.emit('rollback-progress', operation.id, progress);
        },
        onLog: (entry: RollbackLogEntry) => {
          operation.log.push(entry);
          this.store.updateOperation(operation);
        }
      };

      // Validate strategy can handle this rollback
      const canHandle = await strategyInstance.validate(context);
      if (!canHandle) {
        throw new RollbackError(
          `Strategy ${strategy} cannot handle this rollback`,
          'STRATEGY_VALIDATION_FAILED',
          { strategy, rollbackPointId: rollbackPoint.id }
        );
      }

      // Execute the rollback (skip actual execution if dry run)
      if (!options?.dryRun) {
        await strategyInstance.execute(context);
      }

      // Mark as completed
      operation.status = RollbackStatus.COMPLETED;
      operation.progress = 100;
      operation.completedAt = new Date();
      await this.store.updateOperation(operation);

      this.activeOperations.delete(operation.id);
      this.emit('rollback-completed', operation);

    } catch (error) {
      await this.handleRollbackError(operation, error);
    }
  }

  /**
   * Handle rollback operation errors
   */
  private async handleRollbackError(operation: RollbackOperation, error: any): Promise<void> {
    operation.status = RollbackStatus.FAILED;
    operation.error = error instanceof Error ? error.message : String(error);
    operation.completedAt = new Date();

    // Log the error
    operation.log.push({
      timestamp: new Date(),
      level: 'error',
      message: 'Rollback operation failed',
      data: { error: operation.error }
    });

    await this.store.updateOperation(operation);
    this.activeOperations.delete(operation.id);

    this.emit('rollback-failed', operation, error);
  }

  /**
   * Capture snapshots of current state
   */
  private async captureSnapshots(rollbackPointId: string): Promise<void> {
    try {
      // Capture knowledge graph entities
      if (this.knowledgeGraphService) {
        const entities = await this.knowledgeGraphService.getEntities();
        await this.snapshotManager.createSnapshot(
          rollbackPointId,
          SnapshotType.ENTITY,
          entities,
          { source: 'knowledge-graph' }
        );

        const relationships = await this.knowledgeGraphService.getRelationships();
        await this.snapshotManager.createSnapshot(
          rollbackPointId,
          SnapshotType.RELATIONSHIP,
          relationships,
          { source: 'knowledge-graph' }
        );
      }

      // Capture session state
      if (this.sessionManager) {
        const sessionId = this.sessionManager.getCurrentSessionId();
        if (sessionId) {
          const sessionData = await this.sessionManager.getSessionData(sessionId);
          await this.snapshotManager.createSnapshot(
            rollbackPointId,
            SnapshotType.SESSION_STATE,
            sessionData,
            { sessionId, source: 'session-manager' }
          );
        }
      }

      // Capture file system state (if configured)
      // This would be implemented based on specific requirements

    } catch (error) {
      throw new RollbackError(
        'Failed to capture snapshots',
        'SNAPSHOT_CAPTURE_FAILED',
        { rollbackPointId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
