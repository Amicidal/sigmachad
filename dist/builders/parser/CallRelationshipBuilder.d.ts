/**
 * CallRelationshipBuilder - Handles function/method calls, method overrides, and throws relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles CALLS, OVERRIDES, and THROWS relationship types with confidence scoring
 * and evidence collection.
 */
import { Node, SourceFile } from "ts-morph";
import { Symbol as SymbolEntity } from "../../models/entities.js";
import { GraphRelationship, RelationshipType } from "../../models/relationships.js";
export interface RelationshipBuilderOptions {
    tsProject: any;
    globalSymbolIndex: Map<string, SymbolEntity>;
    nameIndex: Map<string, SymbolEntity[]>;
    stopNames: Set<string>;
    shouldUseTypeChecker: (context: any) => boolean;
    takeTcBudget: () => boolean;
    resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
    resolveCallTargetWithChecker: (call: any, sourceFile: SourceFile) => any;
    resolveImportedMemberToFileAndName: (memberName: string, exportName: string, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>) => any;
    normalizeRelPath: (p: string) => string;
    createRelationship: (fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, any>) => GraphRelationship;
}
/**
 * CallRelationshipBuilder handles the extraction of call-related relationships
 * including function/method calls, method overrides, and exception throwing.
 */
export declare class CallRelationshipBuilder {
    private tsProject;
    private globalSymbolIndex;
    private nameIndex;
    private stopNames;
    private shouldUseTypeChecker;
    private takeTcBudget;
    private resolveWithTypeChecker;
    private resolveCallTargetWithChecker;
    private resolveImportedMemberToFileAndName;
    private normalizeRelPath;
    private createRelationship;
    constructor(options: RelationshipBuilderOptions);
    /**
     * Extracts call-related relationships including calls, overrides, and throws.
     *
     * @param node - The AST node to analyze
     * @param symbolEntity - The symbol entity this node represents
     * @param sourceFile - The source file containing the node
     * @param importMap - Map of import aliases to file paths
     * @param importSymbolMap - Map of import aliases to symbol names
     * @param localIndex - Map of local symbol keys to entity IDs
     * @returns Array of extracted relationships
     */
    extractCallRelationships(node: Node, symbolEntity: SymbolEntity, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>, localIndex?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts function and method call relationships.
     */
    private extractFunctionCalls;
    /**
     * Extracts method override relationships.
     */
    private extractMethodOverrides;
    /**
     * Extracts throw statement relationships.
     */
    private extractThrows;
}
//# sourceMappingURL=CallRelationshipBuilder.d.ts.map