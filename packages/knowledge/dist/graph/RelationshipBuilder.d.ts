/**
 * RelationshipBuilder - Orchestrates relationship extraction from code entities
 *
 * Refactored as a thin orchestrator that routes AST nodes to specialized builders.
 * Handles coordination between CallRelationshipBuilder, TypeRelationshipBuilder,
 * ImportExportBuilder, and ReferenceRelationshipBuilder.
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
 * RelationshipBuilder orchestrates the extraction of various types of relationships
 * between code entities by delegating to specialized builders.
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
    private callBuilder;
    private typeBuilder;
    private importBuilder;
    private referenceBuilder;
    constructor(options: RelationshipBuilderOptions);
    /**
     * Extracts symbol-level relationships including calls, inheritance, type usage,
     * decorators, method overrides, exceptions, and parameter types.
     */
    extractSymbolRelationships(node: Node, symbolEntity: SymbolEntity, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts reference relationships using TypeScript AST with best-effort resolution.
     * Analyzes identifiers, type references, instantiations, and read/write operations.
     */
    extractReferenceRelationships(sourceFile: SourceFile, fileEntity: File, localSymbols: Array<{
        node: Node;
        entity: SymbolEntity;
    }>, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Extracts import relationships from a source file, analyzing various import types
     * including default, named, namespace, and side-effect imports.
     */
    extractImportRelationships(sourceFile: SourceFile, fileEntity: File, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    /**
     * Creates a relationship with proper normalization and metadata handling.
     */
    createRelationship(fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, any>): GraphRelationship;
    /**
     * Builds a local symbol index for efficient symbol resolution within a file.
     */
    private buildLocalIndex;
    /**
     * Creates a canonical relationship ID for stable identity.
     */
    private canonicalRelationshipId;
}
//# sourceMappingURL=RelationshipBuilder.d.ts.map