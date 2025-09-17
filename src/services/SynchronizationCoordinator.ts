/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */

import { EventEmitter } from "events";
import { KnowledgeGraphService } from "./KnowledgeGraphService.js";
import { ASTParser } from "./ASTParser.js";
import { DatabaseService } from "./DatabaseService.js";
import { FileChange } from "./FileWatcher.js";
import { GraphRelationship, RelationshipType } from "../models/relationships.js";
import { GitService } from "./GitService.js";

export interface SyncOperation {
  id: string;
  type: "full" | "incremental" | "partial";
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  startTime: Date;
  endTime?: Date;
  filesProcessed: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  entitiesDeleted: number;
  relationshipsCreated: number;
  relationshipsUpdated: number;
  relationshipsDeleted: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
  rollbackPoint?: string;
}

export interface SyncError {
  file: string;
  type: "parse" | "database" | "conflict" | "unknown";
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface SyncConflict {
  entityId: string;
  type: "version_conflict" | "deletion_conflict" | "relationship_conflict";
  description: string;
  resolution?: "overwrite" | "merge" | "skip";
  timestamp: Date;
}

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  rollbackOnError?: boolean;
  conflictResolution?: "overwrite" | "merge" | "skip" | "manual";
  batchSize?: number;
}

export class SynchronizationCoordinator extends EventEmitter {
  private activeOperations = new Map<string, SyncOperation>();
  private completedOperations = new Map<string, SyncOperation>();
  private operationQueue: SyncOperation[] = [];
  private isProcessing = false;
  private paused = false;
  private resumeWaiters: Array<() => void> = [];
  private retryQueue = new Map<
    string,
    { operation: SyncOperation; attempts: number }
  >();
  private maxRetryAttempts = 3;
  private retryDelay = 5000; // 5 seconds

  // Collect relationships that couldn't be resolved during per-file processing
  private unresolvedRelationships: Array<{
    relationship: import("../models/relationships.js").GraphRelationship;
    sourceFilePath?: string;
  }> = [];

  // Runtime tuning knobs per operation (can be updated during sync)
  private tuning = new Map<string, { maxConcurrency?: number; batchSize?: number }>();

  // Local symbol index to speed up same-file relationship resolution
  private localSymbolIndex: Map<string, string> = new Map();

  constructor(
    private kgService: KnowledgeGraphService,
    private astParser: ASTParser,
    private dbService: DatabaseService
  ) {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on("operationCompleted", this.handleOperationCompleted.bind(this));
    this.on("operationFailed", this.handleOperationFailed.bind(this));
    this.on("conflictDetected", this.handleConflictDetected.bind(this));
  }

  // Update tuning for an active operation; applies on next batch boundary
  updateTuning(
    operationId: string,
    tuning: { maxConcurrency?: number; batchSize?: number }
  ): boolean {
    const op = this.activeOperations.get(operationId);
    if (!op) return false;
    const current = this.tuning.get(operationId) || {};
    const merged = { ...current } as { maxConcurrency?: number; batchSize?: number };
    if (typeof tuning.maxConcurrency === 'number' && isFinite(tuning.maxConcurrency)) {
      merged.maxConcurrency = Math.max(1, Math.min(Math.floor(tuning.maxConcurrency), 64));
    }
    if (typeof tuning.batchSize === 'number' && isFinite(tuning.batchSize)) {
      merged.batchSize = Math.max(1, Math.min(Math.floor(tuning.batchSize), 5000));
    }
    this.tuning.set(operationId, merged);
    this.emit('syncProgress', op, { phase: 'tuning_updated', progress: 0 });
    return true;
  }

  // Convenience methods used by integration tests
  async startSync(): Promise<string> {
    return this.startFullSynchronization({});
  }

  async stopSync(): Promise<void> {
    // Halt processing of the queue
    this.isProcessing = false;
    // Mark all active operations as completed to simulate stop
    const now = new Date();
    for (const [id, op] of this.activeOperations.entries()) {
      if (op.status === "running" || op.status === "pending") {
        op.status = "completed";
        op.endTime = now;
        this.completedOperations.set(id, op);
        this.activeOperations.delete(id);
        this.emit("operationCompleted", op);
      }
    }
    // Clear queued operations
    this.operationQueue = [];
  }

  async startFullSynchronization(options: SyncOptions = {}): Promise<string> {
    // Default: do not include embeddings during full sync; generate them in background later
    if (options.includeEmbeddings === undefined) {
      options.includeEmbeddings = false;
    }
    const operation: SyncOperation = {
      id: `full_sync_${Date.now()}`,
      type: "full",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
    };

    // Attach options to the operation so workers can consult them
    ;(operation as any).options = options;

    this.activeOperations.set(operation.id, operation);
    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  async synchronizeFileChanges(changes: FileChange[]): Promise<string> {
    const operation: SyncOperation = {
      id: `incremental_sync_${Date.now()}`,
      type: "incremental",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
    };

    // Store changes for processing
    (operation as any).changes = changes;

    this.activeOperations.set(operation.id, operation);
    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, 30000);

    return operation.id;
  }

  async synchronizePartial(updates: PartialUpdate[]): Promise<string> {
    const operation: SyncOperation = {
      id: `partial_sync_${Date.now()}`,
      type: "partial",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
    };

    // Store updates for processing
    (operation as any).updates = updates;

    this.activeOperations.set(operation.id, operation);
    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {
      // Begin processing immediately to avoid pending state in edge cases
      void this.processQueue();
    }

    // Guard against lingering 'pending' state under heavy load
    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, 30000);

    return operation.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.operationQueue.length > 0) {
      // Respect paused state before starting the next operation
      if (this.paused) {
        await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
      }
      const operation = this.operationQueue.shift()!;
      operation.status = "running";

      try {
        switch (operation.type) {
          case "full":
            await this.performFullSync(operation);
            break;
          case "incremental":
            await this.performIncrementalSync(operation);
            break;
          case "partial":
            await this.performPartialSync(operation);
            break;
        }

        operation.status = "completed";
        operation.endTime = new Date();
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationCompleted", operation);
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: false,
        });

        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
      }
    }

    this.isProcessing = false;
  }

  // Pause/resume controls
  pauseSync(): void {
    this.paused = true;
  }

  resumeSync(): void {
    if (!this.paused) return;
    this.paused = false;
    const waiters = this.resumeWaiters.splice(0);
    for (const w of waiters) {
      try { w(); } catch {}
    }
    // If there are queued operations and not currently processing, resume processing
    if (!this.isProcessing && this.operationQueue.length > 0) {
      void this.processQueue();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  private async performFullSync(operation: SyncOperation): Promise<void> {
    // Implementation for full synchronization
    const scanStart = new Date();
    this.emit("syncProgress", operation, { phase: "scanning", progress: 0 });

    // Ensure a Module entity exists for the root package if applicable (best-effort)
    try {
      const { ModuleIndexer } = await import('./ModuleIndexer.js');
      const mi = new ModuleIndexer(this.kgService);
      await mi.indexRootPackage().catch(() => {});
    } catch {}

    // Scan all source files
    const files = await this.scanSourceFiles();

    this.emit("syncProgress", operation, { phase: "parsing", progress: 0.2 });

    // Local helper to cooperatively pause execution between units of work
    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };

    // Process files in batches
    const opts = ((operation as any).options || {}) as SyncOptions;
    const includeEmbeddings = opts.includeEmbeddings === true; // default is false; only true when explicitly requested

    // Helper to process a single file
    const processFile = async (file: string) => {
      try {
        const result = await this.astParser.parseFile(file);

          // Build local index for this file's symbols to avoid DB lookups
          for (const ent of result.entities) {
            if ((ent as any)?.type === 'symbol') {
              const nm = (ent as any).name as string | undefined;
              const p = (ent as any).path as string | undefined;
              if (nm && p) {
                const filePath = p.includes(":") ? p.split(":")[0] : p;
                this.localSymbolIndex.set(`${filePath}:${nm}`, ent.id);
              }
            }
          }

          // Detect and handle conflicts before creating entities
          if (result.entities.length > 0 || result.relationships.length > 0) {
            try {
              const conflicts = await this.detectConflicts(
                result.entities,
                result.relationships
              );
              if (conflicts.length > 0) {
                operation.conflicts.push(...conflicts);
                this.emit("conflictsDetected", operation, conflicts);

                // Auto-resolve conflicts if configured
                // For now, we'll just log them
                console.warn(
                  `⚠️ ${conflicts.length} conflicts detected in ${file}`
                );
              }
            } catch (conflictError) {
              operation.errors.push({
                file,
                type: "conflict",
                message:
                  conflictError instanceof Error
                    ? conflictError.message
                    : "Conflict detection failed",
                timestamp: new Date(),
                recoverable: true,
              });
            }
          }

          // Accumulate entities and relationships for batch processing
          (operation as any)._batchEntities = ((operation as any)._batchEntities || []).concat(result.entities);
          const relsWithSource = result.relationships.map(r => ({ ...(r as any), __sourceFile: file }));
          (operation as any)._batchRelationships = ((operation as any)._batchRelationships || []).concat(relsWithSource as any);

          operation.filesProcessed++;
        } catch (error) {
          operation.errors.push({
            file,
            type: "parse",
            message: error instanceof Error ? error.message : "Parse error",
            timestamp: new Date(),
            recoverable: true,
          });
        }
      };

    for (let i = 0; i < files.length; ) {
      const tn = this.tuning.get(operation.id) || {};
      const bsRaw = tn.batchSize ?? (opts as any).batchSize ?? 60;
      const batchSize = Math.max(1, Math.min(Math.floor(bsRaw), 1000));
      const mcRaw = tn.maxConcurrency ?? opts.maxConcurrency ?? 12;
      const maxConcurrency = Math.max(1, Math.min(Math.floor(mcRaw), batchSize));

      const batch = files.slice(i, i + batchSize);
      i += batchSize;

      // Run a simple worker pool to process this batch concurrently
      let idx = 0;
      const worker = async () => {
        while (idx < batch.length) {
          const current = idx++;
          await awaitIfPaused();
          await processFile(batch[current]);
        }
      };
      const workers = Array.from({ length: Math.min(maxConcurrency, batch.length) }, () => worker());
      await Promise.allSettled(workers);

      // After parsing a batch of files, write entities in bulk, then relationships
      const batchEntities: any[] = (operation as any)._batchEntities || [];
      const batchRelationships: any[] = (operation as any)._batchRelationships || [];
      (operation as any)._batchEntities = [];
      (operation as any)._batchRelationships = [];

      if (batchEntities.length > 0) {
        try {
          await this.kgService.createEntitiesBulk(batchEntities, { skipEmbedding: true });
          operation.entitiesCreated += batchEntities.length;
        } catch (e) {
          // Fallback to per-entity creation
          for (const ent of batchEntities) {
            try {
              await this.kgService.createEntity(ent, { skipEmbedding: true });
              operation.entitiesCreated++;
            } catch (err) {
              operation.errors.push({
                file: (ent as any).path || 'unknown',
                type: "database",
                message: `Entity create failed: ${err instanceof Error ? err.message : 'unknown'}`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
          }
        }
      }

      if (batchRelationships.length > 0) {
        // Resolve targets first, then create in bulk grouped by type
        const resolved: any[] = [];
        for (const relationship of batchRelationships) {
          try {
            // Fast path: if toEntityId points to an existing node, accept; else try to resolve
            const toEntity = await this.kgService.getEntity((relationship as any).toEntityId);
            if (toEntity) {
              resolved.push(relationship);
              continue;
            }
          } catch {}
          try {
            const resolvedId = await (this as any).resolveRelationshipTarget(
              relationship,
              (relationship as any).__sourceFile || undefined
            );
            if (resolvedId) {
              resolved.push({ ...(relationship as any), toEntityId: resolvedId });
            } else {
              this.unresolvedRelationships.push({ relationship });
            }
          } catch (relationshipError) {
            operation.errors.push({
              file: "coordinator",
              type: "database",
              message: `Failed to resolve relationship: ${
                relationshipError instanceof Error
                  ? relationshipError.message
                  : "Unknown error"
              }`,
              timestamp: new Date(),
              recoverable: true,
            });
            this.unresolvedRelationships.push({ relationship });
          }
        }
        if (resolved.length > 0) {
          try {
            await this.kgService.createRelationshipsBulk(resolved as any, { validate: false });
            operation.relationshipsCreated += resolved.length;
          } catch (e) {
            // Fallback to per-relationship creation if bulk fails
            for (const r of resolved) {
              try {
                await this.kgService.createRelationship(r as any, undefined, undefined, { validate: false });
                operation.relationshipsCreated++;
              } catch (err) {
                operation.errors.push({
                  file: "coordinator",
                  type: "database",
                  message: `Failed to create relationship: ${err instanceof Error ? err.message : 'unknown'}`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
          }
        }
      }

      // Batch embeddings after entities to avoid per-entity overhead
      if (includeEmbeddings && batchEntities.length > 0) {
        try {
          await this.kgService.createEmbeddingsBatch(batchEntities);
        } catch (e) {
          operation.errors.push({
            file: "coordinator",
            type: "database",
            message: `Batch embedding failed: ${e instanceof Error ? e.message : 'unknown'}`,
            timestamp: new Date(),
            recoverable: true,
          });
        }
      } else if (!includeEmbeddings && batchEntities.length > 0) {
        // Accumulate for background embedding after sync completes
        (operation as any)._embedQueue = ((operation as any)._embedQueue || []).concat(batchEntities);
      }

      const progress = 0.2 + (i / files.length) * 0.8;
      this.emit("syncProgress", operation, { phase: "parsing", progress });
    }

    // Post-pass: attempt to resolve and create any deferred relationships now that all entities exist
    await this.runPostResolution(operation);

    // Deactivate edges not seen during this scan window (best-effort)
    try { await this.kgService.finalizeScan(scanStart); } catch {}

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });

    // Fire-and-forget background embeddings if they were skipped during full sync
    const pendingToEmbed: any[] = (operation as any)._embedQueue || [];
    if (pendingToEmbed.length > 0) {
      // Run in background without blocking completion
      const chunks: any[][] = [];
      const chunkSize = 200;
      for (let i = 0; i < pendingToEmbed.length; i += chunkSize) {
        chunks.push(pendingToEmbed.slice(i, i + chunkSize));
      }
      (async () => {
        for (const c of chunks) {
          try {
            await this.kgService.createEmbeddingsBatch(c);
          } catch (e) {
            // log and continue
            try { console.warn("Background embedding batch failed:", e); } catch {}
          }
        }
        try { console.log(`✅ Background embeddings created for ${pendingToEmbed.length} entities`); } catch {}
      })().catch(() => {});
    }
  }

  private async performIncrementalSync(
    operation: SyncOperation
  ): Promise<void> {
    // Implementation for incremental synchronization
    const scanStart = new Date();
    this.emit("syncProgress", operation, {
      phase: "processing_changes",
      progress: 0,
    });

    // Get changes from operation
    const changes = ((operation as any).changes as FileChange[]) || [];

    if (changes.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalChanges = changes.length;
    let processedChanges = 0;

    // Local helper to cooperatively pause execution between units of work
    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };

    // Create or update a session entity for this incremental operation
    const sessionId = `session_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: sessionId,
        type: "session",
        startTime: operation.startTime,
        status: "active",
        agentType: "sync",
        changes: [],
        specs: [],
      } as any);
    } catch {}

    // Track entities to embed in batch and session relationships buffer
    const toEmbed: any[] = [];
    const sessionRelBuffer: Array<import("../models/relationships.js").GraphRelationship> = [];
    // Track changed entities for checkpointing and change metadata
    const changedSeeds = new Set<string>();
    // Create a Change entity to associate temporal edges for this batch
    const changeId = `change_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: changeId,
        type: "change",
        changeType: "update",
        entityType: "batch",
        entityId: operation.id,
        timestamp: new Date(),
        sessionId,
      } as any);
      // Link session to this change descriptor
      try {
        await this.kgService.createRelationship({
          id: `rel_${sessionId}_${changeId}_DEPENDS_ON_CHANGE`,
          fromEntityId: sessionId,
          toEntityId: changeId,
          type: RelationshipType.DEPENDS_ON_CHANGE as any,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        } as any, undefined, undefined, { validate: false });
      } catch {}
    } catch {}

    for (const change of changes) {
      await awaitIfPaused();
      try {
        this.emit("syncProgress", operation, {
          phase: "processing_changes",
          progress: (processedChanges / totalChanges) * 0.8,
        });

        switch (change.type) {
          case "create":
          case "modify":
            // Parse the file and update graph
            let parseResult;
            try {
              parseResult = await this.astParser.parseFileIncremental(
                change.path
              );
            } catch (error) {
              // Handle parsing errors (e.g., invalid file paths)
              operation.errors.push({
                file: change.path,
                type: "parse",
                message: `Failed to parse file: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
                timestamp: new Date(),
                recoverable: false,
              });
              processedChanges++;
              continue; // Skip to next change
            }

            // Detect conflicts before applying changes
            if (
              parseResult.entities.length > 0 ||
              parseResult.relationships.length > 0
            ) {
              const conflicts = await this.detectConflicts(
                parseResult.entities,
                parseResult.relationships
              );

              if (conflicts.length > 0) {
                operation.conflicts.push(...conflicts);
                console.warn(
                  `⚠️ ${conflicts.length} conflicts detected in ${change.path}`
                );
              }
            }

            // Apply entities
            for (const entity of parseResult.entities) {
              try {
                if (
                  parseResult.isIncremental &&
                  parseResult.updatedEntities?.includes(entity)
                ) {
                  await this.kgService.updateEntity(entity.id, entity, { skipEmbedding: true });
                  operation.entitiesUpdated++;
                  toEmbed.push(entity);
                } else {
                  await this.kgService.createEntity(entity, { skipEmbedding: true });
                  operation.entitiesCreated++;
                  toEmbed.push(entity);
                }
              } catch (error) {
                operation.errors.push({
                  file: change.path,
                  type: "database",
                  message: `Failed to process entity ${entity.id}: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }

            // Apply relationships (current layer). Keep for idempotency; uses MERGE semantics downstream.
            for (const relationship of parseResult.relationships) {
              try {
                const created = await this.resolveAndCreateRelationship(
                  relationship,
                  change.path
                );
                if (created) {
                  operation.relationshipsCreated++;
                } else {
                  this.unresolvedRelationships.push({
                    relationship,
                    sourceFilePath: change.path,
                  });
                }
              } catch (error) {
                operation.errors.push({
                  file: change.path,
                  type: "database",
                  message: `Failed to create relationship: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
                // Defer for post-pass resolution
                this.unresolvedRelationships.push({
                  relationship,
                  sourceFilePath: change.path,
                });
              }
            }

            // Handle removed entities if incremental
            if (parseResult.isIncremental && parseResult.removedEntities) {
              for (const entity of parseResult.removedEntities) {
                try {
                  // Before deletion, attach temporal relationship to change and session impact
                  const now2 = new Date();
                  try {
                    await this.kgService.createRelationship({
                      id: `rel_${entity.id}_${changeId}_REMOVED_IN`,
                      fromEntityId: entity.id,
                      toEntityId: changeId,
                      type: RelationshipType.REMOVED_IN as any,
                      created: now2,
                      lastModified: now2,
                      version: 1,
                    } as any, undefined, undefined, { validate: false });
                  } catch {}
                  // Attach MODIFIED_BY with git metadata (best-effort)
                  try {
                    const git = new GitService();
                    const info = await git.getLastCommitInfo(change.path);
                    await this.kgService.createRelationship({
                      id: `rel_${entity.id}_${sessionId}_MODIFIED_BY`,
                      fromEntityId: entity.id,
                      toEntityId: sessionId,
                      type: RelationshipType.MODIFIED_BY as any,
                      created: now2,
                      lastModified: now2,
                      version: 1,
                      metadata: info ? { author: info.author, email: info.email, commitHash: info.hash, date: info.date } : { source: 'sync' },
                    } as any, undefined, undefined, { validate: false });
                  } catch {}
                  try {
                    sessionRelBuffer.push({
                      id: `rel_${sessionId}_${entity.id}_SESSION_IMPACTED`,
                      fromEntityId: sessionId,
                      toEntityId: entity.id,
                      type: RelationshipType.SESSION_IMPACTED,
                      created: now2,
                      lastModified: now2,
                      version: 1,
                      metadata: { severity: 'high', file: change.path },
                    } as any);
                  } catch {}
                  changedSeeds.add(entity.id);
                  await this.kgService.deleteEntity(entity.id);
                  operation.entitiesDeleted++;
                } catch (error) {
                  const label = (entity as any).path || (entity as any).name || (entity as any).title || entity.id;
                  operation.errors.push({
                    file: change.path,
                    type: "database",
                    message: `Failed to delete entity ${label}: ${
                      error instanceof Error ? error.message : "Unknown"
                    }`,
                    timestamp: new Date(),
                    recoverable: true,
                  });
                }
              }
            }

            // History layer (versions + validity intervals) when incremental
            if (parseResult.isIncremental) {
              const now = new Date();

              // Append versions for updated entities
              if (Array.isArray(parseResult.updatedEntities)) {
                for (const ent of parseResult.updatedEntities) {
                  try {
                    await this.kgService.appendVersion(ent, { timestamp: now });
                    operation.entitiesUpdated++;
                    // Queue session relationship for modified entity
                    try {
                      const git = new GitService();
                      const diff = await git.getUnifiedDiff(change.path, 3);
                      // Extract small before/after snippets from first hunk
                      let beforeSnippet = '';
                      let afterSnippet = '';
                      if (diff) {
                        const lines = diff.split('\n');
                        for (const ln of lines) {
                          if (ln.startsWith('---') || ln.startsWith('+++') || ln.startsWith('@@')) continue;
                          if (ln.startsWith('-') && beforeSnippet.length < 400) beforeSnippet += ln.substring(1) + '\n';
                          if (ln.startsWith('+') && afterSnippet.length < 400) afterSnippet += ln.substring(1) + '\n';
                          if (beforeSnippet.length >= 400 && afterSnippet.length >= 400) break;
                        }
                      }
                      sessionRelBuffer.push({
                        id: `rel_${sessionId}_${ent.id}_SESSION_MODIFIED`,
                        fromEntityId: sessionId,
                        toEntityId: ent.id,
                        type: RelationshipType.SESSION_MODIFIED,
                        created: now,
                        lastModified: now,
                        version: 1,
                        metadata: {
                          file: change.path,
                          stateTransition: {
                            from: 'unknown',
                            to: 'working',
                            verifiedBy: 'manual',
                            confidence: 0.5,
                            criticalChange: {
                              entityId: ent.id,
                              beforeSnippet: beforeSnippet.trim() || undefined,
                              afterSnippet: afterSnippet.trim() || undefined,
                            },
                          },
                        },
                      } as any);
                    } catch {
                      sessionRelBuffer.push({
                        id: `rel_${sessionId}_${ent.id}_SESSION_MODIFIED`,
                        fromEntityId: sessionId,
                        toEntityId: ent.id,
                        type: RelationshipType.SESSION_MODIFIED,
                        created: now,
                        lastModified: now,
                        version: 1,
                        metadata: { file: change.path },
                      } as any);
                    }
                    // Also mark session impacted and link entity to the change
                    sessionRelBuffer.push({
                      id: `rel_${sessionId}_${ent.id}_SESSION_IMPACTED`,
                      fromEntityId: sessionId,
                      toEntityId: ent.id,
                      type: RelationshipType.SESSION_IMPACTED,
                      created: now,
                      lastModified: now,
                      version: 1,
                      metadata: { severity: 'medium', file: change.path },
                    } as any);
                    try {
                      await this.kgService.createRelationship({
                        id: `rel_${ent.id}_${changeId}_MODIFIED_IN`,
                        fromEntityId: ent.id,
                        toEntityId: changeId,
                        type: RelationshipType.MODIFIED_IN as any,
                        created: now,
                        lastModified: now,
                        version: 1,
                      } as any, undefined, undefined, { validate: false });
                    } catch {}
                    // Attach MODIFIED_BY with git metadata (best-effort)
                    try {
                      const git = new GitService();
                      const info = await git.getLastCommitInfo(change.path);
                      await this.kgService.createRelationship({
                        id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                        fromEntityId: ent.id,
                        toEntityId: sessionId,
                        type: RelationshipType.MODIFIED_BY as any,
                        created: now,
                        lastModified: now,
                        version: 1,
                        metadata: info ? { author: info.author, email: info.email, commitHash: info.hash, date: info.date } : { source: 'sync' },
                      } as any, undefined, undefined, { validate: false });
                    } catch {}
                    changedSeeds.add(ent.id);
                  } catch (err) {
                    operation.errors.push({
                      file: change.path,
                      type: "database",
                      message: `appendVersion failed for ${ent.id}: ${err instanceof Error ? err.message : 'unknown'}`,
                      timestamp: new Date(),
                      recoverable: true,
                    });
                  }
                }
              }

              // Open edges for added relationships (with resolution)
              if (Array.isArray((parseResult as any).addedRelationships)) {
                for (const rel of (parseResult as any).addedRelationships as GraphRelationship[]) {
                  try {
                    let toId = rel.toEntityId;
                    // Resolve placeholder targets like kind:name or import:module:symbol
                    if (!toId || String(toId).includes(":")) {
                      const resolved = await (this as any).resolveRelationshipTarget(rel, change.path);
                      if (resolved) toId = resolved;
                    }
                    if (toId && rel.fromEntityId) {
                      await this.kgService.openEdge(rel.fromEntityId, toId as any, rel.type, now);
                      // Keep edge evidence/properties in sync during incremental updates
                      try {
                        const enriched = { ...rel, toEntityId: toId } as GraphRelationship;
                        await this.kgService.upsertEdgeEvidenceBulk([enriched]);
                      } catch {}
                      operation.relationshipsUpdated++;
                    }
                  } catch (err) {
                    operation.errors.push({
                      file: change.path,
                      type: "database",
                      message: `openEdge failed: ${err instanceof Error ? err.message : 'unknown'}`,
                      timestamp: new Date(),
                      recoverable: true,
                    });
                  }
                }
              }

              // Close edges for removed relationships (with resolution)
              if (Array.isArray((parseResult as any).removedRelationships)) {
                for (const rel of (parseResult as any).removedRelationships as GraphRelationship[]) {
                  try {
                    let toId = rel.toEntityId;
                    if (!toId || String(toId).includes(":")) {
                      const resolved = await (this as any).resolveRelationshipTarget(rel, change.path);
                      if (resolved) toId = resolved;
                    }
                    if (toId && rel.fromEntityId) {
                      await this.kgService.closeEdge(rel.fromEntityId, toId as any, rel.type, now);
                      operation.relationshipsUpdated++;
                    }
                  } catch (err) {
                    operation.errors.push({
                      file: change.path,
                      type: "database",
                      message: `closeEdge failed: ${err instanceof Error ? err.message : 'unknown'}`,
                      timestamp: new Date(),
                      recoverable: true,
                    });
                  }
                }
              }

              // Created entities: attach CREATED_IN and mark impacted
              if (Array.isArray((parseResult as any).addedEntities)) {
                for (const ent of (parseResult as any).addedEntities as any[]) {
                  try {
                    const now3 = new Date();
                    await this.kgService.createRelationship({
                      id: `rel_${ent.id}_${changeId}_CREATED_IN`,
                      fromEntityId: ent.id,
                      toEntityId: changeId,
                      type: RelationshipType.CREATED_IN as any,
                      created: now3,
                      lastModified: now3,
                      version: 1,
                    } as any, undefined, undefined, { validate: false });
                    // Also MODIFIED_BY with git metadata (best-effort)
                    try {
                      const git = new GitService();
                      const info = await git.getLastCommitInfo(change.path);
                      await this.kgService.createRelationship({
                        id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                        fromEntityId: ent.id,
                        toEntityId: sessionId,
                        type: RelationshipType.MODIFIED_BY as any,
                        created: now3,
                        lastModified: now3,
                        version: 1,
                        metadata: info ? { author: info.author, email: info.email, commitHash: info.hash, date: info.date } : { source: 'sync' },
                      } as any, undefined, undefined, { validate: false });
                    } catch {}
                    try {
                      const git = new GitService();
                      const diff = await git.getUnifiedDiff(change.path, 2);
                      let afterSnippet = '';
                      if (diff) {
                        const lines = diff.split('\n');
                        for (const ln of lines) {
                          if (ln.startsWith('+++') || ln.startsWith('---') || ln.startsWith('@@')) continue;
                          if (ln.startsWith('+') && afterSnippet.length < 300) afterSnippet += ln.substring(1) + '\n';
                          if (afterSnippet.length >= 300) break;
                        }
                      }
                      sessionRelBuffer.push({
                        id: `rel_${sessionId}_${ent.id}_SESSION_IMPACTED`,
                        fromEntityId: sessionId,
                        toEntityId: ent.id,
                        type: RelationshipType.SESSION_IMPACTED,
                        created: now3,
                        lastModified: now3,
                        version: 1,
                        metadata: {
                          severity: 'low',
                          file: change.path,
                          stateTransition: {
                            from: 'unknown',
                            to: 'working',
                            verifiedBy: 'manual',
                            confidence: 0.4,
                            criticalChange: {
                              entityId: ent.id,
                              afterSnippet: afterSnippet.trim() || undefined,
                            },
                          },
                        },
                      } as any);
                    } catch {
                      sessionRelBuffer.push({
                        id: `rel_${sessionId}_${ent.id}_SESSION_IMPACTED`,
                        fromEntityId: sessionId,
                        toEntityId: ent.id,
                        type: RelationshipType.SESSION_IMPACTED,
                        created: now3,
                        lastModified: now3,
                        version: 1,
                        metadata: { severity: 'low', file: change.path },
                      } as any);
                    }
                    changedSeeds.add(ent.id);
                  } catch {}
                }
              }
            }
            break;

          case "delete":
            // Handle file deletion
            try {
              const fileEntities = await this.kgService.getEntitiesByFile(
                change.path,
                { includeSymbols: true }
              );

              for (const entity of fileEntities) {
                await this.kgService.deleteEntity(entity.id);
                operation.entitiesDeleted++;
              }

              console.log(
                `🗑️ Removed ${fileEntities.length} entities from deleted file ${change.path}`
              );
            } catch (error) {
              operation.errors.push({
                file: change.path,
                type: "database",
                message: `Failed to handle file deletion: ${
                  error instanceof Error ? error.message : "Unknown"
                }`,
                timestamp: new Date(),
                recoverable: false,
              });
            }
            break;
        }

        operation.filesProcessed++;
        processedChanges++;
      } catch (error) {
        operation.errors.push({
          file: change.path,
          type: "parse",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: true,
        });
      }
    }

    // Post-pass for any unresolved relationships from this batch
    await this.runPostResolution(operation);

    // Bulk create session relationships
    if (sessionRelBuffer.length > 0) {
      try {
        await this.kgService.createRelationshipsBulk(sessionRelBuffer, { validate: false });
      } catch (e) {
        operation.errors.push({
          file: "coordinator",
          type: "database",
          message: `Bulk session rels failed: ${e instanceof Error ? e.message : 'unknown'}`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    }

    // Create a small checkpoint for changed neighborhood and link session -> checkpoint
    try {
      const seeds = Array.from(changedSeeds);
      if (seeds.length > 0) {
        const { checkpointId } = await this.kgService.createCheckpoint(seeds, "manual", 2);
        try {
          await this.kgService.createRelationship({
            id: `rel_${sessionId}_${checkpointId}_SESSION_CHECKPOINT`,
            fromEntityId: sessionId,
            toEntityId: checkpointId,
            type: RelationshipType.SESSION_CHECKPOINT as any,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
          } as any, undefined, undefined, { validate: false });
        } catch {}
      }
    } catch {}

    // Batch-generate embeddings for affected entities
    if (toEmbed.length > 0) {
      try {
        await this.kgService.createEmbeddingsBatch(toEmbed);
      } catch (e) {
        operation.errors.push({
          file: "coordinator",
          type: "database",
          message: `Batch embedding failed: ${e instanceof Error ? e.message : 'unknown'}`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    }

    // Deactivate edges not seen during this scan window (best-effort)
    try { await this.kgService.finalizeScan(scanStart); } catch {}

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async performPartialSync(operation: SyncOperation): Promise<void> {
    // Implementation for partial synchronization
    this.emit("syncProgress", operation, {
      phase: "processing_partial",
      progress: 0,
    });

    // Get partial updates from operation
    const updates = ((operation as any).updates as PartialUpdate[]) || [];

    if (updates.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalUpdates = updates.length;
    let processedUpdates = 0;

    for (const update of updates) {
      try {
        this.emit("syncProgress", operation, {
          phase: "processing_partial",
          progress: (processedUpdates / totalUpdates) * 0.9,
        });

        switch (update.type) {
          case "create":
            // Create new entity
            if (update.newValue) {
              try {
                await this.kgService.createEntity(update.newValue);
                operation.entitiesCreated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to create entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "update":
            // Update existing entity
            if (update.changes) {
              try {
                await this.kgService.updateEntity(
                  update.entityId,
                  update.changes
                );
                operation.entitiesUpdated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to update entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "delete":
            // Delete entity
            try {
              await this.kgService.deleteEntity(update.entityId);
              operation.entitiesDeleted++;
            } catch (error) {
              operation.errors.push({
                file: update.entityId,
                type: "database",
                message: `Failed to delete entity: ${
                  error instanceof Error ? error.message : "Unknown"
                }`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
            break;
        }

        processedUpdates++;
      } catch (error) {
        operation.errors.push({
          file: "partial_update",
          type: "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: false,
        });
      }
    }

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async scanSourceFiles(): Promise<string[]> {
    // Scan for source files in the project using fs
    const fs = await import("fs/promises");
    const path = await import("path");

    const files: string[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx"];

    // Directories to scan
    const directories = ["src", "lib", "packages", "tests"];

    // Exclude patterns
    const shouldExclude = (filePath: string): boolean => {
      return (
        filePath.includes("node_modules") ||
        filePath.includes("dist") ||
        filePath.includes("build") ||
        filePath.includes(".git") ||
        filePath.includes("coverage") ||
        filePath.endsWith(".d.ts") ||
        filePath.endsWith(".min.js")
      );
    };

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (shouldExclude(fullPath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (
            entry.isFile() &&
            extensions.some((ext) => fullPath.endsWith(ext))
          ) {
            files.push(path.resolve(fullPath));
          }
        }
      } catch (error) {
        // Directory might not exist, skip silently
      }
    };

    try {
      for (const dir of directories) {
        await scanDirectory(dir);
      }

      // Remove duplicates
      const uniqueFiles = Array.from(new Set(files));
      console.log(`📂 Found ${uniqueFiles.length} source files to scan`);

      return uniqueFiles;
    } catch (error) {
      console.error("Error scanning source files:", error);
      return [];
    }
  }

  private async detectConflicts(
    entities: any[],
    relationships: any[]
  ): Promise<SyncConflict[]> {
    // Placeholder for conflict detection
    // In a full implementation, this would check for version conflicts,
    // concurrent modifications, etc.
    return [];
  }

  async rollbackOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.status !== "failed") {
      return false;
    }

    try {
      // Implement rollback logic
      operation.status = "rolled_back";
      this.emit("operationRolledBack", operation);
      return true;
    } catch (error) {
      this.emit("rollbackFailed", operation, error);
      return false;
    }
  }

  getOperationStatus(operationId: string): SyncOperation | null {
    return (
      this.activeOperations.get(operationId) ||
      this.completedOperations.get(operationId) ||
      null
    );
  }

  getActiveOperations(): SyncOperation[] {
    return Array.from(this.activeOperations.values());
  }

  getQueueLength(): number {
    return this.operationQueue.length;
  }

  async startIncrementalSynchronization(): Promise<string> {
    // Alias for synchronizeFileChanges with empty changes
    return this.synchronizeFileChanges([]);
  }

  async startPartialSynchronization(paths: string[]): Promise<string> {
    // Convert paths to partial updates
    const updates: PartialUpdate[] = paths.map((path) => ({
      entityId: path,
      type: "update" as const,
      changes: {},
    }));

    return this.synchronizePartial(updates);
  }

  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      return false;
    }

    // Remove from active operations
    this.activeOperations.delete(operationId);

    // Remove from queue if pending
    const queueIndex = this.operationQueue.findIndex(
      (op) => op.id === operationId
    );
    if (queueIndex !== -1) {
      this.operationQueue.splice(queueIndex, 1);
    }

    // Remove from retry queue
    this.retryQueue.delete(operationId);

    // Update status
    operation.status = "failed";
    operation.endTime = new Date();

    // Store in completed operations for status queries
    this.completedOperations.set(operationId, operation);

    this.emit("operationCancelled", operation);
    return true;
  }

  getOperationStatistics(): {
    total: number;
    active: number;
    queued: number;
    completed: number;
    failed: number;
    retried: number;
    totalOperations: number;
    completedOperations: number;
    failedOperations: number;
    totalFilesProcessed: number;
    totalEntitiesCreated: number;
    totalErrors: number;
  } {
    const activeOperations = Array.from(this.activeOperations.values());
    const completedOperations = Array.from(this.completedOperations.values());
    const retryOperations = Array.from(this.retryQueue.values());
    const allOperations = [...activeOperations, ...completedOperations];

    const totalFilesProcessed = allOperations.reduce(
      (sum, op) => sum + op.filesProcessed,
      0
    );
    const totalEntitiesCreated = allOperations.reduce(
      (sum, op) => sum + op.entitiesCreated,
      0
    );
    const totalErrors = allOperations.reduce(
      (sum, op) => sum + op.errors.length,
      0
    );

    return {
      total: allOperations.length + this.operationQueue.length,
      active: activeOperations.filter((op) => op.status === "running").length,
      queued: this.operationQueue.length,
      completed: allOperations.filter((op) => op.status === "completed").length,
      failed: allOperations.filter((op) => op.status === "failed").length,
      retried: retryOperations.length,
      totalOperations: allOperations.length + this.operationQueue.length,
      completedOperations: allOperations.filter(
        (op) => op.status === "completed"
      ).length,
      failedOperations: allOperations.filter((op) => op.status === "failed")
        .length,
      totalFilesProcessed,
      totalEntitiesCreated,
      totalErrors,
    };
  }

  private handleOperationCompleted(operation: SyncOperation): void {
    console.log(`✅ Sync operation ${operation.id} completed successfully`);

    // Clear from retry queue if it was a retry
    if (this.retryQueue.has(operation.id)) {
      const retryInfo = this.retryQueue.get(operation.id);
      console.log(
        `✅ Retry successful for operation ${operation.id} after ${retryInfo?.attempts} attempts`
      );
      this.retryQueue.delete(operation.id);
    }

    // Note: Keep completed operations in activeOperations so they can be queried
    // this.activeOperations.delete(operation.id);
  }

  private handleOperationFailed(operation: SyncOperation): void {
    try {
      const msg = operation.errors?.map(e => `${e.type}:${e.message}`).join('; ');
      console.error(`❌ Sync operation ${operation.id} failed: ${msg || 'unknown'}`);
    } catch {
      console.error(`❌ Sync operation ${operation.id} failed:`, operation.errors);
    }

    // Check if operation has recoverable errors
    const hasRecoverableErrors = operation.errors.some((e) => e.recoverable);

    if (hasRecoverableErrors) {
      // Check retry attempts
      const retryInfo = this.retryQueue.get(operation.id);
      const attempts = retryInfo ? retryInfo.attempts : 0;

      if (attempts < this.maxRetryAttempts) {
        console.log(
          `🔄 Scheduling retry ${attempts + 1}/${
            this.maxRetryAttempts
          } for operation ${operation.id}`
        );

        // Store retry info
        this.retryQueue.set(operation.id, {
          operation,
          attempts: attempts + 1,
        });

        // Schedule retry
        setTimeout(() => {
          this.retryOperation(operation);
        }, this.retryDelay * (attempts + 1)); // Exponential backoff
      } else {
        console.error(
          `❌ Max retry attempts reached for operation ${operation.id}`
        );
        this.retryQueue.delete(operation.id);
        this.emit("operationAbandoned", operation);
      }
    } else {
      console.error(
        `❌ Operation ${operation.id} has non-recoverable errors, not retrying`
      );
    }
  }

  private async retryOperation(operation: SyncOperation): Promise<void> {
    console.log(`🔄 Retrying operation ${operation.id}`);

    // Reset operation status
    operation.status = "pending";
    operation.errors = [];
    operation.conflicts = [];

    // Re-add to queue
    this.operationQueue.push(operation);

    // Process if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private handleConflictDetected(conflict: SyncConflict): void {
    console.warn(`⚠️ Sync conflict detected:`, conflict);
    // Could implement conflict resolution logic here
  }

  // Attempt to resolve and create deferred relationships
  private async runPostResolution(operation: SyncOperation): Promise<void> {
    if (this.unresolvedRelationships.length === 0) return;
    this.emit("syncProgress", operation, { phase: "resolving_relationships", progress: 0.95 });

    const pending = this.unresolvedRelationships.splice(0);
    let createdCount = 0;
    for (const item of pending) {
      try {
        const created = await (this as any).resolveAndCreateRelationship(
          item.relationship,
          item.sourceFilePath
        );
        if (created) createdCount++;
      } catch {
        // keep silent; will try in next sync if needed
      }
    }
    if (createdCount > 0) {
      operation.relationshipsCreated += createdCount;
    }
  }
}

export interface PartialUpdate {
  entityId: string;
  changes: Record<string, any>;
  type: "update" | "delete" | "create";
  newValue?: any;
}

export interface FileLikeEntity { path?: string }

declare module "./SynchronizationCoordinator.js" {
  interface SynchronizationCoordinator {
    resolveAndCreateRelationship(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<boolean>;
    resolveRelationshipTarget(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<string | null>;
  }
}

// Implement as prototype methods to avoid reordering class definitions
(SynchronizationCoordinator as any).prototype.resolveAndCreateRelationship = async function (
  this: SynchronizationCoordinator,
  relationship: GraphRelationship,
  sourceFilePath?: string
): Promise<boolean> {
  try {
    const toEntity = await (this as any).kgService.getEntity(
      relationship.toEntityId
    );
    if (toEntity) {
      await (this as any).kgService.createRelationship(relationship, undefined, undefined, { validate: false });
      return true;
    }
  } catch {}

  const resolvedResult = await (this as any).resolveRelationshipTarget(
    relationship,
    sourceFilePath
  );
  const resolvedId = typeof resolvedResult === 'string' ? resolvedResult : (resolvedResult?.id || null);
  if (!resolvedId) return false;
  const enrichedMeta = { ...(relationship as any).metadata } as any;
  if (resolvedResult && typeof resolvedResult === 'object') {
    if (Array.isArray((resolvedResult as any).candidates) && (resolvedResult as any).candidates.length > 0) {
      enrichedMeta.candidates = (resolvedResult as any).candidates.slice(0, 5);
      (relationship as any).ambiguous = ((resolvedResult as any).candidates.length > 1);
      (relationship as any).candidateCount = (resolvedResult as any).candidates.length;
    }
    if ((resolvedResult as any).resolutionPath) enrichedMeta.resolutionPath = (resolvedResult as any).resolutionPath;
    enrichedMeta.resolvedTo = { kind: 'entity', id: resolvedId };
  }
  const resolvedRel = { ...relationship, toEntityId: resolvedId, metadata: enrichedMeta } as GraphRelationship;
  await (this as any).kgService.createRelationship(resolvedRel, undefined, undefined, { validate: false });
  return true;
};

(SynchronizationCoordinator as any).prototype.resolveRelationshipTarget = async function (
  this: SynchronizationCoordinator,
  relationship: GraphRelationship,
  sourceFilePath?: string
): Promise<string | { id: string | null; candidates?: Array<{ id: string; name?: string; path?: string; resolver?: string; score?: number }>; resolutionPath?: string } | null> {
  const to = (relationship.toEntityId as any) || "";

  // Prefer structured toRef when present to avoid brittle string parsing
  const toRef: any = (relationship as any).toRef;
  // Establish a currentFilePath context early using fromRef if provided
  let currentFilePath = sourceFilePath;
  const candidates: Array<{ id: string; name?: string; path?: string; resolver?: string; score?: number }> = [];
  try {
    const fromRef: any = (relationship as any).fromRef;
    if (!currentFilePath && fromRef && typeof fromRef === 'object') {
      if (fromRef.kind === 'fileSymbol' && fromRef.file) {
        currentFilePath = fromRef.file;
      } else if (fromRef.kind === 'entity' && fromRef.id) {
        const ent = await (this as any).kgService.getEntity(fromRef.id);
        const p = (ent as any)?.path as string | undefined;
        if (p) currentFilePath = p.includes(':') ? p.split(':')[0] : p;
      }
    }
  } catch {}
  if (toRef && typeof toRef === 'object') {
    try {
      if (toRef.kind === 'entity' && toRef.id) {
        return { id: toRef.id, candidates, resolutionPath: 'entity' };
      }
      if (toRef.kind === 'fileSymbol' && toRef.file && (toRef.symbol || toRef.name)) {
        const ent = await (this as any).kgService.findSymbolInFile(toRef.file, (toRef.symbol || toRef.name));
        if (ent) return { id: ent.id, candidates, resolutionPath: 'fileSymbol' };
      }
      if (toRef.kind === 'external' && toRef.name) {
        const name = toRef.name as string;
        if (!currentFilePath) {
          try {
            const fromEntity = await (this as any).kgService.getEntity(relationship.fromEntityId);
            if (fromEntity && (fromEntity as any).path) {
              const p = (fromEntity as any).path as string;
              currentFilePath = p.includes(":") ? p.split(":")[0] : p;
            }
          } catch {}
        }
        if (currentFilePath) {
          const local = await (this as any).kgService.findSymbolInFile(currentFilePath, name);
          if (local) { candidates.push({ id: local.id, name: (local as any).name, path: (local as any).path, resolver: 'local', score: 1.0 }); }
          const near = await (this as any).kgService.findNearbySymbols(currentFilePath, name, 5);
          for (const n of near) candidates.push({ id: n.id, name: (n as any).name, path: (n as any).path, resolver: 'nearby' });
        }
        const global = await (this as any).kgService.findSymbolsByName(name);
        for (const g of global) candidates.push({ id: g.id, name: (g as any).name, path: (g as any).path, resolver: 'name' });
        if (candidates.length > 0) return { id: candidates[0].id, candidates, resolutionPath: 'external-name' };
      }
    } catch {}
  }

  // Explicit file placeholder: file:<relPath>:<name>
  {
    const fileMatch = to.match(/^file:(.+?):(.+)$/);
    if (fileMatch) {
      const relPath = fileMatch[1];
      const name = fileMatch[2];
      try {
        const ent = await (this as any).kgService.findSymbolInFile(relPath, name);
        if (ent) return { id: ent.id, candidates, resolutionPath: 'file-placeholder' };
      } catch {}
      return null;
    }
  }

  // Ensure we still have a usable file context for subsequent heuristics
  // (do not redeclare currentFilePath; just populate if missing)
  if (!currentFilePath) {
    try {
      const fromEntity = await (this as any).kgService.getEntity(
        relationship.fromEntityId
      );
      if (fromEntity && (fromEntity as any).path) {
        const p = (fromEntity as any).path as string;
        currentFilePath = p.includes(":") ? p.split(":")[0] : p;
      }
    } catch {}
  }

  const kindMatch = to.match(/^(class|interface|function|typeAlias):(.+)$/);
  if (kindMatch) {
    const kind = kindMatch[1];
    const name = kindMatch[2];
    if (currentFilePath) {
      // Use local index first to avoid DB roundtrips
      const key = `${currentFilePath}:${name}`;
      const localId = (this as any).localSymbolIndex?.get?.(key);
      if (localId) return { id: localId, candidates, resolutionPath: 'local-index' };
      const local = await (this as any).kgService.findSymbolInFile(currentFilePath, name);
      if (local) { candidates.push({ id: local.id, name: (local as any).name, path: (local as any).path, resolver: 'local' }); }
      // Prefer nearby directory symbols if available
      const near = await (this as any).kgService.findNearbySymbols(currentFilePath, name, 3);
      for (const n of near) candidates.push({ id: n.id, name: (n as any).name, path: (n as any).path, resolver: 'nearby' });
    }
    const byKind = await (this as any).kgService.findSymbolByKindAndName(
      kind,
      name
    );
    for (const c of byKind) candidates.push({ id: c.id, name: (c as any).name, path: (c as any).path, resolver: 'kind-name' });
    if (candidates.length > 0) return { id: candidates[0].id, candidates, resolutionPath: 'kind-name' };
    return null;
  }

  const importMatch = to.match(/^import:(.+?):(.+)$/);
  if (importMatch) {
    const name = importMatch[2];
    if (currentFilePath) {
      const local = await (this as any).kgService.findSymbolInFile(
        currentFilePath,
        name
      );
      if (local) { candidates.push({ id: local.id, name: (local as any).name, path: (local as any).path, resolver: 'local' }); }
      // Prefer nearby directory symbols for imported names
      const near = await (this as any).kgService.findNearbySymbols(currentFilePath, name, 5);
      for (const n of near) candidates.push({ id: n.id, name: (n as any).name, path: (n as any).path, resolver: 'nearby' });
    }
    const byName = await (this as any).kgService.findSymbolsByName(name);
    for (const c of byName) candidates.push({ id: c.id, name: (c as any).name, path: (c as any).path, resolver: 'name' });
    if (candidates.length > 0) return { id: candidates[0].id, candidates, resolutionPath: 'import-name' };
    return null;
  }

  const externalMatch = to.match(/^external:(.+)$/);
  if (externalMatch) {
    const name = externalMatch[1];
    if (currentFilePath) {
      const local = await (this as any).kgService.findSymbolInFile(
        currentFilePath,
        name
      );
      if (local) { candidates.push({ id: local.id, name: (local as any).name, path: (local as any).path, resolver: 'local' }); }
      // Prefer nearby matches
      const near = await (this as any).kgService.findNearbySymbols(currentFilePath, name, 5);
      for (const n of near) candidates.push({ id: n.id, name: (n as any).name, path: (n as any).path, resolver: 'nearby' });
    }
    const global = await (this as any).kgService.findSymbolsByName(name);
    for (const g of global) candidates.push({ id: g.id, name: (g as any).name, path: (g as any).path, resolver: 'name' });
    if (candidates.length > 0) return { id: candidates[0].id, candidates, resolutionPath: 'external-name' };
    return null;
  }

  return null;
};
