/**
 * Shared Type Definitions for AST Parser Modules
 * Consolidates common types to avoid duplication
 */
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";
/**
 * Result of parsing a file or set of files
 */
export interface ParseResult {
    entities: Entity[];
    relationships: GraphRelationship[];
    errors: ParseError[];
}
/**
 * Error information from parsing
 */
export interface ParseError {
    file: string;
    line: number;
    column: number;
    message: string;
    severity: "error" | "warning";
}
/**
 * Result of incremental parsing with change tracking
 */
export interface IncrementalParseResult extends ParseResult {
    isIncremental: boolean;
    addedEntities: Entity[];
    removedEntities: Entity[];
    updatedEntities: Entity[];
    addedRelationships: GraphRelationship[];
    removedRelationships: GraphRelationship[];
}
/**
 * Partial update information for incremental parsing
 */
export interface PartialUpdate {
    type: "add" | "remove" | "update";
    entityType: "file" | "symbol" | "function" | "class" | "interface" | "typeAlias";
    entityId: string;
    changes?: Record<string, any>;
    oldValue?: any;
    newValue?: any;
}
/**
 * Range of changes in a file
 */
export interface ChangeRange {
    start: number;
    end: number;
    content: string;
}
/**
 * Cached file information
 */
export interface CachedFileInfo {
    hash: string;
    entities: Entity[];
    relationships: GraphRelationship[];
    lastModified: Date;
    symbolMap: Map<string, SymbolEntity>;
}
/**
 * Export map entry with metadata
 */
export interface ExportMapEntry {
    fileRel: string;
    name: string;
    depth: number;
}
/**
 * Resolved symbol with file location and name
 */
export interface ResolvedSymbol {
    fileRel: string;
    name: string;
}
/**
 * Budget statistics for type checker usage
 */
export interface BudgetStats {
    remaining: number;
    spent: number;
    total: number;
    percentUsed: number;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    files: number;
    totalEntities: number;
    averageEntitiesPerFile?: number;
}
/**
 * Partial update statistics
 */
export interface PartialUpdateStats {
    cachedFiles: number;
    totalSymbols: number;
    averageSymbolsPerFile: number;
}
/**
 * Options for type checker usage heuristics
 */
export interface TypeCheckerUsageOptions {
    context: "call" | "heritage" | "decorator" | "reference" | "export";
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
}
/**
 * Symbol visibility levels
 */
export type SymbolVisibility = "public" | "private" | "protected";
/**
 * Symbol kinds
 */
export type SymbolKind = "function" | "class" | "interface" | "typeAlias" | "property" | "variable" | "symbol";
/**
 * Entity types
 */
export type EntityType = "file" | "directory" | "symbol" | "function" | "class" | "interface" | "typeAlias";
/**
 * Index manager interface for symbol management
 */
export interface IndexManager {
    createSymbolMap: (entities: Entity[]) => Map<string, SymbolEntity>;
    removeFileFromIndexes: (fileRel: string) => void;
    addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    normalizeRelPath?: (relPath: string) => string;
}
/**
 * Function parameter information
 */
export interface ParameterInfo {
    name: string;
    type: string;
    defaultValue?: string;
    optional: boolean;
}
/**
 * File entity creation options
 */
export interface FileEntityOptions {
    filePath: string;
    fileRelPath: string;
    content: string;
    extension?: string;
    language?: string;
}
/**
 * Symbol entity creation options
 */
export interface SymbolEntityOptions {
    name: string;
    kind: SymbolKind;
    signature: string;
    filePath: string;
    visibility?: SymbolVisibility;
    isExported?: boolean;
    docstring?: string;
    parameters?: ParameterInfo[];
    returnType?: string;
}
/**
 * Directory entity creation options
 */
export interface DirectoryEntityOptions {
    path: string;
    depth: number;
}
/**
 * Relationship creation options
 */
export interface RelationshipOptions {
    fromEntityId: string;
    toEntityId: string;
    type: string;
    metadata?: any;
    confidence?: number;
}
//# sourceMappingURL=types.d.ts.map