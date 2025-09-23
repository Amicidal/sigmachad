/**
 * Directory Handler for AST Parser
 * Handles directory hierarchy creation and path normalization
 */

import { Entity } from "../../../models/entities.js";
import { GraphRelationship, RelationshipType, StructuralRelationship } from "../../../models/relationships.js";
import { createHash, normalizeRelPath, parseFilePath, getPathDepth, isParentPath } from "./utils.js";

/**
 * Handles directory-related operations for the AST Parser
 * Creates directory entities and relationships for file organization
 */
export class DirectoryHandler {
  // Note: normalizeRelPath is now available as a shared utility

  /**
   * Create directory entities for the path and CONTAINS edges for dir->dir and dir->file
   * @param fileRelPath - Relative path to the file
   * @param fileEntityId - ID of the file entity
   * @returns Object containing directory entities and relationships
   */
  createDirectoryHierarchy(
    fileRelPath: string,
    fileEntityId: string
  ): { dirEntities: Entity[]; dirRelationships: GraphRelationship[] } {
    const dirEntities: Entity[] = [];
    const dirRelationships: GraphRelationship[] = [];

    const rel = normalizeRelPath(fileRelPath);
    if (!rel || rel.indexOf("/") < 0) {
      return { dirEntities, dirRelationships }; // no directory
    }

    const parts = rel.split("/");
    parts.pop(); // remove file name

    const segments: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      segments.push(parts.slice(0, i + 1).join("/"));
    }

    // Create directory entities with stable ids based on path
    const dirIds: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const dpath = segments[i];
      const depth = i + 1;
      const id = `dir:${dpath}`;
      dirIds.push(id);
      dirEntities.push({
        id,
        type: "directory",
        path: dpath,
        hash: createHash(`dir:${dpath}`),
        language: "unknown",
        lastModified: new Date(),
        created: new Date(),
        children: [],
        depth,
      } as any);
    }

    // Link parent->child directories
    for (let i = 1; i < dirIds.length; i++) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[i - 1],
          dirIds[i],
          RelationshipType.CONTAINS
        )
      );
    }

    // Link last directory to the file
    if (dirIds.length > 0) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[dirIds.length - 1],
          fileEntityId,
          RelationshipType.CONTAINS
        )
      );
    }

    return { dirEntities, dirRelationships };
  }

  /**
   * Check if directory entities should be included based on environment
   * @returns True if running in integration test environment
   */
  shouldIncludeDirectoryEntities(): boolean {
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
  private createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS,
    metadata?: any
  ): StructuralRelationship {
    const baseRel: StructuralRelationship = {
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
    baseRel.id = createHash(idString);

    return baseRel;
  }

  // These methods are now available as shared utilities:
  // parseFilePath, getPathDepth, isParentPath

  /**
   * Get the relative path from one directory to another
   * @param fromPath - Starting path
   * @param toPath - Target path
   * @returns Relative path string
   */
  getRelativePath(fromPath: string, toPath: string): string {
    const normalizedFrom = normalizeRelPath(fromPath);
    const normalizedTo = normalizeRelPath(toPath);

    if (normalizedTo.startsWith(normalizedFrom + "/")) {
      return normalizedTo.substring(normalizedFrom.length + 1);
    }

    // For more complex cases, implement full relative path logic
    // For now, return the target path if not a simple child
    return normalizedTo;
  }
}