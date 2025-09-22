/**
 * Directory Handler for AST Parser
 * Handles directory hierarchy creation and path normalization
 */
import { Entity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";
/**
 * Handles directory-related operations for the AST Parser
 * Creates directory entities and relationships for file organization
 */
export declare class DirectoryHandler {
    /**
     * Normalize a relative path by standardizing separators and removing trailing slashes
     * @param path - Path to normalize
     * @returns Normalized path string
     */
    normalizeRelPath(path: string): string;
    /**
     * Create directory entities for the path and CONTAINS edges for dir->dir and dir->file
     * @param fileRelPath - Relative path to the file
     * @param fileEntityId - ID of the file entity
     * @returns Object containing directory entities and relationships
     */
    createDirectoryHierarchy(fileRelPath: string, fileEntityId: string): {
        dirEntities: Entity[];
        dirRelationships: GraphRelationship[];
    };
    /**
     * Check if directory entities should be included based on environment
     * @returns True if running in integration test environment
     */
    shouldIncludeDirectoryEntities(): boolean;
    /**
     * Create a relationship between two entities
     * @param fromId - Source entity ID
     * @param toId - Target entity ID
     * @param type - Relationship type
     * @param metadata - Optional metadata for the relationship
     * @returns GraphRelationship object
     */
    private createRelationship;
    /**
     * Parse a file path and extract directory information
     * @param filePath - Full file path
     * @returns Object with directory path and file name
     */
    parseFilePath(filePath: string): {
        dirPath: string;
        fileName: string;
    };
    /**
     * Get the depth of a path (number of directory levels)
     * @param path - Path to analyze
     * @returns Depth as a number
     */
    getPathDepth(path: string): number;
    /**
     * Check if one path is a parent of another
     * @param parentPath - Potential parent path
     * @param childPath - Potential child path
     * @returns True if parentPath is a parent of childPath
     */
    isParentPath(parentPath: string, childPath: string): boolean;
    /**
     * Get the relative path from one directory to another
     * @param fromPath - Starting path
     * @param toPath - Target path
     * @returns Relative path string
     */
    getRelativePath(fromPath: string, toPath: string): string;
}
//# sourceMappingURL=DirectoryHandler.d.ts.map