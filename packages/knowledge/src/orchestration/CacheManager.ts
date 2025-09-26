/**
 * Cache Manager for AST Parser
 * Handles file caching, symbol indexing, and export maps for efficient parsing
 */

import { Entity, Symbol as SymbolEntity } from '@memento/core';
import { GraphRelationship } from '@memento/core';
import { createHash } from "./utils.js";
import { CachedFileInfo, ExportMapEntry } from "./types.js";
import { PerformanceOptimizer } from "./PerformanceOptimizer.js";

// Re-export types for backward compatibility
export type { CachedFileInfo, ExportMapEntry };

/**
 * Manages caching and indexing for the AST Parser
 * Provides efficient lookups for symbols and exports across files
 */
export class CacheManager {
  // Performance optimizer for memory management
  private optimizer: PerformanceOptimizer;

  // File-level cache storing parsed entities and relationships (now with LRU eviction)
  private fileCache: ReturnType<PerformanceOptimizer['createLRUCache']>;

  // Cache for module export maps to speed up resolution
  private exportMapCache: Map<string, Map<string, ExportMapEntry>> = new Map();

  // Global symbol indexes for cross-file resolution
  private globalSymbolIndex: Map<string, SymbolEntity> = new Map(); // key: `${fileRel}:${name}`
  private nameIndex: Map<string, SymbolEntity[]> = new Map(); // key: name -> symbols

  constructor(maxCacheSize: number = 1000) {
    this.optimizer = new PerformanceOptimizer({ maxCacheSize });
    this.fileCache = this.optimizer.createLRUCache<string, CachedFileInfo>(maxCacheSize);
  }

  /**
   * Get cached file information
   * @param absolutePath - Absolute path to the file
   * @returns Cached info if available, undefined otherwise
   */
  getCachedFile(absolutePath: string): CachedFileInfo | undefined {
    const result = this.fileCache.get(absolutePath);
    if (result) {
      this.optimizer.recordCacheHit();
    } else {
      this.optimizer.recordCacheMiss();
    }
    return result;
  }

  /**
   * Store file information in cache
   * @param absolutePath - Absolute path to the file
   * @param info - Information to cache
   */
  setCachedFile(absolutePath: string, info: CachedFileInfo): void {
    this.fileCache.set(absolutePath, info);
  }

  /**
   * Delete a file from cache
   * @param absolutePath - Absolute path to the file
   */
  deleteCachedFile(absolutePath: string): void {
    this.fileCache.delete(absolutePath);
  }

  /**
   * Get export map for a module
   * @param absolutePath - Absolute path to the module
   * @returns Export map if cached, undefined otherwise
   */
  getExportMap(absolutePath: string): Map<string, ExportMapEntry> | undefined {
    return this.exportMapCache.get(absolutePath);
  }

  /**
   * Store export map for a module
   * @param absolutePath - Absolute path to the module
   * @param exportMap - Export map to cache
   */
  setExportMap(absolutePath: string, exportMap: Map<string, ExportMapEntry>): void {
    this.exportMapCache.set(absolutePath, exportMap);
  }

  /**
   * Clear export map cache
   */
  clearExportMapCache(): void {
    this.exportMapCache.clear();
  }

  /**
   * Get symbol by its global key
   * @param key - Global key in format `${fileRel}:${name}`
   * @returns Symbol entity if found
   */
  getGlobalSymbol(key: string): SymbolEntity | undefined {
    return this.globalSymbolIndex.get(key);
  }

  /**
   * Set symbol in global index
   * @param key - Global key in format `${fileRel}:${name}`
   * @param symbol - Symbol entity to store
   */
  setGlobalSymbol(key: string, symbol: SymbolEntity): void {
    this.globalSymbolIndex.set(key, symbol);
  }

  /**
   * Delete symbol from global index
   * @param key - Global key in format `${fileRel}:${name}`
   */
  deleteGlobalSymbol(key: string): void {
    this.globalSymbolIndex.delete(key);
  }

  /**
   * Get all global symbol keys
   * @returns Array of all keys in global symbol index
   */
  getGlobalSymbolKeys(): string[] {
    return Array.from(this.globalSymbolIndex.keys());
  }

  /**
   * Get symbols by name
   * @param name - Symbol name to look up
   * @returns Array of symbols with that name
   */
  getSymbolsByName(name: string): SymbolEntity[] {
    return this.nameIndex.get(name) || [];
  }

  /**
   * Set symbols for a name
   * @param name - Symbol name
   * @param symbols - Array of symbols with that name
   */
  setSymbolsByName(name: string, symbols: SymbolEntity[]): void {
    if (symbols.length > 0) {
      this.nameIndex.set(name, symbols);
    } else {
      this.nameIndex.delete(name);
    }
  }

  /**
   * Check if a name exists in the index
   * @param name - Symbol name to check
   * @returns True if name exists in index
   */
  hasSymbolName(name: string): boolean {
    return this.nameIndex.has(name);
  }

  /**
   * Remove file from all indexes
   * @param fileRelPath - Relative path to the file
   */
  removeFileFromIndexes(fileRelPath: string): void {
    try {
      // Remove keys from globalSymbolIndex
      for (const key of this.getGlobalSymbolKeys()) {
        if (key.startsWith(`${fileRelPath}:`)) {
          const sym = this.globalSymbolIndex.get(key);
          if (sym && "name" in sym) {
            const nm = sym.name as string;
            if (nm && this.hasSymbolName(nm)) {
              const arr = this.getSymbolsByName(nm).filter(
                (s) => (s as any).id !== (sym as any).id
              );
              this.setSymbolsByName(nm, arr);
            }
          }
          this.deleteGlobalSymbol(key);
        }
      }
    } catch {}
  }

  /**
   * Add symbols from a file to indexes
   * @param fileRelPath - Relative path to the file
   * @param symbols - Array of symbols to add
   */
  addSymbolsToIndexes(fileRelPath: string, symbols: SymbolEntity[]): void {
    try {
      for (const sym of symbols) {
        if (!sym || !("name" in sym)) continue;
        const nm = sym.name as string;
        if (!nm) continue;
        const key = `${fileRelPath}:${nm}`;
        this.setGlobalSymbol(key, sym);
        if (nm) {
          const arr = this.getSymbolsByName(nm);
          if (!arr.find((s) => (s as any).id === (sym as any).id)) {
            arr.push(sym);
          }
          this.setSymbolsByName(nm, arr);
        }
      }
    } catch {}
  }

  /**
   * Create a symbol map from entities
   * @param entities - Array of entities to map
   * @returns Map of symbol paths to symbol entities
   */
  createSymbolMap(entities: Entity[]): Map<string, SymbolEntity> {
    const symbolMap = new Map<string, SymbolEntity>();
    for (const entity of entities) {
      if (entity.type === "symbol") {
        const symbol = entity as SymbolEntity;
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
  computeFileHash(content: string): string {
    return createHash(content);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.fileCache.clear();
    this.exportMapCache.clear();
    this.globalSymbolIndex.clear();
    this.nameIndex.clear();
  }

  /**
   * Get cache statistics including performance metrics
   * @returns Object with cache statistics
   */
  getCacheStats(): {
    files: number;
    totalEntities: number;
    cacheHitRate: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
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
  updateCacheForFile(
    filePath: string,
    fileRelPath: string,
    symbolMap: Map<string, SymbolEntity>,
    newContent: string
  ): void {
    const cachedInfo = this.fileCache.get(filePath);
    if (!cachedInfo) return;

    // Update symbol map
    cachedInfo.symbolMap = symbolMap;

    // Update file hash
    cachedInfo.hash = createHash(newContent);
    cachedInfo.lastModified = new Date();

    // Rebuild indexes for this file
    this.removeFileFromIndexes(fileRelPath);
    this.addSymbolsToIndexes(
      fileRelPath,
      Array.from(symbolMap.values())
    );
  }

  /**
   * Get performance optimizer instance
   * @returns Performance optimizer
   */
  getOptimizer(): PerformanceOptimizer {
    return this.optimizer;
  }

  /**
   * Optimize caches by removing stale entries
   * @param maxAge - Maximum age in milliseconds
   * @returns Number of entries removed
   */
  optimizeCaches(maxAge: number = 3600000): number {
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
  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }
}