/**
 * TypeRelationshipBuilder - Handles type-related relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles EXTENDS, IMPLEMENTS, TYPE_USES, RETURNS_TYPE, PARAM_TYPE, and decorator relationships.
 */

import { Node, SourceFile, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import {
  Symbol as SymbolEntity,
  GraphRelationship,
  RelationshipType,
} from '@memento/graph';
import { TypeRelationshipBuilderOptions } from '@memento/shared-types';
import { noiseConfig } from '@memento/core';

/**
 * TypeRelationshipBuilder handles the extraction of type-related relationships
 * including inheritance, type usage, decorators, return types, and parameter types.
 */
export class TypeRelationshipBuilder {
  private globalSymbolIndex: Map<string, SymbolEntity>;
  private nameIndex: Map<string, SymbolEntity[]>;
  private stopNames: Set<string>;
  private shouldUseTypeChecker: (context: any) => boolean;
  private takeTcBudget: () => boolean;
  private resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  private resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  private createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;

  constructor(options: TypeRelationshipBuilderOptions) {
    this.globalSymbolIndex = options.globalSymbolIndex;
    this.nameIndex = options.nameIndex;
    this.stopNames = options.stopNames;
    this.shouldUseTypeChecker = options.shouldUseTypeChecker;
    this.takeTcBudget = options.takeTcBudget;
    this.resolveWithTypeChecker = options.resolveWithTypeChecker;
    this.resolveImportedMemberToFileAndName =
      options.resolveImportedMemberToFileAndName;
    this.createRelationship = options.createRelationship;
  }

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
  extractTypeRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    // Extract class inheritance
    if (Node.isClassDeclaration(node)) {
      relationships.push(
        ...this.extractInheritance(
          node,
          symbolEntity,
          sourceFile,
          importMap,
          importSymbolMap,
          localIndex
        )
      );
    }

    // Extract decorators
    relationships.push(
      ...this.extractDecorators(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap
      )
    );

    // Extract type usage and type annotations for functions/methods
    if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
      relationships.push(
        ...this.extractFunctionTypeRelationships(
          node,
          symbolEntity,
          sourceFile,
          importMap,
          importSymbolMap,
          localIndex
        )
      );
    }

    return relationships;
  }

  /**
   * Extracts inheritance relationships (EXTENDS, IMPLEMENTS).
   */
  private extractInheritance(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    const heritageClauses = (node as any).getHeritageClauses?.() || [];
    for (const clause of heritageClauses) {
      if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
        for (const type of clause.getTypeNodes()) {
          try {
            const sfPath = path.relative(
              process.cwd(),
              sourceFile.getFilePath()
            );
            const simple = type.getText();
            const key = `${sfPath}:${simple}`;
            let toId = localIndex?.get(key);
            if (toId) {
              // Concretize file placeholder to symbol id when available
              try {
                if (toId.startsWith('file:')) {
                  const m = toId.match(/^file:(.+?):(.+)$/);
                  if (m) {
                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                    if (hit) toId = hit.id;
                  }
                }
              } catch {}
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.EXTENDS,
                  { resolved: true }
                )
              );
            } else {
              // Try import/deep export
              let resolved: {
                fileRel: string;
                name: string;
                depth: number;
              } | null = null;
              if (importMap) {
                resolved = this.resolveImportedMemberToFileAndName(
                  simple,
                  simple,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
              }
              if (!resolved) {
                const tc = this.shouldUseTypeChecker({
                  context: 'heritage',
                  imported: true,
                  ambiguous: true,
                  nameLength: String(type.getText?.() || '').length,
                })
                  ? this.resolveWithTypeChecker(type as any, sourceFile)
                  : null;
                if (tc)
                  resolved = {
                    fileRel: tc.fileRel,
                    name: tc.name,
                    depth: 0,
                  } as any;
              }
              let placeholder = resolved
                ? `file:${resolved.fileRel}:${resolved.name}`
                : `class:${simple}`;
              try {
                const m = placeholder.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) placeholder = hit.id;
                } else if (placeholder.startsWith('class:')) {
                  const nm = placeholder.slice('class:'.length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) placeholder = list[0].id;
                }
              } catch {}
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  placeholder,
                  RelationshipType.EXTENDS,
                  resolved
                    ? { resolved: true, importDepth: resolved.depth }
                    : undefined
                )
              );
            }
          } catch {
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                `class:${type.getText()}`,
                RelationshipType.EXTENDS
              )
            );
          }
        }
      }
      if (clause.getToken() === SyntaxKind.ImplementsKeyword) {
        for (const type of clause.getTypeNodes()) {
          try {
            const sfPath = path.relative(
              process.cwd(),
              sourceFile.getFilePath()
            );
            const simple = type.getText();
            const key = `${sfPath}:${simple}`;
            let toId = localIndex?.get(key);
            if (toId) {
              try {
                if (toId.startsWith('file:')) {
                  const m = toId.match(/^file:(.+?):(.+)$/);
                  if (m) {
                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                    if (hit) toId = hit.id;
                  }
                }
              } catch {}
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.IMPLEMENTS,
                  { resolved: true }
                )
              );
            } else {
              let resolved: {
                fileRel: string;
                name: string;
                depth: number;
              } | null = null;
              if (importMap) {
                resolved = this.resolveImportedMemberToFileAndName(
                  simple,
                  simple,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
              }
              if (!resolved) {
                const tc = this.takeTcBudget()
                  ? this.resolveWithTypeChecker(type as any, sourceFile)
                  : null;
                if (tc)
                  resolved = {
                    fileRel: tc.fileRel,
                    name: tc.name,
                    depth: 0,
                  } as any;
              }
              let placeholder = resolved
                ? `file:${resolved.fileRel}:${resolved.name}`
                : `interface:${simple}`;
              try {
                const m = placeholder.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) placeholder = hit.id;
                } else if (placeholder.startsWith('interface:')) {
                  const nm = placeholder.slice('interface:'.length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) placeholder = list[0].id;
                }
              } catch {}
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  placeholder,
                  RelationshipType.IMPLEMENTS,
                  resolved
                    ? { resolved: true, importDepth: resolved.depth }
                    : undefined
                )
              );
            }
          } catch {
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                `interface:${type.getText()}`,
                RelationshipType.IMPLEMENTS
              )
            );
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Extracts decorator relationships.
   */
  private extractDecorators(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    try {
      const getDecorators: any = (node as any).getDecorators?.();
      const decs: any[] = Array.isArray(getDecorators) ? getDecorators : [];
      for (const d of decs) {
        try {
          const expr: any = d.getExpression?.() || d.getNameNode?.() || null;
          let accessPath = '';
          let simpleName = '';
          if (expr && typeof expr.getText === 'function') {
            accessPath = String(expr.getText());
            const base = accessPath.split('(')[0];
            simpleName = (base.split('.').pop() || base).trim();
          }
          if (!simpleName) continue;
          if (
            this.stopNames?.has(simpleName.toLowerCase()) ||
            simpleName.length < noiseConfig.AST_MIN_NAME_LENGTH
          )
            continue;
          let toId: string | null = null;
          // Try type-checker resolution first
          try {
            if (
              !toId &&
              this.shouldUseTypeChecker({
                context: 'decorator',
                imported: !!importMap,
                ambiguous: true,
                nameLength: simpleName.length,
              })
            ) {
              const tc = this.resolveWithTypeChecker(expr as any, sourceFile);
              if (tc) toId = `file:${tc.fileRel}:${tc.name}`;
            }
          } catch {}
          // Try import map using root of accessPath
          if (!toId && importMap) {
            const root = accessPath.split(/[.(]/)[0];
            const target = root && importMap.get(root);
            if (target) toId = `file:${target}:${simpleName}`;
          }
          if (!toId) {
            toId = `external:${simpleName}`;
          }
          // Location
          let line: number | undefined;
          let column: number | undefined;
          try {
            const pos = (d as any).getStart?.();
            if (typeof pos === 'number') {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}
          const meta = {
            kind: 'decorator',
            accessPath,
            path: path.relative(process.cwd(), sourceFile.getFilePath()),
            ...(typeof line === 'number' ? { line } : {}),
            ...(typeof column === 'number' ? { column } : {}),
          };
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.REFERENCES,
              meta
            )
          );
        } catch {}
      }
    } catch {}

    return relationships;
  }

  /**
   * Extracts function/method type relationships (return types, parameter types).
   */
  private extractFunctionTypeRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    try {
      // RETURNS_TYPE
      const rt: any = (node as any).getReturnTypeNode?.();
      if (rt && typeof rt.getText === 'function') {
        const tname = rt.getText();
        if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
          let toId: string = `external:${tname}`;
          if (importMap) {
            const deep = this.resolveImportedMemberToFileAndName(
              tname,
              tname,
              sourceFile,
              importMap,
              importSymbolMap
            );
            if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
          }
          try {
            const m = toId.match(/^file:(.+?):(.+)$/);
            if (m) {
              const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
              if (hit) toId = hit.id;
            } else if (toId.startsWith('external:')) {
              const nm = toId.slice('external:'.length);
              const list = this.nameIndex.get(nm) || [];
              if (list.length === 1) toId = list[0].id;
              else if (list.length > 1) {
                // mark ambiguous in metadata (set below)
              }
            }
          } catch {}
          let line: number | undefined;
          let column: number | undefined;
          try {
            const pos = (rt as any).getStart?.();
            if (typeof pos === 'number') {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}
          const meta: any = {
            inferred: true,
            kind: 'type',
            ...(typeof line === 'number' ? { line } : {}),
            ...(typeof column === 'number' ? { column } : {}),
          };
          try {
            if (toId.startsWith('external:')) {
              const nm = toId.slice('external:'.length);
              const list = this.nameIndex.get(nm) || [];
              if (list.length > 1) {
                meta.ambiguous = true;
                meta.candidateCount = list.length;
              }
            }
          } catch {}
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.RETURNS_TYPE,
              meta
            )
          );
        }
      } else {
        // Fallback: infer return type via type checker when annotation is missing
        try {
          const t = (node as any).getReturnType?.();
          // Attempt to obtain a readable base name
          let tname = '';
          try {
            tname = (t?.getSymbol?.()?.getName?.() || '').toString();
          } catch {}
          if (!tname) {
            try {
              tname =
                typeof t?.getText === 'function' ? String(t.getText()) : '';
            } catch {}
          }
          if (tname) tname = String(tname).split(/[<|&]/)[0].trim();
          if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
            let toId: string = `external:${tname}`;
            if (importMap) {
              const deep = this.resolveImportedMemberToFileAndName(
                tname,
                tname,
                sourceFile,
                importMap,
                importSymbolMap
              );
              if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
            }
            try {
              const m = toId.match(/^file:(.+?):(.+)$/);
              if (m) {
                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                if (hit) toId = hit.id;
              } else if (toId.startsWith('external:')) {
                const nm = toId.slice('external:'.length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) toId = list[0].id;
              }
            } catch {}
            const meta: any = {
              inferred: true,
              kind: 'type',
              usedTypeChecker: true,
              resolution: 'type-checker',
            };
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                toId,
                RelationshipType.RETURNS_TYPE,
                meta
              )
            );
          }
        } catch {}
      }
    } catch {}

    try {
      // PARAM_TYPE per parameter
      const params: any[] = (node as any).getParameters?.() || [];
      for (const p of params) {
        const tn: any = p.getTypeNode?.();
        const pname: string = p.getName?.() || '';
        if (tn && typeof tn.getText === 'function') {
          const tname = tn.getText();
          if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
            let toId: string = `external:${tname}`;
            if (importMap) {
              const deep = this.resolveImportedMemberToFileAndName(
                tname,
                tname,
                sourceFile,
                importMap,
                importSymbolMap
              );
              if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
            }
            try {
              const m = toId.match(/^file:(.+?):(.+)$/);
              if (m) {
                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                if (hit) toId = hit.id;
              } else if (toId.startsWith('external:')) {
                const nm = toId.slice('external:'.length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) toId = list[0].id;
              }
            } catch {}
            let pline: number | undefined;
            let pcol: number | undefined;
            try {
              const pos = (tn as any).getStart?.();
              if (typeof pos === 'number') {
                const lc = sourceFile.getLineAndColumnAtPos(pos);
                pline = lc.line;
                pcol = lc.column;
              }
            } catch {}
            const meta: any = { inferred: true, kind: 'type', param: pname };
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                toId,
                RelationshipType.PARAM_TYPE,
                meta
              )
            );
            const scope = toId.startsWith('external:')
              ? 'external'
              : toId.startsWith('file:')
              ? 'imported'
              : 'local';
            const depConfidence =
              scope === 'local' ? 0.9 : scope === 'imported' ? 0.6 : 0.4;
            const depMeta = {
              inferred: true,
              kind: 'dependency',
              scope,
              resolution: 'type-annotation',
              confidence: depConfidence,
              param: pname,
            } as any;
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                toId,
                RelationshipType.DEPENDS_ON,
                depMeta
              )
            );
          }
        } else {
          // Fallback: infer param type via type checker
          try {
            const t = p.getType?.();
            let tname = '';
            try {
              tname = (t?.getSymbol?.()?.getName?.() || '').toString();
            } catch {}
            if (!tname) {
              try {
                tname =
                  typeof t?.getText === 'function' ? String(t.getText()) : '';
              } catch {}
            }
            if (tname) tname = String(tname).split(/[<|&]/)[0].trim();
            if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
              let toId: string = `external:${tname}`;
              if (importMap) {
                const deep = this.resolveImportedMemberToFileAndName(
                  tname,
                  tname,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
                if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
              }
              try {
                const m = toId.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) toId = hit.id;
                } else if (toId.startsWith('external:')) {
                  const nm = toId.slice('external:'.length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) toId = list[0].id;
                }
              } catch {}
              const meta: any = {
                inferred: true,
                kind: 'type',
                param: pname,
                usedTypeChecker: true,
                resolution: 'type-checker',
              };
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.PARAM_TYPE,
                  meta
                )
              );
              const scope = toId.startsWith('external:')
                ? 'external'
                : toId.startsWith('file:')
                ? 'imported'
                : 'local';
              const depConfidence =
                scope === 'local' ? 0.9 : scope === 'imported' ? 0.6 : 0.4;
              const depMeta = {
                inferred: true,
                kind: 'dependency',
                scope,
                resolution: 'type-checker',
                confidence: depConfidence,
                param: pname,
              } as any;
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.DEPENDS_ON,
                  depMeta
                )
              );
            }
          } catch {}
        }
      }
    } catch {}

    return relationships;
  }
}
