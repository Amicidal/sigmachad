/**
 * Performance Optimizer for AST Parser Modules
 * Provides memory and performance optimizations
 */
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
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
export declare class PerformanceOptimizer {
    private config;
    private metrics;
    private cacheHits;
    private cacheMisses;
    private parseStartTimes;
    private totalParseTime;
    private parsedFileCount;
    private weakEntityRefs;
    private weakRelationshipRefs;
    constructor(config?: Partial<OptimizationConfig>);
    /**
     * Start tracking parse time for a file
     * @param filePath - Path of the file being parsed
     */
    startParseTimer(filePath: string): void;
    /**
     * End tracking parse time for a file
     * @param filePath - Path of the file that was parsed
     */
    endParseTimer(filePath: string): void;
    /**
     * Record a cache hit
     */
    recordCacheHit(): void;
    /**
     * Record a cache miss
     */
    recordCacheMiss(): void;
    /**
     * Update cache hit rate
     */
    private updateCacheHitRate;
    /**
     * Process entities in batches to reduce memory pressure
     * @param entities - Entities to process
     * @param processor - Function to process each batch
     * @returns Processed results
     */
    processBatchedEntities<T>(entities: Entity[], processor: (batch: Entity[]) => Promise<T[]>): Promise<T[]>;
    /**
     * Optimize symbol map by removing stale entries
     * @param symbolMap - Symbol map to optimize
     * @param maxAge - Maximum age in milliseconds
     * @returns Number of entries removed
     */
    optimizeSymbolMap(symbolMap: Map<string, SymbolEntity>, maxAge?: number): number;
    /**
     * Create a memory-efficient entity cache with LRU eviction
     * @param maxSize - Maximum cache size
     * @returns LRU cache implementation
     */
    createLRUCache<K, V>(maxSize?: number): Map<K, V> & {
        delete: (key: K) => boolean;
        clear: () => void;
        has: (key: K) => boolean;
        get: (key: K) => V | undefined;
        set: (key: K, value: V) => this;
    };
    /**
     * Compress entity metadata to reduce memory usage
     * @param entity - Entity to compress
     * @returns Compressed entity
     */
    compressEntity(entity: Entity): Entity;
    /**
     * Get current performance metrics
     * @returns Current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Update entity and relationship counts
     * @param entityCount - Number of entities
     * @param relationshipCount - Number of relationships
     */
    updateCounts(entityCount: number, relationshipCount: number): void;
    /**
     * Reset performance metrics
     */
    resetMetrics(): void;
    /**
     * Check if memory usage is above threshold
     * @param threshold - Memory threshold in MB
     * @returns True if memory usage is above threshold
     */
    isMemoryPressureHigh(threshold?: number): boolean;
    /**
     * Suggest optimizations based on current metrics
     * @returns Array of optimization suggestions
     */
    getOptimizationSuggestions(): string[];
}
//# sourceMappingURL=PerformanceOptimizer.d.ts.map