/**
 * ASTParserCore - Main facade for AST parsing operations
 *
 * This is the main orchestrator for the modular AST parsing system.
 * It coordinates between specialized modules to provide a unified parsing interface
 * while maintaining the same public API as the original monolithic ASTParser.
 *
 * Extracted from the original 5,197-line ASTParser.ts as part of modular refactoring.
 */

import { Project, Node, SourceFile, SyntaxKind } from 'ts-morph';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as crypto from 'crypto';
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity,
} from '@memento/shared-types.js';
import {
  GraphRelationship,
  RelationshipType,
  StructuralRelationship,
} from '@memento/shared-types.js';
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
} from '../../utils/codeEdges.js';
import { noiseConfig } from '../../config/noise.js';
import { scoreInferredEdge } from '../../utils/confidence.js';

// Import shared utilities and types
import {
  createHash,
  normalizeRelPath,
  detectLanguage,
  extractDependencies,
} from './utils.js';
import {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
} from './types.js';

// Import the extracted modules
import { CacheManager, CachedFileInfo } from './CacheManager.js';
import { DirectoryHandler } from './DirectoryHandler.js';
import { TypeCheckerBudget } from './TypeCheckerBudget.js';
import { SymbolExtractor } from './SymbolExtractor.js';
import { ModuleResolver, ModuleResolverOptions } from './ModuleResolver.js';
import {
  RelationshipBuilder,
  RelationshipBuilderOptions,
} from './RelationshipBuilder.js';

// Re-export types for backward compatibility
export type {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
} from './types.js';

/**
 * Main AST Parser facade that orchestrates specialized parsing modules
 *
 * This class maintains the same public API as the original ASTParser while
 * internally delegating to specialized modules for different aspects of parsing:
 * - CacheManager: File caching and symbol indexing
 * - DirectoryHandler: Directory hierarchy and path operations
 * - TypeCheckerBudget: Type checker performance management
 * - SymbolExtractor: Symbol entity creation from AST nodes
 * - ModuleResolver: Cross-file module and symbol resolution
 * - RelationshipBuilder: Relationship extraction and inference
 */
export class ASTParserCore {
  // Common globals and test helpers to ignore when inferring edges
  private readonly stopNames = new Set<string>(
    [
      'console',
      'log',
      'warn',
      'error',
      'info',
      'debug',
      'require',
      'module',
      'exports',
      '__dirname',
      '__filename',
      'process',
      'buffer',
      'settimeout',
      'setinterval',
      'cleartimeout',
      'clearinterval',
      'math',
      'json',
      'date',
      // test frameworks
      'describe',
      'it',
      'test',
      'expect',
      'beforeeach',
      'aftereach',
      'beforeall',
      'afterall',
    ].concat(Array.from(noiseConfig.AST_STOPLIST_EXTRA))
  );

  // Core ts-morph project for TypeScript parsing
  private tsProject: Project;

  // TypeScript compiler options for module resolution
  private tsPathOptions: Partial<ts.CompilerOptions> | null = null;

  // Specialized module instances
  private cacheManager: CacheManager;
  private directoryHandler: DirectoryHandler;
  private typeCheckerBudget: TypeCheckerBudget;
  private symbolExtractor: SymbolExtractor;
  private moduleResolver: ModuleResolver;
  private relationshipBuilder: RelationshipBuilder;

  /**
   * Initialize the ASTParserCore with all required modules
   */
  constructor() {
    // Initialize ts-morph project
    this.tsProject = new Project({
      compilerOptions: {
        allowJs: true,
        declaration: true,
        emitDeclarationOnly: false,
        outDir: './dist',
        target: ts.ScriptTarget.ES2018,
        module: ts.ModuleKind.CommonJS as any,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      useInMemoryFileSystem: true,
    });

    // Initialize specialized modules
    this.cacheManager = new CacheManager();
    this.directoryHandler = new DirectoryHandler();
    this.typeCheckerBudget = new TypeCheckerBudget();
    this.symbolExtractor = new SymbolExtractor();

    // ModuleResolver needs the tsProject and options
    this.moduleResolver = new ModuleResolver({
      tsProject: this.tsProject,
      tsPathOptions: this.tsPathOptions,
    });

    // RelationshipBuilder will be initialized after we have the needed dependencies
    this.relationshipBuilder = new RelationshipBuilder({
      tsProject: this.tsProject,
      globalSymbolIndex: new Map(), // Will be updated as we parse
      nameIndex: new Map(), // Will be updated as we parse
      stopNames: this.stopNames,
      fileCache: new Map(), // Will be managed by cache manager
      shouldUseTypeChecker: this.shouldUseTypeChecker.bind(this),
      takeTcBudget: this.typeCheckerBudget.takeBudget.bind(
        this.typeCheckerBudget
      ),
      resolveWithTypeChecker: this.resolveWithTypeChecker.bind(this),
      resolveCallTargetWithChecker:
        this.resolveCallTargetWithChecker.bind(this),
      resolveImportedMemberToFileAndName:
        this.resolveImportedMemberToFileAndName.bind(this),
      getModuleExportMap: this.moduleResolver.getModuleExportMap.bind(
        this.moduleResolver
      ),
      normalizeRelPath,
    });
  }

  /**
   * Initialize the parser with configuration
   * Loads tsconfig.json for TypeScript path mapping support
   */
  async initialize(): Promise<void> {
    try {
      const tsconfigPath = path.resolve('tsconfig.json');
      if (fsSync.existsSync(tsconfigPath)) {
        const raw = await fs.readFile(tsconfigPath, 'utf-8');
        const json = JSON.parse(raw) as { compilerOptions?: any };
        const co = json?.compilerOptions || {};
        const baseUrl = co.baseUrl
          ? path.resolve(path.dirname(tsconfigPath), co.baseUrl)
          : undefined;

        this.tsPathOptions = {
          baseUrl,
          paths: co.paths,
          allowJs: true,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
        };

        // Update the module resolver with the new options
        this.moduleResolver = new ModuleResolver({
          tsProject: this.tsProject,
          tsPathOptions: this.tsPathOptions,
        });
      }
    } catch (e) {
      console.warn(
        'Failed to load tsconfig.json, proceeding without path mapping:',
        e
      );
    }
  }

  /**
   * Parse a single file and return entities, relationships, and errors
   * @param filePath - Path to the file to parse
   * @returns Parse result with entities and relationships
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      const extension = path.extname(filePath).toLowerCase();

      // Determine parser based on file extension
      // Unify JS/TS handling via ts-morph for better consistency and stability
      if (['.ts', '.tsx', '.js', '.jsx'].includes(extension)) {
        return this.parseTypeScriptFile(filePath, content);
      } else {
        // Unsupported file type
        return {
          entities: [],
          relationships: [],
          errors: [
            {
              file: filePath,
              line: 0,
              column: 0,
              message: `Unsupported file extension: ${extension}`,
              severity: 'warning',
            },
          ],
        };
      }
    } catch (error) {
      return {
        entities: [],
        relationships: [],
        errors: [
          {
            file: filePath,
            line: 0,
            column: 0,
            message: `Failed to parse file: ${
              error instanceof Error ? error.message : String(error)
            }`,
            severity: 'error',
          },
        ],
      };
    }
  }

  /**
   * Parse multiple files and combine results
   * @param filePaths - Array of file paths to parse
   * @returns Combined parse result
   */
  async parseMultipleFiles(filePaths: string[]): Promise<ParseResult> {
    const perFileResults: ParseResult[] = [];
    const promises = filePaths.map((filePath) => this.parseFile(filePath));
    const settled = await Promise.allSettled(promises);

    for (const r of settled) {
      if (r.status === 'fulfilled') {
        perFileResults.push(r.value);
      } else {
        console.error('Parse error:', r.reason);
        perFileResults.push({
          entities: [],
          relationships: [],
          errors: [
            {
              file: 'unknown',
              line: 0,
              column: 0,
              message: `Parse failure: ${r.reason}`,
              severity: 'error',
            },
          ],
        });
      }
    }

    // Combine all results
    const allEntities: Entity[] = [];
    const allRelationships: GraphRelationship[] = [];
    const allErrors: ParseError[] = [];

    for (const result of perFileResults) {
      allEntities.push(...result.entities);
      allRelationships.push(...result.relationships);
      allErrors.push(...result.errors);
    }

    return {
      entities: allEntities,
      relationships: allRelationships,
      errors: allErrors,
    };
  }

  /**
   * Clear all cached parsing data
   */
  clearCache(): void {
    this.cacheManager.clearCache();
  }

  /**
   * Get statistics about cached data
   * @returns Object with cache statistics
   */
  getCacheStats(): { files: number; totalEntities: number } {
    return this.cacheManager.getCacheStats();
  }

  /**
   * Parse incremental changes to a file
   * @param filePath - Path to the changed file
   * @returns Incremental parse result with change tracking
   */
  async parseFileIncremental(
    filePath: string
  ): Promise<IncrementalParseResult> {
    const absolutePath = path.resolve(filePath);
    const cachedInfo = this.cacheManager.getCachedFile(absolutePath);

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      const currentHash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');

      // If no changes, return cached result
      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
          isIncremental: true,
          addedEntities: [],
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: [],
        };
      }

      // Parse the updated file
      const parseResult = await this.parseFile(filePath);

      // Calculate differences if we have cached data
      let addedEntities: Entity[] = [];
      let removedEntities: Entity[] = [];
      const updatedEntities: Entity[] = [];
      let addedRelationships: GraphRelationship[] = [];
      let removedRelationships: GraphRelationship[] = [];

      if (cachedInfo) {
        // Simple diff - in a real implementation, this would be more sophisticated
        const oldEntityIds = new Set(cachedInfo.entities.map((e) => e.id));
        const newEntityIds = new Set(parseResult.entities.map((e) => e.id));

        addedEntities = parseResult.entities.filter(
          (e) => !oldEntityIds.has(e.id)
        );
        removedEntities = cachedInfo.entities.filter(
          (e) => !newEntityIds.has(e.id)
        );

        const oldRelIds = new Set(cachedInfo.relationships.map((r) => r.id));
        const newRelIds = new Set(parseResult.relationships.map((r) => r.id));

        addedRelationships = parseResult.relationships.filter(
          (r) => !oldRelIds.has(r.id)
        );
        removedRelationships = cachedInfo.relationships.filter(
          (r) => !newRelIds.has(r.id)
        );
      } else {
        addedEntities = parseResult.entities;
        addedRelationships = parseResult.relationships;
      }

      return {
        ...parseResult,
        isIncremental: true,
        addedEntities,
        removedEntities,
        updatedEntities,
        addedRelationships,
        removedRelationships,
      };
    } catch (error) {
      return {
        entities: [],
        relationships: [],
        errors: [
          {
            file: filePath,
            line: 0,
            column: 0,
            message: `Incremental parse failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
            severity: 'error',
          },
        ],
        isIncremental: false,
        addedEntities: [],
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: [],
        removedRelationships: [],
      };
    }
  }

  /**
   * Get partial update statistics for debugging
   * @returns Statistics about partial updates
   */
  getPartialUpdateStats(): {
    filesInCache: number;
    globalSymbols: number;
    namedSymbols: number;
  } {
    return {
      filesInCache: this.cacheManager.getCacheStats().files,
      globalSymbols: this.cacheManager.getGlobalSymbolKeys().length,
      namedSymbols: 0, // TODO: Implement name index tracking
    };
  }

  // Private helper methods

  /**
   * Parse a TypeScript/JavaScript file using ts-morph
   * @param filePath - Path to the file
   * @param content - File content
   * @returns Parse result
   */
  private async parseTypeScriptFile(
    filePath: string,
    content: string
  ): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Initialize type checker budget for this file
      this.typeCheckerBudget.initializeBudget();

      const absolutePath = path.resolve(filePath);
      const fileRelPath = normalizeRelPath(
        path.relative(process.cwd(), absolutePath)
      );

      // Check cache first
      const currentHash = createHash(content);

      const cachedInfo = this.cacheManager.getCachedFile(absolutePath);
      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
        };
      }

      // Create or update source file in ts-morph project
      const sourceFile = this.tsProject.createSourceFile(
        absolutePath,
        content,
        {
          overwrite: true,
        }
      );

      // Create file entity
      const fileEntity: File = {
        id: `file:${fileRelPath}`,
        type: 'file',
        path: fileRelPath,
        extension: path.extname(filePath),
        size: content.length,
        lines: content.split('\n').length,
        isTest: filePath.includes('.test.') || filePath.includes('.spec.'),
        isConfig:
          path.basename(filePath).startsWith('.') ||
          filePath.includes('config'),
        language: detectLanguage(filePath),
        dependencies: extractDependencies(content),
        lastModified: new Date(),
        created: new Date(),
        hash: createHash(content),
      };

      entities.push(fileEntity);

      // Create directory entities if configured
      if (this.shouldIncludeDirectoryEntities()) {
        const { dirEntities, dirRelationships } =
          this.directoryHandler.createDirectoryHierarchy(
            fileRelPath,
            fileEntity.id
          );
        entities.push(...dirEntities);
        relationships.push(...dirRelationships);
      }

      // Extract symbols using SymbolExtractor
      this.extractSymbolsFromSourceFile(
        sourceFile,
        fileEntity,
        entities,
        relationships
      );

      // Build relationships using RelationshipBuilder
      // Extract relationships for each symbol entity
      for (const entity of entities) {
        if (entity.type === 'symbol') {
          const symbolEntity = entity as SymbolEntity;
          // Find the corresponding AST node for this symbol
          const symbolRelationships = this.extractRelationshipsForSymbol(
            sourceFile,
            symbolEntity
          );
          relationships.push(...symbolRelationships);
        }
      }

      // Update cache
      const symbolMap = this.createSymbolMap(entities);
      this.cacheManager.setCachedFile(absolutePath, {
        hash: currentHash,
        entities,
        relationships,
        lastModified: new Date(),
        symbolMap,
      });

      // Update global symbol indexes
      const symbols = entities.filter(
        (e) => e.type === 'symbol'
      ) as SymbolEntity[];
      this.cacheManager.addSymbolsToIndexes(fileRelPath, symbols);

      return { entities, relationships, errors };
    } catch (error) {
      console.error(`Error parsing TypeScript file ${filePath}:`, error);
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `Parse error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        severity: 'error',
      });
      return { entities, relationships, errors };
    }
  }

  /**
   * Extract symbols from a source file using the SymbolExtractor
   */
  private extractSymbolsFromSourceFile(
    sourceFile: SourceFile,
    fileEntity: File,
    entities: Entity[],
    relationships: GraphRelationship[]
  ): void {
    sourceFile.forEachDescendant((node) => {
      const symbol = this.symbolExtractor.createSymbolEntity(node, fileEntity);
      if (symbol) {
        entities.push(symbol);

        // Create CONTAINS relationship between file and symbol
        const containsRel: StructuralRelationship = {
          id: `${fileEntity.id}-contains-${symbol.id}`,
          type: RelationshipType.CONTAINS,
          fromEntityId: fileEntity.id,
          toEntityId: symbol.id,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        };
        relationships.push(containsRel);
      }
    });
  }

  /**
   * Create a symbol map from entities for caching
   */
  private createSymbolMap(entities: Entity[]): Map<string, SymbolEntity> {
    const symbolMap = new Map<string, SymbolEntity>();

    entities.forEach((entity) => {
      if (entity.type === 'symbol') {
        symbolMap.set(entity.id, entity as SymbolEntity);
      }
    });

    return symbolMap;
  }

  /**
   * Heuristic policy for using the TS type checker
   */
  private shouldUseTypeChecker(opts: {
    context: 'call' | 'heritage' | 'decorator';
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
  }): boolean {
    try {
      const imported = !!opts.imported;
      const ambiguous = !!opts.ambiguous;
      const len = typeof opts.nameLength === 'number' ? opts.nameLength : 0;
      const usefulName = len >= noiseConfig.AST_MIN_NAME_LENGTH;
      const want = imported || ambiguous || usefulName;
      if (!want) return false;
      return this.typeCheckerBudget.takeBudget();
    } catch {
      return false;
    }
  }

  // Removed duplicate utility methods - now using shared utils

  /**
   * Check if directory entities should be included
   */
  private shouldIncludeDirectoryEntities(): boolean {
    return true; // Default to including directory entities
  }

  // Placeholder methods for TypeScript checker integration
  // These would need to be implemented based on the original ASTParser logic

  private resolveWithTypeChecker(node: Node, sourceFile: SourceFile): any {
    // Placeholder - would implement TypeScript type checker resolution
    return null;
  }

  private resolveCallTargetWithChecker(
    call: Node,
    sourceFile: SourceFile
  ): any {
    // Placeholder - would implement call target resolution with type checker
    return null;
  }

  private resolveImportedMemberToFileAndName(
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): any {
    // Placeholder - would implement imported member resolution
    return this.moduleResolver.resolveImportedMemberToFileAndName(
      memberName,
      exportName,
      sourceFile,
      importMap,
      importSymbolMap
    );
  }

  /**
   * Get symbol name from an AST node
   */
  private getSymbolName(node: Node): string | undefined {
    try {
      if (
        Node.isFunctionDeclaration(node) ||
        Node.isClassDeclaration(node) ||
        Node.isInterfaceDeclaration(node) ||
        Node.isTypeAliasDeclaration(node) ||
        Node.isVariableDeclaration(node) ||
        Node.isMethodDeclaration(node)
      ) {
        const nameNode = (node as any).getNameNode?.();
        return nameNode?.getText?.() || (node as any).getName?.();
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract relationships for a specific symbol entity
   */
  private extractRelationshipsForSymbol(
    sourceFile: SourceFile,
    symbolEntity: SymbolEntity
  ): GraphRelationship[] {
    try {
      // Find the AST node corresponding to this symbol
      // This is a simplified approach - in practice, we'd need to map symbols to nodes more precisely
      const allNodes = sourceFile.getDescendants();
      const symbolNode = allNodes.find((node) => {
        const name = this.getSymbolName(node);
        return name === symbolEntity.name;
      });

      if (!symbolNode) {
        return [];
      }

      // Use RelationshipBuilder to extract relationships
      return this.relationshipBuilder.extractSymbolRelationships(
        symbolNode,
        symbolEntity,
        sourceFile
      );
    } catch (error) {
      console.warn(
        `Failed to extract relationships for symbol ${symbolEntity.id}:`,
        error
      );
      return [];
    }
  }
}
