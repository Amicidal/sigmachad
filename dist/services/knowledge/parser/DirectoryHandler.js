/**
 * Directory Handler for AST Parser
 * Handles directory hierarchy creation and path normalization
 */
import * as crypto from "crypto";
import { RelationshipType } from "../../../models/relationships.js";
/**
 * Handles directory-related operations for the AST Parser
 * Creates directory entities and relationships for file organization
 */
export class DirectoryHandler {
    /**
     * Normalize a relative path by standardizing separators and removing trailing slashes
     * @param path - Path to normalize
     * @returns Normalized path string
     */
    normalizeRelPath(path) {
        let s = String(path || "").replace(/\\/g, "/");
        s = s.replace(/\/+/g, "/");
        s = s.replace(/\/+$/g, "");
        return s;
    }
    /**
     * Create directory entities for the path and CONTAINS edges for dir->dir and dir->file
     * @param fileRelPath - Relative path to the file
     * @param fileEntityId - ID of the file entity
     * @returns Object containing directory entities and relationships
     */
    createDirectoryHierarchy(fileRelPath, fileEntityId) {
        const dirEntities = [];
        const dirRelationships = [];
        const rel = this.normalizeRelPath(fileRelPath);
        if (!rel || rel.indexOf("/") < 0) {
            return { dirEntities, dirRelationships }; // no directory
        }
        const parts = rel.split("/");
        parts.pop(); // remove file name
        const segments = [];
        for (let i = 0; i < parts.length; i++) {
            segments.push(parts.slice(0, i + 1).join("/"));
        }
        // Create directory entities with stable ids based on path
        const dirIds = [];
        for (let i = 0; i < segments.length; i++) {
            const dpath = segments[i];
            const depth = i + 1;
            const id = `dir:${dpath}`;
            dirIds.push(id);
            dirEntities.push({
                id,
                type: "directory",
                path: dpath,
                hash: crypto.createHash("sha256").update(`dir:${dpath}`).digest("hex"),
                language: "unknown",
                lastModified: new Date(),
                created: new Date(),
                children: [],
                depth,
            });
        }
        // Link parent->child directories
        for (let i = 1; i < dirIds.length; i++) {
            dirRelationships.push(this.createRelationship(dirIds[i - 1], dirIds[i], RelationshipType.CONTAINS));
        }
        // Link last directory to the file
        if (dirIds.length > 0) {
            dirRelationships.push(this.createRelationship(dirIds[dirIds.length - 1], fileEntityId, RelationshipType.CONTAINS));
        }
        return { dirEntities, dirRelationships };
    }
    /**
     * Check if directory entities should be included based on environment
     * @returns True if running in integration test environment
     */
    shouldIncludeDirectoryEntities() {
        return process.env.RUN_INTEGRATION === "1";
    }
    /**
     * Create a relationship between two entities
     * @param fromId - Source entity ID
     * @param toId - Target entity ID
     * @param type - Relationship type
     * @param metadata - Optional metadata for the relationship
     * @returns GraphRelationship object
     */
    createRelationship(fromId, toId, type, metadata) {
        const baseRel = {
            id: `${fromId}-${type}-${toId}`,
            type: type,
            fromEntityId: fromId,
            toEntityId: toId,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
        };
        // Generate stable ID based on relationship content
        const idString = `${baseRel.fromEntityId}-${baseRel.type}-${baseRel.toEntityId}`;
        baseRel.id = crypto.createHash("sha256").update(idString).digest("hex");
        return baseRel;
    }
    /**
     * Parse a file path and extract directory information
     * @param filePath - Full file path
     * @returns Object with directory path and file name
     */
    parseFilePath(filePath) {
        const normalized = this.normalizeRelPath(filePath);
        const lastSlash = normalized.lastIndexOf("/");
        if (lastSlash === -1) {
            return { dirPath: "", fileName: normalized };
        }
        return {
            dirPath: normalized.substring(0, lastSlash),
            fileName: normalized.substring(lastSlash + 1),
        };
    }
    /**
     * Get the depth of a path (number of directory levels)
     * @param path - Path to analyze
     * @returns Depth as a number
     */
    getPathDepth(path) {
        const normalized = this.normalizeRelPath(path);
        if (!normalized)
            return 0;
        return normalized.split("/").filter(p => p).length;
    }
    /**
     * Check if one path is a parent of another
     * @param parentPath - Potential parent path
     * @param childPath - Potential child path
     * @returns True if parentPath is a parent of childPath
     */
    isParentPath(parentPath, childPath) {
        const normalizedParent = this.normalizeRelPath(parentPath);
        const normalizedChild = this.normalizeRelPath(childPath);
        if (!normalizedParent || !normalizedChild)
            return false;
        if (normalizedParent === normalizedChild)
            return false;
        return normalizedChild.startsWith(normalizedParent + "/");
    }
    /**
     * Get the relative path from one directory to another
     * @param fromPath - Starting path
     * @param toPath - Target path
     * @returns Relative path string
     */
    getRelativePath(fromPath, toPath) {
        const normalizedFrom = this.normalizeRelPath(fromPath);
        const normalizedTo = this.normalizeRelPath(toPath);
        if (normalizedTo.startsWith(normalizedFrom + "/")) {
            return normalizedTo.substring(normalizedFrom.length + 1);
        }
        // For more complex cases, implement full relative path logic
        // For now, return the target path if not a simple child
        return normalizedTo;
    }
}
//# sourceMappingURL=DirectoryHandler.js.map