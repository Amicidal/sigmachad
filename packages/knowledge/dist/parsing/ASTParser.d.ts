/**
 * AST Parser Service for Memento
 * Parses TypeScript/JavaScript code using ts-morph and tree-sitter
 */
import { Entity, Symbol as SymbolEntity } from "@memento/core/models/entities.js";
import { GraphRelationship } from "@memento/core/models/relationships.js";
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
export interface CachedFileInfo {
    hash: string;
    entities: Entity[];
    relationships: GraphRelationship[];
    lastModified: Date;
    symbolMap: Map<string, SymbolEntity>;
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
export declare class ASTParser {
    private readonly stopNames;
    private tsProject;
    private jsParser;
    private fileCache;
    private exportMapCache;
    private tsPathOptions;
    private globalSymbolIndex;
    private nameIndex;
    private tcBudgetRemaining;
    private tcBudgetSpent;
    private takeTcBudget;
    private shouldUseTypeChecker;
    constructor();
    private resolveWithTypeChecker;
    private resolveCallTargetWithChecker;
    initialize(): Promise<void>;
    private removeFileFromIndexes;
    private addSymbolsToIndexes;
    private resolveModuleSpecifierToSourceFile;
    private resolveReexportTarget;
    private getModuleExportMap;
    private resolveImportedMemberToFileAndName;
    parseFile(filePath: string): Promise<ParseResult>;
    parseFileIncremental(filePath: string): Promise<IncrementalParseResult>;
    private createSymbolMap;
    private computeIncrementalChanges;
    clearCache(): void;
    getCacheStats(): {
        files: number;
        totalEntities: number;
    };
    private parseTypeScriptFile;
    private parseJavaScriptFile;
    private parseOtherFile;
    private walkJavaScriptAST;
    private createFileEntity;
    private createSymbolEntity;
    private createJavaScriptFunctionEntity;
    private createJavaScriptClassEntity;
    private extractSymbolRelationships;
    private extractReferenceRelationships;
    private extractImportRelationships;
    private createRelationship;
    private normalizeRelPath;
    /**
     * Create directory entities for the path and CONTAINS edges for dir->dir and dir->file.
     * Returns entities and relationships to be merged into the parse result.
     */
    private createDirectoryHierarchy;
    private shouldIncludeDirectoryEntities;
    private getSymbolName;
    private getJavaScriptSymbolName;
    private getSymbolSignature;
    private getSymbolKind;
    private getSymbolDocstring;
    private getSymbolVisibility;
    private isSymbolExported;
    private isSymbolDeprecated;
    private getFunctionParameters;
    private getFunctionReturnType;
    private isFunctionAsync;
    private isFunctionGenerator;
    private calculateComplexity;
    private getClassExtends;
    private getClassImplements;
    private isClassAbstract;
    private getInterfaceExtends;
    private getTypeAliasType;
    private isTypeUnion;
    private isTypeIntersection;
    private detectLanguage;
    private extractDependencies;
    parseMultipleFiles(filePaths: string[]): Promise<ParseResult>;
    /**
     * Apply partial updates to a file based on specific changes
     */
    applyPartialUpdate(filePath: string, changes: ChangeRange[], originalContent: string): Promise<IncrementalParseResult>;
    /**
     * Find symbols that are affected by a change range
     */
    private findAffectedSymbols;
    /**
     * Check if a symbol is within the change range
     */
    private isSymbolInRange;
    /**
     * Analyze what type of change occurred to a symbol
     */
    private analyzeSymbolChange;
    /**
     * Parse a symbol from a specific range in the file
     */
    private parseSymbolFromRange;
    /**
     * Update the cache after applying partial updates
     */
    private updateCacheAfterPartialUpdate;
    /**
     * Helper methods for change analysis
     */
    private looksLikeNewSymbol;
    private detectSymbolType;
    /**
     * Get statistics about cached files
     */
    getPartialUpdateStats(): {
        cachedFiles: number;
        totalSymbols: number;
        averageSymbolsPerFile: number;
    };
}
//# sourceMappingURL=ASTParser.d.ts.map