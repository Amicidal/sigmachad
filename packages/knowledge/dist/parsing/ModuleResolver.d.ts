/**
 * Module Resolution System
 *
 * Handles TypeScript module resolution, re-exports, and cross-file symbol mapping.
 * This module provides functionality to resolve module specifiers, track re-exports,
 * and map imported symbols to their actual definitions across the codebase.
 */
import { Project, Node, SourceFile } from "ts-morph";
import * as ts from "typescript";
/**
 * Represents a resolved re-export mapping
 */
type ReexportResolution = {
    fileRel: string;
    exportedName: string;
};
/**
 * Represents a resolved symbol with file location and name
 */
export interface ResolvedSymbol {
    fileRel: string;
    name: string;
}
/**
 * Represents an export map entry with metadata
 */
export interface ExportMapEntry {
    fileRel: string;
    name: string;
    depth: number;
}
/**
 * Configuration options for module resolver
 */
export interface ModuleResolverOptions {
    tsProject: Project;
    tsPathOptions?: Partial<ts.CompilerOptions> | null;
    maxReexportDepth?: number;
}
/**
 * ModuleResolver handles all module resolution operations including:
 * - Resolving module specifiers to source files
 * - Mapping re-exports across modules
 * - Resolving imported member names to their actual definitions
 * - Cross-file symbol resolution using TypeScript's type checker
 */
export declare class ModuleResolver {
    private readonly tsProject;
    private readonly tsPathOptions;
    private readonly maxReexportDepth;
    private readonly typeCheckerBudget;
    private exportMapCache;
    /**
     * Creates a new ModuleResolver instance
     *
     * @param options - Configuration options for the resolver
     */
    constructor(options: ModuleResolverOptions);
    /**
     * Sets the TypeChecker budget for resolution operations
     *
     * @param budget - Budget limit for type checker operations
     */
    setBudget(budget: number): void;
    /**
     * Resets the export map cache
     * Used when files are modified to ensure fresh resolution
     */
    clearExportMapCache(): void;
    /**
     * Resolves a module specifier to a TypeScript source file using TS module resolution
     * Supports tsconfig path mapping and standard Node.js resolution
     *
     * @param specifier - The module specifier to resolve (e.g., './utils', '@/components')
     * @param fromFile - The source file containing the import
     * @returns The resolved source file or null if not found
     */
    resolveModuleSpecifierToSourceFile(specifier: string, fromFile: SourceFile): SourceFile | null;
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
    resolveReexportTarget(symbolName: string, moduleSf: SourceFile | undefined, depth?: number, seen?: Set<string>): ReexportResolution | null;
    /**
     * Builds a comprehensive map of exported names to their source definitions
     * Resolves re-exports recursively up to maxReexportDepth levels
     *
     * @param moduleSf - The source file to analyze
     * @param depth - Current recursion depth (internal)
     * @param seen - Set of visited files to prevent cycles (internal)
     * @returns Map of export names to their resolved definitions
     */
    getModuleExportMap(moduleSf: SourceFile | undefined, depth?: number, seen?: Set<string>): Map<string, ExportMapEntry>;
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
    resolveImportedMemberToFileAndName(rootOrAlias: string, member: string | "default", sourceFile: SourceFile, importMap?: Map<string, string>, importSymbolMap?: Map<string, string>): ExportMapEntry | null;
    /**
     * Uses TypeScript's type checker to resolve a node to its declaring file and symbol name
     * This is a best-effort resolution that may fail for complex cases
     *
     * @param node - The AST node to resolve
     * @param sourceFile - The source file containing the node
     * @returns Resolved symbol information or null if not resolvable
     */
    resolveWithTypeChecker(node: Node | undefined, sourceFile: SourceFile): ResolvedSymbol | null;
    /**
     * Resolves a call expression target using TypeScript's type checker
     * Attempts to find the actual function or method being called
     *
     * @param callNode - The call expression node
     * @param sourceFile - The source file containing the call
     * @returns Resolved call target information or null if not resolvable
     */
    resolveCallTargetWithChecker(callNode: Node, sourceFile: SourceFile): ResolvedSymbol | null;
    /**
     * Checks if type checker should be used based on context and consumes budget
     *
     * @param opts - Options for determining type checker usage
     * @returns True if type checker should be used (and budget was consumed)
     */
    shouldUseTypeChecker(opts: {
        context: "call" | "heritage" | "decorator" | "reference" | "export";
        imported?: boolean;
        ambiguous?: boolean;
        nameLength?: number;
    }): boolean;
    /**
     * Gets the current type checker budget statistics
     *
     * @returns Budget statistics object
     */
    getBudgetStats(): {
        remaining: number;
        spent: number;
        total: number;
        percentUsed: number;
    };
}
export {};
//# sourceMappingURL=ModuleResolver.d.ts.map