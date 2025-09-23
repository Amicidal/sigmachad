/**
 * ReferenceRelationshipBuilder - Handles reference relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles REFERENCES, READS, WRITES, DEPENDS_ON relationships for general references
 * and dataflow analysis.
 */
import { Node, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as crypto from "crypto";
import { RelationshipType, } from "../../models/relationships.js";
import { scoreInferredEdge } from "../../utils/confidence.js";
import { noiseConfig } from "../../config/noise.js";
/**
 * ReferenceRelationshipBuilder handles the extraction of reference relationships
 * including general references, reads, writes, and dependencies.
 */
export class ReferenceRelationshipBuilder {
    constructor(options) {
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
    extractReferenceRelationships(sourceFile, fileEntity, localSymbols, importMap, importSymbolMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const relationships = [];
        const dedupe = new Set();
        // Aggregators to collapse duplicates and record occurrences while keeping earliest location
        const refAgg = new Map();
        const readAgg = new Map();
        const writeAgg = new Map();
        const depAgg = new Map();
        const fromFileRel = fileEntity.path;
        const addRel = (fromId, toId, type, locNode, opts) => {
            // Concretize toId using global indexes when possible, before gating/aggregation
            try {
                if (toId && typeof toId === "string") {
                    if (toId.startsWith("file:")) {
                        const m = toId.match(/^file:(.+?):(.+)$/);
                        if (m) {
                            const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                            if (hit)
                                toId = hit.id;
                        }
                    }
                    else if (toId.startsWith("external:")) {
                        const nm = toId.slice("external:".length);
                        const list = this.nameIndex.get(nm) || [];
                        if (list.length === 1)
                            toId = list[0].id;
                    }
                    else if (/^(class|interface|function|typeAlias):/.test(toId)) {
                        const nm = toId.split(":").slice(1).join(":");
                        const list = this.nameIndex.get(nm) || [];
                        if (list.length === 1)
                            toId = list[0].id;
                    }
                }
            }
            catch (_a) { }
            const key = `${fromId}|${type}|${toId}`;
            // For aggregated types, allow multiple observations to accumulate; otherwise de-duplicate
            const isAggregated = type === RelationshipType.REFERENCES ||
                type === RelationshipType.READS ||
                type === RelationshipType.WRITES;
            if (!isAggregated) {
                if (dedupe.has(key))
                    return;
                dedupe.add(key);
            }
            // Apply simple gating for placeholders referencing common/global names
            const gate = () => {
                try {
                    if (toId.startsWith("external:")) {
                        const nm = toId.substring("external:".length).toLowerCase();
                        if (!nm ||
                            nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
                            this.stopNames.has(nm))
                            return false;
                    }
                    if (toId.startsWith("class:")) {
                        const nm = toId.substring("class:".length).toLowerCase();
                        if (!nm ||
                            nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
                            this.stopNames.has(nm))
                            return false;
                    }
                }
                catch (_a) { }
                return true;
            };
            if (!gate())
                return;
            // Location info (best-effort)
            let line;
            let column;
            try {
                if (locNode && typeof locNode.getStart === "function") {
                    const pos = locNode.getStart();
                    const lc = sourceFile.getLineAndColumnAtPos(pos);
                    line = lc.line;
                    column = lc.column;
                }
            }
            catch (_b) { }
            // Assign confidence for inferred relationships via scorer, and gate low-confidence
            let metadata;
            const isPlaceholder = typeof toId === "string" &&
                (toId.startsWith("external:") || toId.startsWith("file:"));
            if (type === RelationshipType.REFERENCES ||
                type === RelationshipType.DEPENDS_ON ||
                ((type === RelationshipType.READS ||
                    type === RelationshipType.WRITES) &&
                    isPlaceholder)) {
                const confidence = scoreInferredEdge({
                    relationType: type,
                    toId,
                    fromFileRel,
                    usedTypeChecker: !!(opts === null || opts === void 0 ? void 0 : opts.usedTypeChecker),
                    isExported: !!(opts === null || opts === void 0 ? void 0 : opts.isExported),
                    nameLength: opts === null || opts === void 0 ? void 0 : opts.nameLength,
                    importDepth: opts === null || opts === void 0 ? void 0 : opts.importDepth,
                });
                // Gate: drop if below threshold to reduce noise
                if (confidence < noiseConfig.MIN_INFERRED_CONFIDENCE)
                    return;
                metadata = { inferred: true, confidence };
            }
            // Attach context metadata for easier downstream UX
            metadata = {
                ...(metadata || {}),
                path: fileEntity.path,
                ...(typeof line === "number" ? { line } : {}),
                ...(typeof column === "number" ? { column } : {}),
                ...((opts === null || opts === void 0 ? void 0 : opts.kindHint) ? { kind: opts.kindHint } : {}),
                ...((opts === null || opts === void 0 ? void 0 : opts.operator) ? { operator: opts.operator } : {}),
                ...((opts === null || opts === void 0 ? void 0 : opts.accessPath) ? { accessPath: opts.accessPath } : {}),
                ...((opts === null || opts === void 0 ? void 0 : opts.resolution) ? { resolution: opts.resolution } : {}),
                ...((opts === null || opts === void 0 ? void 0 : opts.scope)
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
                    }
                    else if (toId.startsWith("sym:")) {
                        const m = toId.match(/^sym:[^#]+#([^@]+)(?:@.+)?$/);
                        varName = (m && m[1]) || "";
                    }
                    else if (toId.startsWith("external:")) {
                        varName = toId.slice("external:".length);
                    }
                    else {
                        varName = toId;
                    }
                    const dfBase = `${fileEntity.path}|${owner}|${varName}`;
                    const dfId = "df_" +
                        crypto.createHash("sha1").update(dfBase).digest("hex").slice(0, 12);
                    metadata.dataFlowId = dfId;
                }
                catch (_c) { }
            }
            // Aggregate common code edges to reduce noise; non-aggregated types are pushed directly
            const aggKey = `${fromId}|${toId}`;
            if (type === RelationshipType.REFERENCES) {
                const prev = refAgg.get(aggKey);
                if (!prev)
                    refAgg.set(aggKey, { count: 1, meta: metadata });
                else {
                    prev.count += 1;
                    if (typeof metadata.line === "number" &&
                        (typeof prev.meta.line !== "number" ||
                            metadata.line < prev.meta.line))
                        prev.meta = metadata;
                }
                try {
                    if (metadata.scope === "imported")
                        depAgg.set(aggKey, metadata);
                }
                catch (_d) { }
                return;
            }
            if (type === RelationshipType.READS) {
                const prev = readAgg.get(aggKey);
                if (!prev)
                    readAgg.set(aggKey, { count: 1, meta: metadata });
                else {
                    prev.count += 1;
                    if (typeof metadata.line === "number" &&
                        (typeof prev.meta.line !== "number" ||
                            metadata.line < prev.meta.line))
                        prev.meta = metadata;
                }
                try {
                    if (metadata.scope === "imported")
                        depAgg.set(aggKey, metadata);
                }
                catch (_e) { }
                return;
            }
            if (type === RelationshipType.WRITES) {
                const prev = writeAgg.get(aggKey);
                if (!prev)
                    writeAgg.set(aggKey, { count: 1, meta: metadata });
                else {
                    prev.count += 1;
                    if (typeof metadata.line === "number" &&
                        (typeof prev.meta.line !== "number" ||
                            metadata.line < prev.meta.line))
                        prev.meta = metadata;
                }
                try {
                    if (metadata.scope === "imported")
                        depAgg.set(aggKey, metadata);
                }
                catch (_f) { }
                return;
            }
            relationships.push(this.createRelationship(fromId, toId, type, metadata));
        };
        const enclosingSymbolId = (node) => {
            const owner = node.getFirstAncestor((a) => Node.isFunctionDeclaration(a) ||
                Node.isMethodDeclaration(a) ||
                Node.isClassDeclaration(a) ||
                Node.isInterfaceDeclaration(a) ||
                Node.isTypeAliasDeclaration(a) ||
                Node.isVariableDeclaration(a));
            if (owner) {
                const found = localSymbols.find((ls) => ls.node === owner);
                if (found)
                    return found.entity.id;
            }
            return fileEntity.id;
        };
        // Class usage via instantiation: new Foo() -> treat as a reference (prefer same-file)
        for (const nw of sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression)) {
            const expr = nw.getExpression();
            const nameAll = expr ? expr.getText() : "";
            const name = nameAll ? nameAll.split(".").pop() || "" : "";
            if (!name)
                continue;
            if (this.stopNames.has(name.toLowerCase()) ||
                name.length < noiseConfig.AST_MIN_NAME_LENGTH)
                continue;
            const fromId = enclosingSymbolId(nw);
            const key = `${fileEntity.path}:${name}`;
            // If constructed class is imported: map to file:<path>:<name> using deep export map
            if (importMap && importMap.has(name)) {
                const deep = this.resolveImportedMemberToFileAndName(name, "default", sourceFile, importMap, importSymbolMap) ||
                    this.resolveImportedMemberToFileAndName(name, name, sourceFile, importMap, importSymbolMap);
                const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(name)) || name;
                const fr = deep
                    ? `file:${deep.fileRel}:${deep.name}`
                    : `file:${importMap.get(name)}:${fallbackName}`;
                addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
                    nameLength: name === null || name === void 0 ? void 0 : name.length,
                    importDepth: deep === null || deep === void 0 ? void 0 : deep.depth,
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
                    const deep = this.resolveImportedMemberToFileAndName(root, name, sourceFile, importMap, importSymbolMap);
                    const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(root)) || name;
                    const fr = deep
                        ? `file:${deep.fileRel}:${deep.name}`
                        : `file:${importMap.get(root)}:${fallbackName}`;
                    addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
                        nameLength: name === null || name === void 0 ? void 0 : name.length,
                        importDepth: deep === null || deep === void 0 ? void 0 : deep.depth,
                        kindHint: "instantiation",
                        accessPath: nameAll,
                        scope: "imported",
                        resolution: deep ? "via-import" : "heuristic",
                    });
                    continue;
                }
            }
            const local = localSymbols.find((ls) => ls.entity.path === key);
            if (local) {
                addRel(fromId, local.entity.id, RelationshipType.REFERENCES, nw, {
                    kindHint: "instantiation",
                    accessPath: nameAll,
                    scope: "local",
                    resolution: "direct",
                });
            }
            else {
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
            if (!text)
                continue;
            if (this.stopNames.has(text.toLowerCase()) ||
                text.length < noiseConfig.AST_MIN_NAME_LENGTH)
                continue;
            // Skip if this identifier is part of a call expression callee; CALLS handled elsewhere
            const parent = id.getParent();
            if (parent &&
                Node.isCallExpression(parent) &&
                parent.getExpression() === id) {
                continue;
            }
            // Skip import/export specifiers (already captured as IMPORTS/EXPORTS)
            if (parent &&
                (Node.isImportSpecifier(parent) ||
                    Node.isImportClause(parent) ||
                    Node.isNamespaceImport(parent))) {
                continue;
            }
            const fromId = enclosingSymbolId(id);
            // Imported binding -> cross-file placeholder with deep export resolution
            if (importMap && importMap.has(text)) {
                const deep = this.resolveImportedMemberToFileAndName(text, "default", sourceFile, importMap, importSymbolMap) ||
                    this.resolveImportedMemberToFileAndName(text, text, sourceFile, importMap, importSymbolMap);
                const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(text)) || text;
                const fr = deep
                    ? `file:${deep.fileRel}:${deep.name}`
                    : `file:${importMap.get(text)}:${fallbackName}`;
                addRel(fromId, fr, RelationshipType.REFERENCES, id, {
                    nameLength: (text || "").length,
                    importDepth: deep === null || deep === void 0 ? void 0 : deep.depth,
                    kindHint: "identifier",
                    scope: "imported",
                    resolution: deep ? "via-import" : "heuristic",
                });
                continue;
            }
            const key = `${fileEntity.path}:${text}`;
            const local = localSymbols.find((ls) => ls.entity.path === key);
            if (local) {
                const nm = local.entity.name || "";
                addRel(fromId, local.entity.id, RelationshipType.REFERENCES, id, {
                    isExported: !!local.entity.isExported,
                    nameLength: typeof nm === "string" ? nm.length : undefined,
                    kindHint: "identifier",
                    scope: "local",
                    resolution: "direct",
                });
            }
            else {
                // Try type-checker-based resolution to concrete file target
                const tc = this.resolveWithTypeChecker(id, sourceFile);
                if (tc) {
                    addRel(fromId, `file:${tc.fileRel}:${tc.name}`, RelationshipType.REFERENCES, id, {
                        usedTypeChecker: true,
                        nameLength: (tc.name || "").length,
                        kindHint: "identifier",
                        scope: "imported",
                        resolution: "type-checker",
                    });
                }
                else {
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
            const assignOps = new Set([
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
                    const op = ((_d = (_c = (_b = (_a = be).getOperatorToken) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.getText) === null || _d === void 0 ? void 0 : _d.call(_c)) || "";
                    if (!assignOps.has(op))
                        continue;
                    const lhs = (_f = (_e = be).getLeft) === null || _f === void 0 ? void 0 : _f.call(_e);
                    const rhs = (_h = (_g = be).getRight) === null || _h === void 0 ? void 0 : _h.call(_g);
                    const fromId = enclosingSymbolId(be);
                    // Resolve LHS identifier writes: prefer local symbol or file-qualified symbol, do NOT use RHS type
                    const resolveNameToId = (nm) => {
                        if (!nm)
                            return null;
                        if (importMap && importMap.has(nm)) {
                            const deep = this.resolveImportedMemberToFileAndName(nm, nm, sourceFile, importMap, importSymbolMap) || null;
                            const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(nm)) || nm;
                            return deep
                                ? `file:${deep.fileRel}:${deep.name}`
                                : `file:${importMap.get(nm)}:${fallbackName}`;
                        }
                        const key = `${fileEntity.path}:${nm}`;
                        const local = localSymbols.find((ls) => ls.entity.path === key);
                        if (local)
                            return local.entity.id;
                        // try best-effort type checker on LHS identifier itself
                        try {
                            if (this.takeTcBudget()) {
                                const tc = this.resolveWithTypeChecker(lhs, sourceFile);
                                if (tc)
                                    return `file:${tc.fileRel}:${tc.name}`;
                            }
                        }
                        catch (_a) { }
                        return `external:${nm}`;
                    };
                    // WRITES edge for simple identifier or property LHS
                    if (lhs && typeof lhs.getText === "function") {
                        const ltxt = lhs.getText();
                        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ltxt)) {
                            const tid = resolveNameToId(ltxt);
                            addRel(fromId, tid, RelationshipType.WRITES, lhs, {
                                kindHint: "write",
                                operator: op,
                            });
                        }
                        else {
                            // Property writes like obj.prop = value
                            try {
                                const hasName = lhs.getName &&
                                    typeof lhs.getName === "function";
                                const getExpr = lhs.getExpression &&
                                    typeof lhs.getExpression === "function"
                                    ? lhs.getExpression.bind(lhs)
                                    : null;
                                const prop = hasName ? lhs.getName() : undefined;
                                const baseExpr = getExpr ? getExpr() : null;
                                const baseText = baseExpr && typeof baseExpr.getText === "function"
                                    ? baseExpr.getText()
                                    : "";
                                const accessPath = ltxt;
                                let wrote = false;
                                let toIdProp = null;
                                // 1) Try type-checker to resolve the property symbol directly
                                try {
                                    if (this.takeTcBudget()) {
                                        const tc = this.resolveWithTypeChecker(lhs, sourceFile);
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
                                }
                                catch (_r) { }
                                // 2) Try import map for namespace/member: alias.prop
                                if (!wrote &&
                                    importMap &&
                                    prop &&
                                    baseText &&
                                    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)) {
                                    try {
                                        if (importMap.has(baseText)) {
                                            const deep = this.resolveImportedMemberToFileAndName(baseText, prop, sourceFile, importMap, importSymbolMap);
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
                                    }
                                    catch (_s) { }
                                }
                                // 3) Prefer same-file symbol with matching property name as fallback
                                if (!wrote && prop) {
                                    try {
                                        const sfRel = fileEntity.path; // relative file path
                                        const list = this.nameIndex.get(prop) || [];
                                        const sameFile = list.filter((s) => {
                                            const p = s.path;
                                            return typeof p === "string" && p.startsWith(`${sfRel}:`);
                                        });
                                        if (sameFile.length === 1) {
                                            addRel(fromId, sameFile[0].id, RelationshipType.WRITES, lhs, {
                                                kindHint: "write",
                                                operator: op,
                                                accessPath,
                                                scope: "local",
                                                resolution: "direct",
                                            });
                                            wrote = true;
                                        }
                                        else if (sameFile.length > 1) {
                                            // Ambiguous: record as external placeholder with ambiguity info
                                            const meta = {
                                                kind: "write",
                                                operator: op,
                                                accessPath,
                                                ambiguous: true,
                                                candidateCount: sameFile.length,
                                                scope: "local",
                                                resolution: "heuristic",
                                            };
                                            addRel(fromId, `external:${prop}`, RelationshipType.WRITES, lhs, meta);
                                            wrote = true;
                                        }
                                    }
                                    catch (_t) { }
                                }
                                // 4) Fallback to external:prop if nothing else resolved
                                if (!wrote && prop) {
                                    addRel(fromId, `external:${prop}`, RelationshipType.WRITES, lhs, {
                                        kindHint: "write",
                                        operator: op,
                                        accessPath,
                                        scope: "external",
                                        resolution: "heuristic",
                                    });
                                    wrote = true;
                                }
                            }
                            catch (_u) { }
                            // Destructuring assignment writes: ({a} = rhs) or ([x] = rhs)
                            try {
                                const kind = lhs.getKind && lhs.getKind();
                                if (kind === SyntaxKind.ObjectLiteralExpression) {
                                    const props = ((_k = (_j = lhs).getProperties) === null || _k === void 0 ? void 0 : _k.call(_j)) || [];
                                    for (const pr of props) {
                                        try {
                                            const nm = typeof pr.getName === "function"
                                                ? pr.getName()
                                                : undefined;
                                            if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                                                const tid = resolveNameToId(nm);
                                                addRel(fromId, tid, RelationshipType.WRITES, pr, { kindHint: "write", operator: op });
                                            }
                                        }
                                        catch (_v) { }
                                    }
                                }
                                else if (kind === SyntaxKind.ArrayLiteralExpression) {
                                    const elems = ((_m = (_l = lhs).getElements) === null || _m === void 0 ? void 0 : _m.call(_l)) || [];
                                    for (const el of elems) {
                                        try {
                                            const nm = typeof el.getText === "function" ? el.getText() : "";
                                            if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                                                const tid = resolveNameToId(nm);
                                                addRel(fromId, tid, RelationshipType.WRITES, el, { kindHint: "write", operator: op });
                                            }
                                        }
                                        catch (_w) { }
                                    }
                                }
                            }
                            catch (_x) { }
                        }
                    }
                    // READS: collect identifiers from RHS (basic)
                    if (rhs && typeof rhs.getDescendantsOfKind === "function") {
                        const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
                        for (const idn of ids) {
                            const t = idn.getText();
                            if (!t)
                                continue;
                            const key = `${fileEntity.path}:${t}`;
                            const local = localSymbols.find((ls) => ls.entity.path === key);
                            // detect access path if part of a property access
                            let accessPath;
                            try {
                                const parent = (_p = (_o = idn).getParent) === null || _p === void 0 ? void 0 : _p.call(_o);
                                if (parent &&
                                    typeof parent.getKind === "function" &&
                                    parent.getKind() === SyntaxKind.PropertyAccessExpression &&
                                    typeof parent.getText === "function") {
                                    accessPath = parent.getText();
                                }
                            }
                            catch (_y) { }
                            if (local) {
                                addRel(fromId, local.entity.id, RelationshipType.READS, idn, {
                                    kindHint: "read",
                                    accessPath,
                                    scope: "local",
                                    resolution: "direct",
                                });
                            }
                            else if (importMap && importMap.has(t)) {
                                const deep = this.resolveImportedMemberToFileAndName(t, t, sourceFile, importMap, importSymbolMap);
                                const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(t)) || t;
                                const fr = deep
                                    ? `file:${deep.fileRel}:${deep.name}`
                                    : `file:${importMap.get(t)}:${fallbackName}`;
                                addRel(fromId, fr, RelationshipType.READS, idn, {
                                    kindHint: "read",
                                    importDepth: deep === null || deep === void 0 ? void 0 : deep.depth,
                                    accessPath,
                                    scope: "imported",
                                    resolution: deep ? "via-import" : "heuristic",
                                });
                            }
                            else {
                                if (this.takeTcBudget()) {
                                    const tc = this.resolveWithTypeChecker(idn, sourceFile);
                                    if (tc)
                                        addRel(fromId, `file:${tc.fileRel}:${tc.name}`, RelationshipType.READS, idn, {
                                            usedTypeChecker: true,
                                            kindHint: "read",
                                            accessPath,
                                            scope: "imported",
                                            resolution: "type-checker",
                                        });
                                }
                                else
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
                            const props = rhs.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression) ||
                                [];
                            const seen = new Set();
                            for (const pa of props) {
                                try {
                                    const accessPath = typeof pa.getText === "function"
                                        ? pa.getText()
                                        : undefined;
                                    const propName = typeof pa.getName === "function"
                                        ? pa.getName()
                                        : undefined;
                                    const baseExpr = typeof pa.getExpression === "function"
                                        ? pa.getExpression()
                                        : null;
                                    const baseText = baseExpr && typeof baseExpr.getText === "function"
                                        ? baseExpr.getText()
                                        : "";
                                    if (!propName)
                                        continue;
                                    const key = `${propName}|${accessPath || ""}`;
                                    if (seen.has(key))
                                        continue;
                                    seen.add(key);
                                    let toIdProp = null;
                                    // 1) Type-checker resolution of the property
                                    try {
                                        if (this.takeTcBudget()) {
                                            const tc = this.resolveWithTypeChecker(pa, sourceFile);
                                            if (tc && tc.fileRel && tc.name) {
                                                toIdProp = `file:${tc.fileRel}:${tc.name}`;
                                                addRel(fromId, toIdProp, RelationshipType.READS, pa, {
                                                    kindHint: "read",
                                                    accessPath,
                                                    usedTypeChecker: true,
                                                    resolution: "type-checker",
                                                    scope: "imported",
                                                });
                                                continue;
                                            }
                                        }
                                    }
                                    catch (_z) { }
                                    // 2) Import alias deep resolution for alias.prop
                                    if (importMap &&
                                        baseText &&
                                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText) &&
                                        importMap.has(baseText)) {
                                        const deep = this.resolveImportedMemberToFileAndName(baseText, propName, sourceFile, importMap, importSymbolMap);
                                        if (deep) {
                                            toIdProp = `file:${deep.fileRel}:${deep.name}`;
                                            addRel(fromId, toIdProp, RelationshipType.READS, pa, {
                                                kindHint: "read",
                                                accessPath,
                                                importDepth: deep.depth,
                                                resolution: "via-import",
                                                scope: "imported",
                                            });
                                            continue;
                                        }
                                    }
                                    // 3) Same-file symbol fallback by name
                                    try {
                                        const sfRel = fileEntity.path;
                                        const list = this.nameIndex.get(propName) || [];
                                        const sameFile = list.filter((s) => {
                                            const p = s.path;
                                            return typeof p === "string" && p.startsWith(`${sfRel}:`);
                                        });
                                        if (sameFile.length === 1) {
                                            addRel(fromId, sameFile[0].id, RelationshipType.READS, pa, {
                                                kindHint: "read",
                                                accessPath,
                                                scope: "local",
                                                resolution: "direct",
                                            });
                                            continue;
                                        }
                                        else if (sameFile.length > 1) {
                                            const meta = {
                                                kind: "read",
                                                accessPath,
                                                ambiguous: true,
                                                candidateCount: sameFile.length,
                                                scope: "local",
                                                resolution: "heuristic",
                                            };
                                            addRel(fromId, `external:${propName}`, RelationshipType.READS, pa, meta);
                                            continue;
                                        }
                                    }
                                    catch (_0) { }
                                    // 4) Fallback external
                                    addRel(fromId, `external:${propName}`, RelationshipType.READS, pa, {
                                        kindHint: "read",
                                        accessPath,
                                        scope: "external",
                                        resolution: "heuristic",
                                    });
                                }
                                catch (_1) { }
                            }
                        }
                        catch (_2) { }
                    }
                }
                catch (_3) { }
            }
        }
        catch (_4) { }
        // Flush aggregations into final relationships with occurrences metadata
        if (refAgg.size > 0) {
            for (const [k, v] of refAgg.entries()) {
                const [fromId, toId] = k.split("|");
                const meta = { ...v.meta, occurrencesScan: v.count };
                relationships.push(this.createRelationship(fromId, toId, RelationshipType.REFERENCES, meta));
            }
            refAgg.clear();
        }
        if (readAgg.size > 0) {
            for (const [k, v] of readAgg.entries()) {
                const [fromId, toId] = k.split("|");
                const meta = { ...v.meta, occurrencesScan: v.count };
                relationships.push(this.createRelationship(fromId, toId, RelationshipType.READS, meta));
            }
            readAgg.clear();
        }
        if (writeAgg.size > 0) {
            for (const [k, v] of writeAgg.entries()) {
                const [fromId, toId] = k.split("|");
                const meta = { ...v.meta, occurrencesScan: v.count };
                relationships.push(this.createRelationship(fromId, toId, RelationshipType.WRITES, meta));
            }
            writeAgg.clear();
        }
        // Emit symbol-level dependencies for imported reference targets
        if (depAgg.size > 0) {
            for (const [k, meta] of depAgg.entries()) {
                const [fromId, toId] = k.split("|");
                const depMeta = {
                    ...(meta || {}),
                    scope: (meta === null || meta === void 0 ? void 0 : meta.scope) || "imported",
                    resolution: (meta === null || meta === void 0 ? void 0 : meta.resolution) || "via-import",
                    kind: "dependency", // Always set kind to 'dependency' for aggregated dependencies
                    inferred: ((_q = meta === null || meta === void 0 ? void 0 : meta.inferred) !== null && _q !== void 0 ? _q : true),
                };
                if (typeof depMeta.confidence !== "number") {
                    // Calculate confidence for aggregated dependencies
                    depMeta.confidence = scoreInferredEdge({
                        relationType: RelationshipType.DEPENDS_ON,
                        toId,
                        fromFileRel: this.normalizeRelPath(path.dirname(fromId.split(":")[1] || "")),
                    });
                }
                relationships.push(this.createRelationship(fromId, toId, RelationshipType.DEPENDS_ON, depMeta));
            }
        }
        return relationships;
    }
    normalizeRelPath(p) {
        return path.relative(process.cwd(), p);
    }
}
//# sourceMappingURL=ReferenceRelationshipBuilder.js.map