/**
 * ImportExportBuilder - Handles module import/export relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles IMPORTS relationships for various import types (default, named, namespace, side-effect).
 */
import { SourceFile } from "ts-morph";
import { File } from "../../models/entities.js";
import { GraphRelationship } from "../../models/relationships.js";
export interface ImportExportBuilderOptions {
    getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
}
/**
 * ImportExportBuilder handles the extraction of import/export relationships
 * between modules including default, named, namespace, and side-effect imports.
 */
export declare class ImportExportBuilder {
    private getModuleExportMap;
    constructor(options: ImportExportBuilderOptions);
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
     */
    private createRelationship;
}
//# sourceMappingURL=ImportExportBuilder.d.ts.map