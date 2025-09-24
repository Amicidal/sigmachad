/**
 * Cache Manager for AST Parser
 * Handles file caching, symbol indexing, and export maps for efficient parsing
 */
import { createHash } from "./utils.js";
import { PerformanceOptimizer } from "./PerformanceOptimizer.js";
/**
 * Manages caching and indexing for the AST Parser
 * Provides efficient lookups for symbols and exports across files
 */
export class CacheManager {
    constructor(maxCacheSize = 1000) {
        // Cache for module export maps to speed up resolution
        this.exportMapCache = new Map();
        // Global symbol indexes for cross-file resolution
        this.globalSymbolIndex = new Map(); // key: `${fileRel}:${name}`
        this.nameIndex = new Map(); // key: name -> symbols
        this.optimizer = new PerformanceOptimizer({ maxCacheSize });
        this.fileCache = this.optimizer.createLRUCache(maxCacheSize);
    }
    /**
     * Get cached file information
     * @param absolutePath - Absolute path to the file
     * @returns Cached info if available, undefined otherwise
     */
    getCachedFile(absolutePath) {
        const result = this.fileCache.get(absolutePath);
        if (result) {
            this.optimizer.recordCacheHit();
        }
        else {
            this.optimizer.recordCacheMiss();
        }
        return result;
    }
    /**
     * Store file information in cache
     * @param absolutePath - Absolute path to the file
     * @param info - Information to cache
     */
    setCachedFile(absolutePath, info) {
        this.fileCache.set(absolutePath, info);
    }
    /**
     * Delete a file from cache
     * @param absolutePath - Absolute path to the file
     */
    deleteCachedFile(absolutePath) {
        this.fileCache.delete(absolutePath);
    }
    /**
     * Get export map for a module
     * @param absolutePath - Absolute path to the module
     * @returns Export map if cached, undefined otherwise
     */
    getExportMap(absolutePath) {
        return this.exportMapCache.get(absolutePath);
    }
    /**
     * Store export map for a module
     * @param absolutePath - Absolute path to the module
     * @param exportMap - Export map to cache
     */
    setExportMap(absolutePath, exportMap) {
        this.exportMapCache.set(absolutePath, exportMap);
    }
    /**
     * Clear export map cache
     */
    clearExportMapCache() {
        this.exportMapCache.clear();
    }
    /**
     * Get symbol by its global key
     * @param key - Global key in format `${fileRel}:${name}`
     * @returns Symbol entity if found
     */
    getGlobalSymbol(key) {
        return this.globalSymbolIndex.get(key);
    }
    /**
     * Set symbol in global index
     * @param key - Global key in format `${fileRel}:${name}`
     * @param symbol - Symbol entity to store
     */
    setGlobalSymbol(key, symbol) {
        this.globalSymbolIndex.set(key, symbol);
    }
    /**
     * Delete symbol from global index
     * @param key - Global key in format `${fileRel}:${name}`
     */
    deleteGlobalSymbol(key) {
        this.globalSymbolIndex.delete(key);
    }
    /**
     * Get all global symbol keys
     * @returns Array of all keys in global symbol index
     */
    getGlobalSymbolKeys() {
        return Array.from(this.globalSymbolIndex.keys());
    }
    /**
     * Get symbols by name
     * @param name - Symbol name to look up
     * @returns Array of symbols with that name
     */
    getSymbolsByName(name) {
        return this.nameIndex.get(name) || [];
    }
    /**
     * Set symbols for a name
     * @param name - Symbol name
     * @param symbols - Array of symbols with that name
     */
    setSymbolsByName(name, symbols) {
        if (symbols.length > 0) {
            this.nameIndex.set(name, symbols);
        }
        else {
            this.nameIndex.delete(name);
        }
    }
    /**
     * Check if a name exists in the index
     * @param name - Symbol name to check
     * @returns True if name exists in index
     */
    hasSymbolName(name) {
        return this.nameIndex.has(name);
    }
    /**
     * Remove file from all indexes
     * @param fileRelPath - Relative path to the file
     */
    removeFileFromIndexes(fileRelPath) {
        try {
            // Remove keys from globalSymbolIndex
            for (const key of this.getGlobalSymbolKeys()) {
                if (key.startsWith(`${fileRelPath}:`)) {
                    const sym = this.globalSymbolIndex.get(key);
                    if (sym && "name" in sym) {
                        const nm = sym.name;
                        if (nm && this.hasSymbolName(nm)) {
                            const arr = this.getSymbolsByName(nm).filter((s) => s.id !== sym.id);
                            this.setSymbolsByName(nm, arr);
                        }
                    }
                    this.deleteGlobalSymbol(key);
                }
            }
        }
        catch (_a) { }
    }
    /**
     * Add symbols from a file to indexes
     * @param fileRelPath - Relative path to the file
     * @param symbols - Array of symbols to add
     */
    addSymbolsToIndexes(fileRelPath, symbols) {
        try {
            for (const sym of symbols) {
                if (!sym || !("name" in sym))
                    continue;
                const nm = sym.name;
                if (!nm)
                    continue;
                const key = `${fileRelPath}:${nm}`;
                this.setGlobalSymbol(key, sym);
                if (nm) {
                    const arr = this.getSymbolsByName(nm);
                    if (!arr.find((s) => s.id === sym.id)) {
                        arr.push(sym);
                    }
                    this.setSymbolsByName(nm, arr);
                }
            }
        }
        catch (_a) { }
    }
    /**
     * Create a symbol map from entities
     * @param entities - Array of entities to map
     * @returns Map of symbol paths to symbol entities
     */
    createSymbolMap(entities) {
        const symbolMap = new Map();
        for (const entity of entities) {
            if (entity.type === "symbol") {
                const symbol = entity;
                if (symbol.path) {
                    symbolMap.set(symbol.path, symbol);
                }
            }
        }
        return symbolMap;
    }
    /**
     * Compute hash for file content
     * @param content - File content to hash
     * @returns SHA256 hash of the content
     */
    computeFileHash(content) {
        return createHash(content);
    }
    /**
     * Clear all caches
     */
    clearCache() {
        this.fileCache.clear();
        this.exportMapCache.clear();
        this.globalSymbolIndex.clear();
        this.nameIndex.clear();
    }
    /**
     * Get cache statistics including performance metrics
     * @returns Object with cache statistics
     */
    getCacheStats() {
        let totalEntities = 0;
        let fileCount = 0;
        // Count cached files and entities
        this.fileCache.forEach((cached) => {
            totalEntities += cached.entities.length;
            fileCount++;
        });
        const metrics = this.optimizer.getMetrics();
        return {
            files: fileCount,
            totalEntities,
            cacheHitRate: metrics.cacheHitRate,
            memoryUsage: metrics.memoryUsage,
        };
    }
    /**
     * Update cache after partial update
     * @param filePath - Absolute path to the file
     * @param fileRelPath - Relative path to the file
     * @param symbolMap - Updated symbol map
     * @param newContent - New file content
     */
    updateCacheForFile(filePath, fileRelPath, symbolMap, newContent) {
        const cachedInfo = this.fileCache.get(filePath);
        if (!cachedInfo)
            return;
        // Update symbol map
        cachedInfo.symbolMap = symbolMap;
        // Update file hash
        cachedInfo.hash = createHash(newContent);
        cachedInfo.lastModified = new Date();
        // Rebuild indexes for this file
        this.removeFileFromIndexes(fileRelPath);
        this.addSymbolsToIndexes(fileRelPath, Array.from(symbolMap.values()));
    }
    /**
     * Get performance optimizer instance
     * @returns Performance optimizer
     */
    getOptimizer() {
        return this.optimizer;
    }
    /**
     * Optimize caches by removing stale entries
     * @param maxAge - Maximum age in milliseconds
     * @returns Number of entries removed
     */
    optimizeCaches(maxAge = 3600000) {
        let removedCount = 0;
        // Optimize symbol map
        removedCount += this.optimizer.optimizeSymbolMap(this.globalSymbolIndex, maxAge);
        // Clear export map cache periodically
        if (this.exportMapCache.size > 100) {
            this.exportMapCache.clear();
            removedCount += 1;
        }
        return removedCount;
    }
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection() {
        if (global.gc) {
            global.gc();
        }
    }
}
//# sourceMappingURL=CacheManager.js.map