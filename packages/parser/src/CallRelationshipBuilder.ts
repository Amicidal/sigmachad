/**
 * CallRelationshipBuilder - Handles function/method calls, method overrides, and throws relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles CALLS, OVERRIDES, and THROWS relationship types with confidence scoring
 * and evidence collection.
 */

import { Node, SourceFile, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as crypto from "crypto";
import {
  Entity,
  File,
  Symbol as SymbolEntity,
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";
import { RelationshipBuilderOptions } from "@memento/shared-types";
import { scoreInferredEdge, noiseConfig } from "@memento/core";
  resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  normalizeRelPath: (p: string) => string;
  createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;
}

/**
 * CallRelationshipBuilder handles the extraction of call-related relationships
 * including function/method calls, method overrides, and exception throwing.
 */
export class CallRelationshipBuilder {
  private tsProject: any;
  private globalSymbolIndex: Map<string, SymbolEntity>;
  private nameIndex: Map<string, SymbolEntity[]>;
  private stopNames: Set<string>;
  private shouldUseTypeChecker: (context: any) => boolean;
  private takeTcBudget: () => boolean;
  private resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  private resolveCallTargetWithChecker: (
    call: any,
    sourceFile: SourceFile
  ) => any;
  private resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  private normalizeRelPath: (p: string) => string;
  private createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;

  constructor(options: RelationshipBuilderOptions) {
    this.tsProject = options.tsProject;
    this.globalSymbolIndex = options.globalSymbolIndex;
    this.nameIndex = options.nameIndex;
    this.stopNames = options.stopNames;
    this.shouldUseTypeChecker = options.shouldUseTypeChecker;
    this.takeTcBudget = options.takeTcBudget;
    this.resolveWithTypeChecker = options.resolveWithTypeChecker;
    this.resolveCallTargetWithChecker = options.resolveCallTargetWithChecker;
    this.resolveImportedMemberToFileAndName =
      options.resolveImportedMemberToFileAndName;
    this.normalizeRelPath = options.normalizeRelPath;
    this.createRelationship = options.createRelationship;
  }

  /**
   * Extracts call-related relationships including calls, overrides, and throws.
   *
   * @param node - The AST node to analyze
   * @param symbolEntity - The symbol entity this node represents
   * @param sourceFile - The source file containing the node
   * @param importMap - Map of import aliases to file paths
   * @param importSymbolMap - Map of import aliases to symbol names
   * @param localIndex - Map of local symbol keys to entity IDs
   * @returns Array of extracted relationships
   */
  extractCallRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    // Extract function calls
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      relationships.push(
        ...this.extractFunctionCalls(
          node,
          symbolEntity,
          sourceFile,
          importMap,
          importSymbolMap,
          localIndex
        )
      );
    }

    // Extract method-level semantics: OVERRIDES, THROWS
    if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
      relationships.push(
        ...this.extractMethodOverrides(
          node,
          symbolEntity,
          sourceFile,
          importMap,
          importSymbolMap,
          localIndex
        )
      );
      relationships.push(
        ...this.extractThrows(
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
   * Extracts function and method call relationships.
   */
  private extractFunctionCalls(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];
    // Aggregate repeated CALLS per target for this symbol
    const callAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();

    const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
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
                if (localIndex && localIndex.has(keyBase)) {
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
        if (localIndex && localIndex.has(key)) {
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

    return relationships;
  }

  /**
   * Extracts method override relationships.
   */
  private extractMethodOverrides(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

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

    return relationships;
  }

  /**
   * Extracts throw statement relationships.
   */
  private extractThrows(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

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
            const candidate = localIndex && localIndex.get(key);
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

    return relationships;
  }
}
