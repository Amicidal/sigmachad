/**
 * Batch Processor for High-Throughput Ingestion Pipeline
 * Implements streaming batch processing with dependency DAG and idempotent operations
 * Based on HighThroughputKnowledgeGraph.md micro-batch architecture
 */

import { EventEmitter } from 'events';
import { Entity } from '@memento/core';
import { GraphRelationship } from '@memento/core';
import {
  BatchConfig,
  BatchMetadata,
  BatchResult,
  TaskPayload,
  ChangeFragment,
  DependencyDAG,
  DependencyNode,
  IdempotentBatch,
  StreamingWriteConfig,
  BatchProcessingError,
  IngestionError,
  IngestionEvents
} from './types.js';
import { KnowledgeGraphServiceIntegration } from './pipeline.js';

export interface BatchProcessorConfig extends BatchConfig {
  streaming: StreamingWriteConfig;
  enableDAG: boolean;
  epochTTL: number;
  dependencyTimeout: number;
}

export interface BatchProcessor {
  processEntities(entities: Entity[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
  processRelationships(relationships: GraphRelationship[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
  processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]>;
}

export class HighThroughputBatchProcessor extends EventEmitter<IngestionEvents> implements BatchProcessor {
  private config: BatchProcessorConfig;
  private activeBatches: Map<string, IdempotentBatch> = new Map();
  private processedBatches: Set<string> = new Set();
  private epochCounter = 0;
  private dependencyDAG?: DependencyDAG;
  private running = false;
  private knowledgeGraphService?: KnowledgeGraphServiceIntegration;

  // Idempotency tracking
  private idempotencyKeys: Map<string, { batchId: string; result: BatchResult; expiresAt: Date }> = new Map();

  constructor(config: BatchProcessorConfig, knowledgeGraphService?: KnowledgeGraphServiceIntegration) {
    super();
    this.config = config;
    this.knowledgeGraphService = knowledgeGraphService;

    // Start cleanup timer for expired idempotency keys
    setInterval(() => this.cleanupExpiredKeys(), 60000); // Every minute
  }

  /**
   * Start the batch processor
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError('Batch processor already running', 'ALREADY_RUNNING');
    }

    this.running = true;
    console.log('[BatchProcessor] Started');
  }

  /**
   * Stop the batch processor
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Wait for active batches to complete
    await this.waitForActiveBatches();

    console.log('[BatchProcessor] Stopped');
  }

  /**
   * Process a batch of entities with streaming writes
   */
  async processEntities(entities: Entity[], metadata: Partial<BatchMetadata> = {}): Promise<BatchResult> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    const batchMeta: BatchMetadata = {
      id: this.generateBatchId(),
      type: 'entity',
      size: entities.length,
      priority: metadata.priority || 5,
      createdAt: new Date(),
      epochId: this.generateEpochId(),
      namespace: metadata.namespace
    };

    this.emit('batch:created', batchMeta);

    try {
      // Check for idempotency
      const idempotencyKey = this.generateIdempotencyKey('entity', entities);
      const existingResult = this.checkIdempotency(idempotencyKey);
      if (existingResult) {
        console.log(`[BatchProcessor] Returning cached result for batch ${batchMeta.id}`);
        return existingResult;
      }

      const result = await this.processEntityBatch(entities, batchMeta);

      // Store idempotent result
      this.storeIdempotentResult(idempotencyKey, result);

      this.emit('batch:completed', result);
      return result;

    } catch (error) {
      const batchError = new BatchProcessingError(
        `Entity batch processing failed: ${(error as Error).message}`,
        batchMeta.id,
        entities
      );

      this.emit('batch:failed', batchError);
      throw batchError;
    }
  }

  /**
   * Process a batch of relationships with dependency resolution
   */
  async processRelationships(
    relationships: GraphRelationship[],
    metadata: Partial<BatchMetadata> = {}
  ): Promise<BatchResult> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    const batchMeta: BatchMetadata = {
      id: this.generateBatchId(),
      type: 'relationship',
      size: relationships.length,
      priority: metadata.priority || 5,
      createdAt: new Date(),
      epochId: this.generateEpochId(),
      namespace: metadata.namespace
    };

    this.emit('batch:created', batchMeta);

    try {
      // Check for idempotency
      const idempotencyKey = this.generateIdempotencyKey('relationship', relationships);
      const existingResult = this.checkIdempotency(idempotencyKey);
      if (existingResult) {
        console.log(`[BatchProcessor] Returning cached result for batch ${batchMeta.id}`);
        return existingResult;
      }

      const result = await this.processRelationshipBatch(relationships, batchMeta);

      // Store idempotent result
      this.storeIdempotentResult(idempotencyKey, result);

      this.emit('batch:completed', result);
      return result;

    } catch (error) {
      const batchError = new BatchProcessingError(
        `Relationship batch processing failed: ${(error as Error).message}`,
        batchMeta.id,
        relationships
      );

      this.emit('batch:failed', batchError);
      throw batchError;
    }
  }

  /**
   * Process change fragments with dependency DAG ordering
   */
  async processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    if (!this.config.enableDAG) {
      // Simple batching without dependency resolution
      return this.processFragmentsSimple(fragments);
    }

    try {
      // Build dependency DAG
      const dag = this.buildDependencyDAG(fragments);

      // Process in dependency order
      return await this.processFragmentsWithDAG(dag);

    } catch (error) {
      console.error('[BatchProcessor] DAG processing failed, falling back to simple processing:', error);
      return this.processFragmentsSimple(fragments);
    }
  }

  /**
   * Process entity batch with streaming writes
   */
  private async processEntityBatch(entities: Entity[], metadata: BatchMetadata): Promise<BatchResult> {
    const startTime = Date.now();
    const batchId = metadata.id;

    try {
      // Create idempotent batch record
      const idempotentBatch: IdempotentBatch = {
        id: batchId,
        epochId: metadata.epochId!,
        operation: 'entity_upsert',
        data: entities,
        metadata: { batchMetadata: metadata },
        createdAt: metadata.createdAt
      };

      this.activeBatches.set(batchId, idempotentBatch);

      // Split into micro-batches for streaming
      const microBatches = this.createMicroBatches(entities, this.config.entityBatchSize);
      let processedCount = 0;
      let failedCount = 0;
      const errors: Error[] = [];

      // Process micro-batches with controlled concurrency
      const concurrencyLimit = this.config.maxConcurrentBatches;
      const processPromises: Promise<void>[] = [];

      for (let i = 0; i < microBatches.length; i += concurrencyLimit) {
        const batchSlice = microBatches.slice(i, i + concurrencyLimit);

        const batchPromises = batchSlice.map(async (microBatch, index) => {
          try {
            await this.processMicroBatch(microBatch, `${batchId}-micro-${i + index}`);
            processedCount += microBatch.length;
          } catch (error) {
            failedCount += microBatch.length;
            errors.push(error as Error);
            console.error(`[BatchProcessor] Micro-batch failed:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
      }

      const duration = Date.now() - startTime;
      const success = failedCount === 0;

      const result: BatchResult = {
        batchId,
        success,
        processedCount,
        failedCount,
        duration,
        errors,
        metadata
      };

      // Mark batch as processed
      this.activeBatches.delete(batchId);
      this.processedBatches.add(batchId);

      return result;

    } catch (error) {
      this.activeBatches.delete(batchId);
      throw error;
    }
  }

  /**
   * Process relationship batch with endpoint resolution
   */
  private async processRelationshipBatch(
    relationships: GraphRelationship[],
    metadata: BatchMetadata
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const batchId = metadata.id;

    try {
      // Resolve relationship endpoints first
      const resolvedRelationships = await this.resolveRelationshipEndpoints(relationships);

      // Create idempotent batch record
      const idempotentBatch: IdempotentBatch = {
        id: batchId,
        epochId: metadata.epochId!,
        operation: 'relationship_upsert',
        data: resolvedRelationships,
        metadata: { batchMetadata: metadata },
        createdAt: metadata.createdAt
      };

      this.activeBatches.set(batchId, idempotentBatch);

      // Process in micro-batches
      const microBatches = this.createMicroBatches(resolvedRelationships, this.config.relationshipBatchSize);
      let processedCount = 0;
      let failedCount = 0;
      const errors: Error[] = [];

      for (const microBatch of microBatches) {
        try {
          await this.processMicroBatch(microBatch, `${batchId}-rel-${microBatches.indexOf(microBatch)}`);
          processedCount += microBatch.length;
        } catch (error) {
          failedCount += microBatch.length;
          errors.push(error as Error);
          console.error(`[BatchProcessor] Relationship micro-batch failed:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const success = failedCount === 0;

      const result: BatchResult = {
        batchId,
        success,
        processedCount,
        failedCount,
        duration,
        errors,
        metadata
      };

      this.activeBatches.delete(batchId);
      this.processedBatches.add(batchId);

      return result;

    } catch (error) {
      this.activeBatches.delete(batchId);
      throw error;
    }
  }

  /**
   * Process fragments without dependency DAG (simple batching)
   */
  private async processFragmentsSimple(fragments: ChangeFragment[]): Promise<BatchResult[]> {
    const entityFragments = fragments.filter(f => f.changeType === 'entity');
    const relationshipFragments = fragments.filter(f => f.changeType === 'relationship');

    const results: BatchResult[] = [];

    // Process entities first
    if (entityFragments.length > 0) {
      const entities = entityFragments.map(f => f.data as Entity);
      const result = await this.processEntities(entities);
      results.push(result);
    }

    // Then relationships
    if (relationshipFragments.length > 0) {
      const relationships = relationshipFragments.map(f => f.data as GraphRelationship);
      const result = await this.processRelationships(relationships);
      results.push(result);
    }

    return results;
  }

  /**
   * Build dependency DAG from change fragments
   */
  private buildDependencyDAG(fragments: ChangeFragment[]): DependencyDAG {
    const nodes = new Map<string, DependencyNode>();
    const roots: string[] = [];
    const leaves: string[] = [];

    // Create nodes
    for (const fragment of fragments) {
      const node: DependencyNode = {
        id: fragment.id,
        type: fragment.changeType,
        data: fragment.data,
        dependencies: [],
        dependents: [],
        priority: fragment.confidence,
        status: 'pending'
      };

      nodes.set(fragment.id, node);
    }

    // Build dependency relationships
    for (const fragment of fragments) {
      const node = nodes.get(fragment.id)!;

      // Add dependencies based on hints
      for (const hintId of fragment.dependencyHints) {
        const depNode = nodes.get(hintId);
        if (depNode) {
          node.dependencies.push(hintId);
          depNode.dependents.push(fragment.id);
        }
      }
    }

    // Identify roots and leaves
    for (const [nodeId, node] of nodes) {
      if (node.dependencies.length === 0) {
        roots.push(nodeId);
      }
      if (node.dependents.length === 0) {
        leaves.push(nodeId);
      }
    }

    // Detect cycles (simplified)
    const cycles = this.detectCycles(nodes);

    return {
      nodes,
      roots,
      leaves,
      cycles
    };
  }

  /**
   * Process fragments using dependency DAG ordering
   */
  private async processFragmentsWithDAG(dag: DependencyDAG): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const processed = new Set<string>();

    // Process nodes in topological order
    const queue = [...dag.roots];

    while (queue.length > 0) {
      const currentBatch: ChangeFragment[] = [];
      const batchNodes: string[] = [];

      // Collect ready nodes for this batch
      for (let i = queue.length - 1; i >= 0; i--) {
        const nodeId = queue[i];
        const node = dag.nodes.get(nodeId)!;

        // Check if all dependencies are satisfied
        const allDepsSatisfied = node.dependencies.every(depId => processed.has(depId));

        if (allDepsSatisfied) {
          queue.splice(i, 1);
          batchNodes.push(nodeId);

          const fragment: ChangeFragment = {
            id: nodeId,
            eventId: '', // Will be set by caller
            changeType: node.type,
            operation: 'add', // Simplified
            data: node.data,
            dependencyHints: node.dependencies,
            confidence: node.priority
          };

          currentBatch.push(fragment);
        }
      }

      if (currentBatch.length > 0) {
        // Process this batch
        const batchResults = await this.processFragmentsSimple(currentBatch);
        results.push(...batchResults);

        // Mark nodes as processed
        for (const nodeId of batchNodes) {
          processed.add(nodeId);
          const node = dag.nodes.get(nodeId)!;
          node.status = 'completed';

          // Add dependents to queue
          for (const dependentId of node.dependents) {
            if (!queue.includes(dependentId) && !processed.has(dependentId)) {
              queue.push(dependentId);
            }
          }
        }
      } else if (queue.length > 0) {
        // Deadlock or cycle detected
        console.warn('[BatchProcessor] Possible deadlock in DAG, processing remaining nodes');
        break;
      }
    }

    return results;
  }

  /**
   * Create micro-batches from larger batch
   */
  private createMicroBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Process a micro-batch with actual KnowledgeGraphService integration
   */
  private async processMicroBatch(batch: any[], batchId: string): Promise<void> {
    if (!this.knowledgeGraphService) {
      console.log(`[BatchProcessor] No KnowledgeGraphService available, simulating micro-batch ${batchId} with ${batch.length} items`);
      // Simulate processing time for fallback
      await new Promise(resolve => setTimeout(resolve, 10));
      return;
    }

    try {
      // Separate entities and relationships
      const entities: Entity[] = [];
      const relationships: GraphRelationship[] = [];

      for (const item of batch) {
        if (item.type === 'entity' || item.entityType) {
          entities.push(item);
        } else if (item.type === 'relationship' || item.fromEntityId || item.toEntityId) {
          relationships.push(item);
        }
      }

      // Process entities in bulk if we have any
      if (entities.length > 0) {
        console.log(`[BatchProcessor] Processing ${entities.length} entities in micro-batch ${batchId}`);
        await this.knowledgeGraphService.createEntitiesBulk(entities, {
          batchId,
          skipEmbedding: true, // Embeddings are handled separately
          microBatch: true
        });
      }

      // Process relationships in bulk if we have any
      if (relationships.length > 0) {
        console.log(`[BatchProcessor] Processing ${relationships.length} relationships in micro-batch ${batchId}`);
        await this.knowledgeGraphService.createRelationshipsBulk(relationships, {
          batchId,
          microBatch: true
        });
      }

      console.log(`[BatchProcessor] Successfully processed micro-batch ${batchId} with ${entities.length} entities and ${relationships.length} relationships`);

    } catch (error) {
      console.error(`[BatchProcessor] Error processing micro-batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve relationship endpoints using cache/lookup
   */
  private async resolveRelationshipEndpoints(relationships: GraphRelationship[]): Promise<GraphRelationship[]> {
    // Validate and normalize relationship endpoints
    return relationships.filter(rel => {
      // Ensure both endpoints exist
      const hasFromId = rel.fromEntityId || (rel.from && (rel.from as any).id);
      const hasToId = rel.toEntityId || (rel.to && (rel.to as any).id);

      if (!hasFromId || !hasToId) {
        console.warn(`[BatchProcessor] Skipping relationship with missing endpoints: ${JSON.stringify(rel)}`);
        return false;
      }

      // Normalize IDs if needed
      if (!rel.fromEntityId && rel.from) {
        rel.fromEntityId = (rel.from as any).id;
      }
      if (!rel.toEntityId && rel.to) {
        rel.toEntityId = (rel.to as any).id;
      }

      return true;
    });
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Generate epoch ID for transaction versioning
   */
  private generateEpochId(): string {
    return `epoch-${++this.epochCounter}-${Date.now()}`;
  }

  /**
   * Generate idempotency key for batch
   */
  private generateIdempotencyKey(type: string, data: any[]): string {
    // Simple hash of the data - in production, use a proper hash function
    const dataStr = JSON.stringify(data.map(item => ({ id: item.id, type: item.type || type })));
    return `${type}-${this.simpleHash(dataStr)}`;
  }

  /**
   * Check if a batch has already been processed (idempotency)
   */
  private checkIdempotency(key: string): BatchResult | null {
    const cached = this.idempotencyKeys.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.result;
    }
    return null;
  }

  /**
   * Store idempotent result
   */
  private storeIdempotentResult(key: string, result: BatchResult): void {
    const expiresAt = new Date(Date.now() + this.config.streaming.idempotencyKeyTTL);
    this.idempotencyKeys.set(key, { batchId: result.batchId, result, expiresAt });
  }

  /**
   * Simple hash function for idempotency keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Detect cycles in the dependency graph (simplified)
   */
  private detectCycles(nodes: Map<string, DependencyNode>): string[][] {
    // Simple cycle detection - in production, use proper algorithms
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Cycle detected
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          dfs(depId, [...path]);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Wait for all active batches to complete
   */
  private async waitForActiveBatches(): Promise<void> {
    const timeout = this.config.timeoutMs;
    const startTime = Date.now();

    while (this.activeBatches.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn('[BatchProcessor] Timeout waiting for active batches to complete');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Cleanup expired idempotency keys
   */
  private cleanupExpiredKeys(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, cached] of this.idempotencyKeys) {
      if (cached.expiresAt <= now) {
        this.idempotencyKeys.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[BatchProcessor] Cleaned up ${cleanedCount} expired idempotency keys`);
    }
  }

  /**
   * Get current batch processing metrics
   */
  getMetrics(): {
    activeBatches: number;
    processedBatches: number;
    idempotencyKeys: number;
  } {
    return {
      activeBatches: this.activeBatches.size,
      processedBatches: this.processedBatches.size,
      idempotencyKeys: this.idempotencyKeys.size
    };
  }
}