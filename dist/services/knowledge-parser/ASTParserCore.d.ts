/**
 * ASTParserCore - Main facade for AST parsing operations
 *
 * This is the main orchestrator for the modular AST parsing system.
 * It coordinates between specialized modules to provide a unified parsing interface
 * while maintaining the same public API as the original monolithic ASTParser.
 *
 * Extracted from the original 5,197-line ASTParser.ts as part of modular refactoring.
 */
import { ParseResult, IncrementalParseResult } from "./types.js";
export type { ParseResult, ParseError, IncrementalParseResult, PartialUpdate, ChangeRange, } from "./types.js";
/**
 * Main AST Parser facade that orchestrates specialized parsing modules
 *
 * This class maintains the same public API as the original ASTParser while
 * internally delegating to specialized modules for different aspects of parsing:
 * - CacheManager: File caching and symbol indexing
 * - DirectoryHandler: Directory hierarchy and path operations
 * - TypeCheckerBudget: Type checker performance management
 * - SymbolExtractor: Symbol entity creation from AST nodes
 * - ModuleResolver: Cross-file module and symbol resolution
 * - RelationshipBuilder: Relationship extraction and inference
 */
export declare class ASTParserCore {
    private readonly stopNames;
    private tsProject;
    private tsPathOptions;
    private cacheManager;
    private directoryHandler;
    private typeCheckerBudget;
    private symbolExtractor;
    private moduleResolver;
    private relationshipBuilder;
    /**
     * Initialize the ASTParserCore with all required modules
     */
    constructor();
    /**
     * Initialize the parser with configuration
     * Loads tsconfig.json for TypeScript path mapping support
     */
    initialize(): Promise<void>;
    /**
     * Parse a single file and return entities, relationships, and errors
     * @param filePath - Path to the file to parse
     * @returns Parse result with entities and relationships
     */
    parseFile(filePath: string): Promise<ParseResult>;
    /**
     * Parse multiple files and combine results
     * @param filePaths - Array of file paths to parse
     * @returns Combined parse result
     */
    parseMultipleFiles(filePaths: string[]): Promise<ParseResult>;
    /**
     * Clear all cached parsing data
     */
    clearCache(): void;
    /**
     * Get statistics about cached data
     * @returns Object with cache statistics
     */
    getCacheStats(): {
        files: number;
        totalEntities: number;
    };
    /**
     * Parse incremental changes to a file
     * @param filePath - Path to the changed file
     * @returns Incremental parse result with change tracking
     */
    parseFileIncremental(filePath: string): Promise<IncrementalParseResult>;
    /**
     * Get partial update statistics for debugging
     * @returns Statistics about partial updates
     */
    getPartialUpdateStats(): {
        filesInCache: number;
        globalSymbols: number;
        namedSymbols: number;
    };
    /**
     * Parse a TypeScript/JavaScript file using ts-morph
     * @param filePath - Path to the file
     * @param content - File content
     * @returns Parse result
     */
    private parseTypeScriptFile;
    /**
     * Extract symbols from a source file using the SymbolExtractor
     */
    private extractSymbolsFromSourceFile;
    /**
     * Create a symbol map from entities for caching
     */
    private createSymbolMap;
    /**
     * Heuristic policy for using the TS type checker
     */
    private shouldUseTypeChecker;
    /**
     * Check if directory entities should be included
     */
    private shouldIncludeDirectoryEntities;
    private resolveWithTypeChecker;
    private resolveCallTargetWithChecker;
    private resolveImportedMemberToFileAndName;
    /**
     * Get symbol name from an AST node
     */
    private getSymbolName;
    /**
     * Extract relationships for a specific symbol entity
     */
    private extractRelationshipsForSymbol;
}
//# sourceMappingURL=ASTParserCore.d.ts.map