/**
 * Module Resolution System
 *
 * Handles TypeScript module resolution, re-exports, and cross-file symbol mapping.
 * This module provides functionality to resolve module specifiers, track re-exports,
 * and map imported symbols to their actual definitions across the codebase.
 */

import { Project, Node, SourceFile } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as fsSync from "fs";
import { TypeCheckerBudget } from "./TypeCheckerBudget.js";

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
export class ModuleResolver {
  private readonly tsProject: Project;
  private readonly tsPathOptions: Partial<ts.CompilerOptions> | null;
  private readonly maxReexportDepth: number;
  private readonly typeCheckerBudget: TypeCheckerBudget;

  // Cache for export maps to avoid redundant computation
  private exportMapCache: Map<string, Map<string, ExportMapEntry>> = new Map();

  /**
   * Creates a new ModuleResolver instance
   *
   * @param options - Configuration options for the resolver
   */
  constructor(options: ModuleResolverOptions) {
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
  setBudget(budget: number): void {
    this.typeCheckerBudget.initializeBudget(budget);
  }

  /**
   * Resets the export map cache
   * Used when files are modified to ensure fresh resolution
   */
  clearExportMapCache(): void {
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
  resolveModuleSpecifierToSourceFile(
    specifier: string,
    fromFile: SourceFile
  ): SourceFile | null {
    try {
      if (!specifier) return null;

      // Combine project compiler options with tsconfig path options
      const compilerOpts = {
        ...(this.tsProject.getCompilerOptions() as any),
        ...(this.tsPathOptions || {}),
      } as ts.CompilerOptions;

      const containingFile = fromFile.getFilePath();

      // Use TypeScript's module resolution algorithm
      const resolved = ts.resolveModuleName(
        specifier,
        containingFile,
        compilerOpts,
        ts.sys
      );

      if (!resolved.resolvedModule?.resolvedFileName) return null;

      const candidate = resolved.resolvedModule.resolvedFileName;

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
        } catch {
          // Ignore errors if file can't be added
        }
      }

      return sf || null;
    } catch {
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
  resolveReexportTarget(
    symbolName: string,
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): ReexportResolution | null {
    try {
      if (!moduleSf || depth >= this.maxReexportDepth) return null;

      const key = moduleSf.getFilePath();
      if (seen.has(key)) return null;
      seen.add(key);

      // Check all export declarations in the module
      for (const ed of moduleSf.getExportDeclarations()) {
        if (!ed.getModuleSpecifier()) continue;

        // Get the target module source file
        let spec = ed.getModuleSpecifierSourceFile();
        if (!spec) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            spec = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                   (undefined as any);
          }
        }

        const named = ed.getNamedExports();

        // Handle named re-exports: export { A as B } from './x'
        if (named && named.length > 0) {
          for (const ne of named) {
            const name = ne.getNameNode().getText();
            const alias = ne.getAliasNode()?.getText();

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
          const res = this.resolveReexportTarget(
            symbolName,
            spec,
            depth + 1,
            seen
          );
          if (res) return res;
        }
      }

      return null;
    } catch {
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
  getModuleExportMap(
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): Map<string, ExportMapEntry> {
    const out = new Map<string, ExportMapEntry>();

    if (!moduleSf || depth >= this.maxReexportDepth) return out;

    const key = moduleSf.getFilePath();
    if (seen.has(key)) return out;
    seen.add(key);

    // Check cache first
    const cacheKey = `${key}:${depth}`;
    if (this.exportMapCache.has(cacheKey)) {
      return this.exportMapCache.get(cacheKey)!;
    }

    const fileRel = path.relative(process.cwd(), key);

    /**
     * Helper to add an export to the map
     */
    const addExport = (
      exportedName: string,
      actualName: string,
      actualFileRel: string,
      currentDepth: number
    ) => {
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
          if (name) addExport(name, name, fileRel, depth);
        }
      }

      // Class declarations: export class MyClass {}
      for (const cd of moduleSf.getClasses()) {
        if (cd.isExported()) {
          const name = cd.getName();
          if (name) addExport(name, name, fileRel, depth);
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
        if (!ed.getModuleSpecifier()) continue;

        // Get target source file
        let specSf = ed.getModuleSpecifierSourceFile();
        if (!specSf) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            specSf = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                     (undefined as any);
          }
        }

        const namespaceExport = ed.getNamespaceExport
          ? ed.getNamespaceExport()?.getText()
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
          const alias = ne.getAliasNode()?.getText();

          if (specSf) {
            const child = this.getModuleExportMap(specSf, depth + 1, seen);
            const chosen = child.get(name) || child.get(alias || "");
            if (chosen) {
              addExport(
                alias || name,
                chosen.name,
                chosen.fileRel,
                chosen.depth
              );
            }
          }
        }
      }
    } catch {
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
  resolveImportedMemberToFileAndName(
    rootOrAlias: string,
    member: string | "default",
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): ExportMapEntry | null {
    try {
      const targetRel = importMap?.get(rootOrAlias);
      if (!targetRel) return null;

      const hintName = importSymbolMap?.get(rootOrAlias);

      // Resolve target file
      const targetAbs = path.isAbsolute(targetRel)
        ? targetRel
        : path.resolve(process.cwd(), targetRel);

      const modSf = this.tsProject.getSourceFile(targetAbs) ||
                    sourceFile.getProject().getSourceFile(targetAbs);

      const exportMap = this.getModuleExportMap(modSf);

      // Try different candidate names in order of preference
      const candidateNames: string[] = [];
      if (hintName) candidateNames.push(hintName);
      candidateNames.push(member);
      if (member === "default") candidateNames.push("default");

      for (const candidate of candidateNames) {
        const found = exportMap.get(candidate);
        if (found) return found;
      }

      return null;
    } catch {
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
  resolveWithTypeChecker(
    node: Node | undefined,
    sourceFile: SourceFile
  ): ResolvedSymbol | null {
    try {
      if (!node) return null;

      const checker = this.tsProject.getTypeChecker();

      // Get symbol at the node location
      const sym: any = (checker as any).getSymbolAtLocation?.(node as any);
      const target = sym?.getAliasedSymbol?.() || sym;

      if (!target) return null;

      // Get the first declaration of the symbol
      const declarations: any[] = Array.isArray(target.getDeclarations?.())
        ? target.getDeclarations()
        : [];
      const firstDecl = declarations[0];

      if (!firstDecl) return null;

      // Get the source file of the declaration
      const declSf = typeof firstDecl.getSourceFile === "function"
        ? firstDecl.getSourceFile()
        : null;

      if (!declSf) return null;

      const filePath = declSf.getFilePath();
      const fileRel = path.relative(process.cwd(), filePath);
      const name = target.getName();

      return { fileRel, name };
    } catch {
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
  resolveCallTargetWithChecker(
    callNode: Node,
    sourceFile: SourceFile
  ): ResolvedSymbol | null {
    try {
      const checker = this.tsProject.getTypeChecker();

      // Try to get the resolved signature of the call
      const sig: any = (checker as any).getResolvedSignature?.(callNode as any);
      const decl: any = sig?.getDeclaration?.() || sig?.declaration;

      if (!decl) {
        // Fallback: try to resolve the callee expression itself
        const expr: any = (callNode as any).getExpression?.() || null;
        return this.resolveWithTypeChecker(expr as any, sourceFile);
      }

      // Get the source file of the declaration
      const declSf = typeof decl.getSourceFile === "function"
        ? decl.getSourceFile()
        : null;

      if (!declSf) return null;

      const filePath = declSf.getFilePath();
      const fileRel = path.relative(process.cwd(), filePath);

      // Try to get the name from the declaration
      let name = "";
      if (typeof decl.getName === "function") {
        name = decl.getName();
      } else if (decl.name && typeof decl.name.getText === "function") {
        name = decl.name.getText();
      }

      return name ? { fileRel, name } : null;
    } catch {
      return null;
    }
  }

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
  }): boolean {
    return this.typeCheckerBudget.shouldUseTypeChecker(opts);
  }

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
  } {
    return this.typeCheckerBudget.getBudgetStats();
  }
}