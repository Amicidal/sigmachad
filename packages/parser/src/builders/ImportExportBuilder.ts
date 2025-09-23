/**
 * ImportExportBuilder - Handles module import/export relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles IMPORTS relationships for various import types (default, named, namespace, side-effect).
 */

import { SourceFile } from "ts-morph";
import * as path from "path";
import {
  File,
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";

export interface ImportExportBuilderOptions {
  getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
}

/**
 * ImportExportBuilder handles the extraction of import/export relationships
 * between modules including default, named, namespace, and side-effect imports.
 */
export class ImportExportBuilder {
  private getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;

  constructor(options: ImportExportBuilderOptions) {
    this.getModuleExportMap = options.getModuleExportMap;
  }

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
  extractImportRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    const imports = sourceFile.getImportDeclarations();
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      // Side-effect import: import './x'
      if (
        importDecl.getNamedImports().length === 0 &&
        !importDecl.getDefaultImport() &&
        !importDecl.getNamespaceImport()
      ) {
        const modSf = importDecl.getModuleSpecifierSourceFile();
        if (modSf) {
          const abs = modSf.getFilePath();
          const rel = path.relative(process.cwd(), abs);
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${rel}:${path.basename(rel)}`,
              RelationshipType.IMPORTS,
              {
                importKind: "side-effect",
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "side-effect",
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }

      // Default import
      const def = importDecl.getDefaultImport();
      if (def) {
        const alias = def.getText();
        if (alias) {
          const target = importMap?.get(alias);
          if (target) {
            // Link to module default export placeholder in target file
            relationships.push(
              this.createRelationship(
                fileEntity.id,
                `file:${target}:default`,
                RelationshipType.IMPORTS,
                {
                  importKind: "default",
                  alias,
                  module: moduleSpecifier,
                  language: fileEntity.language,
                }
              )
            );
          } else {
            relationships.push(
              this.createRelationship(
                fileEntity.id,
                `import:${moduleSpecifier}:default`,
                RelationshipType.IMPORTS,
                {
                  importKind: "default",
                  alias,
                  module: moduleSpecifier,
                  language: fileEntity.language,
                }
              )
            );
          }
        }
      }

      // Namespace import: import * as NS from '...'
      const ns = importDecl.getNamespaceImport();
      if (ns) {
        const alias = ns.getText();
        const target = alias ? importMap?.get(alias) : undefined;
        if (target) {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${target}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "namespace",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "namespace",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }

      // Named imports
      for (const ni of importDecl.getNamedImports()) {
        const name = ni.getNameNode().getText();
        const aliasNode = ni.getAliasNode();
        const alias = aliasNode ? aliasNode.getText() : undefined;
        let resolved: { fileRel: string; name: string; depth: number } | null =
          null;
        try {
          const modSf = importDecl.getModuleSpecifierSourceFile();
          const resolvedMap = this.getModuleExportMap(modSf || undefined);
          const hit =
            resolvedMap.get(name) ||
            (alias ? resolvedMap.get(alias) : undefined);
          if (hit) resolved = hit;
        } catch {}
        if (!resolved && importMap) {
          const root = alias || name;
          const t = importMap.get(root);
          if (t) resolved = { fileRel: t, name, depth: 1 } as any;
        }
        if (resolved) {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${resolved.fileRel}:${resolved.name}`,
              RelationshipType.IMPORTS,
              {
                importKind: "named",
                alias,
                module: moduleSpecifier,
                importDepth: resolved.depth,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:${alias || name}`,
              RelationshipType.IMPORTS,
              {
                importKind: "named",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }
    }

    return relationships;
  }

  /**
   * Creates a relationship with proper normalization and metadata handling.
   */
  private createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {
    // For import relationships, we need to create a basic relationship
    // The full normalization will be handled by the main RelationshipBuilder
    const rel: any = {
      id: `${fromId}|${type}|${toId}`, // Simple ID for now
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };

    // Attach a basic toRef for placeholders to aid later resolution
    try {
      if (!(rel as any).toRef) {
        const t = String(toId || "");
        // file:<relPath>:<name> -> fileSymbol
        const mFile = t.match(/^file:(.+?):(.+)$/);
        if (mFile) {
          (rel as any).toRef = {
            kind: "fileSymbol",
            file: mFile[1],
            symbol: mFile[2],
            name: mFile[2],
          };
        } else if (t.startsWith("import:")) {
          // import:<module>:<name> -> external
          (rel as any).toRef = {
            kind: "external",
            name: t.slice("import:".length),
          };
        }
      }
    } catch {}

    // Attach a basic fromRef
    try {
      if (!(rel as any).fromRef) {
        (rel as any).fromRef = { kind: "entity", id: fromId };
      }
    } catch {}

    return rel as GraphRelationship;
  }
}
