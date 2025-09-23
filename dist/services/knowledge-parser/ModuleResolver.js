/**
 * Module Resolution System
 *
 * Handles TypeScript module resolution, re-exports, and cross-file symbol mapping.
 * This module provides functionality to resolve module specifiers, track re-exports,
 * and map imported symbols to their actual definitions across the codebase.
 */
import * as ts from "typescript";
import * as path from "path";
import * as fsSync from "fs";
import { TypeCheckerBudget } from "./TypeCheckerBudget.js";
/**
 * ModuleResolver handles all module resolution operations including:
 * - Resolving module specifiers to source files
 * - Mapping re-exports across modules
 * - Resolving imported member names to their actual definitions
 * - Cross-file symbol resolution using TypeScript's type checker
 */
export class ModuleResolver {
    /**
     * Creates a new ModuleResolver instance
     *
     * @param options - Configuration options for the resolver
     */
    constructor(options) {
        // Cache for export maps to avoid redundant computation
        this.exportMapCache = new Map();
        this.tsProject = options.tsProject;
        this.tsPathOptions = options.tsPathOptions || null;
        this.maxReexportDepth = options.maxReexportDepth || 4;
        this.typeCheckerBudget = new TypeCheckerBudget();
    }
    /**
     * Sets the TypeChecker budget for resolution operations
     *
     * @param budget - Budget limit for type checker operations
     */
    setBudget(budget) {
        this.typeCheckerBudget.initializeBudget(budget);
    }
    /**
     * Resets the export map cache
     * Used when files are modified to ensure fresh resolution
     */
    clearExportMapCache() {
        this.exportMapCache.clear();
    }
    /**
     * Resolves a module specifier to a TypeScript source file using TS module resolution
     * Supports tsconfig path mapping and standard Node.js resolution
     *
     * @param specifier - The module specifier to resolve (e.g., './utils', '@/components')
     * @param fromFile - The source file containing the import
     * @returns The resolved source file or null if not found
     */
    resolveModuleSpecifierToSourceFile(specifier, fromFile) {
        var _a;
        try {
            if (!specifier)
                return null;
            // Combine project compiler options with tsconfig path options
            const compilerOpts = {
                ...this.tsProject.getCompilerOptions(),
                ...(this.tsPathOptions || {}),
            };
            const containingFile = fromFile.getFilePath();
            // Use TypeScript's module resolution algorithm
            const resolved = ts.resolveModuleName(specifier, containingFile, compilerOpts, ts.sys);
            if (!((_a = resolved.resolvedModule) === null || _a === void 0 ? void 0 : _a.resolvedFileName))
                return null;
            let candidate = resolved.resolvedModule.resolvedFileName;
            // Prefer .ts over .d.ts files when both exist
            const prefer = fsSync.existsSync(candidate.replace(/\.d\.ts$/, ".ts"))
                ? candidate.replace(/\.d\.ts$/, ".ts")
                : candidate;
            // Try to get existing source file from project
            let sf = this.tsProject.getSourceFile(prefer);
            if (!sf) {
                try {
                    // Add the file to the project if not already present
                    sf = this.tsProject.addSourceFileAtPath(prefer);
                }
                catch (_b) {
                    // Ignore errors if file can't be added
                }
            }
            return sf || null;
        }
        catch (_c) {
            return null;
        }
    }
    /**
     * Resolves re-exports to find the actual source of an exported symbol
     * Recursively follows export chains up to maxReexportDepth levels
     *
     * @param symbolName - The name of the symbol to resolve
     * @param moduleSf - The source file containing the re-export
     * @param depth - Current recursion depth (internal)
     * @param seen - Set of visited files to prevent cycles (internal)
     * @returns Resolution result or null if not found
     */
    resolveReexportTarget(symbolName, moduleSf, depth = 0, seen = new Set()) {
        var _a, _b;
        try {
            if (!moduleSf || depth >= this.maxReexportDepth)
                return null;
            const key = moduleSf.getFilePath();
            if (seen.has(key))
                return null;
            seen.add(key);
            // Check all export declarations in the module
            for (const ed of moduleSf.getExportDeclarations()) {
                if (!ed.getModuleSpecifier())
                    continue;
                // Get the target module source file
                let spec = ed.getModuleSpecifierSourceFile();
                if (!spec) {
                    const modText = (_a = ed.getModuleSpecifierValue) === null || _a === void 0 ? void 0 : _a.call(ed);
                    if (modText) {
                        spec = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                            undefined;
                    }
                }
                const named = ed.getNamedExports();
                // Handle named re-exports: export { A as B } from './x'
                if (named && named.length > 0) {
                    for (const ne of named) {
                        const name = ne.getNameNode().getText();
                        const alias = (_b = ne.getAliasNode()) === null || _b === void 0 ? void 0 : _b.getText();
                        if (name === symbolName || alias === symbolName) {
                            if (spec) {
                                const childMap = this.getModuleExportMap(spec, depth + 1, seen);
                                const viaName = childMap.get(name);
                                if (viaName) {
                                    return {
                                        fileRel: viaName.fileRel,
                                        exportedName: viaName.name,
                                    };
                                }
                            }
                            return null;
                        }
                    }
                    continue;
                }
                // Handle star re-exports: export * from './x'
                const hasNamespace = ed.getNamespaceExport
                    ? !!ed.getNamespaceExport()
                    : false;
                const isStarExport = !hasNamespace && (!named || named.length === 0);
                if (isStarExport) {
                    const res = this.resolveReexportTarget(symbolName, spec, depth + 1, seen);
                    if (res)
                        return res;
                }
            }
            return null;
        }
        catch (_c) {
            return null;
        }
    }
    /**
     * Builds a comprehensive map of exported names to their source definitions
     * Resolves re-exports recursively up to maxReexportDepth levels
     *
     * @param moduleSf - The source file to analyze
     * @param depth - Current recursion depth (internal)
     * @param seen - Set of visited files to prevent cycles (internal)
     * @returns Map of export names to their resolved definitions
     */
    getModuleExportMap(moduleSf, depth = 0, seen = new Set()) {
        var _a, _b, _c;
        const out = new Map();
        if (!moduleSf || depth >= this.maxReexportDepth)
            return out;
        const key = moduleSf.getFilePath();
        if (seen.has(key))
            return out;
        seen.add(key);
        // Check cache first
        const cacheKey = `${key}:${depth}`;
        if (this.exportMapCache.has(cacheKey)) {
            return this.exportMapCache.get(cacheKey);
        }
        const fileRel = path.relative(process.cwd(), key);
        /**
         * Helper to add an export to the map
         */
        const addExport = (exportedName, actualName, actualFileRel, currentDepth) => {
            if (!out.has(exportedName)) {
                out.set(exportedName, {
                    fileRel: actualFileRel,
                    name: actualName,
                    depth: currentDepth,
                });
            }
        };
        try {
            // Add direct exports from this file
            // Variable declarations: export const x = ...
            for (const vd of moduleSf.getVariableDeclarations()) {
                if (vd.isExported()) {
                    const name = vd.getName();
                    addExport(name, name, fileRel, depth);
                }
            }
            // Function declarations: export function foo() {}
            for (const fd of moduleSf.getFunctions()) {
                if (fd.isExported()) {
                    const name = fd.getName();
                    if (name)
                        addExport(name, name, fileRel, depth);
                }
            }
            // Class declarations: export class MyClass {}
            for (const cd of moduleSf.getClasses()) {
                if (cd.isExported()) {
                    const name = cd.getName();
                    if (name)
                        addExport(name, name, fileRel, depth);
                }
            }
            // Interface declarations: export interface IFoo {}
            for (const id of moduleSf.getInterfaces()) {
                if (id.isExported()) {
                    const name = id.getName();
                    addExport(name, name, fileRel, depth);
                }
            }
            // Type alias declarations: export type Foo = string
            for (const ta of moduleSf.getTypeAliases()) {
                if (ta.isExported()) {
                    const name = ta.getName();
                    addExport(name, name, fileRel, depth);
                }
            }
            // Enum declarations: export enum Color {}
            for (const ed of moduleSf.getEnums()) {
                if (ed.isExported()) {
                    const name = ed.getName();
                    addExport(name, name, fileRel, depth);
                }
            }
            // Default export
            const defaultExport = moduleSf.getDefaultExportSymbol();
            if (defaultExport) {
                const name = defaultExport.getName();
                addExport("default", name, fileRel, depth);
            }
            // Process re-export declarations
            for (const ed of moduleSf.getExportDeclarations()) {
                if (!ed.getModuleSpecifier())
                    continue;
                // Get target source file
                let specSf = ed.getModuleSpecifierSourceFile();
                if (!specSf) {
                    const modText = (_a = ed.getModuleSpecifierValue) === null || _a === void 0 ? void 0 : _a.call(ed);
                    if (modText) {
                        specSf = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                            undefined;
                    }
                }
                const namespaceExport = ed.getNamespaceExport
                    ? (_b = ed.getNamespaceExport()) === null || _b === void 0 ? void 0 : _b.getText()
                    : undefined;
                const named = ed.getNamedExports();
                const isStarExport = !namespaceExport && named.length === 0;
                // Handle star re-exports: export * from './module'
                if (isStarExport) {
                    const child = this.getModuleExportMap(specSf, depth + 1, seen);
                    child.forEach((v, k) => {
                        if (!out.has(k)) {
                            out.set(k, { fileRel: v.fileRel, name: v.name, depth: v.depth });
                        }
                    });
                    continue;
                }
                // Handle named re-exports: export { A, B as C } from './module'
                for (const ne of named) {
                    const name = ne.getNameNode().getText();
                    const alias = (_c = ne.getAliasNode()) === null || _c === void 0 ? void 0 : _c.getText();
                    if (specSf) {
                        const child = this.getModuleExportMap(specSf, depth + 1, seen);
                        const chosen = child.get(name) || child.get(alias || "");
                        if (chosen) {
                            addExport(alias || name, chosen.name, chosen.fileRel, chosen.depth);
                        }
                    }
                }
            }
        }
        catch (_d) {
            // Ignore parsing errors and return partial results
        }
        // Cache the result
        this.exportMapCache.set(cacheKey, out);
        return out;
    }
    /**
     * Resolves an imported member name to its actual file and symbol name
     * Handles various import patterns including defaults, named imports, and namespace imports
     *
     * @param rootOrAlias - The root import name or alias
     * @param member - The specific member name or "default"
     * @param sourceFile - The source file containing the import
     * @param importMap - Map of import names to target file paths
     * @param importSymbolMap - Map of import names to their actual symbol names
     * @returns Resolved symbol information or null if not found
     */
    resolveImportedMemberToFileAndName(rootOrAlias, member, sourceFile, importMap, importSymbolMap) {
        try {
            const targetRel = importMap === null || importMap === void 0 ? void 0 : importMap.get(rootOrAlias);
            if (!targetRel)
                return null;
            const hintName = importSymbolMap === null || importSymbolMap === void 0 ? void 0 : importSymbolMap.get(rootOrAlias);
            // Resolve target file
            const targetAbs = path.isAbsolute(targetRel)
                ? targetRel
                : path.resolve(process.cwd(), targetRel);
            const modSf = this.tsProject.getSourceFile(targetAbs) ||
                sourceFile.getProject().getSourceFile(targetAbs);
            const exportMap = this.getModuleExportMap(modSf);
            // Try different candidate names in order of preference
            const candidateNames = [];
            if (hintName)
                candidateNames.push(hintName);
            candidateNames.push(member);
            if (member === "default")
                candidateNames.push("default");
            for (const candidate of candidateNames) {
                const found = exportMap.get(candidate);
                if (found)
                    return found;
            }
            return null;
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Uses TypeScript's type checker to resolve a node to its declaring file and symbol name
     * This is a best-effort resolution that may fail for complex cases
     *
     * @param node - The AST node to resolve
     * @param sourceFile - The source file containing the node
     * @returns Resolved symbol information or null if not resolvable
     */
    resolveWithTypeChecker(node, sourceFile) {
        var _a, _b, _c, _d;
        try {
            if (!node)
                return null;
            const checker = this.tsProject.getTypeChecker();
            // Get symbol at the node location
            const sym = (_b = (_a = checker).getSymbolAtLocation) === null || _b === void 0 ? void 0 : _b.call(_a, node);
            const target = ((_c = sym === null || sym === void 0 ? void 0 : sym.getAliasedSymbol) === null || _c === void 0 ? void 0 : _c.call(sym)) || sym;
            if (!target)
                return null;
            // Get the first declaration of the symbol
            const declarations = Array.isArray((_d = target.getDeclarations) === null || _d === void 0 ? void 0 : _d.call(target))
                ? target.getDeclarations()
                : [];
            const firstDecl = declarations[0];
            if (!firstDecl)
                return null;
            // Get the source file of the declaration
            const declSf = typeof firstDecl.getSourceFile === "function"
                ? firstDecl.getSourceFile()
                : null;
            if (!declSf)
                return null;
            const filePath = declSf.getFilePath();
            const fileRel = path.relative(process.cwd(), filePath);
            const name = target.getName();
            return { fileRel, name };
        }
        catch (_e) {
            return null;
        }
    }
    /**
     * Resolves a call expression target using TypeScript's type checker
     * Attempts to find the actual function or method being called
     *
     * @param callNode - The call expression node
     * @param sourceFile - The source file containing the call
     * @returns Resolved call target information or null if not resolvable
     */
    resolveCallTargetWithChecker(callNode, sourceFile) {
        var _a, _b, _c, _d, _e;
        try {
            const checker = this.tsProject.getTypeChecker();
            // Try to get the resolved signature of the call
            const sig = (_b = (_a = checker).getResolvedSignature) === null || _b === void 0 ? void 0 : _b.call(_a, callNode);
            const decl = ((_c = sig === null || sig === void 0 ? void 0 : sig.getDeclaration) === null || _c === void 0 ? void 0 : _c.call(sig)) || (sig === null || sig === void 0 ? void 0 : sig.declaration);
            if (!decl) {
                // Fallback: try to resolve the callee expression itself
                const expr = ((_e = (_d = callNode).getExpression) === null || _e === void 0 ? void 0 : _e.call(_d)) || null;
                return this.resolveWithTypeChecker(expr, sourceFile);
            }
            // Get the source file of the declaration
            const declSf = typeof decl.getSourceFile === "function"
                ? decl.getSourceFile()
                : null;
            if (!declSf)
                return null;
            const filePath = declSf.getFilePath();
            const fileRel = path.relative(process.cwd(), filePath);
            // Try to get the name from the declaration
            let name = "";
            if (typeof decl.getName === "function") {
                name = decl.getName();
            }
            else if (decl.name && typeof decl.name.getText === "function") {
                name = decl.name.getText();
            }
            return name ? { fileRel, name } : null;
        }
        catch (_f) {
            return null;
        }
    }
    /**
     * Checks if type checker should be used based on context and consumes budget
     *
     * @param opts - Options for determining type checker usage
     * @returns True if type checker should be used (and budget was consumed)
     */
    shouldUseTypeChecker(opts) {
        return this.typeCheckerBudget.shouldUseTypeChecker(opts);
    }
    /**
     * Gets the current type checker budget statistics
     *
     * @returns Budget statistics object
     */
    getBudgetStats() {
        return this.typeCheckerBudget.getBudgetStats();
    }
}
//# sourceMappingURL=ModuleResolver.js.map