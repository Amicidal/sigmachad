/**
 * Cache Manager for AST Parser
 * Handles file caching, symbol indexing, and export maps for efficient parsing
 */
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { CachedFileInfo, ExportMapEntry } from "./types.js";
import { PerformanceOptimizer } from "./PerformanceOptimizer.js";
export type { CachedFileInfo, ExportMapEntry };
/**
 * Manages caching and indexing for the AST Parser
 * Provides efficient lookups for symbols and exports across files
 */
export declare class CacheManager {
    private optimizer;
    private fileCache;
    private exportMapCache;
    private globalSymbolIndex;
    private nameIndex;
    constructor(maxCacheSize?: number);
    /**
     * Get cached file information
     * @param absolutePath - Absolute path to the file
     * @returns Cached info if available, undefined otherwise
     */
    getCachedFile(absolutePath: string): CachedFileInfo | undefined;
    /**
     * Store file information in cache
     * @param absolutePath - Absolute path to the file
     * @param info - Information to cache
     */
    setCachedFile(absolutePath: string, info: CachedFileInfo): void;
    /**
     * Delete a file from cache
     * @param absolutePath - Absolute path to the file
     */
    deleteCachedFile(absolutePath: string): void;
    /**
     * Get export map for a module
     * @param absolutePath - Absolute path to the module
     * @returns Export map if cached, undefined otherwise
     */
    getExportMap(absolutePath: string): Map<string, ExportMapEntry> | undefined;
    /**
     * Store export map for a module
     * @param absolutePath - Absolute path to the module
     * @param exportMap - Export map to cache
     */
    setExportMap(absolutePath: string, exportMap: Map<string, ExportMapEntry>): void;
    /**
     * Clear export map cache
     */
    clearExportMapCache(): void;
    /**
     * Get symbol by its global key
     * @param key - Global key in format `${fileRel}:${name}`
     * @returns Symbol entity if found
     */
    getGlobalSymbol(key: string): SymbolEntity | undefined;
    /**
     * Set symbol in global index
     * @param key - Global key in format `${fileRel}:${name}`
     * @param symbol - Symbol entity to store
     */
    setGlobalSymbol(key: string, symbol: SymbolEntity): void;
    /**
     * Delete symbol from global index
     * @param key - Global key in format `${fileRel}:${name}`
     */
    deleteGlobalSymbol(key: string): void;
    /**
     * Get all global symbol keys
     * @returns Array of all keys in global symbol index
     */
    getGlobalSymbolKeys(): string[];
    /**
     * Get symbols by name
     * @param name - Symbol name to look up
     * @returns Array of symbols with that name
     */
    getSymbolsByName(name: string): SymbolEntity[];
    /**
     * Set symbols for a name
     * @param name - Symbol name
     * @param symbols - Array of symbols with that name
     */
    setSymbolsByName(name: string, symbols: SymbolEntity[]): void;
    /**
     * Check if a name exists in the index
     * @param name - Symbol name to check
     * @returns True if name exists in index
     */
    hasSymbolName(name: string): boolean;
    /**
     * Remove file from all indexes
     * @param fileRelPath - Relative path to the file
     */
    removeFileFromIndexes(fileRelPath: string): void;
    /**
     * Add symbols from a file to indexes
     * @param fileRelPath - Relative path to the file
     * @param symbols - Array of symbols to add
     */
    addSymbolsToIndexes(fileRelPath: string, symbols: SymbolEntity[]): void;
    /**
     * Create a symbol map from entities
     * @param entities - Array of entities to map
     * @returns Map of symbol paths to symbol entities
     */
    createSymbolMap(entities: Entity[]): Map<string, SymbolEntity>;
    /**
     * Compute hash for file content
     * @param content - File content to hash
     * @returns SHA256 hash of the content
     */
    computeFileHash(content: string): string;
    /**
     * Clear all caches
     */
    clearCache(): void;
    /**
     * Get cache statistics including performance metrics
     * @returns Object with cache statistics
     */
    getCacheStats(): {
        files: number;
        totalEntities: number;
        cacheHitRate: number;
        memoryUsage: NodeJS.MemoryUsage;
    };
    /**
     * Update cache after partial update
     * @param filePath - Absolute path to the file
     * @param fileRelPath - Relative path to the file
     * @param symbolMap - Updated symbol map
     * @param newContent - New file content
     */
    updateCacheForFile(filePath: string, fileRelPath: string, symbolMap: Map<string, SymbolEntity>, newContent: string): void;
    /**
     * Get performance optimizer instance
     * @returns Performance optimizer
     */
    getOptimizer(): PerformanceOptimizer;
    /**
     * Optimize caches by removing stale entries
     * @param maxAge - Maximum age in milliseconds
     * @returns Number of entries removed
     */
    optimizeCaches(maxAge?: number): number;
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection(): void;
}
//# sourceMappingURL=CacheManager.d.ts.map