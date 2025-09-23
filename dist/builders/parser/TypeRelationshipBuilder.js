/**
 * TypeRelationshipBuilder - Handles type-related relationships
 *
 * Extracted from RelationshipBuilder.ts as part of the modular refactoring.
 * Handles EXTENDS, IMPLEMENTS, TYPE_USES, RETURNS_TYPE, PARAM_TYPE, and decorator relationships.
 */
import { Node, SyntaxKind } from "ts-morph";
import * as path from "path";
import { RelationshipType, } from "../../models/relationships.js";
import { noiseConfig } from "../../config/noise.js";
/**
 * TypeRelationshipBuilder handles the extraction of type-related relationships
 * including inheritance, type usage, decorators, return types, and parameter types.
 */
export class TypeRelationshipBuilder {
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
    extractTypeRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        const relationships = [];
        // Extract class inheritance
        if (Node.isClassDeclaration(node)) {
            relationships.push(...this.extractInheritance(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        }
        // Extract decorators
        relationships.push(...this.extractDecorators(node, symbolEntity, sourceFile, importMap, importSymbolMap));
        // Extract type usage and type annotations for functions/methods
        if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
            relationships.push(...this.extractFunctionTypeRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex));
        }
        return relationships;
    }
    /**
     * Extracts inheritance relationships (EXTENDS, IMPLEMENTS).
     */
    extractInheritance(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        var _a, _b, _c;
        const relationships = [];
        const heritageClauses = ((_b = (_a = node).getHeritageClauses) === null || _b === void 0 ? void 0 : _b.call(_a)) || [];
        for (const clause of heritageClauses) {
            if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
                for (const type of clause.getTypeNodes()) {
                    try {
                        const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
                        const simple = type.getText();
                        const key = `${sfPath}:${simple}`;
                        let toId = localIndex === null || localIndex === void 0 ? void 0 : localIndex.get(key);
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
                            catch (_d) { }
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
                                    nameLength: String(((_c = type.getText) === null || _c === void 0 ? void 0 : _c.call(type)) || "").length,
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
                            catch (_e) { }
                            relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.EXTENDS, resolved
                                ? { resolved: true, importDepth: resolved.depth }
                                : undefined));
                        }
                    }
                    catch (_f) {
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
                        let toId = localIndex === null || localIndex === void 0 ? void 0 : localIndex.get(key);
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
                            catch (_g) { }
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
                            catch (_h) { }
                            relationships.push(this.createRelationship(symbolEntity.id, placeholder, RelationshipType.IMPLEMENTS, resolved
                                ? { resolved: true, importDepth: resolved.depth }
                                : undefined));
                        }
                    }
                    catch (_j) {
                        relationships.push(this.createRelationship(symbolEntity.id, `interface:${type.getText()}`, RelationshipType.IMPLEMENTS));
                    }
                }
            }
        }
        return relationships;
    }
    /**
     * Extracts decorator relationships.
     */
    extractDecorators(node, symbolEntity, sourceFile, importMap, importSymbolMap) {
        var _a, _b, _c, _d, _e, _f, _g;
        const relationships = [];
        try {
            const getDecorators = (_b = (_a = node).getDecorators) === null || _b === void 0 ? void 0 : _b.call(_a);
            const decs = Array.isArray(getDecorators) ? getDecorators : [];
            for (const d of decs) {
                try {
                    const expr = ((_c = d.getExpression) === null || _c === void 0 ? void 0 : _c.call(d)) || ((_d = d.getNameNode) === null || _d === void 0 ? void 0 : _d.call(d)) || null;
                    let accessPath = "";
                    let simpleName = "";
                    if (expr && typeof expr.getText === "function") {
                        accessPath = String(expr.getText());
                        const base = accessPath.split("(")[0];
                        simpleName = (base.split(".").pop() || base).trim();
                    }
                    if (!simpleName)
                        continue;
                    if (((_e = this.stopNames) === null || _e === void 0 ? void 0 : _e.has(simpleName.toLowerCase())) ||
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
                    catch (_h) { }
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
                        const pos = (_g = (_f = d).getStart) === null || _g === void 0 ? void 0 : _g.call(_f);
                        if (typeof pos === "number") {
                            const lc = sourceFile.getLineAndColumnAtPos(pos);
                            line = lc.line;
                            column = lc.column;
                        }
                    }
                    catch (_j) { }
                    const meta = {
                        kind: "decorator",
                        accessPath,
                        path: path.relative(process.cwd(), sourceFile.getFilePath()),
                        ...(typeof line === "number" ? { line } : {}),
                        ...(typeof column === "number" ? { column } : {}),
                    };
                    relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.REFERENCES, meta));
                }
                catch (_k) { }
            }
        }
        catch (_l) { }
        return relationships;
    }
    /**
     * Extracts function/method type relationships (return types, parameter types).
     */
    extractFunctionTypeRelationships(node, symbolEntity, sourceFile, importMap, importSymbolMap, localIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        const relationships = [];
        try {
            // RETURNS_TYPE
            const rt = (_b = (_a = node).getReturnTypeNode) === null || _b === void 0 ? void 0 : _b.call(_a);
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
                    catch (_v) { }
                    let line;
                    let column;
                    try {
                        const pos = (_d = (_c = rt).getStart) === null || _d === void 0 ? void 0 : _d.call(_c);
                        if (typeof pos === "number") {
                            const lc = sourceFile.getLineAndColumnAtPos(pos);
                            line = lc.line;
                            column = lc.column;
                        }
                    }
                    catch (_w) { }
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
                    catch (_x) { }
                    relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.RETURNS_TYPE, meta));
                }
            }
            else {
                // Fallback: infer return type via type checker when annotation is missing
                try {
                    const t = (_f = (_e = node).getReturnType) === null || _f === void 0 ? void 0 : _f.call(_e);
                    // Attempt to obtain a readable base name
                    let tname = "";
                    try {
                        tname = (((_j = (_h = (_g = t === null || t === void 0 ? void 0 : t.getSymbol) === null || _g === void 0 ? void 0 : _g.call(t)) === null || _h === void 0 ? void 0 : _h.getName) === null || _j === void 0 ? void 0 : _j.call(_h)) || "").toString();
                    }
                    catch (_y) { }
                    if (!tname) {
                        try {
                            tname =
                                typeof (t === null || t === void 0 ? void 0 : t.getText) === "function" ? String(t.getText()) : "";
                        }
                        catch (_z) { }
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
                        catch (_0) { }
                        const meta = {
                            inferred: true,
                            kind: "type",
                            usedTypeChecker: true,
                            resolution: "type-checker",
                        };
                        relationships.push(this.createRelationship(symbolEntity.id, toId, RelationshipType.RETURNS_TYPE, meta));
                    }
                }
                catch (_1) { }
            }
        }
        catch (_2) { }
        try {
            // PARAM_TYPE per parameter
            const params = ((_l = (_k = node).getParameters) === null || _l === void 0 ? void 0 : _l.call(_k)) || [];
            for (const p of params) {
                const tn = (_m = p.getTypeNode) === null || _m === void 0 ? void 0 : _m.call(p);
                const pname = ((_o = p.getName) === null || _o === void 0 ? void 0 : _o.call(p)) || "";
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
                        catch (_3) { }
                        let pline;
                        let pcol;
                        try {
                            const pos = (_q = (_p = tn).getStart) === null || _q === void 0 ? void 0 : _q.call(_p);
                            if (typeof pos === "number") {
                                const lc = sourceFile.getLineAndColumnAtPos(pos);
                                pline = lc.line;
                                pcol = lc.column;
                            }
                        }
                        catch (_4) { }
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
                        const t = (_r = p.getType) === null || _r === void 0 ? void 0 : _r.call(p);
                        let tname = "";
                        try {
                            tname = (((_u = (_t = (_s = t === null || t === void 0 ? void 0 : t.getSymbol) === null || _s === void 0 ? void 0 : _s.call(t)) === null || _t === void 0 ? void 0 : _t.getName) === null || _u === void 0 ? void 0 : _u.call(_t)) || "").toString();
                        }
                        catch (_5) { }
                        if (!tname) {
                            try {
                                tname =
                                    typeof (t === null || t === void 0 ? void 0 : t.getText) === "function" ? String(t.getText()) : "";
                            }
                            catch (_6) { }
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
                            catch (_7) { }
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
                    catch (_8) { }
                }
            }
        }
        catch (_9) { }
        return relationships;
    }
}
//# sourceMappingURL=TypeRelationshipBuilder.js.map