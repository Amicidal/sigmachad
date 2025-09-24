/**
 * High-Throughput Ingestion Pipeline Orchestrator
 * Main orchestrator that coordinates event processing, queueing, workers, and batching
 * Based on HighThroughputKnowledgeGraph.md architecture
 */
import { EventEmitter } from 'events';
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import { PipelineConfig, PipelineMetrics, PipelineState, ChangeEvent, ChangeFragment, IngestionTelemetry, AlertConfig, IngestionEvents, EnrichmentTask } from './types.js';
import { EmbeddingService } from '../embeddings/EmbeddingService.js';
export interface KnowledgeGraphServiceIntegration {
    createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
}
export declare class HighThroughputIngestionPipeline extends EventEmitter<IngestionEvents> {
    private config;
    private state;
    private metrics;
    private queueManager;
    private workerPool;
    private batchProcessor;
    private astParser;
    private embeddingService?;
    private knowledgeGraphService?;
    private metricsTimer?;
    private healthCheckTimer?;
    private alertConfigs;
    private processedEventCount;
    private errorCount;
    private latencyBuffer;
    private throughputBuffer;
    private errorTypes;
    private recentErrors;
    private enrichmentQueue;
    constructor(config: PipelineConfig, knowledgeGraphService?: KnowledgeGraphServiceIntegration, services?: {
        embeddingService?: EmbeddingService;
    });
    /**
     * Start the ingestion pipeline
     */
    start(): Promise<void>;
    /**
     * Stop the ingestion pipeline
     */
    stop(): Promise<void>;
    /**
     * Pause the pipeline (stop accepting new events)
     */
    pause(): Promise<void>;
    /**
     * Resume the pipeline
     */
    resume(): Promise<void>;
    /**
     * Ingest a change event into the pipeline
     */
    ingestChangeEvent(event: ChangeEvent): Promise<void>;
    /**
     * Ingest multiple change events in batch
     */
    ingestChangeEvents(events: ChangeEvent[]): Promise<void>;
    /**
     * Process change fragments directly (bypassing file parsing)
     */
    processChangeFragments(fragments: ChangeFragment[]): Promise<void>;
    /**
     * Add enrichment task to async processing queue
     */
    scheduleEnrichment(task: EnrichmentTask): Promise<void>;
    /**
     * Get current pipeline metrics
     */
    getMetrics(): PipelineMetrics;
    /**
     * Get current pipeline state
     */
    getState(): PipelineState;
    /**
     * Get current telemetry data
     */
    getTelemetry(): IngestionTelemetry;
    /**
     * Add alert configuration
     */
    addAlert(alert: AlertConfig): void;
    /**
     * Initialize core components
     */
    private initializeComponents;
    /**
     * Setup event handlers for component coordination
     */
    private setupEventHandlers;
    /**
     * Register handlers for different worker types
     */
    private registerWorkerHandlers;
    /**
     * Handle file parsing task using real AST parser
     */
    private handleParseTask;
    /**
     * Generate a relationship ID for relationships that don't have one
     */
    private generateRelationshipId;
    /**
     * Handle entity upsert task
     */
    private handleEntityUpsert;
    /**
     * Handle relationship upsert task
     */
    private handleRelationshipUpsert;
    /**
     * Handle enrichment task (embeddings, analysis, etc.)
     */
    private handleEnrichmentTask;
    /**
     * Handle embedding generation task using real EmbeddingService
     */
    private handleEmbeddingTask;
    /**
     * Handle impact analysis task
     */
    private handleImpactAnalysisTask;
    /**
     * Handle documentation analysis task
     */
    private handleDocumentationTask;
    /**
     * Handle security scanning task
     */
    private handleSecurityTask;
    /**
     * Calculate priority for an event
     */
    private calculateEventPriority;
    /**
     * Record latency for metrics
     */
    private recordLatency;
    /**
     * Start monitoring and metrics collection
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    private stopMonitoring;
    /**
     * Update pipeline metrics
     */
    private updateMetrics;
    /**
     * Check alert conditions
     */
    private checkAlerts;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Process a single file through the pipeline
     */
    processFile(filePath: string): Promise<void>;
    /**
     * Wait for the pipeline to complete all pending work
     */
    waitForCompletion(timeoutMs?: number): Promise<void>;
    /**
     * Extract module name from file path
     */
    private extractModuleName;
    /**
     * Track an error for telemetry
     */
    private trackError;
    /**
     * Get breakdown of error types
     */
    private getErrorTypeBreakdown;
    /**
     * Get recent error samples
     */
    private getRecentErrorSamples;
    /**
     * Get CPU usage (simplified calculation)
     */
    private getCpuUsage;
}
//# sourceMappingURL=pipeline.d.ts.map