/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */
import { EventEmitter } from "events";
import { RelationshipType } from "../models/relationships.js";
export class SynchronizationCoordinator extends EventEmitter {
    constructor(kgService, astParser, dbService) {
        super();
        this.kgService = kgService;
        this.astParser = astParser;
        this.dbService = dbService;
        this.activeOperations = new Map();
        this.completedOperations = new Map();
        this.operationQueue = [];
        this.isProcessing = false;
        this.paused = false;
        this.resumeWaiters = [];
        this.retryQueue = new Map();
        this.maxRetryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
        // Collect relationships that couldn't be resolved during per-file processing
        this.unresolvedRelationships = [];
        // Runtime tuning knobs per operation (can be updated during sync)
        this.tuning = new Map();
        // Local symbol index to speed up same-file relationship resolution
        this.localSymbolIndex = new Map();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on("operationCompleted", this.handleOperationCompleted.bind(this));
        this.on("operationFailed", this.handleOperationFailed.bind(this));
        this.on("conflictDetected", this.handleConflictDetected.bind(this));
    }
    // Update tuning for an active operation; applies on next batch boundary
    updateTuning(operationId, tuning) {
        const op = this.activeOperations.get(operationId);
        if (!op)
            return false;
        const current = this.tuning.get(operationId) || {};
        const merged = { ...current };
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
    async startSync() {
        return this.startFullSynchronization({});
    }
    async stopSync() {
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
    async startFullSynchronization(options = {}) {
        var _a;
        // Default: do not include embeddings during full sync; generate them in background later
        if (options.includeEmbeddings === undefined) {
            options.includeEmbeddings = false;
        }
        const operation = {
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
        ;
        operation.options = options;
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
        }, (_a = options.timeout) !== null && _a !== void 0 ? _a : 30000);
        return operation.id;
    }
    async synchronizeFileChanges(changes) {
        const operation = {
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
        operation.changes = changes;
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
    async synchronizePartial(updates) {
        const operation = {
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
        operation.updates = updates;
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
    async processQueue() {
        if (this.isProcessing || this.operationQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.operationQueue.length > 0) {
            // Respect paused state before starting the next operation
            if (this.paused) {
                await new Promise((resolve) => this.resumeWaiters.push(resolve));
            }
            const operation = this.operationQueue.shift();
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
            }
            catch (error) {
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
    pauseSync() {
        this.paused = true;
    }
    resumeSync() {
        if (!this.paused)
            return;
        this.paused = false;
        const waiters = this.resumeWaiters.splice(0);
        for (const w of waiters) {
            try {
                w();
            }
            catch (_a) { }
        }
        // If there are queued operations and not currently processing, resume processing
        if (!this.isProcessing && this.operationQueue.length > 0) {
            void this.processQueue();
        }
    }
    isPaused() {
        return this.paused;
    }
    async performFullSync(operation) {
        var _a, _b, _c, _d;
        // Implementation for full synchronization
        this.emit("syncProgress", operation, { phase: "scanning", progress: 0 });
        // Scan all source files
        const files = await this.scanSourceFiles();
        this.emit("syncProgress", operation, { phase: "parsing", progress: 0.2 });
        // Local helper to cooperatively pause execution between units of work
        const awaitIfPaused = async () => {
            if (!this.paused)
                return;
            await new Promise((resolve) => this.resumeWaiters.push(resolve));
        };
        // Process files in batches
        const opts = (operation.options || {});
        const includeEmbeddings = opts.includeEmbeddings === true; // default is false; only true when explicitly requested
        // Helper to process a single file
        const processFile = async (file) => {
            try {
                const result = await this.astParser.parseFile(file);
                // Build local index for this file's symbols to avoid DB lookups
                for (const ent of result.entities) {
                    if ((ent === null || ent === void 0 ? void 0 : ent.type) === 'symbol') {
                        const nm = ent.name;
                        const p = ent.path;
                        if (nm && p) {
                            const filePath = p.includes(":") ? p.split(":")[0] : p;
                            this.localSymbolIndex.set(`${filePath}:${nm}`, ent.id);
                        }
                    }
                }
                // Detect and handle conflicts before creating entities
                if (result.entities.length > 0 || result.relationships.length > 0) {
                    try {
                        const conflicts = await this.detectConflicts(result.entities, result.relationships);
                        if (conflicts.length > 0) {
                            operation.conflicts.push(...conflicts);
                            this.emit("conflictsDetected", operation, conflicts);
                            // Auto-resolve conflicts if configured
                            // For now, we'll just log them
                            console.warn(`⚠️ ${conflicts.length} conflicts detected in ${file}`);
                        }
                    }
                    catch (conflictError) {
                        operation.errors.push({
                            file,
                            type: "conflict",
                            message: conflictError instanceof Error
                                ? conflictError.message
                                : "Conflict detection failed",
                            timestamp: new Date(),
                            recoverable: true,
                        });
                    }
                }
                // Accumulate entities and relationships for batch processing
                operation._batchEntities = (operation._batchEntities || []).concat(result.entities);
                const relsWithSource = result.relationships.map(r => ({ ...r, __sourceFile: file }));
                operation._batchRelationships = (operation._batchRelationships || []).concat(relsWithSource);
                operation.filesProcessed++;
            }
            catch (error) {
                operation.errors.push({
                    file,
                    type: "parse",
                    message: error instanceof Error ? error.message : "Parse error",
                    timestamp: new Date(),
                    recoverable: true,
                });
            }
        };
        for (let i = 0; i < files.length;) {
            const tn = this.tuning.get(operation.id) || {};
            const bsRaw = (_b = (_a = tn.batchSize) !== null && _a !== void 0 ? _a : opts.batchSize) !== null && _b !== void 0 ? _b : 60;
            const batchSize = Math.max(1, Math.min(Math.floor(bsRaw), 1000));
            const mcRaw = (_d = (_c = tn.maxConcurrency) !== null && _c !== void 0 ? _c : opts.maxConcurrency) !== null && _d !== void 0 ? _d : 12;
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
            const batchEntities = operation._batchEntities || [];
            const batchRelationships = operation._batchRelationships || [];
            operation._batchEntities = [];
            operation._batchRelationships = [];
            if (batchEntities.length > 0) {
                try {
                    await this.kgService.createEntitiesBulk(batchEntities, { skipEmbedding: true });
                    operation.entitiesCreated += batchEntities.length;
                }
                catch (e) {
                    // Fallback to per-entity creation
                    for (const ent of batchEntities) {
                        try {
                            await this.kgService.createEntity(ent, { skipEmbedding: true });
                            operation.entitiesCreated++;
                        }
                        catch (err) {
                            operation.errors.push({
                                file: ent.path || 'unknown',
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
                const resolved = [];
                for (const relationship of batchRelationships) {
                    try {
                        // Fast path: if toEntityId points to an existing node, accept; else try to resolve
                        const toEntity = await this.kgService.getEntity(relationship.toEntityId);
                        if (toEntity) {
                            resolved.push(relationship);
                            continue;
                        }
                    }
                    catch (_e) { }
                    try {
                        const resolvedId = await this.resolveRelationshipTarget(relationship, relationship.__sourceFile || undefined);
                        if (resolvedId) {
                            resolved.push({ ...relationship, toEntityId: resolvedId });
                        }
                        else {
                            this.unresolvedRelationships.push({ relationship });
                        }
                    }
                    catch (relationshipError) {
                        operation.errors.push({
                            file: "coordinator",
                            type: "database",
                            message: `Failed to resolve relationship: ${relationshipError instanceof Error
                                ? relationshipError.message
                                : "Unknown error"}`,
                            timestamp: new Date(),
                            recoverable: true,
                        });
                        this.unresolvedRelationships.push({ relationship });
                    }
                }
                if (resolved.length > 0) {
                    try {
                        await this.kgService.createRelationshipsBulk(resolved, { validate: false });
                        operation.relationshipsCreated += resolved.length;
                    }
                    catch (e) {
                        // Fallback to per-relationship creation if bulk fails
                        for (const r of resolved) {
                            try {
                                await this.kgService.createRelationship(r, undefined, undefined, { validate: false });
                                operation.relationshipsCreated++;
                            }
                            catch (err) {
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
                }
                catch (e) {
                    operation.errors.push({
                        file: "coordinator",
                        type: "database",
                        message: `Batch embedding failed: ${e instanceof Error ? e.message : 'unknown'}`,
                        timestamp: new Date(),
                        recoverable: true,
                    });
                }
            }
            else if (!includeEmbeddings && batchEntities.length > 0) {
                // Accumulate for background embedding after sync completes
                operation._embedQueue = (operation._embedQueue || []).concat(batchEntities);
            }
            const progress = 0.2 + (i / files.length) * 0.8;
            this.emit("syncProgress", operation, { phase: "parsing", progress });
        }
        // Post-pass: attempt to resolve and create any deferred relationships now that all entities exist
        await this.runPostResolution(operation);
        this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
        // Fire-and-forget background embeddings if they were skipped during full sync
        const pendingToEmbed = operation._embedQueue || [];
        if (pendingToEmbed.length > 0) {
            // Run in background without blocking completion
            const chunks = [];
            const chunkSize = 200;
            for (let i = 0; i < pendingToEmbed.length; i += chunkSize) {
                chunks.push(pendingToEmbed.slice(i, i + chunkSize));
            }
            (async () => {
                for (const c of chunks) {
                    try {
                        await this.kgService.createEmbeddingsBatch(c);
                    }
                    catch (e) {
                        // log and continue
                        try {
                            console.warn("Background embedding batch failed:", e);
                        }
                        catch (_a) { }
                    }
                }
                try {
                    console.log(`✅ Background embeddings created for ${pendingToEmbed.length} entities`);
                }
                catch (_b) { }
            })().catch(() => { });
        }
    }
    async performIncrementalSync(operation) {
        var _a;
        // Implementation for incremental synchronization
        this.emit("syncProgress", operation, {
            phase: "processing_changes",
            progress: 0,
        });
        // Get changes from operation
        const changes = operation.changes || [];
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
            if (!this.paused)
                return;
            await new Promise((resolve) => this.resumeWaiters.push(resolve));
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
            });
        }
        catch (_b) { }
        // Track entities to embed in batch and session relationships buffer
        const toEmbed = [];
        const sessionRelBuffer = [];
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
                            parseResult = await this.astParser.parseFileIncremental(change.path);
                        }
                        catch (error) {
                            // Handle parsing errors (e.g., invalid file paths)
                            operation.errors.push({
                                file: change.path,
                                type: "parse",
                                message: `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
                                timestamp: new Date(),
                                recoverable: false,
                            });
                            processedChanges++;
                            continue; // Skip to next change
                        }
                        // Detect conflicts before applying changes
                        if (parseResult.entities.length > 0 ||
                            parseResult.relationships.length > 0) {
                            const conflicts = await this.detectConflicts(parseResult.entities, parseResult.relationships);
                            if (conflicts.length > 0) {
                                operation.conflicts.push(...conflicts);
                                console.warn(`⚠️ ${conflicts.length} conflicts detected in ${change.path}`);
                            }
                        }
                        // Apply entities
                        for (const entity of parseResult.entities) {
                            try {
                                if (parseResult.isIncremental &&
                                    ((_a = parseResult.updatedEntities) === null || _a === void 0 ? void 0 : _a.includes(entity))) {
                                    await this.kgService.updateEntity(entity.id, entity, { skipEmbedding: true });
                                    operation.entitiesUpdated++;
                                    toEmbed.push(entity);
                                }
                                else {
                                    await this.kgService.createEntity(entity, { skipEmbedding: true });
                                    operation.entitiesCreated++;
                                    toEmbed.push(entity);
                                }
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: change.path,
                                    type: "database",
                                    message: `Failed to process entity ${entity.id}: ${error instanceof Error ? error.message : "Unknown"}`,
                                    timestamp: new Date(),
                                    recoverable: true,
                                });
                            }
                        }
                        // Apply relationships (current layer). Keep for idempotency; uses MERGE semantics downstream.
                        for (const relationship of parseResult.relationships) {
                            try {
                                const created = await this.resolveAndCreateRelationship(relationship, change.path);
                                if (created) {
                                    operation.relationshipsCreated++;
                                }
                                else {
                                    this.unresolvedRelationships.push({
                                        relationship,
                                        sourceFilePath: change.path,
                                    });
                                }
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: change.path,
                                    type: "database",
                                    message: `Failed to create relationship: ${error instanceof Error ? error.message : "Unknown"}`,
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
                                    await this.kgService.deleteEntity(entity.id);
                                    operation.entitiesDeleted++;
                                }
                                catch (error) {
                                    const label = entity.path || entity.name || entity.title || entity.id;
                                    operation.errors.push({
                                        file: change.path,
                                        type: "database",
                                        message: `Failed to delete entity ${label}: ${error instanceof Error ? error.message : "Unknown"}`,
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
                                        sessionRelBuffer.push({
                                            id: `rel_${sessionId}_${ent.id}_SESSION_MODIFIED`,
                                            fromEntityId: sessionId,
                                            toEntityId: ent.id,
                                            type: RelationshipType.SESSION_MODIFIED,
                                            created: now,
                                            lastModified: now,
                                            version: 1,
                                            metadata: { file: change.path },
                                        });
                                    }
                                    catch (err) {
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
                            if (Array.isArray(parseResult.addedRelationships)) {
                                for (const rel of parseResult.addedRelationships) {
                                    try {
                                        let toId = rel.toEntityId;
                                        // Resolve placeholder targets like kind:name or import:module:symbol
                                        if (!toId || String(toId).includes(":")) {
                                            const resolved = await this.resolveRelationshipTarget(rel, change.path);
                                            if (resolved)
                                                toId = resolved;
                                        }
                                        if (toId && rel.fromEntityId) {
                                            await this.kgService.openEdge(rel.fromEntityId, toId, rel.type, now);
                                            operation.relationshipsUpdated++;
                                        }
                                    }
                                    catch (err) {
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
                            if (Array.isArray(parseResult.removedRelationships)) {
                                for (const rel of parseResult.removedRelationships) {
                                    try {
                                        let toId = rel.toEntityId;
                                        if (!toId || String(toId).includes(":")) {
                                            const resolved = await this.resolveRelationshipTarget(rel, change.path);
                                            if (resolved)
                                                toId = resolved;
                                        }
                                        if (toId && rel.fromEntityId) {
                                            await this.kgService.closeEdge(rel.fromEntityId, toId, rel.type, now);
                                            operation.relationshipsUpdated++;
                                        }
                                    }
                                    catch (err) {
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
                        }
                        break;
                    case "delete":
                        // Handle file deletion
                        try {
                            // Find all entities associated with this file
                            // TODO: Implement getEntitiesByFile method in KnowledgeGraphService
                            const fileEntities = []; // Placeholder - need to implement this method
                            for (const entity of fileEntities) {
                                await this.kgService.deleteEntity(entity.id);
                                operation.entitiesDeleted++;
                            }
                            console.log(`🗑️ Removed ${fileEntities.length} entities from deleted file ${change.path}`);
                        }
                        catch (error) {
                            operation.errors.push({
                                file: change.path,
                                type: "database",
                                message: `Failed to handle file deletion: ${error instanceof Error ? error.message : "Unknown"}`,
                                timestamp: new Date(),
                                recoverable: false,
                            });
                        }
                        break;
                }
                operation.filesProcessed++;
                processedChanges++;
            }
            catch (error) {
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
            }
            catch (e) {
                operation.errors.push({
                    file: "coordinator",
                    type: "database",
                    message: `Bulk session rels failed: ${e instanceof Error ? e.message : 'unknown'}`,
                    timestamp: new Date(),
                    recoverable: true,
                });
            }
        }
        // Batch-generate embeddings for affected entities
        if (toEmbed.length > 0) {
            try {
                await this.kgService.createEmbeddingsBatch(toEmbed);
            }
            catch (e) {
                operation.errors.push({
                    file: "coordinator",
                    type: "database",
                    message: `Batch embedding failed: ${e instanceof Error ? e.message : 'unknown'}`,
                    timestamp: new Date(),
                    recoverable: true,
                });
            }
        }
        this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
    }
    async performPartialSync(operation) {
        // Implementation for partial synchronization
        this.emit("syncProgress", operation, {
            phase: "processing_partial",
            progress: 0,
        });
        // Get partial updates from operation
        const updates = operation.updates || [];
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
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: update.entityId,
                                    type: "database",
                                    message: `Failed to create entity: ${error instanceof Error ? error.message : "Unknown"}`,
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
                                await this.kgService.updateEntity(update.entityId, update.changes);
                                operation.entitiesUpdated++;
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: update.entityId,
                                    type: "database",
                                    message: `Failed to update entity: ${error instanceof Error ? error.message : "Unknown"}`,
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
                        }
                        catch (error) {
                            operation.errors.push({
                                file: update.entityId,
                                type: "database",
                                message: `Failed to delete entity: ${error instanceof Error ? error.message : "Unknown"}`,
                                timestamp: new Date(),
                                recoverable: true,
                            });
                        }
                        break;
                }
                processedUpdates++;
            }
            catch (error) {
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
    async scanSourceFiles() {
        // Scan for source files in the project using fs
        const fs = await import("fs/promises");
        const path = await import("path");
        const files = [];
        const extensions = [".ts", ".tsx", ".js", ".jsx"];
        // Directories to scan
        const directories = ["src", "lib", "packages", "tests"];
        // Exclude patterns
        const shouldExclude = (filePath) => {
            return (filePath.includes("node_modules") ||
                filePath.includes("dist") ||
                filePath.includes("build") ||
                filePath.includes(".git") ||
                filePath.includes("coverage") ||
                filePath.endsWith(".d.ts") ||
                filePath.endsWith(".min.js"));
        };
        const scanDirectory = async (dir) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (shouldExclude(fullPath)) {
                        continue;
                    }
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath);
                    }
                    else if (entry.isFile() &&
                        extensions.some((ext) => fullPath.endsWith(ext))) {
                        files.push(path.resolve(fullPath));
                    }
                }
            }
            catch (error) {
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
        }
        catch (error) {
            console.error("Error scanning source files:", error);
            return [];
        }
    }
    async detectConflicts(entities, relationships) {
        // Placeholder for conflict detection
        // In a full implementation, this would check for version conflicts,
        // concurrent modifications, etc.
        return [];
    }
    async rollbackOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (!operation || operation.status !== "failed") {
            return false;
        }
        try {
            // Implement rollback logic
            operation.status = "rolled_back";
            this.emit("operationRolledBack", operation);
            return true;
        }
        catch (error) {
            this.emit("rollbackFailed", operation, error);
            return false;
        }
    }
    getOperationStatus(operationId) {
        return (this.activeOperations.get(operationId) ||
            this.completedOperations.get(operationId) ||
            null);
    }
    getActiveOperations() {
        return Array.from(this.activeOperations.values());
    }
    getQueueLength() {
        return this.operationQueue.length;
    }
    async startIncrementalSynchronization() {
        // Alias for synchronizeFileChanges with empty changes
        return this.synchronizeFileChanges([]);
    }
    async startPartialSynchronization(paths) {
        // Convert paths to partial updates
        const updates = paths.map((path) => ({
            entityId: path,
            type: "update",
            changes: {},
        }));
        return this.synchronizePartial(updates);
    }
    async cancelOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) {
            return false;
        }
        // Remove from active operations
        this.activeOperations.delete(operationId);
        // Remove from queue if pending
        const queueIndex = this.operationQueue.findIndex((op) => op.id === operationId);
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
    getOperationStatistics() {
        const activeOperations = Array.from(this.activeOperations.values());
        const completedOperations = Array.from(this.completedOperations.values());
        const retryOperations = Array.from(this.retryQueue.values());
        const allOperations = [...activeOperations, ...completedOperations];
        const totalFilesProcessed = allOperations.reduce((sum, op) => sum + op.filesProcessed, 0);
        const totalEntitiesCreated = allOperations.reduce((sum, op) => sum + op.entitiesCreated, 0);
        const totalErrors = allOperations.reduce((sum, op) => sum + op.errors.length, 0);
        return {
            total: allOperations.length + this.operationQueue.length,
            active: activeOperations.filter((op) => op.status === "running").length,
            queued: this.operationQueue.length,
            completed: allOperations.filter((op) => op.status === "completed").length,
            failed: allOperations.filter((op) => op.status === "failed").length,
            retried: retryOperations.length,
            totalOperations: allOperations.length + this.operationQueue.length,
            completedOperations: allOperations.filter((op) => op.status === "completed").length,
            failedOperations: allOperations.filter((op) => op.status === "failed")
                .length,
            totalFilesProcessed,
            totalEntitiesCreated,
            totalErrors,
        };
    }
    handleOperationCompleted(operation) {
        console.log(`✅ Sync operation ${operation.id} completed successfully`);
        // Clear from retry queue if it was a retry
        if (this.retryQueue.has(operation.id)) {
            const retryInfo = this.retryQueue.get(operation.id);
            console.log(`✅ Retry successful for operation ${operation.id} after ${retryInfo === null || retryInfo === void 0 ? void 0 : retryInfo.attempts} attempts`);
            this.retryQueue.delete(operation.id);
        }
        // Note: Keep completed operations in activeOperations so they can be queried
        // this.activeOperations.delete(operation.id);
    }
    handleOperationFailed(operation) {
        var _a;
        try {
            const msg = (_a = operation.errors) === null || _a === void 0 ? void 0 : _a.map(e => `${e.type}:${e.message}`).join('; ');
            console.error(`❌ Sync operation ${operation.id} failed: ${msg || 'unknown'}`);
        }
        catch (_b) {
            console.error(`❌ Sync operation ${operation.id} failed:`, operation.errors);
        }
        // Check if operation has recoverable errors
        const hasRecoverableErrors = operation.errors.some((e) => e.recoverable);
        if (hasRecoverableErrors) {
            // Check retry attempts
            const retryInfo = this.retryQueue.get(operation.id);
            const attempts = retryInfo ? retryInfo.attempts : 0;
            if (attempts < this.maxRetryAttempts) {
                console.log(`🔄 Scheduling retry ${attempts + 1}/${this.maxRetryAttempts} for operation ${operation.id}`);
                // Store retry info
                this.retryQueue.set(operation.id, {
                    operation,
                    attempts: attempts + 1,
                });
                // Schedule retry
                setTimeout(() => {
                    this.retryOperation(operation);
                }, this.retryDelay * (attempts + 1)); // Exponential backoff
            }
            else {
                console.error(`❌ Max retry attempts reached for operation ${operation.id}`);
                this.retryQueue.delete(operation.id);
                this.emit("operationAbandoned", operation);
            }
        }
        else {
            console.error(`❌ Operation ${operation.id} has non-recoverable errors, not retrying`);
        }
    }
    async retryOperation(operation) {
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
    handleConflictDetected(conflict) {
        console.warn(`⚠️ Sync conflict detected:`, conflict);
        // Could implement conflict resolution logic here
    }
    // Attempt to resolve and create deferred relationships
    async runPostResolution(operation) {
        if (this.unresolvedRelationships.length === 0)
            return;
        this.emit("syncProgress", operation, { phase: "resolving_relationships", progress: 0.95 });
        const pending = this.unresolvedRelationships.splice(0);
        let createdCount = 0;
        for (const item of pending) {
            try {
                const created = await this.resolveAndCreateRelationship(item.relationship, item.sourceFilePath);
                if (created)
                    createdCount++;
            }
            catch (_a) {
                // keep silent; will try in next sync if needed
            }
        }
        if (createdCount > 0) {
            operation.relationshipsCreated += createdCount;
        }
    }
}
// Implement as prototype methods to avoid reordering class definitions
SynchronizationCoordinator.prototype.resolveAndCreateRelationship = async function (relationship, sourceFilePath) {
    try {
        const toEntity = await this.kgService.getEntity(relationship.toEntityId);
        if (toEntity) {
            await this.kgService.createRelationship(relationship, undefined, undefined, { validate: false });
            return true;
        }
    }
    catch (_a) { }
    const resolvedId = await this.resolveRelationshipTarget(relationship, sourceFilePath);
    if (!resolvedId)
        return false;
    const resolvedRel = { ...relationship, toEntityId: resolvedId };
    await this.kgService.createRelationship(resolvedRel, undefined, undefined, { validate: false });
    return true;
};
SynchronizationCoordinator.prototype.resolveRelationshipTarget = async function (relationship, sourceFilePath) {
    var _a, _b;
    const to = relationship.toEntityId || "";
    let currentFilePath = sourceFilePath;
    if (!currentFilePath) {
        try {
            const fromEntity = await this.kgService.getEntity(relationship.fromEntityId);
            if (fromEntity && fromEntity.path) {
                const p = fromEntity.path;
                currentFilePath = p.includes(":") ? p.split(":")[0] : p;
            }
        }
        catch (_c) { }
    }
    const kindMatch = to.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (kindMatch) {
        const kind = kindMatch[1];
        const name = kindMatch[2];
        if (currentFilePath) {
            // Use local index first to avoid DB roundtrips
            const key = `${currentFilePath}:${name}`;
            const localId = (_b = (_a = this.localSymbolIndex) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(_a, key);
            if (localId)
                return localId;
            const local = await this.kgService.findSymbolInFile(currentFilePath, name);
            if (local)
                return local.id;
        }
        const candidates = await this.kgService.findSymbolByKindAndName(kind, name);
        if (candidates.length > 0)
            return candidates[0].id;
        return null;
    }
    const importMatch = to.match(/^import:(.+?):(.+)$/);
    if (importMatch) {
        const name = importMatch[2];
        if (currentFilePath) {
            const local = await this.kgService.findSymbolInFile(currentFilePath, name);
            if (local)
                return local.id;
        }
        const candidates = await this.kgService.findSymbolsByName(name);
        if (candidates.length > 0)
            return candidates[0].id;
        return null;
    }
    const externalMatch = to.match(/^external:(.+)$/);
    if (externalMatch) {
        const name = externalMatch[1];
        if (currentFilePath) {
            const local = await this.kgService.findSymbolInFile(currentFilePath, name);
            if (local)
                return local.id;
        }
        const candidates = await this.kgService.findSymbolsByName(name);
        if (candidates.length > 0)
            return candidates[0].id;
        return null;
    }
    return null;
};
//# sourceMappingURL=SynchronizationCoordinator.js.map