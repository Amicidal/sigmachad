/**
 * RelationshipBuilder - Orchestrates relationship extraction from code entities
 *
 * Refactored as a thin orchestrator that routes AST nodes to specialized builders.
 * Handles coordination between CallRelationshipBuilder, TypeRelationshipBuilder,
 * ImportExportBuilder, and ReferenceRelationshipBuilder.
 */

import { Project, Node, SourceFile } from 'ts-morph';
import * as path from 'path';
import {
  Entity,
  File,
  Symbol as SymbolEntity,
} from '@memento/shared-types';
import {
  GraphRelationship,
  RelationshipType,
} from '@memento/shared-types';
import { normalizeCodeEdge } from '@memento/core/utils/codeEdges';
import { noiseConfig } from '@memento/core/config/noise';

import {
  CallRelationshipBuilder,
  TypeRelationshipBuilder,
  ImportExportBuilder,
  ReferenceRelationshipBuilder,
} from '@memento/parser/builders';
import type {
  RelationshipBuilderOptions as CallBuilderOptions,
  TypeRelationshipBuilderOptions,
  ImportExportBuilderOptions,
  ReferenceRelationshipBuilderOptions,
} from '@memento/shared-types';

export interface RelationshipBuilderOptions {
  tsProject: Project;
  globalSymbolIndex: Map<string, SymbolEntity>;
  nameIndex: Map<string, SymbolEntity[]>;
  stopNames: Set<string>;
  fileCache: Map<string, any>;
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
  getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  normalizeRelPath: (p: string) => string;
}

/**
 * RelationshipBuilder orchestrates the extraction of various types of relationships
 * between code entities by delegating to specialized builders.
 */
export class RelationshipBuilder {
  private tsProject: Project;
  private globalSymbolIndex: Map<string, SymbolEntity>;
  private nameIndex: Map<string, SymbolEntity[]>;
  private stopNames: Set<string>;
  private fileCache: Map<string, any>;
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
  private getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  private normalizeRelPath: (p: string) => string;

  // Specialized builders
  private callBuilder: CallRelationshipBuilder;
  private typeBuilder: TypeRelationshipBuilder;
  private importBuilder: ImportExportBuilder;
  private referenceBuilder: ReferenceRelationshipBuilder;

  constructor(options: RelationshipBuilderOptions) {
    this.tsProject = options.tsProject;
    this.globalSymbolIndex = options.globalSymbolIndex;
    this.nameIndex = options.nameIndex;
    this.stopNames = options.stopNames;
    this.fileCache = options.fileCache;
    this.shouldUseTypeChecker = options.shouldUseTypeChecker;
    this.takeTcBudget = options.takeTcBudget;
    this.resolveWithTypeChecker = options.resolveWithTypeChecker;
    this.resolveCallTargetWithChecker = options.resolveCallTargetWithChecker;
    this.resolveImportedMemberToFileAndName =
      options.resolveImportedMemberToFileAndName;
    this.getModuleExportMap = options.getModuleExportMap;
    this.normalizeRelPath = options.normalizeRelPath;

    // Initialize specialized builders
    const sharedOptions: CallBuilderOptions = {
      tsProject: this.tsProject,
      globalSymbolIndex: this.globalSymbolIndex,
      nameIndex: this.nameIndex,
      stopNames: this.stopNames,
      shouldUseTypeChecker: this.shouldUseTypeChecker,
      takeTcBudget: this.takeTcBudget,
      resolveWithTypeChecker: this.resolveWithTypeChecker,
      resolveCallTargetWithChecker: this.resolveCallTargetWithChecker,
      resolveImportedMemberToFileAndName:
        this.resolveImportedMemberToFileAndName,
      normalizeRelPath: this.normalizeRelPath,
      createRelationship: this.createRelationship.bind(this),
      includeConfidence: true,
      maxDepth: 3,
      batchSize: 1000,
    };

    this.callBuilder = new CallRelationshipBuilder(sharedOptions);
    this.typeBuilder = new TypeRelationshipBuilder({
      ...sharedOptions,
      includeInheritance: true,
      includeImplementations: true,
      includeTypeAliases: true,
    } as TypeRelationshipBuilderOptions);
    this.importBuilder = new ImportExportBuilder({
      ...sharedOptions,
      includeFileImports: true,
      includePackageImports: true,
      includeDynamicImports: true,
      getModuleExportMap: this.getModuleExportMap,
    } as ImportExportBuilderOptions);
    this.referenceBuilder = new ReferenceRelationshipBuilder({
      ...sharedOptions,
      includeImports: true,
      includeExports: true,
      includeReferences: true,
    } as ReferenceRelationshipBuilderOptions);
  }

  /**
   * Extracts symbol-level relationships including calls, inheritance, type usage,
   * decorators, method overrides, exceptions, and parameter types.
   */
  extractSymbolRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    // Build local index for symbol resolution
    const localIndex = this.buildLocalIndex(sourceFile);

    // Route to appropriate builders based on node type and relationship concerns
    relationships.push(
      ...this.callBuilder.extractCallRelationships(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap,
        localIndex
      )
    );

    relationships.push(
      ...this.typeBuilder.extractTypeRelationships(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap,
        localIndex
      )
    );

    return relationships;
  }

  /**
   * Extracts reference relationships using TypeScript AST with best-effort resolution.
   * Analyzes identifiers, type references, instantiations, and read/write operations.
   */
  extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: SymbolEntity }>,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    return this.referenceBuilder.extractReferenceRelationships(
      sourceFile,
      fileEntity,
      localSymbols,
      importMap,
      importSymbolMap
    );
  }

  /**
   * Extracts import relationships from a source file, analyzing various import types
   * including default, named, namespace, and side-effect imports.
   */
  extractImportRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    return this.importBuilder.extractImportRelationships(
      sourceFile,
      fileEntity,
      importMap,
      importSymbolMap
    );
  }

  /**
   * Creates a relationship with proper normalization and metadata handling.
   */
  createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {
    // Ensure a sensible default for code-edge source to aid querying
    try {
      if (metadata && (metadata as any).source == null) {
        const md: any = metadata as any;
        if (md.usedTypeChecker === true || md.resolution === 'type-checker')
          md.source = 'type-checker';
        else md.source = 'ast';
      }
    } catch (e) { /* intentional no-op: non-critical */ void 0; }
    // Deterministic relationship id using canonical target key for stable identity across resolutions
    const rid = this.canonicalRelationshipId(fromId, {
      toEntityId: toId,
      type,
    } as any);
    const rel: any = {
      id: rid,
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };

    // Attach a structured toRef for placeholders to aid later resolution
    try {
      if (!(rel as any).toRef) {
        const t = String(toId || '');
        // file:<relPath>:<name> -> fileSymbol
        const mFile = t.match(/^file:(.+?):(.+)$/);
        if (mFile) {
          (rel as any).toRef = {
            kind: 'fileSymbol',
            file: mFile[1],
            symbol: mFile[2],
            name: mFile[2],
          };
        } else if (t.startsWith('external:')) {
          // external:<name> -> external
          (rel as any).toRef = {
            kind: 'external',
            name: t.slice('external:'.length),
          };
        } else if (/^(class|interface|function|typeAlias):/.test(t)) {
          // kind-qualified placeholder without file: treat as external-like symbolic ref
          const parts = t.split(':');
          (rel as any).toRef = {
            kind: 'external',
            name: parts.slice(1).join(':'),
          };
        }
        // For sym:/file: IDs, check if they can be parsed as file symbols
        else if (/^(sym:|file:)/.test(t)) {
          // Check if sym: can be parsed
          const isParsableSym =
            t.startsWith('sym:') && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
          const isParsableFile =
            t.startsWith('file:') && /^file:(.+?):(.+)$/.test(t);
          if (!isParsableSym && !isParsableFile) {
            (rel as any).toRef = { kind: 'entity', id: t };
          }
        }
      }
    } catch (e) { /* intentional no-op: non-critical */ void 0; }

    // Attach a basic fromRef to aid coordinator context (file resolution, etc.)
    try {
      if (!(rel as any).fromRef) {
        // We don't attempt to decode file/symbol here; coordinator can fetch entity by id
        (rel as any).fromRef = { kind: 'entity', id: fromId };
      }
    } catch (e) { /* intentional no-op: non-critical */ void 0; }

    // Normalize code-edge evidence and fields consistently
    return normalizeCodeEdge(rel as GraphRelationship);
  }

  /**
   * Builds a local symbol index for efficient symbol resolution within a file.
   */
  private buildLocalIndex(sourceFile: SourceFile): Map<string, string> {
    const localIndex = new Map<string, string>();
    try {
      const sfPath = (sourceFile.getFilePath && sourceFile.getFilePath()) || '';
      const relPath = path.relative(process.cwd(), sfPath);

      const cached = this.fileCache.get(path.resolve(relPath));
      if (cached && cached.symbolMap) {
        for (const [k, v] of cached.symbolMap.entries()) {
          const valId = (v as any).id;
          // Original key format in cache: `${symbolEntity.path}:${symbolEntity.name}`
          localIndex.set(k, valId);
          // Also index by simplified key `${fileRelPath}:${name}` to match lookups below
          const parts = String(k).split(':');
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            // symbolEntity.path may itself be `${fileRelPath}:${name}`; rebuild simplified key
            const simpleKey = `${relPath}:${name}`;
            localIndex.set(simpleKey, valId);
          }
        }
      }
    } catch (e) { /* intentional no-op: non-critical */ void 0; }
    return localIndex;
  }

  /**
   * Creates a canonical relationship ID for stable identity.
   */
  private canonicalRelationshipId(fromId: string, rel: any): string {
    // Simple implementation - in the original this was imported from utils/codeEdges
    return `${fromId}|${rel.type}|${rel.toEntityId}`;
  }
}
