/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */
import { EventEmitter } from "events";
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
        this.retryQueue = new Map();
        this.maxRetryAttempts = 3;
        this.retryDelay = 5000; // 5 seconds
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on("operationCompleted", this.handleOperationCompleted.bind(this));
        this.on("operationFailed", this.handleOperationFailed.bind(this));
        this.on("conflictDetected", this.handleConflictDetected.bind(this));
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
        }, Math.min((_a = options.timeout) !== null && _a !== void 0 ? _a : 30000, 2000));
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
        }, 2000);
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
        }, 2000);
        return operation.id;
    }
    async processQueue() {
        if (this.isProcessing || this.operationQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.operationQueue.length > 0) {
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
    async performFullSync(operation) {
        // Implementation for full synchronization
        this.emit("syncProgress", operation, { phase: "scanning", progress: 0 });
        // Scan all source files
        const files = await this.scanSourceFiles();
        this.emit("syncProgress", operation, { phase: "parsing", progress: 0.2 });
        // Process files in batches
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            for (const file of batch) {
                try {
                    const result = await this.astParser.parseFile(file);
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
                    // Create/update entities and relationships
                    for (const entity of result.entities) {
                        try {
                            await this.kgService.createEntity(entity);
                            operation.entitiesCreated++;
                        }
                        catch (entityError) {
                            operation.errors.push({
                                file,
                                type: "database",
                                message: `Failed to create entity ${entity.id}: ${entityError instanceof Error
                                    ? entityError.message
                                    : "Unknown error"}`,
                                timestamp: new Date(),
                                recoverable: true,
                            });
                        }
                    }
                    for (const relationship of result.relationships) {
                        try {
                            await this.kgService.createRelationship(relationship);
                            operation.relationshipsCreated++;
                        }
                        catch (relationshipError) {
                            operation.errors.push({
                                file,
                                type: "database",
                                message: `Failed to create relationship: ${relationshipError instanceof Error
                                    ? relationshipError.message
                                    : "Unknown error"}`,
                                timestamp: new Date(),
                                recoverable: true,
                            });
                        }
                    }
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
            }
            const progress = 0.2 + (i / files.length) * 0.8;
            this.emit("syncProgress", operation, { phase: "parsing", progress });
        }
        this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
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
        for (const change of changes) {
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
                                    await this.kgService.updateEntity(entity.id, entity);
                                    operation.entitiesUpdated++;
                                }
                                else {
                                    await this.kgService.createEntity(entity);
                                    operation.entitiesCreated++;
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
                        // Apply relationships
                        for (const relationship of parseResult.relationships) {
                            try {
                                await this.kgService.createRelationship(relationship);
                                operation.relationshipsCreated++;
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: change.path,
                                    type: "database",
                                    message: `Failed to create relationship: ${error instanceof Error ? error.message : "Unknown"}`,
                                    timestamp: new Date(),
                                    recoverable: true,
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
                                    operation.errors.push({
                                        file: change.path,
                                        type: "database",
                                        message: `Failed to delete entity ${entity.id}: ${error instanceof Error ? error.message : "Unknown"}`,
                                        timestamp: new Date(),
                                        recoverable: true,
                                    });
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
        console.error(`❌ Sync operation ${operation.id} failed:`, operation.errors);
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
}
//# sourceMappingURL=SynchronizationCoordinator.js.map