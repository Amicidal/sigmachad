/**
 * RelationshipBuilder - Extracts relationships between code entities
 *
 * Extracted from ASTParser.ts as part of the modular refactoring.
 * Handles symbol relationships, reference relationships, import relationships,
 * and relationship creation with confidence scoring and edge normalization.
 */
import { Node, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as crypto from "crypto";
import { RelationshipType, } from "../../../models/relationships.js";
import { normalizeCodeEdge, canonicalRelationshipId, } from "../../../utils/codeEdges.js";
import { noiseConfig } from "../../../config/noise.js";
import { scoreInferredEdge } from "../../../utils/confidence.js";
/**
 * RelationshipBuilder handles the extraction of various types of relationships
 * between code entities including symbols, references, imports, and dependencies.
 */
export class RelationshipBuilder {
    constructor(options) {
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
    extractSymbolRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41;
        const relationships = [];
        // Aggregate repeated CALLS per target for this symbol
        const callAgg = new Map();
        // Build quick index of local symbols in this file to enable direct linking
        // We search by path suffix ("<filePath>:<name>") which we assign when creating symbols
        const localIndex = new Map();
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
                    const valId = v.id;
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
        }
        catch (_42) { }
        // Extract function calls with best-effort resolution to local symbols first
        if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
            const calls = node
                .getDescendants()
                .filter((descendant) => Node.isCallExpression(descendant));
            for (const call of calls) {
                try {
                    const expr = ((_b = (_a = call).getExpression) === null || _b === void 0 ? void 0 : _b.call(_a)) || null;
                    let targetName = "";
                    if (expr && typeof expr.getText === "function") {
                        targetName = String(expr.getText());
                    }
                    else {
                        targetName = String(((_d = (_c = call.getExpression()) === null || _c === void 0 ? void 0 : _c.getText) === null || _d === void 0 ? void 0 : _d.call(_c)) || "");
                    }
                    // Try to resolve identifier or property access to a local symbol id or cross-file import
                    let toId = null;
                    const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
                    const parts = targetName.split(".");
                    const simpleName = (parts.pop() || targetName).trim();
                    // Skip noisy/global names
                    const simpleLower = simpleName.toLowerCase();
                    if (!simpleLower ||
                        simpleLower.length < noiseConfig.AST_MIN_NAME_LENGTH ||
                        this.stopNames.has(simpleLower)) {
                        continue;
                    }
                    // Inspect call arity and awaited usage
                    let arity = 0;
                    try {
                        const args = ((_f = (_e = call).getArguments) === null || _f === void 0 ? void 0 : _f.call(_e)) || [];
                        arity = Array.isArray(args) ? args.length : 0;
                    }
                    catch (_43) { }
                    let awaited = false;
                    try {
                        let p = (_h = (_g = call).getParent) === null || _h === void 0 ? void 0 : _h.call(_g);
                        while (p &&
                            typeof p.getKind === "function" &&
                            p.getKind() === SyntaxKind.ParenthesizedExpression)
                            p = (_j = p.getParent) === null || _j === void 0 ? void 0 : _j.call(p);
                        awaited = !!(p &&
                            typeof p.getKind === "function" &&
                            p.getKind() === SyntaxKind.AwaitExpression);
                    }
                    catch (_44) { }
                    // Track resolution/scope hints for richer evidence
                    let resHint;
                    let scopeHint;
                    const baseMeta = {};
                    // Property access calls: try to resolve base object type to declaration and method symbol name
                    try {
                        if (ts.isPropertyAccessExpression &&
                            call.getExpression &&
                            call.getExpression().getExpression) {
                            const pae = call.getExpression();
                            const base = (_k = pae === null || pae === void 0 ? void 0 : pae.getExpression) === null || _k === void 0 ? void 0 : _k.call(pae);
                            const methodName = ((_l = pae === null || pae === void 0 ? void 0 : pae.getName) === null || _l === void 0 ? void 0 : _l.call(pae)) || simpleName;
                            if (base && typeof methodName === "string") {
                                baseMeta.isMethod = true;
                                const checker = this.tsProject.getTypeChecker();
                                const t = (_o = (_m = checker).getTypeAtLocation) === null || _o === void 0 ? void 0 : _o.call(_m, base);
                                const sym = (_p = t === null || t === void 0 ? void 0 : t.getSymbol) === null || _p === void 0 ? void 0 : _p.call(t);
                                const decls = Array.isArray((_q = sym === null || sym === void 0 ? void 0 : sym.getDeclarations) === null || _q === void 0 ? void 0 : _q.call(sym))
                                    ? sym.getDeclarations()
                                    : [];
                                const firstDecl = decls[0];
                                const declSf = (_r = firstDecl === null || firstDecl === void 0 ? void 0 : firstDecl.getSourceFile) === null || _r === void 0 ? void 0 : _r.call(firstDecl);
                                const abs = (_s = declSf === null || declSf === void 0 ? void 0 : declSf.getFilePath) === null || _s === void 0 ? void 0 : _s.call(declSf);
                                if (abs) {
                                    const rel = path.relative(process.cwd(), abs);
                                    toId = `file:${rel}:${methodName}`;
                                    resHint = "type-checker";
                                    scopeHint = "imported";
                                }
                                // Enrich receiver type and dispatch hint
                                try {
                                    const tText = typeof (t === null || t === void 0 ? void 0 : t.getText) === "function" ? t.getText() : undefined;
                                    if (tText)
                                        baseMeta.receiverType = tText;
                                    const isUnion = typeof (t === null || t === void 0 ? void 0 : t.isUnion) === "function"
                                        ? t.isUnion()
                                        : false;
                                    const isInterface = String(((_t = sym === null || sym === void 0 ? void 0 : sym.getFlags) === null || _t === void 0 ? void 0 : _t.call(sym)) || "").includes("Interface");
                                    if (isUnion || isInterface)
                                        baseMeta.dynamicDispatch = true;
                                }
                                catch (_45) { }
                            }
                        }
                    }
                    catch (_46) { }
                    // Namespace/default alias usage: ns.method() or alias.method()
                    if (importMap && parts.length > 1) {
                        const root = parts[0];
                        if (importMap.has(root)) {
                            const relTarget = importMap.get(root);
                            const hint = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(root)) || simpleName;
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
                                const baseExpr = (_x = (_w = (_v = (_u = call).getExpression) === null || _v === void 0 ? void 0 : _v.call(_u)) === null || _w === void 0 ? void 0 : _w.getExpression) === null || _x === void 0 ? void 0 : _x.call(_w);
                                const baseText = ((_y = baseExpr === null || baseExpr === void 0 ? void 0 : baseExpr.getText) === null || _y === void 0 ? void 0 : _y.call(baseExpr)) || "";
                                if (baseText) {
                                    // Try to resolve base identifier to local symbol id
                                    const keyBase = `${sfPath}:${baseText}`;
                                    let varTo = null;
                                    if (localIndex.has(keyBase)) {
                                        varTo = localIndex.get(keyBase);
                                    }
                                    else if (importMap && importMap.has(baseText)) {
                                        const deep = this.resolveImportedMemberToFileAndName(baseText, baseText, sourceFile, importMap, importSymbolMap) || null;
                                        const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(baseText)) || baseText;
                                        varTo = deep
                                            ? `file:${deep.fileRel}:${deep.name}`
                                            : `file:${importMap.get(baseText)}:${fallbackName}`;
                                    }
                                    else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)) {
                                        varTo = `external:${baseText}`;
                                    }
                                    if (varTo) {
                                        relationships.push(this.createRelationship(symbolEntity.id, varTo, RelationshipType.WRITES, {
                                            kind: "write",
                                            operator: "mutate",
                                            accessPath: targetName,
                                        }));
                                    }
                                }
                            }
                        }
                    }
                    catch (_47) { }
                    // If call refers to an imported binding, prefer cross-file placeholder target (deep resolution)
                    if (!toId && importMap && simpleName && importMap.has(simpleName)) {
                        const deep = this.resolveImportedMemberToFileAndName(simpleName, "default", sourceFile, importMap, importSymbolMap) ||
                            this.resolveImportedMemberToFileAndName(simpleName, simpleName, sourceFile, importMap, importSymbolMap);
                        if (deep) {
                            toId = `file:${deep.fileRel}:${deep.name}`;
                            resHint = "via-import";
                            scopeHint = "imported";
                        }
                    }
                    const key = `${sfPath}:${simpleName}`;
                    if (localIndex.has(key)) {
                        toId = localIndex.get(key);
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
                            ? this.resolveCallTargetWithChecker(call, sourceFile) ||
                                this.resolveWithTypeChecker(expr, sourceFile)
                            : null;
                        if (tcTarget) {
                            toId = `file:${tcTarget.fileRel}:${tcTarget.name}`;
                            resHint = "type-checker";
                            scopeHint = "imported";
                        }
                    }
                    // Prepare callsite metadata (path/line/column, call hints)
                    let line;
                    let column;
                    try {
                        const pos = (_0 = (_z = call).getStart) === null || _0 === void 0 ? void 0 : _0.call(_z);
                        if (typeof pos === "number") {
                            const lc = sourceFile.getLineAndColumnAtPos(pos);
                            line = lc.line;
                            column = lc.column;
                        }
                    }
                    catch (_48) { }
                    // default scope inference from toId shape if no hint set
                    if (!scopeHint && toId) {
                        if (toId.startsWith("external:"))
                            scopeHint = "external";
                        else if (toId.startsWith("file:"))
                            scopeHint = "imported";
                        else
                            scopeHint = "unknown";
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
                        baseMeta.isMethod = true;
                    // Aggregate CALLS instead of emitting duplicates directly
                    // Prefer concrete symbol ids via global index when possible
                    try {
                        if (toId) {
                            // Already concrete? sym:... keep
                            if (toId.startsWith("file:")) {
                                const m = toId.match(/^file:(.+?):(.+)$/);
                                if (m) {
                                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                    if (hit)
                                        toId = hit.id;
                                }
                            }
                            else if (toId.startsWith("external:") ||
                                /^(class|interface|function|typeAlias):/.test(toId)) {
                                const nm = toId.startsWith("external:")
                                    ? toId.slice("external:".length)
                                    : toId.split(":").slice(1).join(":");
                                const list = this.nameIndex.get(nm) || [];
                                if (list.length === 1)
                                    toId = list[0].id;
                                else if (list.length > 1) {
                                    const dir = sfPath.includes("/")
                                        ? sfPath.slice(0, sfPath.lastIndexOf("/")) + "/"
                                        : "";
                                    const near = list.filter((s) => (s.path || "").startsWith(dir));
                                    if (near.length === 1)
                                        toId = near[0].id;
                                }
                            }
                        }
                    }
                    catch (_49) { }
                    if (toId &&
                        !toId.startsWith("external:") &&
                        !toId.startsWith("file:")) {
                        const keyAgg = `${symbolEntity.id}|${toId}`;
                        const prev = callAgg.get(keyAgg);
                        if (!prev)
                            callAgg.set(keyAgg, { count: 1, meta: baseMeta });
                        else {
                            prev.count += 1;
                            // keep earliest line
                            if (typeof baseMeta.line === "number" &&
                                (typeof prev.meta.line !== "number" ||
                                    baseMeta.line < prev.meta.line))
                                prev.meta = baseMeta;
                        }
                    }
                    else if (toId && toId.startsWith("file:")) {
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
                            const meta = {
                                ...baseMeta,
                                inferred: true,
                                source: "call-typecheck",
                                confidence,
                                resolution: "type-checker",
                                scope: "imported",
                            };
                            const prev = callAgg.get(keyAgg);
                            if (!prev)
                                callAgg.set(keyAgg, { count: 1, meta });
                            else {
                                prev.count += 1;
                                if (typeof meta.line === "number" &&
                                    (typeof prev.meta.line !== "number" ||
                                        meta.line < prev.meta.line))
                                    prev.meta = meta;
                            }
                        }
                    }
                    else {
                        // Skip external-only unresolved calls to reduce noise
                    }
                }
                catch (_50) {
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
                            const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
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
                                            if (hit)
                                                toId = hit.id;
                                        }
                                    }
                                }
                                catch (_51) { }
                                relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.EXTENDS, { resolved: true }));
                            }
                            else {
                                // Try import/deep export
                                let resolved = null;
                                if (importMap) {
                                    resolved = this.resolveImportedMemberToFileAndName(simple, simple, sourceFile, importMap, importSymbolMap);
                                }
                                if (!resolved) {
                                    const tc = this.shouldUseTypeChecker({
                                        context: "heritage",
                                        imported: true,
                                        ambiguous: true,
                                        nameLength: String(type.getText() || "").length,
                                    })
                                        ? this.resolveWithTypeChecker(type, sourceFile)
                                        : null;
                                    if (tc)
                                        resolved = {
                                            fileRel: tc.fileRel,
                                            name: tc.name,
                                            depth: 0,
                                        };
                                }
                                let placeholder = resolved
                                    ? `file:${resolved.fileRel}:${resolved.name}`
                                    : `class:${simple}`;
                                try {
                                    const m = placeholder.match(/^file:(.+?):(.+)$/);
                                    if (m) {
                                        const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                        if (hit)
                                            placeholder = hit.id;
                                    }
                                    else if (placeholder.startsWith("class:")) {
                                        const nm = placeholder.slice("class:".length);
                                        const list = this.nameIndex.get(nm) || [];
                                        if (list.length === 1)
                                            placeholder = list[0].id;
                                    }
                                }
                                catch (_52) { }
                                relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.EXTENDS, resolved
                                    ? { resolved: true, importDepth: resolved.depth }
                                    : undefined));
                            }
                        }
                        catch (_53) {
                            relationships.push(this.createRelationship(symbolEntity.id, `class:${type.getText()}`, RelationshipType.EXTENDS));
                        }
                    }
                }
                if (clause.getToken() === SyntaxKind.ImplementsKeyword) {
                    for (const type of clause.getTypeNodes()) {
                        try {
                            const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
                            const simple = type.getText();
                            const key = `${sfPath}:${simple}`;
                            let toId = localIndex.get(key);
                            if (toId) {
                                try {
                                    if (toId.startsWith("file:")) {
                                        const m = toId.match(/^file:(.+?):(.+)$/);
                                        if (m) {
                                            const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                            if (hit)
                                                toId = hit.id;
                                        }
                                    }
                                }
                                catch (_54) { }
                                relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.IMPLEMENTS, { resolved: true }));
                            }
                            else {
                                let resolved = null;
                                if (importMap) {
                                    resolved = this.resolveImportedMemberToFileAndName(simple, simple, sourceFile, importMap, importSymbolMap);
                                }
                                if (!resolved) {
                                    const tc = this.takeTcBudget()
                                        ? this.resolveWithTypeChecker(type, sourceFile)
                                        : null;
                                    if (tc)
                                        resolved = {
                                            fileRel: tc.fileRel,
                                            name: tc.name,
                                            depth: 0,
                                        };
                                }
                                let placeholder = resolved
                                    ? `file:${resolved.fileRel}:${resolved.name}`
                                    : `interface:${simple}`;
                                try {
                                    const m = placeholder.match(/^file:(.+?):(.+)$/);
                                    if (m) {
                                        const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                        if (hit)
                                            placeholder = hit.id;
                                    }
                                    else if (placeholder.startsWith("interface:")) {
                                        const nm = placeholder.slice("interface:".length);
                                        const list = this.nameIndex.get(nm) || [];
                                        if (list.length === 1)
                                            placeholder = list[0].id;
                                    }
                                }
                                catch (_55) { }
                                relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.IMPLEMENTS, resolved
                                    ? { resolved: true, importDepth: resolved.depth }
                                    : undefined));
                            }
                        }
                        catch (_56) {
                            relationships.push(this.createRelationship(symbolEntity.id, `interface:${type.getText()}`, RelationshipType.IMPLEMENTS));
                        }
                    }
                }
            }
        }
        // Decorators on classes/methods/properties/parameters -> REFERENCES(kind=decorator)
        try {
            const getDecorators = (_2 = (_1 = node).getDecorators) === null || _2 === void 0 ? void 0 : _2.call(_1);
            const decs = Array.isArray(getDecorators) ? getDecorators : [];
            for (const d of decs) {
                try {
                    const expr = ((_3 = d.getExpression) === null || _3 === void 0 ? void 0 : _3.call(d)) || ((_4 = d.getNameNode) === null || _4 === void 0 ? void 0 : _4.call(d)) || null;
                    let accessPath = "";
                    let simpleName = "";
                    if (expr && typeof expr.getText === "function") {
                        accessPath = String(expr.getText());
                        const base = accessPath.split("(")[0];
                        simpleName = (base.split(".").pop() || base).trim();
                    }
                    if (!simpleName)
                        continue;
                    if (this.stopNames.has(simpleName.toLowerCase()) ||
                        simpleName.length < noiseConfig.AST_MIN_NAME_LENGTH)
                        continue;
                    let toId = null;
                    // Try type-checker resolution first
                    try {
                        if (!toId &&
                            this.shouldUseTypeChecker({
                                context: "decorator",
                                imported: !!importMap,
                                ambiguous: true,
                                nameLength: simpleName.length,
                            })) {
                            const tc = this.resolveWithTypeChecker(expr, sourceFile);
                            if (tc)
                                toId = `file:${tc.fileRel}:${tc.name}`;
                        }
                    }
                    catch (_57) { }
                    // Try import map using root of accessPath
                    if (!toId && importMap) {
                        const root = accessPath.split(/[.(]/)[0];
                        const target = root && importMap.get(root);
                        if (target)
                            toId = `file:${target}:${simpleName}`;
                    }
                    if (!toId) {
                        toId = `external:${simpleName}`;
                    }
                    // Location
                    let line;
                    let column;
                    try {
                        const pos = (_6 = (_5 = d).getStart) === null || _6 === void 0 ? void 0 : _6.call(_5);
                        if (typeof pos === "number") {
                            const lc = sourceFile.getLineAndColumnAtPos(pos);
                            line = lc.line;
                            column = lc.column;
                        }
                    }
                    catch (_58) { }
                    const meta = {
                        kind: "decorator",
                        accessPath,
                        path: path.relative(process.cwd(), sourceFile.getFilePath()),
                        ...(typeof line === "number" ? { line } : {}),
                        ...(typeof column === "number" ? { column } : {}),
                    };
                    relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.REFERENCES, meta));
                }
                catch (_59) { }
            }
        }
        catch (_60) { }
        // Method-level semantics: OVERRIDES, THROWS, RETURNS_TYPE, PARAM_TYPE
        if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
            try {
                // OVERRIDES: only for methods inside classes
                if (Node.isMethodDeclaration(node)) {
                    const ownerClass = node.getFirstAncestor((a) => Node.isClassDeclaration(a));
                    const nameNode = (_8 = (_7 = node).getNameNode) === null || _8 === void 0 ? void 0 : _8.call(_7);
                    const methodName = (typeof (nameNode === null || nameNode === void 0 ? void 0 : nameNode.getText) === "function"
                        ? nameNode.getText()
                        : (_10 = (_9 = node).getName) === null || _10 === void 0 ? void 0 : _10.call(_9)) || "";
                    if (ownerClass && methodName) {
                        const heritage = ((_12 = (_11 = ownerClass).getHeritageClauses) === null || _12 === void 0 ? void 0 : _12.call(_11)) || [];
                        for (const clause of heritage) {
                            if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
                                for (const type of clause.getTypeNodes()) {
                                    let baseFile = null;
                                    let usedTc = false;
                                    try {
                                        if (importMap) {
                                            const simple = type.getText();
                                            const res = this.resolveImportedMemberToFileAndName(simple, simple, sourceFile, importMap, importSymbolMap);
                                            if (res)
                                                baseFile = res.fileRel;
                                        }
                                        if (!baseFile) {
                                            const tc = this.shouldUseTypeChecker({
                                                context: "heritage",
                                                imported: true,
                                                ambiguous: true,
                                                nameLength: String(type.getText() || "").length,
                                            })
                                                ? this.resolveWithTypeChecker(type, sourceFile)
                                                : null;
                                            if (tc) {
                                                baseFile = tc.fileRel;
                                                usedTc = true;
                                            }
                                        }
                                    }
                                    catch (_61) { }
                                    if (baseFile) {
                                        // Prefer linking to exact base method symbol if known
                                        let toId = `file:${baseFile}:${methodName}`;
                                        try {
                                            const hit = this.globalSymbolIndex.get(`${baseFile}:${methodName}`);
                                            if (hit)
                                                toId = hit.id;
                                        }
                                        catch (_62) { }
                                        const meta = {
                                            path: path.relative(process.cwd(), sourceFile.getFilePath()),
                                            kind: "override",
                                        };
                                        if (usedTc) {
                                            meta.usedTypeChecker = true;
                                            meta.resolution = "type-checker";
                                        }
                                        relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.OVERRIDES, meta));
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (_63) { }
            try {
                // THROWS: throw new ErrorType()
                const throws = ((_14 = (_13 = node).getDescendantsOfKind) === null || _14 === void 0 ? void 0 : _14.call(_13, SyntaxKind.ThrowStatement)) || [];
                for (const th of throws) {
                    try {
                        const expr = (_15 = th.getExpression) === null || _15 === void 0 ? void 0 : _15.call(th);
                        let typeName = "";
                        if (expr &&
                            expr.getExpression &&
                            typeof expr.getExpression === "function") {
                            // new ErrorType()
                            const e = expr.getExpression();
                            typeName = ((_16 = e === null || e === void 0 ? void 0 : e.getText) === null || _16 === void 0 ? void 0 : _16.call(e)) || "";
                        }
                        else {
                            typeName = ((_17 = expr === null || expr === void 0 ? void 0 : expr.getText) === null || _17 === void 0 ? void 0 : _17.call(expr)) || "";
                        }
                        typeName = (typeName || "").split(".").pop() || "";
                        if (!typeName)
                            continue;
                        let toId = null;
                        if (importMap && importMap.has(typeName)) {
                            const deep = this.resolveImportedMemberToFileAndName(typeName, typeName, sourceFile, importMap, importSymbolMap);
                            const fallbackName = (importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(typeName)) || typeName;
                            toId = deep
                                ? `file:${deep.fileRel}:${deep.name}`
                                : `file:${importMap.get(typeName)}:${fallbackName}`;
                        }
                        else {
                            // try local symbol using prebuilt localIndex from cache
                            const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
                            const key = `${sfPath}:${typeName}`;
                            const candidate = localIndex.get(key);
                            if (candidate) {
                                toId = candidate;
                            }
                        }
                        // attach throw site location
                        let tline;
                        let tcol;
                        try {
                            const pos = (_19 = (_18 = th).getStart) === null || _19 === void 0 ? void 0 : _19.call(_18);
                            if (typeof pos === "number") {
                                const lc = sourceFile.getLineAndColumnAtPos(pos);
                                tline = lc.line;
                                tcol = lc.column;
                            }
                        }
                        catch (_64) { }
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
                                if (hit)
                                    placeholder = hit.id;
                            }
                            else if (placeholder.startsWith("class:")) {
                                const nm = placeholder.slice("class:".length);
                                const list = this.nameIndex.get(nm) || [];
                                if (list.length === 1)
                                    placeholder = list[0].id;
                                else if (list.length > 1) {
                                    meta.ambiguous = true;
                                    meta.candidateCount = list.length;
                                }
                            }
                        }
                        catch (_65) { }
                        relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.THROWS, meta));
                    }
                    catch (_66) { }
                }
            }
            catch (_67) { }
            try {
                // RETURNS_TYPE
                const rt = (_21 = (_20 = node).getReturnTypeNode) === null || _21 === void 0 ? void 0 : _21.call(_20);
                if (rt && typeof rt.getText === "function") {
                    const tname = rt.getText();
                    if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
                        let toId = `external:${tname}`;
                        if (importMap) {
                            const deep = this.resolveImportedMemberToFileAndName(tname, tname, sourceFile, importMap, importSymbolMap);
                            if (deep)
                                toId = `file:${deep.fileRel}:${deep.name}`;
                        }
                        try {
                            const m = toId.match(/^file:(.+?):(.+)$/);
                            if (m) {
                                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                if (hit)
                                    toId = hit.id;
                            }
                            else if (toId.startsWith("external:")) {
                                const nm = toId.slice("external:".length);
                                const list = this.nameIndex.get(nm) || [];
                                if (list.length === 1)
                                    toId = list[0].id;
                                else if (list.length > 1) {
                                    // mark ambiguous in metadata (set below)
                                }
                            }
                        }
                        catch (_68) { }
                        let line;
                        let column;
                        try {
                            const pos = (_23 = (_22 = rt).getStart) === null || _23 === void 0 ? void 0 : _23.call(_22);
                            if (typeof pos === "number") {
                                const lc = sourceFile.getLineAndColumnAtPos(pos);
                                line = lc.line;
                                column = lc.column;
                            }
                        }
                        catch (_69) { }
                        const meta = {
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
                        }
                        catch (_70) { }
                        relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.RETURNS_TYPE, meta));
                    }
                }
                else {
                    // Fallback: infer return type via type checker when annotation is missing
                    try {
                        const t = (_25 = (_24 = node).getReturnType) === null || _25 === void 0 ? void 0 : _25.call(_24);
                        // Attempt to obtain a readable base name
                        let tname = "";
                        try {
                            tname = (((_28 = (_27 = (_26 = t === null || t === void 0 ? void 0 : t.getSymbol) === null || _26 === void 0 ? void 0 : _26.call(t)) === null || _27 === void 0 ? void 0 : _27.getName) === null || _28 === void 0 ? void 0 : _28.call(_27)) || "").toString();
                        }
                        catch (_71) { }
                        if (!tname) {
                            try {
                                tname =
                                    typeof (t === null || t === void 0 ? void 0 : t.getText) === "function" ? String(t.getText()) : "";
                            }
                            catch (_72) { }
                        }
                        if (tname)
                            tname = String(tname).split(/[<|&]/)[0].trim();
                        if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
                            let toId = `external:${tname}`;
                            if (importMap) {
                                const deep = this.resolveImportedMemberToFileAndName(tname, tname, sourceFile, importMap, importSymbolMap);
                                if (deep)
                                    toId = `file:${deep.fileRel}:${deep.name}`;
                            }
                            try {
                                const m = toId.match(/^file:(.+?):(.+)$/);
                                if (m) {
                                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                    if (hit)
                                        toId = hit.id;
                                }
                                else if (toId.startsWith("external:")) {
                                    const nm = toId.slice("external:".length);
                                    const list = this.nameIndex.get(nm) || [];
                                    if (list.length === 1)
                                        toId = list[0].id;
                                }
                            }
                            catch (_73) { }
                            const meta = {
                                inferred: true,
                                kind: "type",
                                usedTypeChecker: true,
                                resolution: "type-checker",
                            };
                            relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.RETURNS_TYPE, meta));
                        }
                    }
                    catch (_74) { }
                }
            }
            catch (_75) { }
            try {
                // PARAM_TYPE per parameter
                const params = ((_30 = (_29 = node).getParameters) === null || _30 === void 0 ? void 0 : _30.call(_29)) || [];
                for (const p of params) {
                    const tn = (_31 = p.getTypeNode) === null || _31 === void 0 ? void 0 : _31.call(p);
                    const pname = ((_32 = p.getName) === null || _32 === void 0 ? void 0 : _32.call(p)) || "";
                    if (tn && typeof tn.getText === "function") {
                        const tname = tn.getText();
                        if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
                            let toId = `external:${tname}`;
                            if (importMap) {
                                const deep = this.resolveImportedMemberToFileAndName(tname, tname, sourceFile, importMap, importSymbolMap);
                                if (deep)
                                    toId = `file:${deep.fileRel}:${deep.name}`;
                            }
                            try {
                                const m = toId.match(/^file:(.+?):(.+)$/);
                                if (m) {
                                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                    if (hit)
                                        toId = hit.id;
                                }
                                else if (toId.startsWith("external:")) {
                                    const nm = toId.slice("external:".length);
                                    const list = this.nameIndex.get(nm) || [];
                                    if (list.length === 1)
                                        toId = list[0].id;
                                }
                            }
                            catch (_76) { }
                            let pline;
                            let pcol;
                            try {
                                const pos = (_34 = (_33 = tn).getStart) === null || _34 === void 0 ? void 0 : _34.call(_33);
                                if (typeof pos === "number") {
                                    const lc = sourceFile.getLineAndColumnAtPos(pos);
                                    pline = lc.line;
                                    pcol = lc.column;
                                }
                            }
                            catch (_77) { }
                            const meta = { inferred: true, kind: "type", param: pname };
                            relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.PARAM_TYPE, meta));
                            const scope = toId.startsWith("external:")
                                ? "external"
                                : toId.startsWith("file:")
                                    ? "imported"
                                    : "local";
                            const depConfidence = scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
                            const depMeta = {
                                inferred: true,
                                kind: "dependency",
                                scope,
                                resolution: "type-annotation",
                                confidence: depConfidence,
                                param: pname,
                            };
                            relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.DEPENDS_ON, depMeta));
                        }
                    }
                    else {
                        // Fallback: infer param type via type checker
                        try {
                            const t = (_35 = p.getType) === null || _35 === void 0 ? void 0 : _35.call(p);
                            let tname = "";
                            try {
                                tname = (((_38 = (_37 = (_36 = t === null || t === void 0 ? void 0 : t.getSymbol) === null || _36 === void 0 ? void 0 : _36.call(t)) === null || _37 === void 0 ? void 0 : _37.getName) === null || _38 === void 0 ? void 0 : _38.call(_37)) || "").toString();
                            }
                            catch (_78) { }
                            if (!tname) {
                                try {
                                    tname =
                                        typeof (t === null || t === void 0 ? void 0 : t.getText) === "function" ? String(t.getText()) : "";
                                }
                                catch (_79) { }
                            }
                            if (tname)
                                tname = String(tname).split(/[<|&]/)[0].trim();
                            if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
                                let toId = `external:${tname}`;
                                if (importMap) {
                                    const deep = this.resolveImportedMemberToFileAndName(tname, tname, sourceFile, importMap, importSymbolMap);
                                    if (deep)
                                        toId = `file:${deep.fileRel}:${deep.name}`;
                                }
                                try {
                                    const m = toId.match(/^file:(.+?):(.+)$/);
                                    if (m) {
                                        const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                                        if (hit)
                                            toId = hit.id;
                                    }
                                    else if (toId.startsWith("external:")) {
                                        const nm = toId.slice("external:".length);
                                        const list = this.nameIndex.get(nm) || [];
                                        if (list.length === 1)
                                            toId = list[0].id;
                                    }
                                }
                                catch (_80) { }
                                const meta = {
                                    inferred: true,
                                    kind: "type",
                                    param: pname,
                                    usedTypeChecker: true,
                                    resolution: "type-checker",
                                };
                                relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.PARAM_TYPE, meta));
                                const scope = toId.startsWith("external:")
                                    ? "external"
                                    : toId.startsWith("file:")
                                        ? "imported"
                                        : "local";
                                const depConfidence = scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
                                const depMeta = {
                                    inferred: true,
                                    kind: "dependency",
                                    scope,
                                    resolution: "type-checker",
                                    confidence: depConfidence,
                                    param: pname,
                                };
                                relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.DEPENDS_ON, depMeta));
                            }
                        }
                        catch (_81) { }
                    }
                }
            }
            catch (_82) { }
            // Flush aggregated CALLS for this symbol (if any were recorded)
            if (callAgg.size > 0) {
                for (const [k, v] of callAgg.entries()) {
                    const toId = k.split("|")[1];
                    const meta = { ...v.meta, occurrencesScan: v.count };
                    relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.CALLS, meta));
                    const refMeta = {
                        ...meta,
                        kind: "reference",
                        via: (meta === null || meta === void 0 ? void 0 : meta.kind) || "call",
                    };
                    relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.REFERENCES, refMeta));
                    try {
                        if (((_39 = v.meta) === null || _39 === void 0 ? void 0 : _39.scope) === "imported") {
                            const depMeta = {
                                scope: "imported",
                                resolution: ((_40 = v.meta) === null || _40 === void 0 ? void 0 : _40.resolution) || "via-import",
                                kind: "dependency",
                                inferred: true,
                                confidence: typeof ((_41 = v.meta) === null || _41 === void 0 ? void 0 : _41.confidence) === "number"
                                    ? v.meta.confidence
                                    : 0.6,
                            };
                            relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.DEPENDS_ON, depMeta));
                        }
                    }
                    catch (_83) { }
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
    extractReferenceRelationships(sourceFile, fileEntity, localSymbols, importMap, importSymbolMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
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
        const isDeclarationName = (id) => {
            const p = id.getParent();
            if (!p)
                return false;
            return ((Node.isFunctionDeclaration(p) && p.getNameNode() === id) ||
                (Node.isClassDeclaration(p) && p.getNameNode() === id) ||
                (Node.isInterfaceDeclaration(p) && p.getNameNode() === id) ||
                (Node.isTypeAliasDeclaration(p) && p.getNameNode() === id) ||
                (Node.isVariableDeclaration(p) && p.getNameNode() === id) ||
                Node.isImportSpecifier(p) ||
                Node.isImportClause(p) ||
                Node.isNamespaceImport(p));
        };
        // Type dependencies (e.g., Foo<T>, param: Bar) — prefer same-file resolution if possible
        for (const tr of sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference)) {
            // Dedupe rule: skip TypeReference nodes that are directly the return type of a function/method
            try {
                const fnOwner = tr.getFirstAncestor((a) => Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a));
                if (fnOwner) {
                    const rtNode = (_b = (_a = fnOwner).getReturnTypeNode) === null || _b === void 0 ? void 0 : _b.call(_a);
                    if (rtNode && rtNode === tr)
                        continue;
                }
            }
            catch (_v) { }
            // Dedupe rule: skip when it's exactly the type annotation of a parameter
            try {
                const paramOwner = tr.getFirstAncestor((a) => a.getTypeNode &&
                    a.getName &&
                    Node.isParameterDeclaration(a));
                if (paramOwner) {
                    const tn = (_d = (_c = paramOwner).getTypeNode) === null || _d === void 0 ? void 0 : _d.call(_c);
                    if (tn && tn === tr)
                        continue;
                }
            }
            catch (_w) { }
            const typeName = tr.getTypeName().getText();
            if (!typeName)
                continue;
            if (this.stopNames.has(typeName.toLowerCase()) ||
                typeName.length < noiseConfig.AST_MIN_NAME_LENGTH)
                continue;
            const fromId = enclosingSymbolId(tr);
            // Attempt direct same-file resolution via local symbols map
            const key = `${fileEntity.path}:${typeName}`;
            const local = localSymbols.find((ls) => ls.entity.path === key);
            if (local) {
                const nm = local.entity.name || "";
                addRel(fromId, local.entity.id, RelationshipType.TYPE_USES, tr, {
                    isExported: !!local.entity.isExported,
                    nameLength: typeof nm === "string" ? nm.length : undefined,
                    kindHint: "type",
                    scope: "local",
                    resolution: "direct",
                });
            }
            else {
                // Use generic external:NAME target; resolver will map to concrete symbol
                addRel(fromId, `external:${typeName}`, RelationshipType.TYPE_USES, tr, {
                    nameLength: typeName === null || typeName === void 0 ? void 0 : typeName.length,
                    kindHint: "type",
                    scope: "external",
                    resolution: "heuristic",
                });
            }
        }
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
            if (isDeclarationName(id))
                continue;
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
                    const op = ((_h = (_g = (_f = (_e = be).getOperatorToken) === null || _f === void 0 ? void 0 : _f.call(_e)) === null || _g === void 0 ? void 0 : _g.getText) === null || _h === void 0 ? void 0 : _h.call(_g)) || "";
                    if (!assignOps.has(op))
                        continue;
                    const lhs = (_k = (_j = be).getLeft) === null || _k === void 0 ? void 0 : _k.call(_j);
                    const rhs = (_m = (_l = be).getRight) === null || _m === void 0 ? void 0 : _m.call(_l);
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
                                catch (_x) { }
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
                                    catch (_y) { }
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
                                    catch (_z) { }
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
                            catch (_0) { }
                            // Destructuring assignment writes: ({a} = rhs) or ([x] = rhs)
                            try {
                                const kind = lhs.getKind && lhs.getKind();
                                if (kind === SyntaxKind.ObjectLiteralExpression) {
                                    const props = ((_p = (_o = lhs).getProperties) === null || _p === void 0 ? void 0 : _p.call(_o)) || [];
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
                                        catch (_1) { }
                                    }
                                }
                                else if (kind === SyntaxKind.ArrayLiteralExpression) {
                                    const elems = ((_r = (_q = lhs).getElements) === null || _r === void 0 ? void 0 : _r.call(_q)) || [];
                                    for (const el of elems) {
                                        try {
                                            const nm = typeof el.getText === "function" ? el.getText() : "";
                                            if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                                                const tid = resolveNameToId(nm);
                                                addRel(fromId, tid, RelationshipType.WRITES, el, { kindHint: "write", operator: op });
                                            }
                                        }
                                        catch (_2) { }
                                    }
                                }
                            }
                            catch (_3) { }
                        }
                    }
                    // READS: collect identifiers from RHS (basic)
                    if (rhs && typeof rhs.getDescendantsOfKind === "function") {
                        const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
                        for (const idn of ids) {
                            const t = idn.getText();
                            if (!t || isDeclarationName(idn))
                                continue;
                            const key = `${fileEntity.path}:${t}`;
                            const local = localSymbols.find((ls) => ls.entity.path === key);
                            // detect access path if part of a property access
                            let accessPath;
                            try {
                                const parent = (_t = (_s = idn).getParent) === null || _t === void 0 ? void 0 : _t.call(_s);
                                if (parent &&
                                    typeof parent.getKind === "function" &&
                                    parent.getKind() === SyntaxKind.PropertyAccessExpression &&
                                    typeof parent.getText === "function") {
                                    accessPath = parent.getText();
                                }
                            }
                            catch (_4) { }
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
                                    catch (_5) { }
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
                                    catch (_6) { }
                                    // 4) Fallback external
                                    addRel(fromId, `external:${propName}`, RelationshipType.READS, pa, {
                                        kindHint: "read",
                                        accessPath,
                                        scope: "external",
                                        resolution: "heuristic",
                                    });
                                }
                                catch (_7) { }
                            }
                        }
                        catch (_8) { }
                    }
                }
                catch (_9) { }
            }
        }
        catch (_10) { }
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
                    inferred: ((_u = meta === null || meta === void 0 ? void 0 : meta.inferred) !== null && _u !== void 0 ? _u : true),
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
    extractImportRelationships(sourceFile, fileEntity, importMap, importSymbolMap) {
        const relationships = [];
        const imports = sourceFile.getImportDeclarations();
        for (const importDecl of imports) {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            if (!moduleSpecifier)
                continue;
            // Side-effect import: import './x'
            if (importDecl.getNamedImports().length === 0 &&
                !importDecl.getDefaultImport() &&
                !importDecl.getNamespaceImport()) {
                const modSf = importDecl.getModuleSpecifierSourceFile();
                if (modSf) {
                    const abs = modSf.getFilePath();
                    const rel = path.relative(process.cwd(), abs);
                    relationships.push(this.createRelationship(fileEntity.id, `file:${rel}:${path.basename(rel)}`, RelationshipType.IMPORTS, {
                        importKind: "side-effect",
                        module: moduleSpecifier,
                        language: fileEntity.language,
                    }));
                }
                else {
                    relationships.push(this.createRelationship(fileEntity.id, `import:${moduleSpecifier}:*`, RelationshipType.IMPORTS, {
                        importKind: "side-effect",
                        module: moduleSpecifier,
                        language: fileEntity.language,
                    }));
                }
            }
            // Default import
            const def = importDecl.getDefaultImport();
            if (def) {
                const alias = def.getText();
                if (alias) {
                    const target = importMap === null || importMap === void 0 ? void 0 : importMap.get(alias);
                    if (target) {
                        // Link to module default export placeholder in target file
                        relationships.push(this.createRelationship(fileEntity.id, `file:${target}:default`, RelationshipType.IMPORTS, {
                            importKind: "default",
                            alias,
                            module: moduleSpecifier,
                            language: fileEntity.language,
                        }));
                    }
                    else {
                        relationships.push(this.createRelationship(fileEntity.id, `import:${moduleSpecifier}:default`, RelationshipType.IMPORTS, {
                            importKind: "default",
                            alias,
                            module: moduleSpecifier,
                            language: fileEntity.language,
                        }));
                    }
                }
            }
            // Namespace import: import * as NS from '...'
            const ns = importDecl.getNamespaceImport();
            if (ns) {
                const alias = ns.getText();
                const target = alias ? importMap === null || importMap === void 0 ? void 0 : importMap.get(alias) : undefined;
                if (target) {
                    relationships.push(this.createRelationship(fileEntity.id, `file:${target}:*`, RelationshipType.IMPORTS, {
                        importKind: "namespace",
                        alias,
                        module: moduleSpecifier,
                        language: fileEntity.language,
                    }));
                }
                else {
                    relationships.push(this.createRelationship(fileEntity.id, `import:${moduleSpecifier}:*`, RelationshipType.IMPORTS, {
                        importKind: "namespace",
                        alias,
                        module: moduleSpecifier,
                        language: fileEntity.language,
                    }));
                }
            }
            // Named imports
            for (const ni of importDecl.getNamedImports()) {
                const name = ni.getNameNode().getText();
                const aliasNode = ni.getAliasNode();
                const alias = aliasNode ? aliasNode.getText() : undefined;
                let resolved = null;
                try {
                    const modSf = importDecl.getModuleSpecifierSourceFile();
                    const resolvedMap = this.getModuleExportMap(modSf || undefined);
                    const hit = resolvedMap.get(name) ||
                        (alias ? resolvedMap.get(alias) : undefined);
                    if (hit)
                        resolved = hit;
                }
                catch (_a) { }
                if (!resolved && importMap) {
                    const root = alias || name;
                    const t = importMap.get(root);
                    if (t)
                        resolved = { fileRel: t, name, depth: 1 };
                }
                if (resolved) {
                    relationships.push(this.createRelationship(fileEntity.id, `file:${resolved.fileRel}:${resolved.name}`, RelationshipType.IMPORTS, {
                        importKind: "named",
                        alias,
                        module: moduleSpecifier,
                        importDepth: resolved.depth,
                        language: fileEntity.language,
                    }));
                }
                else {
                    relationships.push(this.createRelationship(fileEntity.id, `import:${moduleSpecifier}:${alias || name}`, RelationshipType.IMPORTS, {
                        importKind: "named",
                        alias,
                        module: moduleSpecifier,
                        language: fileEntity.language,
                    }));
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
    createRelationship(fromId, toId, type, metadata) {
        // Ensure a sensible default for code-edge source to aid querying
        try {
            if (metadata && metadata.source == null) {
                const md = metadata;
                if (md.usedTypeChecker === true || md.resolution === "type-checker")
                    md.source = "type-checker";
                else
                    md.source = "ast";
            }
        }
        catch (_a) { }
        // Deterministic relationship id using canonical target key for stable identity across resolutions
        const rid = canonicalRelationshipId(fromId, {
            toEntityId: toId,
            type,
        });
        const rel = {
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
            if (!rel.toRef) {
                const t = String(toId || "");
                // file:<relPath>:<name> -> fileSymbol
                const mFile = t.match(/^file:(.+?):(.+)$/);
                if (mFile) {
                    rel.toRef = {
                        kind: "fileSymbol",
                        file: mFile[1],
                        symbol: mFile[2],
                        name: mFile[2],
                    };
                }
                else if (t.startsWith("external:")) {
                    // external:<name> -> external
                    rel.toRef = {
                        kind: "external",
                        name: t.slice("external:".length),
                    };
                }
                else if (/^(class|interface|function|typeAlias):/.test(t)) {
                    // kind-qualified placeholder without file: treat as external-like symbolic ref
                    const parts = t.split(":");
                    rel.toRef = {
                        kind: "external",
                        name: parts.slice(1).join(":"),
                    };
                }
                // For sym:/file: IDs, check if they can be parsed as file symbols
                else if (/^(sym:|file:)/.test(t)) {
                    // Check if sym: can be parsed
                    const isParsableSym = t.startsWith("sym:") && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
                    const isParsableFile = t.startsWith("file:") && /^file:(.+?):(.+)$/.test(t);
                    if (!isParsableSym && !isParsableFile) {
                        rel.toRef = { kind: "entity", id: t };
                    }
                }
            }
        }
        catch (_b) { }
        // Attach a basic fromRef to aid coordinator context (file resolution, etc.)
        try {
            if (!rel.fromRef) {
                // We don't attempt to decode file/symbol here; coordinator can fetch entity by id
                rel.fromRef = { kind: "entity", id: fromId };
            }
        }
        catch (_c) { }
        // Normalize code-edge evidence and fields consistently
        return normalizeCodeEdge(rel);
    }
}
//# sourceMappingURL=RelationshipBuilder.js.map