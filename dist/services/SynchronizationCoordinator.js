/**
 * Synchronization Coordinator Service
 * Central orchestrator for graph synchronization operations
 */
import { EventEmitter } from 'events';
export class SynchronizationCoordinator extends EventEmitter {
    kgService;
    astParser;
    dbService;
    activeOperations = new Map();
    operationQueue = [];
    isProcessing = false;
    retryQueue = new Map();
    maxRetryAttempts = 3;
    retryDelay = 5000; // 5 seconds
    constructor(kgService, astParser, dbService) {
        super();
        this.kgService = kgService;
        this.astParser = astParser;
        this.dbService = dbService;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on('operationCompleted', this.handleOperationCompleted.bind(this));
        this.on('operationFailed', this.handleOperationFailed.bind(this));
        this.on('conflictDetected', this.handleConflictDetected.bind(this));
    }
    async startFullSynchronization(options = {}) {
        const operation = {
            id: `full_sync_${Date.now()}`,
            type: 'full',
            status: 'pending',
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
        this.emit('operationStarted', operation);
        if (!this.isProcessing) {
            this.processQueue();
        }
        return operation.id;
    }
    async synchronizeFileChanges(changes) {
        const operation = {
            id: `incremental_sync_${Date.now()}`,
            type: 'incremental',
            status: 'pending',
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
        this.emit('operationStarted', operation);
        if (!this.isProcessing) {
            this.processQueue();
        }
        return operation.id;
    }
    async synchronizePartial(updates) {
        const operation = {
            id: `partial_sync_${Date.now()}`,
            type: 'partial',
            status: 'pending',
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
        this.emit('operationStarted', operation);
        if (!this.isProcessing) {
            this.processQueue();
        }
        return operation.id;
    }
    async processQueue() {
        if (this.isProcessing || this.operationQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.operationQueue.length > 0) {
            const operation = this.operationQueue.shift();
            operation.status = 'running';
            try {
                switch (operation.type) {
                    case 'full':
                        await this.performFullSync(operation);
                        break;
                    case 'incremental':
                        await this.performIncrementalSync(operation);
                        break;
                    case 'partial':
                        await this.performPartialSync(operation);
                        break;
                }
                operation.status = 'completed';
                operation.endTime = new Date();
                this.emit('operationCompleted', operation);
            }
            catch (error) {
                operation.status = 'failed';
                operation.endTime = new Date();
                operation.errors.push({
                    file: 'coordinator',
                    type: 'unknown',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                    recoverable: false,
                });
                this.emit('operationFailed', operation);
            }
        }
        this.isProcessing = false;
    }
    async performFullSync(operation) {
        // Implementation for full synchronization
        this.emit('syncProgress', operation, { phase: 'scanning', progress: 0 });
        // Scan all source files
        const files = await this.scanSourceFiles();
        this.emit('syncProgress', operation, { phase: 'parsing', progress: 0.2 });
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
                                this.emit('conflictsDetected', operation, conflicts);
                                // Auto-resolve conflicts if configured
                                // For now, we'll just log them
                                console.warn(`⚠️ ${conflicts.length} conflicts detected in ${file}`);
                            }
                        }
                        catch (conflictError) {
                            operation.errors.push({
                                file,
                                type: 'conflict',
                                message: conflictError instanceof Error ? conflictError.message : 'Conflict detection failed',
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
                                type: 'database',
                                message: `Failed to create entity ${entity.id}: ${entityError instanceof Error ? entityError.message : 'Unknown error'}`,
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
                                type: 'database',
                                message: `Failed to create relationship: ${relationshipError instanceof Error ? relationshipError.message : 'Unknown error'}`,
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
                        type: 'parse',
                        message: error instanceof Error ? error.message : 'Parse error',
                        timestamp: new Date(),
                        recoverable: true,
                    });
                }
            }
            const progress = 0.2 + (i / files.length) * 0.8;
            this.emit('syncProgress', operation, { phase: 'parsing', progress });
        }
        this.emit('syncProgress', operation, { phase: 'completed', progress: 1.0 });
    }
    async performIncrementalSync(operation) {
        // Implementation for incremental synchronization
        this.emit('syncProgress', operation, { phase: 'processing_changes', progress: 0 });
        // Get changes from operation
        const changes = operation.changes || [];
        if (changes.length === 0) {
            this.emit('syncProgress', operation, { phase: 'completed', progress: 1.0 });
            return;
        }
        const totalChanges = changes.length;
        let processedChanges = 0;
        for (const change of changes) {
            try {
                this.emit('syncProgress', operation, {
                    phase: 'processing_changes',
                    progress: processedChanges / totalChanges * 0.8
                });
                switch (change.type) {
                    case 'add':
                    case 'change':
                        // Parse the file and update graph
                        const parseResult = await this.astParser.parseFileIncremental(change.path);
                        // Detect conflicts before applying changes
                        if (parseResult.entities.length > 0 || parseResult.relationships.length > 0) {
                            const conflicts = await this.detectConflicts(parseResult.entities, parseResult.relationships);
                            if (conflicts.length > 0) {
                                operation.conflicts.push(...conflicts);
                                console.warn(`⚠️ ${conflicts.length} conflicts detected in ${change.path}`);
                            }
                        }
                        // Apply entities
                        for (const entity of parseResult.entities) {
                            try {
                                if (parseResult.isIncremental && parseResult.updatedEntities?.includes(entity)) {
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
                                    type: 'database',
                                    message: `Failed to process entity ${entity.id}: ${error instanceof Error ? error.message : 'Unknown'}`,
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
                                    type: 'database',
                                    message: `Failed to create relationship: ${error instanceof Error ? error.message : 'Unknown'}`,
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
                                        type: 'database',
                                        message: `Failed to delete entity ${entity.id}: ${error instanceof Error ? error.message : 'Unknown'}`,
                                        timestamp: new Date(),
                                        recoverable: true,
                                    });
                                }
                            }
                        }
                        break;
                    case 'unlink':
                        // Handle file deletion
                        try {
                            // Find all entities associated with this file
                            const fileEntities = await this.kgService.getEntitiesByFile(change.path);
                            for (const entity of fileEntities) {
                                await this.kgService.deleteEntity(entity.id);
                                operation.entitiesDeleted++;
                            }
                            console.log(`🗑️ Removed ${fileEntities.length} entities from deleted file ${change.path}`);
                        }
                        catch (error) {
                            operation.errors.push({
                                file: change.path,
                                type: 'database',
                                message: `Failed to handle file deletion: ${error instanceof Error ? error.message : 'Unknown'}`,
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
                    type: 'parse',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                    recoverable: true,
                });
            }
        }
        this.emit('syncProgress', operation, { phase: 'completed', progress: 1.0 });
    }
    async performPartialSync(operation) {
        // Implementation for partial synchronization
        this.emit('syncProgress', operation, { phase: 'processing_partial', progress: 0 });
        // Get partial updates from operation
        const updates = operation.updates || [];
        if (updates.length === 0) {
            this.emit('syncProgress', operation, { phase: 'completed', progress: 1.0 });
            return;
        }
        const totalUpdates = updates.length;
        let processedUpdates = 0;
        for (const update of updates) {
            try {
                this.emit('syncProgress', operation, {
                    phase: 'processing_partial',
                    progress: processedUpdates / totalUpdates * 0.9
                });
                switch (update.type) {
                    case 'create':
                        // Create new entity
                        if (update.newValue) {
                            try {
                                await this.kgService.createEntity(update.newValue);
                                operation.entitiesCreated++;
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: update.entityId,
                                    type: 'database',
                                    message: `Failed to create entity: ${error instanceof Error ? error.message : 'Unknown'}`,
                                    timestamp: new Date(),
                                    recoverable: true,
                                });
                            }
                        }
                        break;
                    case 'update':
                        // Update existing entity
                        if (update.changes) {
                            try {
                                await this.kgService.updateEntity(update.entityId, update.changes);
                                operation.entitiesUpdated++;
                            }
                            catch (error) {
                                operation.errors.push({
                                    file: update.entityId,
                                    type: 'database',
                                    message: `Failed to update entity: ${error instanceof Error ? error.message : 'Unknown'}`,
                                    timestamp: new Date(),
                                    recoverable: true,
                                });
                            }
                        }
                        break;
                    case 'delete':
                        // Delete entity
                        try {
                            await this.kgService.deleteEntity(update.entityId);
                            operation.entitiesDeleted++;
                        }
                        catch (error) {
                            operation.errors.push({
                                file: update.entityId,
                                type: 'database',
                                message: `Failed to delete entity: ${error instanceof Error ? error.message : 'Unknown'}`,
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
                    file: 'partial_update',
                    type: 'unknown',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                    recoverable: false,
                });
            }
        }
        this.emit('syncProgress', operation, { phase: 'completed', progress: 1.0 });
    }
    async scanSourceFiles() {
        // Scan for source files in the project
        const files = [];
        const glob = (await import('glob')).glob;
        // Define patterns for source files to scan
        const patterns = [
            'src/**/*.ts',
            'src/**/*.tsx',
            'src/**/*.js',
            'src/**/*.jsx',
            'lib/**/*.ts',
            'lib/**/*.js',
            'packages/**/*.ts',
            'packages/**/*.js',
            'tests/**/*.ts',
            'tests/**/*.js'
        ];
        // Exclude patterns
        const ignorePatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/coverage/**',
            '**/*.d.ts',
            '**/*.min.js'
        ];
        try {
            for (const pattern of patterns) {
                const matchedFiles = await glob(pattern, {
                    ignore: ignorePatterns,
                    nodir: true,
                    absolute: true
                });
                files.push(...matchedFiles);
            }
            // Remove duplicates
            const uniqueFiles = Array.from(new Set(files));
            console.log(`📂 Found ${uniqueFiles.length} source files to scan`);
            return uniqueFiles;
        }
        catch (error) {
            console.error('Error scanning source files:', error);
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
        if (!operation || operation.status !== 'failed') {
            return false;
        }
        try {
            // Implement rollback logic
            operation.status = 'rolled_back';
            this.emit('operationRolledBack', operation);
            return true;
        }
        catch (error) {
            this.emit('rollbackFailed', operation, error);
            return false;
        }
    }
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }
    getActiveOperations() {
        return Array.from(this.activeOperations.values());
    }
    getQueueLength() {
        return this.operationQueue.length;
    }
    handleOperationCompleted(operation) {
        console.log(`✅ Sync operation ${operation.id} completed successfully`);
        // Clear from retry queue if it was a retry
        if (this.retryQueue.has(operation.id)) {
            const retryInfo = this.retryQueue.get(operation.id);
            console.log(`✅ Retry successful for operation ${operation.id} after ${retryInfo?.attempts} attempts`);
            this.retryQueue.delete(operation.id);
        }
        this.activeOperations.delete(operation.id);
    }
    handleOperationFailed(operation) {
        console.error(`❌ Sync operation ${operation.id} failed:`, operation.errors);
        // Check if operation has recoverable errors
        const hasRecoverableErrors = operation.errors.some(e => e.recoverable);
        if (hasRecoverableErrors) {
            // Check retry attempts
            const retryInfo = this.retryQueue.get(operation.id);
            const attempts = retryInfo ? retryInfo.attempts : 0;
            if (attempts < this.maxRetryAttempts) {
                console.log(`🔄 Scheduling retry ${attempts + 1}/${this.maxRetryAttempts} for operation ${operation.id}`);
                // Store retry info
                this.retryQueue.set(operation.id, {
                    operation,
                    attempts: attempts + 1
                });
                // Schedule retry
                setTimeout(() => {
                    this.retryOperation(operation);
                }, this.retryDelay * (attempts + 1)); // Exponential backoff
            }
            else {
                console.error(`❌ Max retry attempts reached for operation ${operation.id}`);
                this.retryQueue.delete(operation.id);
                this.emit('operationAbandoned', operation);
            }
        }
        else {
            console.error(`❌ Operation ${operation.id} has non-recoverable errors, not retrying`);
        }
    }
    async retryOperation(operation) {
        console.log(`🔄 Retrying operation ${operation.id}`);
        // Reset operation status
        operation.status = 'pending';
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