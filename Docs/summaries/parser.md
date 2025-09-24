# Package: parser
Generated: 2025-09-23 07:07:41 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 234 | ⚠️ |
| Critical Issues | 0 | ✅ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 64 | 🚨 |
| Antipatterns | 0 | ✅ |

### Notable Issues

#### 🚨 Potential Deception (64)
Functions that don't do what their names suggest, or claim functionality they don't have:

- `CallRelationshipBuilder.ts:179` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:205` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:210` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:231` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:258` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:289` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:406` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:438` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:553` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:595` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:613` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:643` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:692` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:697` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:741` - **Error silently swallowed - no error handling or logging**
- `CallRelationshipBuilder.ts:756` - **Error silently swallowed - no error handling or logging**
- `ImportExportBuilder.ts:174` - **Error silently swallowed - no error handling or logging**
- `ImportExportBuilder.ts:246` - **Error silently swallowed - no error handling or logging**
- `ImportExportBuilder.ts:269` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:126` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:158` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:184` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:242` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:278` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:296` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:314` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:532` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:549` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:578` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:598` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:618` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:647` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:674` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:738` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:743` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:763` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:795` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:860` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:866` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:890` - **Error silently swallowed - no error handling or logging**
- `ReferenceRelationshipBuilder.ts:950` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:166` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:218` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:262` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:308` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:358` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:362` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:379` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:405` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:448` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:465` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:481` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:495` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:516` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:520` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:524` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:542` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:572` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:592` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:605` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:648` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:651` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:655` - **Error silently swallowed - no error handling or logging**
- `TypeRelationshipBuilder.ts:673` - **Error silently swallowed - no error handling or logging**

#### ⚠️ Warnings (64)
Issues that should be addressed but aren't critical:

- `CallRelationshipBuilder.ts:179` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:205` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:210` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:231` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:258` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:289` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:406` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:438` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:553` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:595` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:613` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:643` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:692` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:697` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:741` - Error silently swallowed - no error handling or logging
- `CallRelationshipBuilder.ts:756` - Error silently swallowed - no error handling or logging
- `ImportExportBuilder.ts:174` - Error silently swallowed - no error handling or logging
- `ImportExportBuilder.ts:246` - Error silently swallowed - no error handling or logging
- `ImportExportBuilder.ts:269` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:126` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:158` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:184` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:242` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:278` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:296` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:314` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:532` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:549` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:578` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:598` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:618` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:647` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:674` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:738` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:743` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:763` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:795` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:860` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:866` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:890` - Error silently swallowed - no error handling or logging
- `ReferenceRelationshipBuilder.ts:950` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:166` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:218` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:262` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:308` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:358` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:362` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:379` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:405` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:448` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:465` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:481` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:495` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:516` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:520` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:524` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:542` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:572` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:592` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:605` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:648` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:651` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:655` - Error silently swallowed - no error handling or logging
- `TypeRelationshipBuilder.ts:673` - Error silently swallowed - no error handling or logging

#### ℹ️ Informational
170 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
builders/
  CallRelationshipBuilder.ts
  ImportExportBuilder.ts
  index.ts
  ReferenceRelationshipBuilder.ts
  TypeRelationshipBuilder.ts
index.ts

================================================================
Files
================================================================

================
File: builders/CallRelationshipBuilder.ts
================
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
import { scoreInferredEdge, noiseConfig } from "@memento/core";

export interface RelationshipBuilderOptions {
  tsProject: any;
  globalSymbolIndex: Map<string, SymbolEntity>;
  nameIndex: Map<string, SymbolEntity[]>;
  stopNames: Set<string>;
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
  normalizeRelPath: (p: string) => string;
  createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;
}





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












  extractCallRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];


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




  private extractFunctionCalls(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

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


        let resHint: string | undefined;
        let scopeHint: string | undefined;
        const baseMeta: Record<string, any> = {};


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



        try {
          if (toId) {

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

        }
      } catch {


      }
    }


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

================
File: builders/ImportExportBuilder.ts
================
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





export class ImportExportBuilder {
  private getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;

  constructor(options: ImportExportBuilderOptions) {
    this.getModuleExportMap = options.getModuleExportMap;
  }











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


      const def = importDecl.getDefaultImport();
      if (def) {
        const alias = def.getText();
        if (alias) {
          const target = importMap?.get(alias);
          if (target) {

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




  private createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {


    const rel: any = {
      id: `${fromId}|${type}|${toId}`,
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };


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

          (rel as any).toRef = {
            kind: "external",
            name: t.slice("import:".length),
          };
        }
      }
    } catch {}


    try {
      if (!(rel as any).fromRef) {
        (rel as any).fromRef = { kind: "entity", id: fromId };
      }
    } catch {}

    return rel as GraphRelationship;
  }
}

================
File: builders/index.ts
================
export * from './CallRelationshipBuilder.js';
export * from './ImportExportBuilder.js';
export * from './ReferenceRelationshipBuilder.js';
export * from './TypeRelationshipBuilder.js';

================
File: builders/ReferenceRelationshipBuilder.ts
================
import { Node, SourceFile, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as crypto from "crypto";
import {
  File,
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";
import { scoreInferredEdge, noiseConfig } from "@memento/core";

export interface ReferenceRelationshipBuilderOptions {
  globalSymbolIndex: Map<string, any>;
  nameIndex: Map<string, any[]>;
  stopNames: Set<string>;
  shouldUseTypeChecker: (context: any) => boolean;
  takeTcBudget: () => boolean;
  resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;
}





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





  extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: any }>,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];
    const dedupe = new Set<string>();


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

      const isAggregated =
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.READS ||
        type === RelationshipType.WRITES;
      if (!isAggregated) {
        if (dedupe.has(key)) return;
        dedupe.add(key);
      }

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

        if (confidence < noiseConfig.MIN_INFERRED_CONFIDENCE) return;
        metadata = { inferred: true, confidence };
      }


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


    for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const text = id.getText();
      if (!text) continue;
      if (
        this.stopNames.has(text.toLowerCase()) ||
        text.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;


      const parent = id.getParent();
      if (
        parent &&
        Node.isCallExpression(parent) &&
        parent.getExpression() === id
      ) {
        continue;
      }


      if (
        parent &&
        (Node.isImportSpecifier(parent) ||
          Node.isImportClause(parent) ||
          Node.isNamespaceImport(parent))
      ) {
        continue;
      }

      const fromId = enclosingSymbolId(id);

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


                if (!wrote && prop) {
                  try {
                    const sfRel = fileEntity.path;
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


          if (rhs && typeof rhs.getDescendantsOfKind === "function") {
            const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
            for (const idn of ids) {
              const t = idn.getText();
              if (!t) continue;
              const key = `${fileEntity.path}:${t}`;
              const local = localSymbols.find(
                (ls) => (ls.entity as any).path === key
              );

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


    if (depAgg.size > 0) {
      for (const [k, meta] of depAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const depMeta = {
          ...(meta || {}),
          scope: meta?.scope || "imported",
          resolution: meta?.resolution || "via-import",
          kind: "dependency",
          inferred: (meta?.inferred ?? true) as boolean,
        } as any;
        if (typeof depMeta.confidence !== "number") {

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

================
File: builders/TypeRelationshipBuilder.ts
================
import { Node, SourceFile, SyntaxKind } from "ts-morph";
import * as path from "path";
import {
  Symbol as SymbolEntity,
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";
import { noiseConfig } from "@memento/core";

export interface TypeRelationshipBuilderOptions {
  globalSymbolIndex: Map<string, SymbolEntity>;
  nameIndex: Map<string, SymbolEntity[]>;
  stopNames: Set<string>;
  shouldUseTypeChecker: (context: any) => boolean;
  takeTcBudget: () => boolean;
  resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  createRelationship: (
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ) => GraphRelationship;
}





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












  extractTypeRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>,
    localIndex?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];


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


    relationships.push(
      ...this.extractDecorators(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap
      )
    );


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
                  nameLength: String(type.getText?.() || "").length,
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
            let toId = localIndex?.get(key);
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
          let accessPath = "";
          let simpleName = "";
          if (expr && typeof expr.getText === "function") {
            accessPath = String(expr.getText());
            const base = accessPath.split("(")[0];
            simpleName = (base.split(".").pop() || base).trim();
          }
          if (!simpleName) continue;
          if (
            this.stopNames?.has(simpleName.toLowerCase()) ||
            simpleName.length < noiseConfig.AST_MIN_NAME_LENGTH
          )
            continue;
          let toId: string | null = null;

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

          if (!toId && importMap) {
            const root = accessPath.split(/[.(]/)[0];
            const target = root && importMap.get(root);
            if (target) toId = `file:${target}:${simpleName}`;
          }
          if (!toId) {
            toId = `external:${simpleName}`;
          }

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

    return relationships;
  }




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

        try {
          const t = (node as any).getReturnType?.();

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

    return relationships;
  }
}

================
File: index.ts
================
export * from './builders/CallRelationshipBuilder.js';
export * from './builders/ImportExportBuilder.js';
export * from './builders/ReferenceRelationshipBuilder.js';
export * from './builders/TypeRelationshipBuilder.js';



================================================================
End of Codebase
================================================================
