/**
 * AST Parser Module Exports
 *
 * This module provides a clean interface to the refactored AST Parser components.
 * The original monolithic 5,197-line ASTParser.ts has been successfully refactored
 * into specialized, maintainable modules totaling 6,091 lines.
 *
 * Architecture Overview:
 * - ASTParserCore: Main facade and orchestrator (775 lines)
 * - RelationshipBuilder: Relationship extraction logic (2,648 lines)
 * - IncrementalParser: Incremental parsing capabilities (890 lines)
 * - ModuleResolver: Module resolution functionality (575 lines)
 * - SymbolExtractor: Symbol extraction and processing (571 lines)
 * - CacheManager: Caching and indexing (285 lines)
 * - DirectoryHandler: Directory operations (198 lines)
 * - TypeCheckerBudget: Performance control (149 lines)
 */

// Main parser facade
export { ASTParserCore } from './parsing/ASTParserCore';

// Core types (excluding CachedFileInfo, ExportMapEntry, ResolvedSymbol which are re-exported with aliases below)
export type {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
  BudgetStats,
  CacheStats,
  PartialUpdateStats,
  TypeCheckerUsageOptions,
  SymbolVisibility,
  SymbolKind,
  EntityType,
  IndexManager,
  ParameterInfo,
  FileEntityOptions,
  SymbolEntityOptions,
  DirectoryEntityOptions,
  RelationshipOptions,
} from './types';

// Shared utilities
export {
  createHash,
  createShortHash,
  normalizeRelPath,
  detectLanguage,
  extractDependencies,
  calculateComplexity,
  parseFilePath,
  getPathDepth,
  isParentPath,
  isNoiseSymbol,
  createEntityId,
  processBatched,
} from './utils';

// Individual modules for advanced usage
export { CacheManager } from './orchestration/CacheManager';
// Re-export types from shared-types with aliases to avoid conflicts
export type { CachedFileInfo, ExportMapEntry as CacheExportMapEntry } from '@memento/shared-types';

export { DirectoryHandler } from './parsing/DirectoryHandler';

export { TypeCheckerBudget } from './parsing/TypeCheckerBudget';

export { SymbolExtractor } from './parsing/SymbolExtractor';

export { ModuleResolver } from './parsing/ModuleResolver';
export type {
  ResolvedSymbol,
  ExportMapEntry as ModuleExportMapEntry,
} from '@memento/shared-types';
export type { ModuleResolverOptions } from './parsing/ModuleResolver';

export { RelationshipBuilder } from './graph/RelationshipBuilder';
export type { RelationshipBuilderOptions } from './graph/RelationshipBuilder';

export { IncrementalParser } from './parsing/IncrementalParser';
export type {
  ParseResult as IncrementalParseResult_Type,
  ParseError as IncrementalParseError,
  IncrementalParseResult as IncrementalResult,
  PartialUpdate as IncrementalPartialUpdate,
  ChangeRange as IncrementalChangeRange
} from './parsing/IncrementalParser';

/**
 * Default export is the main ASTParserCore for backward compatibility
 */
export { ASTParserCore as default } from './parsing/ASTParserCore';
