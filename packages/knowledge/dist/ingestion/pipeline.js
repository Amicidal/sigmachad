/**
 * High-Throughput Ingestion Pipeline Orchestrator
 * Main orchestrator that coordinates event processing, queueing, workers, and batching
 * Based on HighThroughputKnowledgeGraph.md architecture
 */
import { EventEmitter } from 'events';
import { IngestionError } from './types.js';
import { QueueManager } from './queue-manager.js';
import { WorkerPool } from './worker-pool.js';
import { HighThroughputBatchProcessor } from './batch-processor.js';
import { ASTParser } from '../parsing/ASTParser.js';
export class HighThroughputIngestionPipeline extends EventEmitter {
    constructor(config, knowledgeGraphService, services) {
        super();
        this.alertConfigs = [];
        // Performance tracking
        this.processedEventCount = 0;
        this.errorCount = 0;
        this.latencyBuffer = [];
        this.throughputBuffer = [];
        // Error tracking
        this.errorTypes = new Map();
        this.recentErrors = [];
        // Enrichment queue for async processing
        this.enrichmentQueue = [];
        this.config = config;
        this.knowledgeGraphService = knowledgeGraphService;
        this.embeddingService = services === null || services === void 0 ? void 0 : services.embeddingService;
        this.state = {
            status: 'stopped',
            processedEvents: 0,
            errorCount: 0,
            currentLoad: 0
        };
        this.metrics = {
            totalEvents: 0,
            eventsPerSecond: 0,
            averageLatency: 0,
            p95Latency: 0,
            queueMetrics: {
                queueDepth: 0,
                oldestEventAge: 0,
                partitionLag: {},
                throughputPerSecond: 0,
                errorRate: 0
            },
            workerMetrics: [],
            batchMetrics: {
                activeBatches: 0,
                completedBatches: 0,
                failedBatches: 0
            }
        };
        this.initializeComponents();
        this.setupEventHandlers();
    }
    /**
     * Start the ingestion pipeline
     */
    async start() {
        if (this.state.status !== 'stopped') {
            throw new IngestionError('Pipeline already running or in transition', 'INVALID_STATE');
        }
        this.state.status = 'starting';
        console.log('[IngestionPipeline] Starting high-throughput ingestion pipeline...');
        try {
            // Start core components
            await this.queueManager.start();
            await this.workerPool.start();
            await this.batchProcessor.start();
            // Register worker handlers
            this.registerWorkerHandlers();
            // Start monitoring
            this.startMonitoring();
            this.state.status = 'running';
            this.state.startedAt = new Date();
            this.emit('pipeline:started');
            console.log('[IngestionPipeline] Pipeline started successfully');
        }
        catch (error) {
            this.state.status = 'error';
            this.emit('pipeline:error', error);
            throw error;
        }
    }
    /**
     * Stop the ingestion pipeline
     */
    async stop() {
        if (this.state.status === 'stopped') {
            return;
        }
        this.state.status = 'stopping';
        console.log('[IngestionPipeline] Stopping ingestion pipeline...');
        try {
            // Stop monitoring
            this.stopMonitoring();
            // Stop components in reverse order
            await this.batchProcessor.stop();
            await this.workerPool.stop();
            await this.queueManager.stop();
            this.state.status = 'stopped';
            this.emit('pipeline:stopped');
            console.log('[IngestionPipeline] Pipeline stopped successfully');
        }
        catch (error) {
            this.state.status = 'error';
            this.emit('pipeline:error', error);
            throw error;
        }
    }
    /**
     * Pause the pipeline (stop accepting new events)
     */
    async pause() {
        if (this.state.status !== 'running') {
            throw new IngestionError('Pipeline not running', 'INVALID_STATE');
        }
        this.state.status = 'pausing';
        // Continue processing existing queue but stop accepting new events
        this.state.status = 'paused';
        console.log('[IngestionPipeline] Pipeline paused');
    }
    /**
     * Resume the pipeline
     */
    async resume() {
        if (this.state.status !== 'paused') {
            throw new IngestionError('Pipeline not paused', 'INVALID_STATE');
        }
        this.state.status = 'running';
        console.log('[IngestionPipeline] Pipeline resumed');
    }
    /**
     * Ingest a change event into the pipeline
     */
    async ingestChangeEvent(event) {
        if (this.state.status !== 'running') {
            throw new IngestionError('Pipeline not running', 'PIPELINE_NOT_RUNNING');
        }
        const startTime = Date.now();
        try {
            // Create parse task
            const parseTask = {
                id: `parse-${event.id}`,
                type: 'parse',
                priority: this.calculateEventPriority(event),
                data: event,
                metadata: {
                    namespace: event.namespace,
                    module: event.module,
                    eventType: event.eventType
                },
                retryCount: 0,
                maxRetries: 3,
                createdAt: new Date()
            };
            // Queue for processing
            await this.queueManager.enqueue(parseTask, event.namespace);
            // Update metrics
            this.processedEventCount++;
            this.state.processedEvents++;
            this.metrics.totalEvents++;
            const latency = Date.now() - startTime;
            this.recordLatency(latency);
            this.emit('event:received', event);
        }
        catch (error) {
            this.errorCount++;
            this.state.errorCount++;
            this.trackError('INGESTION_ERROR', error instanceof Error ? error.message : 'Unknown error');
            this.emit('pipeline:error', error);
            throw error;
        }
    }
    /**
     * Ingest multiple change events in batch
     */
    async ingestChangeEvents(events) {
        const promises = events.map(event => this.ingestChangeEvent(event));
        await Promise.allSettled(promises);
    }
    /**
     * Process change fragments directly (bypassing file parsing)
     */
    async processChangeFragments(fragments) {
        if (this.state.status !== 'running') {
            throw new IngestionError('Pipeline not running', 'PIPELINE_NOT_RUNNING');
        }
        try {
            // Process through batch processor
            const results = await this.batchProcessor.processChangeFragments(fragments);
            // Update metrics
            this.metrics.batchMetrics.completedBatches += results.length;
            console.log(`[IngestionPipeline] Processed ${fragments.length} change fragments in ${results.length} batches`);
        }
        catch (error) {
            this.metrics.batchMetrics.failedBatches++;
            this.emit('pipeline:error', error);
            throw error;
        }
    }
    /**
     * Add enrichment task to async processing queue
     */
    async scheduleEnrichment(task) {
        this.enrichmentQueue.push(task);
        // Create enrichment task for worker pool
        const enrichmentTaskPayload = {
            id: task.id,
            type: 'embedding',
            priority: task.priority,
            data: task,
            metadata: { enrichmentType: task.type },
            retryCount: 0,
            maxRetries: 2,
            createdAt: new Date()
        };
        await this.queueManager.enqueue(enrichmentTaskPayload);
    }
    /**
     * Get current pipeline metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get current pipeline state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get current telemetry data
     */
    getTelemetry() {
        return {
            timestamp: new Date(),
            pipeline: this.getMetrics(),
            queues: this.queueManager.getMetrics(),
            workers: this.workerPool.getMetrics().workers,
            errors: {
                count: this.errorCount,
                types: this.getErrorTypeBreakdown(),
                samples: this.getRecentErrorSamples()
            },
            performance: {
                cpu: this.getCpuUsage(),
                memory: process.memoryUsage().heapUsed,
                diskIO: 0, // Not tracking disk I/O in this version
                networkIO: 0 // Not tracking network I/O in this version
            }
        };
    }
    /**
     * Add alert configuration
     */
    addAlert(alert) {
        this.alertConfigs.push(alert);
    }
    /**
     * Initialize core components
     */
    initializeComponents() {
        // Initialize queue manager
        const queueConfig = {
            ...this.config.queues,
            enableBackpressure: true,
            backpressureThreshold: this.config.monitoring.alertThresholds.queueDepth,
            partitionStrategy: 'hash',
            metricsInterval: this.config.monitoring.metricsInterval
        };
        this.queueManager = new QueueManager(queueConfig);
        // Initialize worker pool
        const workerConfig = {
            maxWorkers: this.config.workers.parsers + this.config.workers.entityWorkers +
                this.config.workers.relationshipWorkers + this.config.workers.embeddingWorkers,
            minWorkers: Math.ceil(this.config.workers.parsers / 2),
            workerTimeout: 30000,
            healthCheckInterval: this.config.monitoring.healthCheckInterval,
            restartThreshold: 5,
            autoScale: true,
            scalingRules: {
                scaleUpThreshold: this.config.monitoring.alertThresholds.queueDepth / 2,
                scaleDownThreshold: this.config.monitoring.alertThresholds.queueDepth / 4,
                scaleUpCooldown: 30000,
                scaleDownCooldown: 60000
            }
        };
        this.workerPool = new WorkerPool(workerConfig);
        // Initialize batch processor
        const batchConfig = {
            ...this.config.batching,
            streaming: {
                batchSize: this.config.batching.entityBatchSize,
                maxConcurrentWrites: this.config.batching.maxConcurrentBatches,
                idempotencyKeyTTL: 300000, // 5 minutes
                retryPolicy: {
                    maxAttempts: 3,
                    backoffMultiplier: 2,
                    maxBackoffMs: 10000
                }
            },
            enableDAG: true,
            epochTTL: 3600000, // 1 hour
            dependencyTimeout: 30000
        };
        this.batchProcessor = new HighThroughputBatchProcessor(batchConfig, this.knowledgeGraphService);
        // Initialize AST parser
        this.astParser = new ASTParser();
    }
    /**
     * Setup event handlers for component coordination
     */
    setupEventHandlers() {
        // Queue manager events
        this.queueManager.on('metrics:updated', (metrics) => {
            this.metrics.queueMetrics = metrics;
        });
        this.queueManager.on('queue:overflow', (error) => {
            console.error('[IngestionPipeline] Queue overflow:', error);
            this.emit('pipeline:error', error);
        });
        // Worker pool events
        this.workerPool.on('worker:error', (error) => {
            console.error('[IngestionPipeline] Worker error:', error);
            this.errorCount++;
            this.trackError('WORKER_ERROR', error.message);
        });
        // Batch processor events
        this.batchProcessor.on('batch:completed', (result) => {
            this.metrics.batchMetrics.completedBatches++;
        });
        this.batchProcessor.on('batch:failed', (error) => {
            this.metrics.batchMetrics.failedBatches++;
            console.error('[IngestionPipeline] Batch processing failed:', error);
        });
    }
    /**
     * Register handlers for different worker types
     */
    registerWorkerHandlers() {
        // Parse handler
        this.workerPool.registerHandler('parse', async (task) => {
            const event = task.data;
            return this.handleParseTask(event);
        });
        // Entity upsert handler
        this.workerPool.registerHandler('entity_upsert', async (task) => {
            const entities = task.data;
            return this.handleEntityUpsert(entities);
        });
        // Relationship upsert handler
        this.workerPool.registerHandler('relationship_upsert', async (task) => {
            const relationships = task.data;
            return this.handleRelationshipUpsert(relationships);
        });
        // Embedding handler
        this.workerPool.registerHandler('embedding', async (task) => {
            const enrichmentTask = task.data;
            return this.handleEnrichmentTask(enrichmentTask);
        });
    }
    /**
     * Handle file parsing task using real AST parser
     */
    async handleParseTask(event) {
        var _a, _b;
        try {
            console.log(`[IngestionPipeline] Parsing file: ${event.filePath}`);
            // Use the real AST parser to parse the file
            const parseResult = await this.astParser.parseFile(event.filePath);
            const fragments = [];
            // Convert entities to change fragments
            for (const entity of parseResult.entities) {
                const fragment = {
                    id: `fragment-${event.id}-entity-${entity.id}`,
                    eventId: event.id,
                    changeType: 'entity',
                    operation: 'add',
                    data: {
                        ...entity,
                        metadata: {
                            ...entity.metadata,
                            source: 'ingestion-pipeline',
                            parseTimestamp: new Date(),
                            namespace: event.namespace,
                            module: event.module
                        }
                    },
                    dependencyHints: [],
                    confidence: 0.9
                };
                fragments.push(fragment);
                // Queue entity processing
                const entityTask = {
                    id: `entity-${fragment.id}`,
                    type: 'entity_upsert',
                    priority: 5,
                    data: [fragment.data],
                    metadata: {
                        fragmentId: fragment.id,
                        filePath: event.filePath,
                        entityType: entity.type || entity.entityType
                    },
                    retryCount: 0,
                    maxRetries: 3,
                    createdAt: new Date()
                };
                await this.queueManager.enqueue(entityTask);
            }
            // Convert relationships to change fragments
            for (const relationship of parseResult.relationships) {
                const fragment = {
                    id: `fragment-${event.id}-relationship-${relationship.id || this.generateRelationshipId(relationship)}`,
                    eventId: event.id,
                    changeType: 'relationship',
                    operation: 'add',
                    data: {
                        ...relationship,
                        metadata: {
                            ...relationship.metadata,
                            source: 'ingestion-pipeline',
                            parseTimestamp: new Date(),
                            namespace: event.namespace,
                            module: event.module
                        }
                    },
                    dependencyHints: [
                        relationship.fromEntityId || ((_a = relationship.from) === null || _a === void 0 ? void 0 : _a.id),
                        relationship.toEntityId || ((_b = relationship.to) === null || _b === void 0 ? void 0 : _b.id)
                    ].filter(Boolean),
                    confidence: relationship.confidence || 0.8
                };
                fragments.push(fragment);
                // Queue relationship processing
                const relationshipTask = {
                    id: `relationship-${fragment.id}`,
                    type: 'relationship_upsert',
                    priority: 4, // Lower priority than entities
                    data: [fragment.data],
                    metadata: {
                        fragmentId: fragment.id,
                        filePath: event.filePath,
                        relationshipType: relationship.type
                    },
                    retryCount: 0,
                    maxRetries: 3,
                    createdAt: new Date()
                };
                await this.queueManager.enqueue(relationshipTask);
            }
            // Log parsing errors if any
            if (parseResult.errors && parseResult.errors.length > 0) {
                console.warn(`[IngestionPipeline] Parse errors for ${event.filePath}:`, parseResult.errors);
                // Emit error events for monitoring
                for (const error of parseResult.errors) {
                    this.emit('parse:error', {
                        filePath: event.filePath,
                        error: error.message,
                        line: error.line,
                        column: error.column,
                        severity: error.severity
                    });
                }
            }
            console.log(`[IngestionPipeline] Successfully parsed ${event.filePath}: ${parseResult.entities.length} entities, ${parseResult.relationships.length} relationships`);
            return fragments;
        }
        catch (error) {
            console.error(`[IngestionPipeline] Failed to parse file ${event.filePath}:`, error);
            // Emit error event
            this.emit('parse:error', {
                filePath: event.filePath,
                error: error instanceof Error ? error.message : 'Unknown parsing error'
            });
            // Return empty fragments array instead of failing completely
            return [];
        }
    }
    /**
     * Generate a relationship ID for relationships that don't have one
     */
    generateRelationshipId(relationship) {
        var _a, _b;
        const fromId = relationship.fromEntityId || ((_a = relationship.from) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
        const toId = relationship.toEntityId || ((_b = relationship.to) === null || _b === void 0 ? void 0 : _b.id) || 'unknown';
        const type = relationship.type || 'unknown';
        return `${fromId}-${type}-${toId}`;
    }
    /**
     * Handle entity upsert task
     */
    async handleEntityUpsert(entities) {
        if (this.knowledgeGraphService) {
            return this.knowledgeGraphService.createEntitiesBulk(entities);
        }
        console.log(`[IngestionPipeline] Mock: Upserted ${entities.length} entities`);
        return { success: true, count: entities.length };
    }
    /**
     * Handle relationship upsert task
     */
    async handleRelationshipUpsert(relationships) {
        if (this.knowledgeGraphService) {
            return this.knowledgeGraphService.createRelationshipsBulk(relationships);
        }
        console.log(`[IngestionPipeline] Mock: Upserted ${relationships.length} relationships`);
        return { success: true, count: relationships.length };
    }
    /**
     * Handle enrichment task (embeddings, analysis, etc.)
     */
    async handleEnrichmentTask(task) {
        const startTime = Date.now();
        try {
            let result;
            switch (task.type) {
                case 'embedding':
                    result = await this.handleEmbeddingTask(task);
                    break;
                case 'impact_analysis':
                    result = await this.handleImpactAnalysisTask(task);
                    break;
                case 'documentation':
                    result = await this.handleDocumentationTask(task);
                    break;
                case 'security':
                    result = await this.handleSecurityTask(task);
                    break;
                default:
                    throw new Error(`Unknown enrichment task type: ${task.type}`);
            }
            return {
                taskId: task.id,
                entityId: task.entityId,
                type: task.type,
                success: true,
                result,
                duration: Date.now() - startTime,
                metadata: {}
            };
        }
        catch (error) {
            return {
                taskId: task.id,
                entityId: task.entityId,
                type: task.type,
                success: false,
                error: error,
                duration: Date.now() - startTime,
                metadata: {}
            };
        }
    }
    /**
     * Handle embedding generation task using real EmbeddingService
     */
    async handleEmbeddingTask(task) {
        var _a;
        if (!this.embeddingService) {
            console.log(`[IngestionPipeline] No EmbeddingService available, skipping embedding for entity ${task.entityId}`);
            return { embedding: null, skipped: true };
        }
        try {
            console.log(`[IngestionPipeline] Generating embedding for entity ${task.entityId}`);
            // Get the entity from the task data
            const entity = task.data;
            if (!entity) {
                console.warn(`[IngestionPipeline] No entity data found for embedding task ${task.entityId}`);
                return { embedding: null, error: 'No entity data' };
            }
            // Generate and store the embedding using the real service
            const embeddingResult = await this.embeddingService.generateAndStore(entity, {
                indexName: 'entity_vectors',
                checkpointId: (_a = task.metadata) === null || _a === void 0 ? void 0 : _a.checkpointId
            });
            console.log(`[IngestionPipeline] Successfully generated embedding for entity ${task.entityId}, dimensions: ${embeddingResult.vector.length}`);
            return {
                entityId: embeddingResult.entityId,
                embedding: embeddingResult.vector,
                metadata: embeddingResult.metadata,
                success: true
            };
        }
        catch (error) {
            console.error(`[IngestionPipeline] Failed to generate embedding for entity ${task.entityId}:`, error);
            // Emit error event for monitoring
            this.emit('embedding:error', {
                entityId: task.entityId,
                error: error instanceof Error ? error.message : 'Unknown embedding error'
            });
            return {
                entityId: task.entityId,
                embedding: null,
                error: error instanceof Error ? error.message : 'Unknown embedding error',
                success: false
            };
        }
    }
    /**
     * Handle impact analysis task
     */
    async handleImpactAnalysisTask(task) {
        console.log(`[IngestionPipeline] Mock: Analyzed impact for entity ${task.entityId}`);
        return { impactScore: Math.random(), affectedEntities: [] };
    }
    /**
     * Handle documentation analysis task
     */
    async handleDocumentationTask(task) {
        console.log(`[IngestionPipeline] Mock: Analyzed documentation for entity ${task.entityId}`);
        return { documentationScore: Math.random(), topics: [] };
    }
    /**
     * Handle security scanning task
     */
    async handleSecurityTask(task) {
        console.log(`[IngestionPipeline] Mock: Security scan for entity ${task.entityId}`);
        return { vulnerabilities: [], riskScore: Math.random() };
    }
    /**
     * Calculate priority for an event
     */
    calculateEventPriority(event) {
        let priority = 5; // Default
        // Higher priority for certain file types
        if (event.filePath.endsWith('.ts') || event.filePath.endsWith('.js')) {
            priority += 2;
        }
        // Higher priority for smaller files (faster to process)
        if (event.size < 10000) {
            priority += 1;
        }
        // Higher priority for modifications vs. creates
        if (event.eventType === 'modified') {
            priority += 1;
        }
        return Math.min(priority, 10);
    }
    /**
     * Record latency for metrics
     */
    recordLatency(latency) {
        this.latencyBuffer.push(latency);
        // Keep only last 1000 measurements
        if (this.latencyBuffer.length > 1000) {
            this.latencyBuffer.shift();
        }
        // Update metrics
        this.metrics.averageLatency = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;
        // Calculate P95
        const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        this.metrics.p95Latency = sorted[p95Index] || 0;
    }
    /**
     * Start monitoring and metrics collection
     */
    startMonitoring() {
        // Metrics collection
        this.metricsTimer = setInterval(() => {
            this.updateMetrics();
            this.checkAlerts();
            this.emit('metrics:updated', this.metrics);
        }, this.config.monitoring.metricsInterval);
        // Health checks
        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.monitoring.healthCheckInterval);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
            this.metricsTimer = undefined;
        }
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }
    /**
     * Update pipeline metrics
     */
    updateMetrics() {
        // Calculate throughput
        const now = Date.now();
        this.throughputBuffer.push(this.processedEventCount);
        if (this.throughputBuffer.length > 60) { // Last 60 seconds
            this.throughputBuffer.shift();
        }
        this.metrics.eventsPerSecond = this.throughputBuffer.length > 1
            ? (this.throughputBuffer[this.throughputBuffer.length - 1] - this.throughputBuffer[0]) / this.throughputBuffer.length
            : 0;
        // Update worker metrics
        this.metrics.workerMetrics = this.workerPool.getMetrics().workers;
        // Update batch metrics
        const batchMetrics = this.batchProcessor.getMetrics();
        this.metrics.batchMetrics.activeBatches = batchMetrics.activeBatches;
        // Update current load
        this.state.currentLoad = this.metrics.queueMetrics.queueDepth / this.config.monitoring.alertThresholds.queueDepth;
        this.state.lastActivity = new Date();
    }
    /**
     * Check alert conditions
     */
    checkAlerts() {
        for (const alert of this.alertConfigs) {
            let value = 0;
            switch (alert.name) {
                case 'queue_depth':
                    value = this.metrics.queueMetrics.queueDepth;
                    break;
                case 'latency':
                    value = this.metrics.p95Latency;
                    break;
                case 'error_rate':
                    value = this.metrics.queueMetrics.errorRate;
                    break;
            }
            if (value >= alert.threshold) {
                this.emit('alert:triggered', alert, value);
            }
        }
    }
    /**
     * Perform health check
     */
    performHealthCheck() {
        // Check if components are responsive
        const queueMetrics = this.queueManager.getMetrics();
        const workerMetrics = this.workerPool.getMetrics();
        // Alert if queue is backing up
        if (queueMetrics.queueDepth > this.config.monitoring.alertThresholds.queueDepth) {
            console.warn(`[IngestionPipeline] Queue depth warning: ${queueMetrics.queueDepth}`);
        }
        // Alert if workers are all busy
        if (workerMetrics.idleWorkers === 0 && workerMetrics.totalWorkers > 0) {
            console.warn('[IngestionPipeline] All workers busy, consider scaling up');
        }
        // Alert if error rate is high
        if (this.metrics.queueMetrics.errorRate > this.config.monitoring.alertThresholds.errorRate) {
            console.warn(`[IngestionPipeline] High error rate: ${this.metrics.queueMetrics.errorRate}`);
        }
    }
    // ========== Additional Pipeline Methods ==========
    /**
     * Process a single file through the pipeline
     */
    async processFile(filePath) {
        const fs = await import('fs/promises');
        const stats = await fs.stat(filePath);
        const event = {
            id: `file-${Date.now()}-${Math.random()}`,
            namespace: 'file-processing',
            module: await this.extractModuleName(filePath),
            filePath,
            eventType: 'created',
            timestamp: new Date(),
            size: stats.size,
            diffHash: `hash-${Math.random()}`,
            metadata: {
                singleFile: true
            }
        };
        await this.ingestChangeEvent(event);
    }
    /**
     * Wait for the pipeline to complete all pending work
     */
    async waitForCompletion(timeoutMs = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const state = this.getState();
            const metrics = this.getMetrics();
            // Check if pipeline is idle (no active processing)
            if (state.currentLoad === 0 && metrics.queueMetrics.queueDepth === 0) {
                return;
            }
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error(`Pipeline did not complete within ${timeoutMs}ms timeout`);
    }
    /**
     * Extract module name from file path
     */
    async extractModuleName(filePath) {
        const path = await import('path');
        const parts = filePath.split(path.sep).filter(Boolean);
        // Find 'src' directory and use path from there
        const srcIndex = parts.findIndex(part => part === 'src');
        if (srcIndex >= 0 && srcIndex < parts.length - 1) {
            return parts.slice(srcIndex + 1, -1).join('/') || 'root';
        }
        // Fallback to parent directory
        return parts.slice(-2, -1)[0] || 'root';
    }
    // ========== Helper Methods for Telemetry ==========
    /**
     * Track an error for telemetry
     */
    trackError(type, message) {
        // Update error count by type
        const currentCount = this.errorTypes.get(type) || 0;
        this.errorTypes.set(type, currentCount + 1);
        // Add to recent errors (keep last 100)
        this.recentErrors.push({
            type,
            message,
            timestamp: new Date()
        });
        if (this.recentErrors.length > 100) {
            this.recentErrors.shift();
        }
    }
    /**
     * Get breakdown of error types
     */
    getErrorTypeBreakdown() {
        const breakdown = {};
        for (const [type, count] of this.errorTypes) {
            breakdown[type] = count;
        }
        return breakdown;
    }
    /**
     * Get recent error samples
     */
    getRecentErrorSamples() {
        return this.recentErrors.slice(-10).map(error => {
            const err = new Error(error.message);
            err.name = error.type;
            return err;
        });
    }
    /**
     * Get CPU usage (simplified calculation)
     */
    getCpuUsage() {
        // Simple approximation based on queue load and worker utilization
        const state = this.getState();
        const metrics = this.getMetrics();
        // Base CPU usage on current load and active workers
        const baseUsage = state.currentLoad * 0.3; // 30% max for queue load
        const workerUsage = metrics.workerMetrics.length > 0
            ? metrics.workerMetrics.filter(w => w.status === 'busy').length / metrics.workerMetrics.length * 0.4
            : 0;
        return Math.min(baseUsage + workerUsage, 1.0);
    }
}
//# sourceMappingURL=pipeline.js.map