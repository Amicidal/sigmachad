/**
 * Incremental Parser Module
 * Handles incremental parsing, partial updates, and change detection for the AST Parser
 */
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";
import { CachedFileInfo } from "./CacheManager.js";
export interface ParseResult {
    entities: Entity[];
    relationships: GraphRelationship[];
    errors: ParseError[];
}
export interface ParseError {
    file: string;
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning";
}
export interface IncrementalParseResult extends ParseResult {
    isIncremental: boolean;
    addedEntities: Entity[];
    removedEntities: Entity[];
    updatedEntities: Entity[];
    addedRelationships: GraphRelationship[];
    removedRelationships: GraphRelationship[];
}
export interface PartialUpdate {
    type: "add" | "remove" | "update";
    entityType: "file" | "symbol" | "function" | "class" | "interface" | "typeAlias";
    entityId: string;
    changes?: Record<string, any>;
    oldValue?: any;
    newValue?: any;
}
export interface ChangeRange {
    start: number;
    end: number;
    content: string;
}
/**
 * Handles incremental parsing operations for the AST Parser
 * Provides efficient change detection and partial updates
 */
export declare class IncrementalParser {
    /**
     * Parse a file incrementally, returning only changes since last parse
     * @param filePath - Path to the file to parse
     * @param fileCache - File cache for storing/retrieving cached info
     * @param parseFile - Function to perform full file parsing
     * @param indexManager - Object with methods for managing symbol indexes
     * @returns Incremental parse result with change information
     */
    parseFileIncremental(filePath: string, fileCache: Map<string, CachedFileInfo>, parseFile: (filePath: string) => Promise<ParseResult>, indexManager: {
        createSymbolMap: (entities: Entity[]) => Map<string, SymbolEntity>;
        removeFileFromIndexes: (fileRel: string) => void;
        addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    }): Promise<IncrementalParseResult>;
    /**
     * Compute incremental changes between cached and new parse results
     * @param cachedInfo - Previously cached file information
     * @param newResult - New parse result
     * @param newHash - Hash of the new file content
     * @param filePath - Path to the file being parsed
     * @param fileCache - File cache for updating
     * @param indexManager - Object with symbol map creation method
     * @returns Incremental parse result with detected changes
     */
    private computeIncrementalChanges;
    /**
     * Apply partial updates to a file based on change ranges
     * @param filePath - Path to the file being updated
     * @param changes - Array of change ranges to process
     * @param originalContent - Original content of the file
     * @param fileCache - File cache for retrieving cached info
     * @param indexManager - Object with methods for managing symbol indexes
     * @returns Incremental parse result with applied changes
     */
    applyPartialUpdate(filePath: string, changes: ChangeRange[], originalContent: string, fileCache: Map<string, CachedFileInfo>, indexManager: {
        normalizeRelPath: (relPath: string) => string;
        removeFileFromIndexes: (fileRel: string) => void;
        addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    }): Promise<IncrementalParseResult>;
    /**
     * Find symbols that are affected by a change range
     * @param cachedInfo - Cached file information
     * @param change - Change range to analyze
     * @returns Array of symbol IDs that are affected by the change
     */
    private findAffectedSymbols;
    /**
     * Check if a symbol is within the change range
     * @param symbol - Symbol entity to check
     * @param change - Change range to check against
     * @returns True if symbol is affected by the change range
     */
    private isSymbolInRange;
    /**
     * Analyze what type of change occurred to a symbol
     * @param symbol - Symbol entity being analyzed
     * @param change - Change range that may affect the symbol
     * @param originalContent - Original content of the file
     * @returns Partial update describing the change, or null if no change
     */
    private analyzeSymbolChange;
    /**
     * Parse a symbol from a specific range in the file
     * @param filePath - Path to the file containing the symbol
     * @param change - Change range containing the symbol
     * @returns Entity representing the parsed symbol, or null if parsing failed
     */
    private parseSymbolFromRange;
    /**
     * Update the cache after applying partial updates
     * @param filePath - Path to the file being updated
     * @param updates - Array of partial updates to apply
     * @param newContent - New content of the file
     * @param fileCache - File cache to update
     * @param indexManager - Object with methods for managing symbol indexes
     */
    private updateCacheAfterPartialUpdate;
    /**
     * Check if content looks like a new symbol declaration
     * @param content - Content to analyze
     * @returns True if content appears to contain a new symbol declaration
     */
    private looksLikeNewSymbol;
    /**
     * Detect the type of symbol from content
     * @param content - Content to analyze
     * @returns Detected symbol type
     */
    private detectSymbolType;
    /**
     * Get statistics about partial update operations
     * @param fileCache - File cache to analyze
     * @returns Statistics about cached files and symbols
     */
    getPartialUpdateStats(fileCache: Map<string, CachedFileInfo>): {
        cachedFiles: number;
        totalSymbols: number;
        averageSymbolsPerFile: number;
    };
}
//# sourceMappingURL=IncrementalParser.d.ts.map