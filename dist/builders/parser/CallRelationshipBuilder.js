/**
 * CallRelationshipBuilder - Handles function/method calls, method overrides, and throws relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles CALLS, OVERRIDES, and THROWS relationship types with confidence scoring
 * and evidence collection.
 */
import { Node, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import { RelationshipType, } from "../../models/relationships.js";
import { scoreInferredEdge } from "../../utils/confidence.js";
import { noiseConfig } from "../../config/noise.js";
/**
 * CallRelationshipBuilder handles the extraction of call-related relationships
 * including function/method calls, method overrides, and exception throwing.
 */
export class CallRelationshipBuilder {
    constructor(options) {
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
    extractCallRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        const relationships = [];
        // Extract function calls
        if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
            relationships.push(...this.extractFunctionCalls(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        }
        // Extract method-level semantics: OVERRIDES, THROWS
        if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
            relationships.push(...this.extractMethodOverrides(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
            relationships.push(...this.extractThrows(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        }
        return relationships;
    }
    /**
     * Extracts function and method call relationships.
     */
    extractFunctionCalls(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
        const relationships = [];
        // Aggregate repeated CALLS per target for this symbol
        const callAgg = new Map();
        const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
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
                catch (_4) { }
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
                catch (_5) { }
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
                            catch (_6) { }
                        }
                    }
                }
                catch (_7) { }
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
                                if (localIndex && localIndex.has(keyBase)) {
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
                catch (_8) { }
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
                if (localIndex && localIndex.has(key)) {
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
                catch (_9) { }
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
                catch (_10) { }
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
            catch (_11) {
                // Fallback to generic placeholder
                // Intentionally skip emitting a relationship on failure to avoid noise
            }
        }
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
                    if (((_1 = v.meta) === null || _1 === void 0 ? void 0 : _1.scope) === "imported") {
                        const depMeta = {
                            scope: "imported",
                            resolution: ((_2 = v.meta) === null || _2 === void 0 ? void 0 : _2.resolution) || "via-import",
                            kind: "dependency",
                            inferred: true,
                            confidence: typeof ((_3 = v.meta) === null || _3 === void 0 ? void 0 : _3.confidence) === "number"
                                ? v.meta.confidence
                                : 0.6,
                        };
                        relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.DEPENDS_ON, depMeta));
                    }
                }
                catch (_12) { }
            }
            callAgg.clear();
        }
        return relationships;
    }
    /**
     * Extracts method override relationships.
     */
    extractMethodOverrides(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        var _a, _b, _c, _d, _e, _f;
        const relationships = [];
        try {
            // OVERRIDES: only for methods inside classes
            if (Node.isMethodDeclaration(node)) {
                const ownerClass = node.getFirstAncestor((a) => Node.isClassDeclaration(a));
                const nameNode = (_b = (_a = node).getNameNode) === null || _b === void 0 ? void 0 : _b.call(_a);
                const methodName = (typeof (nameNode === null || nameNode === void 0 ? void 0 : nameNode.getText) === "function"
                    ? nameNode.getText()
                    : (_d = (_c = node).getName) === null || _d === void 0 ? void 0 : _d.call(_c)) || "";
                if (ownerClass && methodName) {
                    const heritage = ((_f = (_e = ownerClass).getHeritageClauses) === null || _f === void 0 ? void 0 : _f.call(_e)) || [];
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
                                catch (_g) { }
                                if (baseFile) {
                                    // Prefer linking to exact base method symbol if known
                                    let toId = `file:${baseFile}:${methodName}`;
                                    try {
                                        const hit = this.globalSymbolIndex.get(`${baseFile}:${methodName}`);
                                        if (hit)
                                            toId = hit.id;
                                    }
                                    catch (_h) { }
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
        catch (_j) { }
        return relationships;
    }
    /**
     * Extracts throw statement relationships.
     */
    extractThrows(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        var _a, _b, _c, _d, _e, _f, _g;
        const relationships = [];
        try {
            // THROWS: throw new ErrorType()
            const throws = ((_b = (_a = node).getDescendantsOfKind) === null || _b === void 0 ? void 0 : _b.call(_a, SyntaxKind.ThrowStatement)) || [];
            for (const th of throws) {
                try {
                    const expr = (_c = th.getExpression) === null || _c === void 0 ? void 0 : _c.call(th);
                    let typeName = "";
                    if (expr &&
                        expr.getExpression &&
                        typeof expr.getExpression === "function") {
                        // new ErrorType()
                        const e = expr.getExpression();
                        typeName = ((_d = e === null || e === void 0 ? void 0 : e.getText) === null || _d === void 0 ? void 0 : _d.call(e)) || "";
                    }
                    else {
                        typeName = ((_e = expr === null || expr === void 0 ? void 0 : expr.getText) === null || _e === void 0 ? void 0 : _e.call(expr)) || "";
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
                        const candidate = localIndex && localIndex.get(key);
                        if (candidate) {
                            toId = candidate;
                        }
                    }
                    // attach throw site location
                    let tline;
                    let tcol;
                    try {
                        const pos = (_g = (_f = th).getStart) === null || _g === void 0 ? void 0 : _g.call(_f);
                        if (typeof pos === "number") {
                            const lc = sourceFile.getLineAndColumnAtPos(pos);
                            tline = lc.line;
                            tcol = lc.column;
                        }
                    }
                    catch (_h) { }
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
                    catch (_j) { }
                    relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.THROWS, meta));
                }
                catch (_k) { }
            }
        }
        catch (_l) { }
        return relationships;
    }
}
//# sourceMappingURL=CallRelationshipBuilder.js.map