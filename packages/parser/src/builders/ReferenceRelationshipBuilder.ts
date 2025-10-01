/**
 * ReferenceRelationshipBuilder - Handles reference relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles REFERENCES, READS, WRITES, DEPENDS_ON relationships for general references
 * and dataflow analysis.
 */

import { Node, SourceFile, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as crypto from "crypto";
import {
  File,
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";
import { ReferenceRelationshipBuilderOptions } from "@memento/shared-types";
import { scoreInferredEdge, noiseConfig } from "@memento/core";

/**
 * ReferenceRelationshipBuilder handles the extraction of reference relationships
 * including general references, reads, writes, and dependencies.
 */
export class ReferenceRelationshipBuilder {
  private globalSymbolIndex: Map<string, any>;
  private nameIndex: Map<string, any[]>;
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

  constructor(options: ReferenceRelationshipBuilderOptions) {
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
   * Extracts reference relationships using TypeScript AST with best-effort resolution.
   * Analyzes identifiers, type references, instantiations, and read/write operations.
   */
  extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: any }>,
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
      } catch (e) { /* intentional no-op: non-critical */ void 0; }

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
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
      } catch (e) { /* intentional no-op: non-critical */ void 0; }

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
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
            } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
                } catch (e) { /* intentional no-op: non-critical */ void 0; }

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
                  } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
                  } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
              } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
                    } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
                    } catch (e) { /* intentional no-op: non-critical */ void 0; }
                  }
                }
              } catch (e) { /* intentional no-op: non-critical */ void 0; }
            }
          }

          // READS: collect identifiers from RHS (basic)
          if (rhs && typeof rhs.getDescendantsOfKind === "function") {
            const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
            for (const idn of ids) {
              const t = idn.getText();
              if (!t) continue;
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
              } catch (e) { /* intentional no-op: non-critical */ void 0; }
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
                  } catch (e) { /* intentional no-op: non-critical */ void 0; }

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
                  } catch (e) { /* intentional no-op: non-critical */ void 0; }

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
                } catch (e) { /* intentional no-op: non-critical */ void 0; }
              }
            } catch (e) { /* intentional no-op: non-critical */ void 0; }
          }
        } catch (e) { /* intentional no-op: non-critical */ void 0; }
      }
    } catch (e) { /* intentional no-op: non-critical */ void 0; }

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

  private normalizeRelPath(p: string): string {
    return path.relative(process.cwd(), p);
  }
}
