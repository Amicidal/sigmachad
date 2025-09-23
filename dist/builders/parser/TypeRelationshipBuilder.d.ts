/**
 * TypeRelationshipBuilder - Handles type-related relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles EXTENDS, IMPLEMENTS, TYPE_USES, RETURNS_TYPE, PARAM_TYPE, and decorator relationships.
 */
import { Node, SourceFile } from "ts-morph";
import { Symbol as SymbolEntity } from "../../models/entities.js";
import { GraphRelationship, RelationshipType } from "../../models/relationships.js";
export interface TypeRelationshipBuilderOptions {
    globalSymbolIndex: Map<string, SymbolEntity>;
    nameIndex: Map<string, SymbolEntity[]>;
    stopNames: Set<string>;
    shouldUseTypeChecker: (context: any) => boolean;
    takeTcBudget: () => boolean;
    resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
    resolveImportedMemberToFileAndName: (memberName: string, exportName: string, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>) => any;
    createRelationship: (fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, any>) => GraphRelationship;
}
/**
 * TypeRelationshipBuilder handles the extraction of type-related relationships
 * including inheritance, type usage, decorators, return types, and parameter types.
 */
export declare class TypeRelationshipBuilder {
    private globalSymbolIndex;
    private nameIndex;
    private stopNames;
    private shouldUseTypeChecker;
    private takeTcBudget;
    private resolveWithTypeChecker;
    private resolveImportedMemberToFileAndName;
    private createRelationship;
    constructor(options: TypeRelationshipBuilderOptions);
    /**
     * Extracts type-related relationships including inheritance, decorators, and type usage.
     *
     * @param node - The AST node to analyze
     * @param symbolEntity - The symbol entity this node represents
     * @param sourceFile - The source file containing the node
     * @param importMap - Map of import aliases to file paths
     * @param importSymbolMap - Map of import aliases to symbol names
     * @param localIndex - Map of local symbol keys to entity IDs
     * @returns Array of extracted relationships
     */
    extractTypeRelationships(node: Node, symbolEntity: SymbolEntity, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>, localIndex?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts inheritance relationships (EXTENDS, IMPLEMENTS).
     */
    private extractInheritance;
    /**
     * Extracts decorator relationships.
     */
    private extractDecorators;
    /**
     * Extracts function/method type relationships (return types, parameter types).
     */
    private extractFunctionTypeRelationships;
}
//# sourceMappingURL=TypeRelationshipBuilder.d.ts.map