/**
 * RelationshipBuilder - Extracts relationships between code entities
 *
 * Extracted from ASTParser.ts as part of the modular refactoring.
 * Handles symbol relationships, reference relationships, import relationships,
 * and relationship creation with confidence scoring and edge normalization.
 */

import { Project, Node, SourceFile, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as crypto from "crypto";
import {
  Entity,
  File,
  Symbol as SymbolEntity,
} from "../../../models/entities.js";
import {
  GraphRelationship,
  RelationshipType,
} from "../../../models/relationships.js";
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
} from "../../../utils/codeEdges.js";
import { noiseConfig } from "../../../config/noise.js";
import { scoreInferredEdge } from "../../../utils/confidence.js";

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
  resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  normalizeRelPath: (p: string) => string;
}

/**
 * RelationshipBuilder handles the extraction of various types of relationships
 * between code entities including symbols, references, imports, and dependencies.
 */
export class RelationshipBuilder {
  private tsProject: Project;
  private globalSymbolIndex: Map<string, SymbolEntity>;
  private nameIndex: Map<string, SymbolEntity[]>;
  private stopNames: Set<string>;
  private fileCache: Map<string, any>;
  private shouldUseTypeChecker: (context: any) => boolean;
  private takeTcBudget: () => boolean;
  private resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  private resolveCallTargetWithChecker: (call: any, sourceFile: SourceFile) => any;
  private resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  private getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  private normalizeRelPath: (p: string) => string;

  constructor(options: RelationshipBuilderOptions) {
    this.tsProject = options.tsProject;
    this.globalSymbolIndex = options.globalSymbolIndex;
    this.nameIndex = options.nameIndex;
    this.stopNames = options.stopNames;
    this.fileCache = options.fileCache;
    this.shouldUseTypeChecker = options.shouldUseTypeChecker;
    this.takeTcBudget = options.takeTcBudget;
    this.resolveWithTypeChecker = options.resolveWithTypeChecker;
    this.resolveCallTargetWithChecker = options.resolveCallTargetWithChecker;
    this.resolveImportedMemberToFileAndName = options.resolveImportedMemberToFileAndName;
    this.getModuleExportMap = options.getModuleExportMap;
    this.normalizeRelPath = options.normalizeRelPath;
  }

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
  extractSymbolRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];
    // Aggregate repeated CALLS per target for this symbol
    const callAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    // Build quick index of local symbols in this file to enable direct linking
    // We search by path suffix ("<filePath>:<name>") which we assign when creating symbols
    const localIndex = new Map<string, string>();
    try {
      const sfPath = (sourceFile.getFilePath && sourceFile.getFilePath()) || "";
      const relPath = path.relative(process.cwd(), sfPath);
      // Gather top-level declarations with names and map to their entity ids if already known
      // Note: During this pass, we may not have access to ids of other symbols unless they were just created.
      // For same-file references where we have the entity (symbolEntity), we still rely on fallbacks below.
      // The incremental parser stores a symbolMap in the cache; we leverage that when available.
      const cached = this.fileCache.get(path.resolve(relPath));
      if (cached && cached.symbolMap) {
        for (const [k, v] of cached.symbolMap.entries()) {
          const valId = (v as any).id;
          // Original key format in cache: `${symbolEntity.path}:${symbolEntity.name}`
          localIndex.set(k, valId);
          // Also index by simplified key `${fileRelPath}:${name}` to match lookups below
          const parts = String(k).split(":");
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            // symbolEntity.path may itself be `${fileRelPath}:${name}`; rebuild simplified key
            const simpleKey = `${relPath}:${name}`;
            localIndex.set(simpleKey, valId);
          }
        }
      }
    } catch {}

    // Extract function calls with best-effort resolution to local symbols first
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const calls = node
        .getDescendants()
        .filter((descendant) => Node.isCallExpression(descendant));
      for (const call of calls) {
        try {
          const expr: any = (call as any).getExpression?.() || null;
          let targetName = "";
          if (expr && typeof expr.getText === "function") {
            targetName = String(expr.getText());
          } else {
            targetName = String(call.getExpression()?.getText?.() || "");
          }

          // Try to resolve identifier or property access to a local symbol id or cross-file import
          let toId: string | null = null;
          const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
          const parts = targetName.split(".");
          const simpleName = (parts.pop() || targetName).trim();

          // Skip noisy/global names
          const simpleLower = simpleName.toLowerCase();
          if (
            !simpleLower ||
            simpleLower.length < noiseConfig.AST_MIN_NAME_LENGTH ||
            this.stopNames.has(simpleLower)
          ) {
            continue;
          }

          // Inspect call arity and awaited usage
          let arity = 0;
          try {
            const args: any[] = (call as any).getArguments?.() || [];
            arity = Array.isArray(args) ? args.length : 0;
          } catch {}
          let awaited = false;
          try {
            let p: any = (call as any).getParent?.();
            while (
              p &&
              typeof p.getKind === "function" &&
              p.getKind() === SyntaxKind.ParenthesizedExpression
            )
              p = p.getParent?.();
            awaited = !!(
              p &&
              typeof p.getKind === "function" &&
              p.getKind() === SyntaxKind.AwaitExpression
            );
          } catch {}

          // Track resolution/scope hints for richer evidence
          let resHint: string | undefined;
          let scopeHint: string | undefined;
          const baseMeta: Record<string, any> = {};

          // Property access calls: try to resolve base object type to declaration and method symbol name
          try {
            if (
              (ts as any).isPropertyAccessExpression &&
              (call as any).getExpression &&
              (call as any).getExpression().getExpression
            ) {
              const pae: any = (call as any).getExpression();
              const base: any = pae?.getExpression?.();
              const methodName: string = pae?.getName?.() || simpleName;
              if (base && typeof methodName === "string") {
                (baseMeta as any).isMethod = true;
                const checker = this.tsProject.getTypeChecker();
                const t = (checker as any).getTypeAtLocation?.(base);
                const sym: any = t?.getSymbol?.();
                const decls: any[] = Array.isArray(sym?.getDeclarations?.())
                  ? sym.getDeclarations()
                  : [];
                const firstDecl = decls[0];
                const declSf = firstDecl?.getSourceFile?.();
                const abs = declSf?.getFilePath?.();
                if (abs) {
                  const rel = path.relative(process.cwd(), abs);
                  toId = `file:${rel}:${methodName}`;
                  resHint = "type-checker";
                  scopeHint = "imported";
                }
                // Enrich receiver type and dispatch hint
                try {
                  const tText =
                    typeof t?.getText === "function" ? t.getText() : undefined;
                  if (tText) (baseMeta as any).receiverType = tText;
                  const isUnion =
                    typeof (t as any)?.isUnion === "function"
                      ? (t as any).isUnion()
                      : false;
                  const isInterface = String(sym?.getFlags?.() || "").includes(
                    "Interface"
                  );
                  if (isUnion || isInterface)
                    (baseMeta as any).dynamicDispatch = true;
                } catch {}
              }
            }
          } catch {}

          // Namespace/default alias usage: ns.method() or alias.method()
          if (importMap && parts.length > 1) {
            const root = parts[0];
            if (importMap.has(root)) {
              const relTarget = importMap.get(root)!;
              const hint = importSymbolMap?.get(root) || simpleName;
              toId = `file:${relTarget}:${hint}`;
              resHint = "via-import";
              scopeHint = "imported";
            }
          }

          // Heuristic: if method is a known mutator of its receiver, record a WRITES edge on the base identifier
          try {
            if (targetName.includes(".")) {
              const mutating = new Set([
                "push",
                "pop",
                "shift",
                "unshift",
                "splice",
                "sort",
                "reverse",
                "copyWithin",
                "fill",
                "set",
                "delete",
                "clear",
                "add",
              ]);
              const partsAll = targetName.split(".");
              const mName = partsAll[partsAll.length - 1];
              if (mutating.has(mName)) {
                const baseExpr = (call as any)
                  .getExpression?.()
                  ?.getExpression?.();
                const baseText: string = baseExpr?.getText?.() || "";
                if (baseText) {
                  // Try to resolve base identifier to local symbol id
                  const keyBase = `${sfPath}:${baseText}`;
                  let varTo: string | null = null;
                  if (localIndex.has(keyBase)) {
                    varTo = localIndex.get(keyBase)!;
                  } else if (importMap && importMap.has(baseText)) {
                    const deep =
                      this.resolveImportedMemberToFileAndName(
                        baseText,
                        baseText,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      ) || null;
                    const fallbackName =
                      importSymbolMap?.get(baseText) || baseText;
                    varTo = deep
                      ? `file:${deep.fileRel}:${deep.name}`
                      : `file:${importMap.get(baseText)!}:${fallbackName}`;
                  } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)) {
                    varTo = `external:${baseText}`;
                  }
                  if (varTo) {
                    relationships.push(
                      this.createRelationship(
                        symbolEntity.id,
                        varTo,
                        RelationshipType.WRITES,
                        {
                          kind: "write",
                          operator: "mutate",
                          accessPath: targetName,
                        }
                      )
                    );
                  }
                }
              }
            }
          } catch {}

          // If call refers to an imported binding, prefer cross-file placeholder target (deep resolution)
          if (!toId && importMap && simpleName && importMap.has(simpleName)) {
            const deep =
              this.resolveImportedMemberToFileAndName(
                simpleName,
                "default",
                sourceFile,
                importMap,
                importSymbolMap
              ) ||
              this.resolveImportedMemberToFileAndName(
                simpleName,
                simpleName,
                sourceFile,
                importMap,
                importSymbolMap
              );
            if (deep) {
              toId = `file:${deep.fileRel}:${deep.name}`;
              resHint = "via-import";
              scopeHint = "imported";
            }
          }
          const key = `${sfPath}:${simpleName}`;
          if (localIndex.has(key)) {
            toId = localIndex.get(key)!;
            resHint = "direct";
            scopeHint = "local";
          }

          if (!toId) {
            // Deeper resolution via TypeScript checker on the call expression (budgeted)
            const tcTarget = this.shouldUseTypeChecker({
              context: "call",
              imported: !!importMap,
              ambiguous: true,
              nameLength: simpleName.length,
            })
              ? this.resolveCallTargetWithChecker(call as any, sourceFile) ||
                this.resolveWithTypeChecker(expr, sourceFile)
              : null;
            if (tcTarget) {
              toId = `file:${tcTarget.fileRel}:${tcTarget.name}`;
              resHint = "type-checker";
              scopeHint = "imported";
            }
          }

          // Prepare callsite metadata (path/line/column, call hints)
          let line: number | undefined;
          let column: number | undefined;
          try {
            const pos = (call as any).getStart?.();
            if (typeof pos === "number") {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}
          // default scope inference from toId shape if no hint set
          if (!scopeHint && toId) {
            if (toId.startsWith("external:")) scopeHint = "external";
            else if (toId.startsWith("file:")) scopeHint = "imported";
            else scopeHint = "unknown";
          }

          Object.assign(baseMeta, {
            path: path.relative(process.cwd(), sourceFile.getFilePath()),
            ...(typeof line === "number" ? { line } : {}),
            ...(typeof column === "number" ? { column } : {}),
            kind: "call",
            callee: simpleName,
            accessPath: targetName,
            arity,
            awaited,
            ...(resHint ? { resolution: resHint } : {}),
            ...(scopeHint ? { scope: scopeHint } : {}),
          });
          if (!("isMethod" in baseMeta) && targetName.includes("."))
            (baseMeta as any).isMethod = true;

          // Aggregate CALLS instead of emitting duplicates directly
          // Prefer concrete symbol ids via global index when possible
          try {
            if (toId) {
              // Already concrete? sym:... keep
              if (toId.startsWith("file:")) {
                const m = toId.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) toId = hit.id;
                }
              } else if (
                toId.startsWith("external:") ||
                /^(class|interface|function|typeAlias):/.test(toId)
              ) {
                const nm = toId.startsWith("external:")
                  ? toId.slice("external:".length)
                  : toId.split(":").slice(1).join(":");
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) toId = list[0].id;
                else if (list.length > 1) {
                  const dir = sfPath.includes("/")
                    ? sfPath.slice(0, sfPath.lastIndexOf("/")) + "/"
                    : "";
                  const near = list.filter((s) =>
                    ((s as any).path || "").startsWith(dir)
                  );
                  if (near.length === 1) toId = near[0].id;
                }
              }
            }
          } catch {}

          if (
            toId &&
            !toId.startsWith("external:") &&
            !toId.startsWith("file:")
          ) {
            const keyAgg = `${symbolEntity.id}|${toId}`;
            const prev = callAgg.get(keyAgg);
            if (!prev) callAgg.set(keyAgg, { count: 1, meta: baseMeta });
            else {
              prev.count += 1;
              // keep earliest line
              if (
                typeof baseMeta.line === "number" &&
                (typeof prev.meta.line !== "number" ||
                  baseMeta.line < prev.meta.line)
              )
                prev.meta = baseMeta;
            }
          } else if (toId && toId.startsWith("file:")) {
            // Use confidence gating and mark that type checker was possibly used
            const confidence = scoreInferredEdge({
              relationType: RelationshipType.CALLS,
              toId,
              fromFileRel: sfPath,
              usedTypeChecker: true,
              nameLength: simpleName.length,
            });
            if (confidence >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
              const keyAgg = `${symbolEntity.id}|${toId}`;
              const meta: Record<string, any> = {
                ...baseMeta,
                inferred: true,
                source: "call-typecheck",
                confidence,
                resolution: "type-checker",
                scope: "imported",
              };
              const prev = callAgg.get(keyAgg);
              if (!prev) callAgg.set(keyAgg, { count: 1, meta });
              else {
                prev.count += 1;
                if (
                  typeof meta.line === "number" &&
                  (typeof prev.meta.line !== "number" ||
                    meta.line < prev.meta.line)
                )
                  prev.meta = meta;
              }
            }
          } else {
            // Skip external-only unresolved calls to reduce noise
          }
        } catch {
          // Fallback to generic placeholder
          // Intentionally skip emitting a relationship on failure to avoid noise
        }
      }
    }

    // Extract class inheritance
    if (Node.isClassDeclaration(node)) {
      const heritageClauses = node.getHeritageClauses();
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
              let toId = localIndex.get(key);
              if (toId) {
                // Concretize file placeholder to symbol id when available
                try {
                  if (toId.startsWith("file:")) {
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
                    context: "heritage",
                    imported: true,
                    ambiguous: true,
                    nameLength: String(type.getText() || "").length,
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
                  } else if (placeholder.startsWith("class:")) {
                    const nm = placeholder.slice("class:".length);
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
              let toId = localIndex.get(key);
              if (toId) {
                try {
                  if (toId.startsWith("file:")) {
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
                  } else if (placeholder.startsWith("interface:")) {
                    const nm = placeholder.slice("interface:".length);
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
    }

    // Decorators on classes/methods/properties/parameters -> REFERENCES(kind=decorator)
    try {
      const getDecorators: any = (node as any).getDecorators?.();
      const decs: any[] = Array.isArray(getDecorators) ? getDecorators : [];
      for (const d of decs) {
        try {
          const expr: any = d.getExpression?.() || d.getNameNode?.() || null;
          let accessPath = "";
          let simpleName = "";
          if (expr && typeof expr.getText === "function") {
            accessPath = String(expr.getText());
            const base = accessPath.split("(")[0];
            simpleName = (base.split(".").pop() || base).trim();
          }
          if (!simpleName) continue;
          if (
            this.stopNames.has(simpleName.toLowerCase()) ||
            simpleName.length < noiseConfig.AST_MIN_NAME_LENGTH
          )
            continue;
          let toId: string | null = null;
          // Try type-checker resolution first
          try {
            if (
              !toId &&
              this.shouldUseTypeChecker({
                context: "decorator",
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
            if (typeof pos === "number") {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}
          const meta = {
            kind: "decorator",
            accessPath,
            path: path.relative(process.cwd(), sourceFile.getFilePath()),
            ...(typeof line === "number" ? { line } : {}),
            ...(typeof column === "number" ? { column } : {}),
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

    // Method-level semantics: OVERRIDES, THROWS, RETURNS_TYPE, PARAM_TYPE
    if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
      try {
        // OVERRIDES: only for methods inside classes
        if (Node.isMethodDeclaration(node)) {
          const ownerClass = node.getFirstAncestor((a) =>
            Node.isClassDeclaration(a)
          );
          const nameNode: any = (node as any).getNameNode?.();
          const methodName: string =
            (typeof nameNode?.getText === "function"
              ? nameNode.getText()
              : (node as any).getName?.()) || "";
          if (ownerClass && methodName) {
            const heritage = (ownerClass as any).getHeritageClauses?.() || [];
            for (const clause of heritage) {
              if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
                for (const type of clause.getTypeNodes()) {
                  let baseFile: string | null = null;
                  let usedTc = false;
                  try {
                    if (importMap) {
                      const simple = type.getText();
                      const res = this.resolveImportedMemberToFileAndName(
                        simple,
                        simple,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      );
                      if (res) baseFile = res.fileRel;
                    }
                    if (!baseFile) {
                      const tc = this.shouldUseTypeChecker({
                        context: "heritage",
                        imported: true,
                        ambiguous: true,
                        nameLength: String(type.getText() || "").length,
                      })
                        ? this.resolveWithTypeChecker(type as any, sourceFile)
                        : null;
                      if (tc) {
                        baseFile = tc.fileRel;
                        usedTc = true;
                      }
                    }
                  } catch {}
                  if (baseFile) {
                    // Prefer linking to exact base method symbol if known
                    let toId: string = `file:${baseFile}:${methodName}`;
                    try {
                      const hit = this.globalSymbolIndex.get(
                        `${baseFile}:${methodName}`
                      );
                      if (hit) toId = hit.id;
                    } catch {}
                    const meta: any = {
                      path: path.relative(
                        process.cwd(),
                        sourceFile.getFilePath()
                      ),
                      kind: "override",
                    };
                    if (usedTc) {
                      meta.usedTypeChecker = true;
                      meta.resolution = "type-checker";
                    }
                    relationships.push(
                      this.createRelationship(
                        symbolEntity.id,
                        toId,
                        RelationshipType.OVERRIDES,
                        meta
                      )
                    );
                  }
                }
              }
            }
          }
        }
      } catch {}

      try {
        // THROWS: throw new ErrorType()
        const throws =
          (node as any).getDescendantsOfKind?.(SyntaxKind.ThrowStatement) || [];
        for (const th of throws) {
          try {
            const expr: any = th.getExpression?.();
            let typeName = "";
            if (
              expr &&
              expr.getExpression &&
              typeof expr.getExpression === "function"
            ) {
              // new ErrorType()
              const e = expr.getExpression();
              typeName = e?.getText?.() || "";
            } else {
              typeName = expr?.getText?.() || "";
            }
            typeName = (typeName || "").split(".").pop() || "";
            if (!typeName) continue;
            let toId: string | null = null;
            if (importMap && importMap.has(typeName)) {
              const deep = this.resolveImportedMemberToFileAndName(
                typeName,
                typeName,
                sourceFile,
                importMap,
                importSymbolMap
              );
              const fallbackName = importSymbolMap?.get(typeName) || typeName;
              toId = deep
                ? `file:${deep.fileRel}:${deep.name}`
                : `file:${importMap.get(typeName)!}:${fallbackName}`;
            } else {
              // try local symbol using prebuilt localIndex from cache
              const sfPath = path.relative(
                process.cwd(),
                sourceFile.getFilePath()
              );
              const key = `${sfPath}:${typeName}`;
              const candidate = localIndex.get(key);
              if (candidate) {
                toId = candidate;
              }
            }
            // attach throw site location
            let tline: number | undefined;
            let tcol: number | undefined;
            try {
              const pos = (th as any).getStart?.();
              if (typeof pos === "number") {
                const lc = sourceFile.getLineAndColumnAtPos(pos);
                tline = lc.line;
                tcol = lc.column;
              }
            } catch {}
            const meta = {
              path: path.relative(process.cwd(), sourceFile.getFilePath()),
              kind: "throw",
              ...(typeof tline === "number" ? { line: tline } : {}),
              ...(typeof tcol === "number" ? { column: tcol } : {}),
            };
            let placeholder = toId || `class:${typeName}`;
            try {
              const m = placeholder.match(/^file:(.+?):(.+)$/);
              if (m) {
                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                if (hit) placeholder = hit.id;
              } else if (placeholder.startsWith("class:")) {
                const nm = placeholder.slice("class:".length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) placeholder = list[0].id;
                else if (list.length > 1) {
                  (meta as any).ambiguous = true;
                  (meta as any).candidateCount = list.length;
                }
              }
            } catch {}
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                placeholder,
                RelationshipType.THROWS,
                meta
              )
            );
          } catch {}
        }
      } catch {}

      try {
        // RETURNS_TYPE
        const rt: any = (node as any).getReturnTypeNode?.();
        if (rt && typeof rt.getText === "function") {
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
              } else if (toId.startsWith("external:")) {
                const nm = toId.slice("external:".length);
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
              if (typeof pos === "number") {
                const lc = sourceFile.getLineAndColumnAtPos(pos);
                line = lc.line;
                column = lc.column;
              }
            } catch {}
            const meta: any = {
              inferred: true,
              kind: "type",
              ...(typeof line === "number" ? { line } : {}),
              ...(typeof column === "number" ? { column } : {}),
            };
            try {
              if (toId.startsWith("external:")) {
                const nm = toId.slice("external:".length);
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
            let tname = "";
            try {
              tname = (t?.getSymbol?.()?.getName?.() || "").toString();
            } catch {}
            if (!tname) {
              try {
                tname =
                  typeof t?.getText === "function" ? String(t.getText()) : "";
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
                } else if (toId.startsWith("external:")) {
                  const nm = toId.slice("external:".length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) toId = list[0].id;
                }
              } catch {}
              const meta: any = {
                inferred: true,
                kind: "type",
                usedTypeChecker: true,
                resolution: "type-checker",
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
          const pname: string = p.getName?.() || "";
          if (tn && typeof tn.getText === "function") {
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
                } else if (toId.startsWith("external:")) {
                  const nm = toId.slice("external:".length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) toId = list[0].id;
                }
              } catch {}
              let pline: number | undefined;
              let pcol: number | undefined;
              try {
                const pos = (tn as any).getStart?.();
                if (typeof pos === "number") {
                  const lc = sourceFile.getLineAndColumnAtPos(pos);
                  pline = lc.line;
                  pcol = lc.column;
                }
              } catch {}
              const meta: any = { inferred: true, kind: "type", param: pname };
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.PARAM_TYPE,
                  meta
                )
              );
              const scope = toId.startsWith("external:")
                ? "external"
                : toId.startsWith("file:")
                ? "imported"
                : "local";
              const depConfidence =
                scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
              const depMeta = {
                inferred: true,
                kind: "dependency",
                scope,
                resolution: "type-annotation",
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
              let tname = "";
              try {
                tname = (t?.getSymbol?.()?.getName?.() || "").toString();
              } catch {}
              if (!tname) {
                try {
                  tname =
                    typeof t?.getText === "function" ? String(t.getText()) : "";
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
                  } else if (toId.startsWith("external:")) {
                    const nm = toId.slice("external:".length);
                    const list = this.nameIndex.get(nm) || [];
                    if (list.length === 1) toId = list[0].id;
                  }
                } catch {}
                const meta: any = {
                  inferred: true,
                  kind: "type",
                  param: pname,
                  usedTypeChecker: true,
                  resolution: "type-checker",
                };
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    toId,
                    RelationshipType.PARAM_TYPE,
                    meta
                  )
                );
                const scope = toId.startsWith("external:")
                  ? "external"
                  : toId.startsWith("file:")
                  ? "imported"
                  : "local";
                const depConfidence =
                  scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
                const depMeta = {
                  inferred: true,
                  kind: "dependency",
                  scope,
                  resolution: "type-checker",
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

      // Flush aggregated CALLS for this symbol (if any were recorded)
      if (callAgg.size > 0) {
        for (const [k, v] of callAgg.entries()) {
          const toId = k.split("|")[1];
          const meta = { ...v.meta, occurrencesScan: v.count } as any;
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.CALLS,
              meta
            )
          );
          const refMeta = {
            ...meta,
            kind: "reference",
            via: (meta as any)?.kind || "call",
          } as any;
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.REFERENCES,
              refMeta
            )
          );
          try {
            if ((v.meta as any)?.scope === "imported") {
              const depMeta = {
                scope: "imported",
                resolution: (v.meta as any)?.resolution || "via-import",
                kind: "dependency",
                inferred: true,
                confidence:
                  typeof (v.meta as any)?.confidence === "number"
                    ? (v.meta as any).confidence
                    : 0.6,
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
        callAgg.clear();
      }
    }

    return relationships;
  }

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
  extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: SymbolEntity }>,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];
    const dedupe = new Set<string>();
    // Aggregators to collapse duplicates and record occurrences while keeping earliest location
    const refAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const readAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const writeAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const depAgg = new Map<string, Record<string, any>>();

    const fromFileRel = fileEntity.path;
    const addRel = (
      fromId: string,
      toId: string,
      type: RelationshipType,
      locNode?: Node,
      opts?: {
        usedTypeChecker?: boolean;
        isExported?: boolean;
        nameLength?: number;
        importDepth?: number;
        kindHint?: string;
        operator?: string;
        accessPath?: string;
        resolution?: string;
        scope?: string;
      }
    ) => {
      // Concretize toId using global indexes when possible, before gating/aggregation
      try {
        if (toId && typeof toId === "string") {
          if (toId.startsWith("file:")) {
            const m = toId.match(/^file:(.+?):(.+)$/);
            if (m) {
              const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
              if (hit) toId = hit.id;
            }
          } else if (toId.startsWith("external:")) {
            const nm = toId.slice("external:".length);
            const list = this.nameIndex.get(nm) || [];
            if (list.length === 1) toId = list[0].id;
          } else if (/^(class|interface|function|typeAlias):/.test(toId)) {
            const nm = toId.split(":").slice(1).join(":");
            const list = this.nameIndex.get(nm) || [];
            if (list.length === 1) toId = list[0].id;
          }
        }
      } catch {}

      const key = `${fromId}|${type}|${toId}`;
      // For aggregated types, allow multiple observations to accumulate; otherwise de-duplicate
      const isAggregated =
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.READS ||
        type === RelationshipType.WRITES;
      if (!isAggregated) {
        if (dedupe.has(key)) return;
        dedupe.add(key);
      }
      // Apply simple gating for placeholders referencing common/global names
      const gate = () => {
        try {
          if (toId.startsWith("external:")) {
            const nm = toId.substring("external:".length).toLowerCase();
            if (
              !nm ||
              nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
              this.stopNames.has(nm)
            )
              return false;
          }
          if (toId.startsWith("class:")) {
            const nm = toId.substring("class:".length).toLowerCase();
            if (
              !nm ||
              nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
              this.stopNames.has(nm)
            )
              return false;
          }
        } catch {}
        return true;
      };
      if (!gate()) return;
      // Location info (best-effort)
      let line: number | undefined;
      let column: number | undefined;
      try {
        if (locNode && typeof (locNode as any).getStart === "function") {
          const pos = (locNode as any).getStart();
          const lc = sourceFile.getLineAndColumnAtPos(pos);
          line = lc.line;
          column = lc.column;
        }
      } catch {}

      // Assign confidence for inferred relationships via scorer, and gate low-confidence
      let metadata: Record<string, any> | undefined;
      const isPlaceholder =
        typeof toId === "string" &&
        (toId.startsWith("external:") || toId.startsWith("file:"));
      if (
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.DEPENDS_ON ||
        ((type === RelationshipType.READS ||
          type === RelationshipType.WRITES) &&
          isPlaceholder)
      ) {
        const confidence = scoreInferredEdge({
          relationType: type,
          toId,
          fromFileRel,
          usedTypeChecker: !!opts?.usedTypeChecker,
          isExported: !!opts?.isExported,
          nameLength: opts?.nameLength,
          importDepth: opts?.importDepth,
        });
        // Gate: drop if below threshold to reduce noise
        if (confidence < noiseConfig.MIN_INFERRED_CONFIDENCE) return;
        metadata = { inferred: true, confidence };
      }

      // Attach context metadata for easier downstream UX
      metadata = {
        ...(metadata || {}),
        path: fileEntity.path,
        ...(typeof line === "number" ? { line } : {}),
        ...(typeof column === "number" ? { column } : {}),
        ...(opts?.kindHint ? { kind: opts.kindHint } : {}),
        ...(opts?.operator ? { operator: opts.operator } : {}),
        ...(opts?.accessPath ? { accessPath: opts.accessPath } : {}),
        ...(opts?.resolution ? { resolution: opts.resolution } : {}),
        ...(opts?.scope
          ? { scope: opts.scope }
          : {
              scope: toId.startsWith("external:")
                ? "external"
                : toId.startsWith("file:")
                ? "imported"
                : "unknown",
            }),
      };

      // Enrich metadata with lightweight dataflow grouping for READS/WRITES
      if (type === RelationshipType.READS || type === RelationshipType.WRITES) {
        try {
          const owner = locNode ? enclosingSymbolId(locNode) : fileEntity.id;
          let varName = "";
          if (toId.startsWith("file:")) {
            const parts = toId.split(":");
            varName = parts[parts.length - 1] || "";
          } else if (toId.startsWith("sym:")) {
            const m = toId.match(/^sym:[^#]+#([^@]+)(?:@.+)?$/);
            varName = (m && m[1]) || "";
          } else if (toId.startsWith("external:")) {
            varName = toId.slice("external:".length);
          } else {
            varName = toId;
          }
          const dfBase = `${fileEntity.path}|${owner}|${varName}`;
          const dfId =
            "df_" +
            crypto.createHash("sha1").update(dfBase).digest("hex").slice(0, 12);
          (metadata as any).dataFlowId = dfId;
        } catch {}
      }

      // Aggregate common code edges to reduce noise; non-aggregated types are pushed directly
      const aggKey = `${fromId}|${toId}`;
      if (type === RelationshipType.REFERENCES) {
        const prev = refAgg.get(aggKey);
        if (!prev) refAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }
      if (type === RelationshipType.READS) {
        const prev = readAgg.get(aggKey);
        if (!prev) readAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }
      if (type === RelationshipType.WRITES) {
        const prev = writeAgg.get(aggKey);
        if (!prev) writeAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }

      relationships.push(this.createRelationship(fromId, toId, type, metadata));
    };

    const enclosingSymbolId = (node: Node): string => {
      const owner = node.getFirstAncestor(
        (a) =>
          Node.isFunctionDeclaration(a) ||
          Node.isMethodDeclaration(a) ||
          Node.isClassDeclaration(a) ||
          Node.isInterfaceDeclaration(a) ||
          Node.isTypeAliasDeclaration(a) ||
          Node.isVariableDeclaration(a)
      );
      if (owner) {
        const found = localSymbols.find((ls) => ls.node === owner);
        if (found) return found.entity.id;
      }
      return fileEntity.id;
    };

    const isDeclarationName = (id: Node): boolean => {
      const p = id.getParent();
      if (!p) return false;
      return (
        (Node.isFunctionDeclaration(p) && p.getNameNode() === id) ||
        (Node.isClassDeclaration(p) && p.getNameNode() === id) ||
        (Node.isInterfaceDeclaration(p) && p.getNameNode() === id) ||
        (Node.isTypeAliasDeclaration(p) && p.getNameNode() === id) ||
        (Node.isVariableDeclaration(p) && p.getNameNode() === id) ||
        Node.isImportSpecifier(p) ||
        Node.isImportClause(p) ||
        Node.isNamespaceImport(p)
      );
    };

    // Type dependencies (e.g., Foo<T>, param: Bar) — prefer same-file resolution if possible
    for (const tr of sourceFile.getDescendantsOfKind(
      SyntaxKind.TypeReference
    )) {
      // Dedupe rule: skip TypeReference nodes that are directly the return type of a function/method
      try {
        const fnOwner = tr.getFirstAncestor(
          (a: any) =>
            Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a)
        );
        if (fnOwner) {
          const rtNode: any = (fnOwner as any).getReturnTypeNode?.();
          if (rtNode && rtNode === (tr as any)) continue;
        }
      } catch {}
      // Dedupe rule: skip when it's exactly the type annotation of a parameter
      try {
        const paramOwner = tr.getFirstAncestor(
          (a: any) =>
            (a as any).getTypeNode &&
            (a as any).getName &&
            Node.isParameterDeclaration(a as any)
        );
        if (paramOwner) {
          const tn: any = (paramOwner as any).getTypeNode?.();
          if (tn && tn === (tr as any)) continue;
        }
      } catch {}
      const typeName = tr.getTypeName().getText();
      if (!typeName) continue;
      if (
        this.stopNames.has(typeName.toLowerCase()) ||
        typeName.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;
      const fromId = enclosingSymbolId(tr);
      // Attempt direct same-file resolution via local symbols map
      const key = `${fileEntity.path}:${typeName}`;
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        const nm = (local.entity as any).name || "";
        addRel(fromId, local.entity.id, RelationshipType.TYPE_USES, tr, {
          isExported: !!(local.entity as any).isExported,
          nameLength: typeof nm === "string" ? nm.length : undefined,
          kindHint: "type",
          scope: "local",
          resolution: "direct",
        });
      } else {
        // Use generic external:NAME target; resolver will map to concrete symbol
        addRel(fromId, `external:${typeName}`, RelationshipType.TYPE_USES, tr, {
          nameLength: typeName?.length,
          kindHint: "type",
          scope: "external",
          resolution: "heuristic",
        });
      }
    }

    // Class usage via instantiation: new Foo() -> treat as a reference (prefer same-file)
    for (const nw of sourceFile.getDescendantsOfKind(
      SyntaxKind.NewExpression
    )) {
      const expr = nw.getExpression();
      const nameAll = expr ? expr.getText() : "";
      const name = nameAll ? nameAll.split(".").pop() || "" : "";
      if (!name) continue;
      if (
        this.stopNames.has(name.toLowerCase()) ||
        name.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;
      const fromId = enclosingSymbolId(nw);
      const key = `${fileEntity.path}:${name}`;
      // If constructed class is imported: map to file:<path>:<name> using deep export map
      if (importMap && importMap.has(name)) {
        const deep =
          this.resolveImportedMemberToFileAndName(
            name,
            "default",
            sourceFile,
            importMap,
            importSymbolMap
          ) ||
          this.resolveImportedMemberToFileAndName(
            name,
            name,
            sourceFile,
            importMap,
            importSymbolMap
          );
        const fallbackName = importSymbolMap?.get(name) || name;
        const fr = deep
          ? `file:${deep.fileRel}:${deep.name}`
          : `file:${importMap.get(name)!}:${fallbackName}`;
        addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
          nameLength: name?.length,
          importDepth: deep?.depth,
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "imported",
          resolution: deep ? "via-import" : "heuristic",
        });
        continue;
      }
      // Namespace alias new Foo.Bar(): prefer mapping using root alias
      if (importMap && nameAll && nameAll.includes(".")) {
        const root = nameAll.split(".")[0];
        if (importMap.has(root)) {
          const deep = this.resolveImportedMemberToFileAndName(
            root,
            name,
            sourceFile,
            importMap,
            importSymbolMap
          );
          const fallbackName = importSymbolMap?.get(root) || name;
          const fr = deep
            ? `file:${deep.fileRel}:${deep.name}`
            : `file:${importMap.get(root)!}:${fallbackName}`;
          addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
            nameLength: name?.length,
            importDepth: deep?.depth,
            kindHint: "instantiation",
            accessPath: nameAll,
            scope: "imported",
            resolution: deep ? "via-import" : "heuristic",
          });
          continue;
        }
      }
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        addRel(fromId, local.entity.id, RelationshipType.REFERENCES, nw, {
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "local",
          resolution: "direct",
        });
      } else {
        addRel(fromId, `class:${name}`, RelationshipType.REFERENCES, nw, {
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "unknown",
          resolution: "heuristic",
        });
      }
    }

    // General identifier references (non-call, non-declaration names) — prefer same-file
    for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const text = id.getText();
      if (!text) continue;
      if (
        this.stopNames.has(text.toLowerCase()) ||
        text.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;

      // Skip if this identifier is part of a call expression callee; CALLS handled elsewhere
      const parent = id.getParent();
      if (
        parent &&
        Node.isCallExpression(parent) &&
        parent.getExpression() === id
      ) {
        continue;
      }
      if (isDeclarationName(id)) continue;

      // Skip import/export specifiers (already captured as IMPORTS/EXPORTS)
      if (
        parent &&
        (Node.isImportSpecifier(parent) ||
          Node.isImportClause(parent) ||
          Node.isNamespaceImport(parent))
      ) {
        continue;
      }

      const fromId = enclosingSymbolId(id);
      // Imported binding -> cross-file placeholder with deep export resolution
      if (importMap && importMap.has(text)) {
        const deep =
          this.resolveImportedMemberToFileAndName(
            text,
            "default",
            sourceFile,
            importMap,
            importSymbolMap
          ) ||
          this.resolveImportedMemberToFileAndName(
            text,
            text,
            sourceFile,
            importMap,
            importSymbolMap
          );
        const fallbackName = importSymbolMap?.get(text) || text;
        const fr = deep
          ? `file:${deep.fileRel}:${deep.name}`
          : `file:${importMap.get(text)!}:${fallbackName}`;
        addRel(fromId, fr, RelationshipType.REFERENCES, id, {
          nameLength: (text || "").length,
          importDepth: deep?.depth,
          kindHint: "identifier",
          scope: "imported",
          resolution: deep ? "via-import" : "heuristic",
        });
        continue;
      }
      const key = `${fileEntity.path}:${text}`;
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        const nm = (local.entity as any).name || "";
        addRel(fromId, local.entity.id, RelationshipType.REFERENCES, id, {
          isExported: !!(local.entity as any).isExported,
          nameLength: typeof nm === "string" ? nm.length : undefined,
          kindHint: "identifier",
          scope: "local",
          resolution: "direct",
        });
      } else {
        // Try type-checker-based resolution to concrete file target
        const tc = this.resolveWithTypeChecker(id, sourceFile);
        if (tc) {
          addRel(
            fromId,
            `file:${tc.fileRel}:${tc.name}`,
            RelationshipType.REFERENCES,
            id,
            {
              usedTypeChecker: true,
              nameLength: (tc.name || "").length,
              kindHint: "identifier",
              scope: "imported",
              resolution: "type-checker",
            }
          );
        } else {
          addRel(fromId, `external:${text}`, RelationshipType.REFERENCES, id, {
            nameLength: (text || "").length,
            kindHint: "identifier",
            scope: "external",
            resolution: "heuristic",
          });
        }
      }
    }

    // READS/WRITES: analyze assignment expressions in a lightweight way
    try {
      const assignOps = new Set<string>([
        "=",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "<<=",
        ">>=",
        ">>>=",
        "&=",
        "|=",
        "^=",
      ]);
      const bins = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression);
      for (const be of bins) {
        try {
          const op = (be as any).getOperatorToken?.()?.getText?.() || "";
          if (!assignOps.has(op)) continue;
          const lhs: any = (be as any).getLeft?.();
          const rhs: any = (be as any).getRight?.();
          const fromId = enclosingSymbolId(be);
          // Resolve LHS identifier writes: prefer local symbol or file-qualified symbol, do NOT use RHS type
          const resolveNameToId = (nm: string): string | null => {
            if (!nm) return null;
            if (importMap && importMap.has(nm)) {
              const deep =
                this.resolveImportedMemberToFileAndName(
                  nm,
                  nm,
                  sourceFile,
                  importMap,
                  importSymbolMap
                ) || null;
              const fallbackName = importSymbolMap?.get(nm) || nm;
              return deep
                ? `file:${deep.fileRel}:${deep.name}`
                : `file:${importMap.get(nm)!}:${fallbackName}`;
            }
            const key = `${fileEntity.path}:${nm}`;
            const local = localSymbols.find(
              (ls) => (ls.entity as any).path === key
            );
            if (local) return local.entity.id;
            // try best-effort type checker on LHS identifier itself
            try {
              if (this.takeTcBudget()) {
                const tc = this.resolveWithTypeChecker(lhs as any, sourceFile);
                if (tc) return `file:${tc.fileRel}:${tc.name}`;
              }
            } catch {}
            return `external:${nm}`;
          };

          // WRITES edge for simple identifier or property LHS
          if (lhs && typeof lhs.getText === "function") {
            const ltxt = lhs.getText();
            if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ltxt)) {
              const tid = resolveNameToId(ltxt);
              addRel(fromId, tid!, RelationshipType.WRITES, lhs, {
                kindHint: "write",
                operator: op,
              });
            } else {
              // Property writes like obj.prop = value
              try {
                const hasName =
                  (lhs as any).getName &&
                  typeof (lhs as any).getName === "function";
                const getExpr =
                  (lhs as any).getExpression &&
                  typeof (lhs as any).getExpression === "function"
                    ? (lhs as any).getExpression.bind(lhs)
                    : null;
                const prop = hasName ? (lhs as any).getName() : undefined;
                const baseExpr: any = getExpr ? getExpr() : null;
                const baseText =
                  baseExpr && typeof baseExpr.getText === "function"
                    ? baseExpr.getText()
                    : "";
                const accessPath = ltxt;

                let wrote = false;
                let toIdProp: string | null = null;
                // 1) Try type-checker to resolve the property symbol directly
                try {
                  if (this.takeTcBudget()) {
                    const tc = this.resolveWithTypeChecker(
                      lhs as any,
                      sourceFile
                    );
                    if (tc && tc.fileRel && tc.name) {
                      toIdProp = `file:${tc.fileRel}:${tc.name}`;
                      addRel(fromId, toIdProp, RelationshipType.WRITES, lhs, {
                        kindHint: "write",
                        operator: op,
                        accessPath,
                        usedTypeChecker: true,
                        resolution: "type-checker",
                        scope: "imported",
                      });
                      wrote = true;
                    }
                  }
                } catch {}

                // 2) Try import map for namespace/member: alias.prop
                if (
                  !wrote &&
                  importMap &&
                  prop &&
                  baseText &&
                  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)
                ) {
                  try {
                    if (importMap.has(baseText)) {
                      const deep = this.resolveImportedMemberToFileAndName(
                        baseText,
                        prop,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      );
                      if (deep) {
                        toIdProp = `file:${deep.fileRel}:${deep.name}`;
                        addRel(fromId, toIdProp, RelationshipType.WRITES, lhs, {
                          kindHint: "write",
                          operator: op,
                          accessPath,
                          importDepth: deep.depth,
                          resolution: "via-import",
                          scope: "imported",
                        });
                        wrote = true;
                      }
                    }
                  } catch {}
                }

                // 3) Prefer same-file symbol with matching property name as fallback
                if (!wrote && prop) {
                  try {
                    const sfRel = fileEntity.path; // relative file path
                    const list = this.nameIndex.get(prop) || [];
                    const sameFile = list.filter((s) => {
                      const p = (s as any).path as string | undefined;
                      return typeof p === "string" && p.startsWith(`${sfRel}:`);
                    });
                    if (sameFile.length === 1) {
                      addRel(
                        fromId,
                        sameFile[0].id,
                        RelationshipType.WRITES,
                        lhs,
                        {
                          kindHint: "write",
                          operator: op,
                          accessPath,
                          scope: "local",
                          resolution: "direct",
                        }
                      );
                      wrote = true;
                    } else if (sameFile.length > 1) {
                      // Ambiguous: record as external placeholder with ambiguity info
                      const meta: any = {
                        kind: "write",
                        operator: op,
                        accessPath,
                        ambiguous: true,
                        candidateCount: sameFile.length,
                        scope: "local",
                        resolution: "heuristic",
                      };
                      addRel(
                        fromId,
                        `external:${prop}`,
                        RelationshipType.WRITES,
                        lhs,
                        meta
                      );
                      wrote = true;
                    }
                  } catch {}
                }

                // 4) Fallback to external:prop if nothing else resolved
                if (!wrote && prop) {
                  addRel(
                    fromId,
                    `external:${prop}`,
                    RelationshipType.WRITES,
                    lhs,
                    {
                      kindHint: "write",
                      operator: op,
                      accessPath,
                      scope: "external",
                      resolution: "heuristic",
                    }
                  );
                  wrote = true;
                }
              } catch {}
              // Destructuring assignment writes: ({a} = rhs) or ([x] = rhs)
              try {
                const kind = (lhs as any).getKind && (lhs as any).getKind();
                if (kind === SyntaxKind.ObjectLiteralExpression) {
                  const props: any[] = (lhs as any).getProperties?.() || [];
                  for (const pr of props) {
                    try {
                      const nm =
                        typeof pr.getName === "function"
                          ? pr.getName()
                          : undefined;
                      if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                        const tid = resolveNameToId(nm);
                        addRel(
                          fromId,
                          tid!,
                          RelationshipType.WRITES,
                          pr as any,
                          { kindHint: "write", operator: op }
                        );
                      }
                    } catch {}
                  }
                } else if (kind === SyntaxKind.ArrayLiteralExpression) {
                  const elems: any[] = (lhs as any).getElements?.() || [];
                  for (const el of elems) {
                    try {
                      const nm =
                        typeof el.getText === "function" ? el.getText() : "";
                      if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                        const tid = resolveNameToId(nm);
                        addRel(
                          fromId,
                          tid!,
                          RelationshipType.WRITES,
                          el as any,
                          { kindHint: "write", operator: op }
                        );
                      }
                    } catch {}
                  }
                }
              } catch {}
            }
          }

          // READS: collect identifiers from RHS (basic)
          if (rhs && typeof rhs.getDescendantsOfKind === "function") {
            const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
            for (const idn of ids) {
              const t = idn.getText();
              if (!t || isDeclarationName(idn)) continue;
              const key = `${fileEntity.path}:${t}`;
              const local = localSymbols.find(
                (ls) => (ls.entity as any).path === key
              );
              // detect access path if part of a property access
              let accessPath: string | undefined;
              try {
                const parent: any = (idn as any).getParent?.();
                if (
                  parent &&
                  typeof parent.getKind === "function" &&
                  parent.getKind() === SyntaxKind.PropertyAccessExpression &&
                  typeof parent.getText === "function"
                ) {
                  accessPath = parent.getText();
                }
              } catch {}
              if (local) {
                addRel(fromId, local.entity.id, RelationshipType.READS, idn, {
                  kindHint: "read",
                  accessPath,
                  scope: "local",
                  resolution: "direct",
                });
              } else if (importMap && importMap.has(t)) {
                const deep = this.resolveImportedMemberToFileAndName(
                  t,
                  t,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
                const fallbackName = importSymbolMap?.get(t) || t;
                const fr = deep
                  ? `file:${deep.fileRel}:${deep.name}`
                  : `file:${importMap.get(t)!}:${fallbackName}`;
                addRel(fromId, fr, RelationshipType.READS, idn, {
                  kindHint: "read",
                  importDepth: deep?.depth,
                  accessPath,
                  scope: "imported",
                  resolution: deep ? "via-import" : "heuristic",
                });
              } else {
                if (this.takeTcBudget()) {
                  const tc = this.resolveWithTypeChecker(idn, sourceFile);
                  if (tc)
                    addRel(
                      fromId,
                      `file:${tc.fileRel}:${tc.name}`,
                      RelationshipType.READS,
                      idn,
                      {
                        usedTypeChecker: true,
                        kindHint: "read",
                        accessPath,
                        scope: "imported",
                        resolution: "type-checker",
                      }
                    );
                } else
                  addRel(fromId, `external:${t}`, RelationshipType.READS, idn, {
                    kindHint: "read",
                    accessPath,
                    scope: "external",
                    resolution: "heuristic",
                  });
              }
            }

            // READS: property accesses on RHS (e.g., foo.bar)
            try {
              const props =
                rhs.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression) ||
                [];
              const seen = new Set<string>();
              for (const pa of props) {
                try {
                  const accessPath =
                    typeof (pa as any).getText === "function"
                      ? (pa as any).getText()
                      : undefined;
                  const propName =
                    typeof (pa as any).getName === "function"
                      ? (pa as any).getName()
                      : undefined;
                  const baseExpr: any =
                    typeof (pa as any).getExpression === "function"
                      ? (pa as any).getExpression()
                      : null;
                  const baseText =
                    baseExpr && typeof baseExpr.getText === "function"
                      ? baseExpr.getText()
                      : "";
                  if (!propName) continue;
                  const key = `${propName}|${accessPath || ""}`;
                  if (seen.has(key)) continue;
                  seen.add(key);

                  let toIdProp: string | null = null;
                  // 1) Type-checker resolution of the property
                  try {
                    if (this.takeTcBudget()) {
                      const tc = this.resolveWithTypeChecker(
                        pa as any,
                        sourceFile
                      );
                      if (tc && tc.fileRel && tc.name) {
                        toIdProp = `file:${tc.fileRel}:${tc.name}`;
                        addRel(
                          fromId,
                          toIdProp,
                          RelationshipType.READS,
                          pa as any,
                          {
                            kindHint: "read",
                            accessPath,
                            usedTypeChecker: true,
                            resolution: "type-checker",
                            scope: "imported",
                          }
                        );
                        continue;
                      }
                    }
                  } catch {}

                  // 2) Import alias deep resolution for alias.prop
                  if (
                    importMap &&
                    baseText &&
                    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText) &&
                    importMap.has(baseText)
                  ) {
                    const deep = this.resolveImportedMemberToFileAndName(
                      baseText,
                      propName,
                      sourceFile,
                      importMap,
                      importSymbolMap
                    );
                    if (deep) {
                      toIdProp = `file:${deep.fileRel}:${deep.name}`;
                      addRel(
                        fromId,
                        toIdProp,
                        RelationshipType.READS,
                        pa as any,
                        {
                          kindHint: "read",
                          accessPath,
                          importDepth: deep.depth,
                          resolution: "via-import",
                          scope: "imported",
                        }
                      );
                      continue;
                    }
                  }

                  // 3) Same-file symbol fallback by name
                  try {
                    const sfRel = fileEntity.path;
                    const list = this.nameIndex.get(propName) || [];
                    const sameFile = list.filter((s) => {
                      const p = (s as any).path as string | undefined;
                      return typeof p === "string" && p.startsWith(`${sfRel}:`);
                    });
                    if (sameFile.length === 1) {
                      addRel(
                        fromId,
                        sameFile[0].id,
                        RelationshipType.READS,
                        pa as any,
                        {
                          kindHint: "read",
                          accessPath,
                          scope: "local",
                          resolution: "direct",
                        }
                      );
                      continue;
                    } else if (sameFile.length > 1) {
                      const meta: any = {
                        kind: "read",
                        accessPath,
                        ambiguous: true,
                        candidateCount: sameFile.length,
                        scope: "local",
                        resolution: "heuristic",
                      };
                      addRel(
                        fromId,
                        `external:${propName}`,
                        RelationshipType.READS,
                        pa as any,
                        meta
                      );
                      continue;
                    }
                  } catch {}

                  // 4) Fallback external
                  addRel(
                    fromId,
                    `external:${propName}`,
                    RelationshipType.READS,
                    pa as any,
                    {
                      kindHint: "read",
                      accessPath,
                      scope: "external",
                      resolution: "heuristic",
                    }
                  );
                } catch {}
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}

    // Flush aggregations into final relationships with occurrences metadata
    if (refAgg.size > 0) {
      for (const [k, v] of refAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(
            fromId,
            toId,
            RelationshipType.REFERENCES,
            meta
          )
        );
      }
      refAgg.clear();
    }
    if (readAgg.size > 0) {
      for (const [k, v] of readAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(fromId, toId, RelationshipType.READS, meta)
        );
      }
      readAgg.clear();
    }
    if (writeAgg.size > 0) {
      for (const [k, v] of writeAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(fromId, toId, RelationshipType.WRITES, meta)
        );
      }
      writeAgg.clear();
    }

    // Emit symbol-level dependencies for imported reference targets
    if (depAgg.size > 0) {
      for (const [k, meta] of depAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const depMeta = {
          ...(meta || {}),
          scope: meta?.scope || "imported",
          resolution: meta?.resolution || "via-import",
          kind: "dependency", // Always set kind to 'dependency' for aggregated dependencies
          inferred: (meta?.inferred ?? true) as boolean,
        } as any;
        if (typeof depMeta.confidence !== "number") {
          // Calculate confidence for aggregated dependencies
          depMeta.confidence = scoreInferredEdge({
            relationType: RelationshipType.DEPENDS_ON,
            toId,
            fromFileRel: this.normalizeRelPath(
              path.dirname(fromId.split(":")[1] || "")
            ),
          });
        }
        relationships.push(
          this.createRelationship(
            fromId,
            toId,
            RelationshipType.DEPENDS_ON,
            depMeta
          )
        );
      }
    }

    return relationships;
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
   *
   * @param fromId - Source entity ID
   * @param toId - Target entity ID
   * @param type - Relationship type
   * @param metadata - Optional metadata
   * @returns Normalized GraphRelationship
   */
  createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {
    // Ensure a sensible default for code-edge source to aid querying
    try {
      if (metadata && (metadata as any).source == null) {
        const md: any = metadata as any;
        if (md.usedTypeChecker === true || md.resolution === "type-checker")
          md.source = "type-checker";
        else md.source = "ast";
      }
    } catch {}
    // Deterministic relationship id using canonical target key for stable identity across resolutions
    const rid = canonicalRelationshipId(fromId, {
      toEntityId: toId,
      type,
    } as any);
    const rel: any = {
      id: rid,
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };

    // Minimal: rely on normalizeCodeEdge to hoist metadata and build evidence

    // Attach a structured toRef for placeholders to aid later resolution
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
        } else if (t.startsWith("external:")) {
          // external:<name> -> external
          (rel as any).toRef = {
            kind: "external",
            name: t.slice("external:".length),
          };
        } else if (/^(class|interface|function|typeAlias):/.test(t)) {
          // kind-qualified placeholder without file: treat as external-like symbolic ref
          const parts = t.split(":");
          (rel as any).toRef = {
            kind: "external",
            name: parts.slice(1).join(":"),
          };
        }
        // For sym:/file: IDs, check if they can be parsed as file symbols
        else if (/^(sym:|file:)/.test(t)) {
          // Check if sym: can be parsed
          const isParsableSym =
            t.startsWith("sym:") && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
          const isParsableFile =
            t.startsWith("file:") && /^file:(.+?):(.+)$/.test(t);
          if (!isParsableSym && !isParsableFile) {
            (rel as any).toRef = { kind: "entity", id: t };
          }
        }
      }
    } catch {}

    // Attach a basic fromRef to aid coordinator context (file resolution, etc.)
    try {
      if (!(rel as any).fromRef) {
        // We don't attempt to decode file/symbol here; coordinator can fetch entity by id
        (rel as any).fromRef = { kind: "entity", id: fromId };
      }
    } catch {}

    // Normalize code-edge evidence and fields consistently
    return normalizeCodeEdge(rel as GraphRelationship);
  }
}