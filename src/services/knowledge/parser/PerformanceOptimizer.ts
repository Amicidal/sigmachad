/**
 * Performance Optimizer for AST Parser Modules
 * Provides memory and performance optimizations
 */

import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";

/**
 * Configuration for performance optimizations
 */
export interface OptimizationConfig {
  maxCacheSize: number;
  batchSize: number;
  gcThreshold: number;
  enableLazyLoading: boolean;
  enableWeakRefs: boolean;
}

/**
 * Performance metrics tracking
 */
export interface PerformanceMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cacheHitRate: number;
  parsedFiles: number;
  totalEntities: number;
  totalRelationships: number;
  averageParseTime: number;
}

/**
 * Manages performance optimizations and memory usage for the parser
 */
export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private parseStartTimes: Map<string, number> = new Map();
  private totalParseTime: number = 0;
  private parsedFileCount: number = 0;

  // Weak references for optional data to reduce memory pressure
  private weakEntityRefs: WeakMap<Entity, any> = new WeakMap();
  private weakRelationshipRefs: WeakMap<GraphRelationship, any> = new WeakMap();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      maxCacheSize: 1000,
      batchSize: 50,
      gcThreshold: 100,
      enableLazyLoading: true,
      enableWeakRefs: true,
      ...config,
    };

    this.metrics = {
      memoryUsage: process.memoryUsage(),
      cacheHitRate: 0,
      parsedFiles: 0,
      totalEntities: 0,
      totalRelationships: 0,
      averageParseTime: 0,
    };
  }

  /**
   * Start tracking parse time for a file
   * @param filePath - Path of the file being parsed
   */
  startParseTimer(filePath: string): void {
    this.parseStartTimes.set(filePath, Date.now());
  }

  /**
   * End tracking parse time for a file
   * @param filePath - Path of the file that was parsed
   */
  endParseTimer(filePath: string): void {
    const startTime = this.parseStartTimes.get(filePath);
    if (startTime) {
      const parseTime = Date.now() - startTime;
      this.totalParseTime += parseTime;
      this.parsedFileCount++;
      this.parseStartTimes.delete(filePath);
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
    this.updateCacheHitRate();
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Process entities in batches to reduce memory pressure
   * @param entities - Entities to process
   * @param processor - Function to process each batch
   * @returns Processed results
   */
  async processBatchedEntities<T>(
    entities: Entity[],
    processor: (batch: Entity[]) => Promise<T[]>
  ): Promise<T[]> {
    const results: T[] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      // Force garbage collection if threshold reached
      if (i % this.config.gcThreshold === 0 && global.gc) {
        global.gc();
      }
    }

    return results;
  }

  /**
   * Optimize symbol map by removing stale entries
   * @param symbolMap - Symbol map to optimize
   * @param maxAge - Maximum age in milliseconds
   * @returns Number of entries removed
   */
  optimizeSymbolMap(symbolMap: Map<string, SymbolEntity>, maxAge: number = 3600000): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, symbol] of symbolMap.entries()) {
      const age = now - symbol.lastModified.getTime();
      if (age > maxAge) {
        symbolMap.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Create a memory-efficient entity cache with LRU eviction
   * @param maxSize - Maximum cache size
   * @returns LRU cache implementation
   */
  createLRUCache<K, V>(maxSize: number = this.config.maxCacheSize): Map<K, V> & {
    delete: (key: K) => boolean;
    clear: () => void;
    has: (key: K) => boolean;
    get: (key: K) => V | undefined;
    set: (key: K, value: V) => this;
  } {
    const cache = new Map<K, V>();
    const usage = new Map<K, number>();
    let counter = 0;

    const lruCache = {
      delete: (key: K): boolean => {
        usage.delete(key);
        return cache.delete(key);
      },
      clear: (): void => {
        cache.clear();
        usage.clear();
        counter = 0;
      },
      has: (key: K): boolean => cache.has(key),
      get: (key: K): V | undefined => {
        if (cache.has(key)) {
          usage.set(key, ++counter);
          return cache.get(key);
        }
        return undefined;
      },
      set: (key: K, value: V): typeof lruCache => {
        // Evict least recently used item if cache is full
        if (cache.size >= maxSize && !cache.has(key)) {
          let lruKey: K | undefined;
          let lruTime = Infinity;

          for (const [k, time] of usage) {
            if (time < lruTime) {
              lruTime = time;
              lruKey = k;
            }
          }

          if (lruKey !== undefined) {
            cache.delete(lruKey);
            usage.delete(lruKey);
          }
        }

        cache.set(key, value);
        usage.set(key, ++counter);
        return lruCache;
      },
    } as Map<K, V> & {
      delete: (key: K) => boolean;
      clear: () => void;
      has: (key: K) => boolean;
      get: (key: K) => V | undefined;
      set: (key: K, value: V) => typeof lruCache;
    };

    return lruCache;
  }

  /**
   * Compress entity metadata to reduce memory usage
   * @param entity - Entity to compress
   * @returns Compressed entity
   */
  compressEntity(entity: Entity): Entity {
    const compressed = { ...entity };

    // Remove or compress large metadata fields
    if (compressed.metadata) {
      const metadata = compressed.metadata as any;
      if (metadata.sourceCode && metadata.sourceCode.length > 1000) {
        metadata.sourceCode = metadata.sourceCode.substring(0, 500) + "...";
      }
      if (metadata.comments && Array.isArray(metadata.comments)) {
        metadata.comments = metadata.comments.slice(0, 5); // Keep only first 5 comments
      }
    }

    // Store large data in weak references if enabled
    if (this.config.enableWeakRefs && entity.type === "symbol") {
      const symbol = entity as SymbolEntity;
      if (symbol.signature && symbol.signature.length > 500) {
        this.weakEntityRefs.set(compressed, { originalSignature: symbol.signature });
        (compressed as any).signature = symbol.signature.substring(0, 200) + "...";
      }
    }

    return compressed;
  }

  /**
   * Get current performance metrics
   * @returns Current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.averageParseTime = this.parsedFileCount > 0
      ? this.totalParseTime / this.parsedFileCount
      : 0;

    return { ...this.metrics };
  }

  /**
   * Update entity and relationship counts
   * @param entityCount - Number of entities
   * @param relationshipCount - Number of relationships
   */
  updateCounts(entityCount: number, relationshipCount: number): void {
    this.metrics.totalEntities = entityCount;
    this.metrics.totalRelationships = relationshipCount;
    this.metrics.parsedFiles = this.parsedFileCount;
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalParseTime = 0;
    this.parsedFileCount = 0;
    this.parseStartTimes.clear();
    this.weakEntityRefs = new WeakMap();
    this.weakRelationshipRefs = new WeakMap();

    this.metrics = {
      memoryUsage: process.memoryUsage(),
      cacheHitRate: 0,
      parsedFiles: 0,
      totalEntities: 0,
      totalRelationships: 0,
      averageParseTime: 0,
    };
  }

  /**
   * Check if memory usage is above threshold
   * @param threshold - Memory threshold in MB
   * @returns True if memory usage is above threshold
   */
  isMemoryPressureHigh(threshold: number = 512): boolean {
    const usage = process.memoryUsage();
    const usageMB = usage.heapUsed / 1024 / 1024;
    return usageMB > threshold;
  }

  /**
   * Suggest optimizations based on current metrics
   * @returns Array of optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.cacheHitRate < 50) {
      suggestions.push("Cache hit rate is low - consider increasing cache size or improving cache strategy");
    }

    if (metrics.averageParseTime > 1000) {
      suggestions.push("Average parse time is high - consider enabling parallel processing or optimizing parser logic");
    }

    const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > 256) {
      suggestions.push("Memory usage is high - consider enabling entity compression or reducing cache size");
    }

    if (this.isMemoryPressureHigh()) {
      suggestions.push("Memory pressure is high - consider running garbage collection more frequently");
    }

    return suggestions;
  }
}