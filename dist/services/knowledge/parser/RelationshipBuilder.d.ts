/**
 * RelationshipBuilder - Extracts relationships between code entities
 *
 * Extracted from ASTParser.ts as part of the modular refactoring.
 * Handles symbol relationships, reference relationships, import relationships,
 * and relationship creation with confidence scoring and edge normalization.
 */
import { Project, Node, SourceFile } from "ts-morph";
import { File, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship, RelationshipType } from "../../../models/relationships.js";
export interface RelationshipBuilderOptions {
    tsProject: Project;
    globalSymbolIndex: Map<string, SymbolEntity>;
    nameIndex: Map<string, SymbolEntity[]>;
    stopNames: Set<string>;
    fileCache: Map<string, any>;
    shouldUseTypeChecker: (context: any) => boolean;
    takeTcBudget: () => boolean;
    resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
    resolveCallTargetWithChecker: (call: any, sourceFile: SourceFile) => any;
    resolveImportedMemberToFileAndName: (memberName: string, exportName: string, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>) => any;
    getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
    normalizeRelPath: (p: string) => string;
}
/**
 * RelationshipBuilder handles the extraction of various types of relationships
 * between code entities including symbols, references, imports, and dependencies.
 */
export declare class RelationshipBuilder {
    private tsProject;
    private globalSymbolIndex;
    private nameIndex;
    private stopNames;
    private fileCache;
    private shouldUseTypeChecker;
    private takeTcBudget;
    private resolveWithTypeChecker;
    private resolveCallTargetWithChecker;
    private resolveImportedMemberToFileAndName;
    private getModuleExportMap;
    private normalizeRelPath;
    constructor(options: RelationshipBuilderOptions);
    /**
     * Extracts symbol-level relationships including calls, inheritance, type usage,
     * decorators, method overrides, exceptions, and parameter types.
     *
     * @param node - The AST node to analyze
     * @param symbolEntity - The symbol entity this node represents
     * @param sourceFile - The source file containing the node
     * @param importMap - Map of import aliases to file paths
     * @param importSymbolMap - Map of import aliases to symbol names
     * @returns Array of extracted relationships
     */
    extractSymbolRelationships(node: Node, symbolEntity: SymbolEntity, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts reference relationships using TypeScript AST with best-effort resolution.
     * Analyzes identifiers, type references, instantiations, and read/write operations.
     *
     * @param sourceFile - The source file to analyze
     * @param fileEntity - The file entity
     * @param localSymbols - Array of local symbols in the file
     * @param importMap - Map of import aliases to file paths
     * @param importSymbolMap - Map of import aliases to symbol names
     * @returns Array of extracted relationships
     */
    extractReferenceRelationships(sourceFile: SourceFile, fileEntity: File, localSymbols: Array<{
        node: Node;
        entity: SymbolEntity;
    }>, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts import relationships from a source file, analyzing various import types
     * including default, named, namespace, and side-effect imports.
     *
     * @param sourceFile - The source file to analyze
     * @param fileEntity - The file entity
     * @param importMap - Map of import aliases to file paths
     * @param importSymbolMap - Map of import aliases to symbol names
     * @returns Array of import relationships
     */
    extractImportRelationships(sourceFile: SourceFile, fileEntity: File, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Creates a relationship with proper normalization and metadata handling.
     *
     * @param fromId - Source entity ID
     * @param toId - Target entity ID
     * @param type - Relationship type
     * @param metadata - Optional metadata
     * @returns Normalized GraphRelationship
     */
    createRelationship(fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, any>): GraphRelationship;
}
//# sourceMappingURL=RelationshipBuilder.d.ts.map