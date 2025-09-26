/**
 * Embedding Service
 * Handles vector generation, storage, and search using Neo4j's native vector support
 */

import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '@memento/core';
import { embeddingService } from '../../utils/embedding.js';

export interface EmbeddingOptions {
  indexName?: string;
  dimensions?: number;
  similarity?: 'euclidean' | 'cosine';
  batchSize?: number;
  checkpointId?: string;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface EmbeddingResult {
  entityId: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  entity: Entity;
  score: number;
  metadata?: Record<string, any>;
}

// Simple cache for embedding results
class EmbeddingCache {
  private cache = new Map<string, { vector: number[]; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 500, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.vector;
  }

  set(key: string, vector: number[]): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      vector,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class EmbeddingService extends EventEmitter {
  private cache: EmbeddingCache;
  private readonly defaultIndexName = 'entity_vectors';
  private readonly defaultDimensions = 768;

  constructor(private neo4j: Neo4jService) {
    super();
    this.cache = new EmbeddingCache();
    this.initializeVectorIndex().catch(err =>
      console.warn('Failed to initialize vector index:', err)
    );
  }

  /**
   * Initialize the default vector index
   */
  async initializeVectorIndex(
    options: EmbeddingOptions = {}
  ): Promise<void> {
    const indexName = options.indexName || this.defaultIndexName;
    const dimensions = options.dimensions || this.defaultDimensions;
    const similarity = options.similarity || 'cosine';

    await this.neo4j.createVectorIndex(
      indexName,
      'Entity',
      'embedding',
      dimensions,
      similarity
    );

    this.emit('index:initialized', { indexName, dimensions, similarity });
  }

  /**
   * Generate and store embeddings for a single entity
   */
  async generateAndStore(
    entity: Entity,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const content = this.extractEntityContent(entity);
    const vector = await this.generateEmbedding(content);

    await this.storeEmbedding(entity.id, vector, options);

    this.cache.set(entity.id, vector);
    this.emit('embedding:created', { entityId: entity.id });

    return {
      entityId: entity.id,
      vector,
      metadata: options.checkpointId ? { checkpointId: options.checkpointId } : undefined,
    };
  }

  /**
   * Batch generate and store embeddings
   */
  async batchEmbed(
    entities: Entity[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const batchSize = options.batchSize || 10;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      const embeddings = await Promise.all(
        batch.map(async entity => {
          const content = this.extractEntityContent(entity);
          const vector = await this.generateEmbedding(content);
          return {
            id: entity.id,
            vector,
            properties: options.checkpointId
              ? { checkpointId: options.checkpointId }
              : {},
          };
        })
      );

      await this.neo4j.upsertVectors('Entity', embeddings);

      embeddings.forEach(e => {
        this.cache.set(e.id, e.vector);
        results.push({
          entityId: e.id,
          vector: e.vector,
          metadata: e.properties,
        });
      });

      this.emit('embeddings:batch:created', {
        count: embeddings.length,
        total: entities.length,
        progress: Math.min((i + batchSize) / entities.length, 1),
      });
    }

    return results;
  }

  /**
   * Search for similar entities using vector similarity
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const queryVector = await this.generateEmbedding(query);
    return this.searchByVector(queryVector, options);
  }

  /**
   * Search using a pre-computed vector
   */
  async searchByVector(
    queryVector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const indexName = this.defaultIndexName;

    const results = await this.neo4j.searchVectors(
      indexName,
      queryVector,
      {
        limit: options.limit || 10,
        minScore: options.minScore || 0.5,
        filter: options.filter,
      }
    );

    return results.map(result => ({
      entity: this.parseEntity(result.node),
      score: result.score,
      metadata: options.includeMetadata
        ? this.extractMetadata(result.node)
        : undefined,
    }));
  }

  /**
   * Update embedding for an existing entity
   */
  async updateEmbedding(
    entityId: string,
    content?: string,
    options: EmbeddingOptions = {}
  ): Promise<void> {
    let vector: number[];

    if (content) {
      vector = await this.generateEmbedding(content);
    } else {
      // Fetch entity and regenerate
      const query = `MATCH (n:Entity {id: $id}) RETURN n`;
      const result = await this.neo4j.executeCypher(query, { id: entityId });

      if (result.length === 0) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      const entity = this.parseEntity(result[0].n);
      const entityContent = this.extractEntityContent(entity);
      vector = await this.generateEmbedding(entityContent);
    }

    await this.storeEmbedding(entityId, vector, options);
    this.cache.set(entityId, vector);

    this.emit('embedding:updated', { entityId });
  }

  /**
   * Delete embedding for an entity
   */
  async deleteEmbedding(entityId: string): Promise<void> {
    const query = `
      MATCH (n:Entity {id: $id})
      REMOVE n.embedding
      RETURN n
    `;

    await this.neo4j.executeCypher(query, { id: entityId });
    this.cache.clear();

    this.emit('embedding:deleted', { entityId });
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    total: number;
    indexed: number;
    dimensions: number;
    avgMagnitude: number;
  }> {
    const queries = [
      {
        name: 'total',
        query: 'MATCH (n:Entity) RETURN count(n) as count',
      },
      {
        name: 'indexed',
        query: 'MATCH (n:Entity) WHERE n.embedding IS NOT NULL RETURN count(n) as count',
      },
      {
        name: 'sample',
        query: `
          MATCH (n:Entity)
          WHERE n.embedding IS NOT NULL
          RETURN n.embedding as embedding
          LIMIT 100
        `,
      },
    ];

    const [totalResult, indexedResult, sampleResult] = await Promise.all(
      queries.map(q => this.neo4j.executeCypher(q.query))
    );

    const total = totalResult[0]?.count || 0;
    const indexed = indexedResult[0]?.count || 0;

    let dimensions = this.defaultDimensions;
    let avgMagnitude = 0;

    if (sampleResult.length > 0) {
      const samples = sampleResult
        .map(r => r.embedding)
        .filter(e => Array.isArray(e));

      if (samples.length > 0) {
        dimensions = samples[0].length;

        const magnitudes = samples.map(vector =>
          Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0))
        );

        avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      }
    }

    return {
      total,
      indexed,
      dimensions,
      avgMagnitude,
    };
  }

  /**
   * Find similar entities to a given entity
   */
  async findSimilar(
    entityId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // Try cache first
    let vector = this.cache.get(entityId);

    if (!vector) {
      // Fetch from database
      const query = `
        MATCH (n:Entity {id: $id})
        WHERE n.embedding IS NOT NULL
        RETURN n.embedding as embedding
      `;

      const result = await this.neo4j.executeCypher(query, { id: entityId });

      if (result.length === 0 || !result[0].embedding) {
        throw new Error(`No embedding found for entity: ${entityId}`);
      }

      vector = result[0].embedding;
      if (!vector) {
        throw new Error(`Invalid embedding for entity: ${entityId}`);
      }
      this.cache.set(entityId, vector);
    }

    if (!vector) {
      throw new Error(`No valid embedding found for entity: ${entityId}`);
    }

    // Exclude the source entity from results
    const filter = { ...options.filter, 'id': { $ne: entityId } };

    return this.searchByVector(vector, { ...options, filter });
  }

  /**
   * Generate embedding for content
   */
  private async generateEmbedding(content: string): Promise<number[]> {
    if (!content || content.trim().length === 0) {
      // Return zero vector for empty content
      return new Array(this.defaultDimensions).fill(0);
    }

    try {
      const result = await embeddingService.generateEmbedding(content);
      return result.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Return random unit vector as fallback
      const vector = new Array(this.defaultDimensions)
        .fill(0)
        .map(() => Math.random() - 0.5);
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      return vector.map(v => v / magnitude);
    }
  }

  /**
   * Store embedding in Neo4j
   */
  private async storeEmbedding(
    entityId: string,
    vector: number[],
    options: EmbeddingOptions = {}
  ): Promise<void> {
    const properties: any = {
      embeddingVersion: process.env.EMBEDDING_MODEL_VERSION || 'default',
      embeddingUpdatedAt: new Date().toISOString(),
    };

    if (options.checkpointId) {
      properties.checkpointId = options.checkpointId;
    }

    await this.neo4j.upsertVectors('Entity', [{
      id: entityId,
      vector,
      properties,
    }]);
  }

  /**
   * Extract content from entity for embedding
   */
  private extractEntityContent(entity: Entity): string {
    const parts: string[] = [];

    // Add name and type
    if ('name' in entity && entity.name) parts.push(`Name: ${entity.name}`);
    if (entity.type) parts.push(`Type: ${entity.type}`);

    // Add description if available
    if ((entity as any).description) {
      parts.push(`Description: ${(entity as any).description}`);
    }

    // Add content if available (for code entities)
    if ((entity as any).content) {
      const content = (entity as any).content;
      // Truncate very long content
      const maxLength = 5000;
      if (content.length > maxLength) {
        parts.push(content.substring(0, maxLength) + '...');
      } else {
        parts.push(content);
      }
    }

    // Add path if available
    if ((entity as any).path) {
      parts.push(`Path: ${(entity as any).path}`);
    }

    // Add metadata if available
    if ('metadata' in entity && entity.metadata) {
      parts.push(`Metadata: ${JSON.stringify(entity.metadata)}`);
    }

    return parts.join('\n');
  }

  /**
   * Parse entity from Neo4j node
   */
  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (key === 'embedding') continue; // Skip embedding vector

      if (value === null || value === undefined) continue;

      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }

  /**
   * Extract metadata from Neo4j node
   */
  private extractMetadata(node: any): Record<string, any> {
    const properties = node.properties || node;
    const metadata: Record<string, any> = {};

    const metadataKeys = [
      'embeddingVersion',
      'embeddingUpdatedAt',
      'checkpointId',
      'confidence',
      'source',
    ];

    for (const key of metadataKeys) {
      if (properties[key]) {
        metadata[key] = properties[key];
      }
    }

    return metadata;
  }
}