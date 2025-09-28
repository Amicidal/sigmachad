/**
 * Vector Service
 * Handles vector operations, embeddings, and similarity search
 */

import { EventEmitter } from 'events';
import { CypherExecutor } from '../graph/CypherExecutor.js';

export interface VectorSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface VectorIndexConfig {
  name: string;
  nodeLabel: string;
  propertyKey: string;
  dimensions: number;
  similarityFunction?: 'cosine' | 'euclidean';
}

export class VectorService extends EventEmitter {
  constructor(private executor: CypherExecutor) {
    super();
  }

  /**
   * Create a vector index for embeddings
   */
  async createVectorIndex(config: VectorIndexConfig): Promise<void> {
    const {
      name,
      nodeLabel,
      propertyKey,
      dimensions,
      similarityFunction = 'cosine',
    } = config;

    try {
      // Check if index already exists
      const existingIndexes = await this.executor.callApoc(
        'db.index.vector.list'
      );
      const indexExists = existingIndexes.some((idx: any) => idx.name === name);

      if (!indexExists) {
        // Create vector index using APOC
        await this.executor.callApoc('db.index.vector.createNodeIndex', {
          indexName: name,
          nodeLabel,
          propertyKey,
          similarityFunction,
          vectorDimensions: dimensions,
        });

        this.emit('vectorIndex:created', { name, dimensions });
      }
    } catch (error) {
      // Fallback to basic index if vector index creation fails
      console.warn(
        'Vector index creation failed, falling back to basic index:',
        error
      );
      await this.executor.executeCypher(
        `CREATE INDEX ${name} IF NOT EXISTS FOR (n:${nodeLabel}) ON (n.${propertyKey})`
      );
    }
  }

  /**
   * Upsert vectors (embeddings) for entities
   */
  async upsertVectors(
    vectors: Array<{
      entityId: string;
      vector: number[];
      metadata?: Record<string, any>;
    }>
  ): Promise<void> {
    if (vectors.length === 0) return;

    const queries = vectors.map(({ entityId, vector, metadata }) => ({
      query: `
        MATCH (e:Entity {id: $entityId})
        SET e.embedding = $vector
        SET e.embeddingUpdated = $timestamp
        ${metadata ? 'SET e.embeddingMetadata = $metadata' : ''}
      `,
      params: {
        entityId,
        vector,
        timestamp: new Date().toISOString(),
        metadata: metadata || null,
      },
    }));

    await this.executor.executeTransaction(queries);
    this.emit('vectors:upserted', { count: vectors.length });
  }

  /**
   * Search for similar vectors using vector similarity
   */
  async searchVectors(
    queryVector: number[],
    options: VectorSearchOptions & {
      indexName?: string;
      nodeLabel?: string;
    } = {}
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {
    const {
      limit = 10,
      minScore = 0.1,
      indexName = 'entity_embedding',
      nodeLabel = 'Entity',
      filter = {},
    } = options;

    try {
      // Use APOC vector search if available
      const results = await this.executor.callApoc(
        'db.index.vector.queryNodes',
        {
          indexName,
          queryVector,
          limit,
          filter: Object.keys(filter).length > 0 ? filter : null,
        }
      );

      return results
        .filter((result: any) => result.score >= minScore)
        .map((result: any) => ({
          entityId: result.node.id,
          score: result.score,
          metadata: result.node.embeddingMetadata,
        }));
    } catch (error) {
      // Fallback to basic similarity search
      console.warn(
        'Vector search failed, falling back to basic search:',
        error
      );
      return this.fallbackSimilaritySearch(queryVector, {
        limit,
        minScore,
        nodeLabel,
        filter,
      });
    }
  }

  /**
   * Find similar entities by embedding
   */
  async findSimilar(
    entityId: string,
    options: VectorSearchOptions = {}
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      entity?: any;
    }>
  > {
    // Get the entity's embedding
    const embeddingQuery = await this.executor.executeCypher(
      'MATCH (e:Entity {id: $entityId}) RETURN e.embedding as embedding',
      { entityId }
    );

    if (embeddingQuery.length === 0 || !embeddingQuery[0].embedding) {
      return [];
    }

    const queryVector = embeddingQuery[0].embedding;

    // Search for similar vectors, excluding the entity itself
    const similar = await this.searchVectors(queryVector, {
      ...options,
      filter: { id: { $ne: entityId } },
    });

    // Optionally fetch entity details
    if (options.filter?.includeEntity) {
      const entityIds = similar.map((s) => s.entityId);
      const entities = await this.executor.executeCypher(
        'MATCH (e:Entity) WHERE e.id IN $entityIds RETURN e',
        { entityIds }
      );

      const entityMap = new Map(entities.map((e: any) => [e.id, e]));

      return similar.map((s) => ({
        ...s,
        entity: entityMap.get(s.entityId),
      }));
    }

    return similar;
  }

  /**
   * Batch embed multiple entities
   */
  async batchEmbed(
    entities: Array<{ id: string; content: string; [key: string]: any }>,
    options: {
      batchSize?: number;
      skipExisting?: boolean;
    } = {}
  ): Promise<
    Array<{
      entityId: string;
      vector: number[];
      success: boolean;
      error?: string;
    }>
  > {
    const { batchSize = 50, skipExisting = true } = options;
    const results: Array<{
      entityId: string;
      vector: number[];
      success: boolean;
      error?: string;
    }> = [];

    // Process in batches
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      // Generate embeddings for batch (placeholder - would integrate with actual embedding service)
      const embeddings = await this.generateEmbeddingsBatch(
        batch.map((e) => ({ text: e.content, metadata: e }))
      );

      // Store embeddings
      const vectorsToUpsert = embeddings
        .filter((e) => e.success)
        .map((e) => ({
          entityId: e.entityId,
          vector: e.vector,
          metadata: {
            source: 'batch_embed',
            timestamp: new Date().toISOString(),
          },
        }));

      if (vectorsToUpsert.length > 0) {
        await this.upsertVectors(vectorsToUpsert);
      }

      results.push(...embeddings);
    }

    return results;
  }

  /**
   * Update embedding for a specific entity
   */
  async updateEmbedding(entityId: string, content?: string): Promise<void> {
    let embeddingContent = content;

    // Get content if not provided
    if (!embeddingContent) {
      const result = await this.executor.executeCypher(
        'MATCH (e:Entity {id: $entityId}) RETURN e.content as content',
        { entityId }
      );
      embeddingContent = result[0]?.content;
    }

    if (!embeddingContent) {
      throw new Error(`No content found for entity ${entityId}`);
    }

    // Generate embedding
    const embeddings = await this.generateEmbeddingsBatch([
      { text: embeddingContent },
    ]);
    const embedding = embeddings[0];

    if (!embedding.success) {
      throw new Error(`Failed to generate embedding: ${embedding.error}`);
    }

    // Update the vector
    await this.upsertVectors([
      {
        entityId,
        vector: embedding.vector,
        metadata: { source: 'update', timestamp: new Date().toISOString() },
      },
    ]);
  }

  /**
   * Delete embedding for an entity
   */
  async deleteEmbedding(entityId: string): Promise<void> {
    await this.executor.executeCypher(
      'MATCH (e:Entity {id: $entityId}) REMOVE e.embedding, e.embeddingUpdated, e.embeddingMetadata',
      { entityId }
    );
    this.emit('embedding:deleted', { entityId });
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    totalEmbeddings: number;
    averageDimensions: number;
    lastUpdated?: Date;
  }> {
    const result = await this.executor.executeCypher(`
      MATCH (e:Entity)
      WHERE e.embedding IS NOT NULL
      RETURN count(e) as totalEmbeddings,
             avg(size(e.embedding)) as averageDimensions,
             max(e.embeddingUpdated) as lastUpdated
    `);

    const stats = result[0] || {};
    return {
      totalEmbeddings: stats.totalEmbeddings || 0,
      averageDimensions: stats.averageDimensions || 0,
      lastUpdated: stats.lastUpdated ? new Date(stats.lastUpdated) : undefined,
    };
  }

  /**
   * Fallback similarity search when vector search is not available
   */
  private async fallbackSimilaritySearch(
    queryVector: number[],
    options: {
      limit: number;
      minScore: number;
      nodeLabel: string;
      filter: Record<string, any>;
    }
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {
    // Simple fallback using basic filtering - in practice, you'd want a more sophisticated approach
    const result = await this.executor.executeCypher(
      `MATCH (e:${options.nodeLabel}) WHERE e.embedding IS NOT NULL RETURN e.id as id, e.embedding as embedding LIMIT $limit`,
      { limit: options.limit * 2 }
    );

    const similarities = result
      .map((row: any) => ({
        entityId: row.id,
        score: this.cosineSimilarity(queryVector, row.embedding),
        metadata: {},
      }))
      .filter((item: any) => item.score >= options.minScore)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, options.limit);

    return similarities;
  }

  /**
   * Generate embeddings for a batch of texts (placeholder implementation)
   */
  private async generateEmbeddingsBatch(
    items: Array<{ text: string; metadata?: any }>
  ): Promise<
    Array<{
      entityId: string;
      vector: number[];
      success: boolean;
      error?: string;
    }>
  > {
    // Placeholder implementation - would integrate with actual embedding service
    // For now, generate random vectors as a demonstration
    return items.map((item, index) => ({
      entityId: item.metadata?.id || `item-${index}`,
      vector: Array.from({ length: 384 }, () => Math.random() * 2 - 1), // 384 dimensions
      success: true,
    }));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
