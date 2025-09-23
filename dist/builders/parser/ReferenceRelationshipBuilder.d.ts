/**
 * ReferenceRelationshipBuilder - Handles reference relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles REFERENCES, READS, WRITES, DEPENDS_ON relationships for general references
 * and dataflow analysis.
 */
import { Node, SourceFile } from "ts-morph";
import { File } from "../../models/entities.js";
import { GraphRelationship, RelationshipType } from "../../models/relationships.js";
export interface ReferenceRelationshipBuilderOptions {
    globalSymbolIndex: Map<string, any>;
    nameIndex: Map<string, any[]>;
    stopNames: Set<string>;
    shouldUseTypeChecker: (context: any) => boolean;
    takeTcBudget: () => boolean;
    resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
    resolveImportedMemberToFileAndName: (memberName: string, exportName: string, sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>) => any;
    createRelationship: (fromId: string, toId: string, type: RelationshipType, metadata?: Record<string, any>) => GraphRelationship;
}
/**
 * ReferenceRelationshipBuilder handles the extraction of reference relationships
 * including general references, reads, writes, and dependencies.
 */
export declare class ReferenceRelationshipBuilder {
    private globalSymbolIndex;
    private nameIndex;
    private stopNames;
    private shouldUseTypeChecker;
    private takeTcBudget;
    private resolveWithTypeChecker;
    private resolveImportedMemberToFileAndName;
    private createRelationship;
    constructor(options: ReferenceRelationshipBuilderOptions);
    /**
     * Extracts reference relationships using TypeScript AST with best-effort resolution.
     * Analyzes identifiers, type references, instantiations, and read/write operations.
     */
    extractReferenceRelationships(sourceFile: SourceFile, fileEntity: File, localSymbols: Array<{
        node: Node;
        entity: any;
    }>, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): GraphRelationship[];
    private normalizeRelPath;
}
//# sourceMappingURL=ReferenceRelationshipBuilder.d.ts.map