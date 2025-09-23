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
export { ASTParserCore } from './ASTParserCore.js';
export type { ParseResult, ParseError, IncrementalParseResult, PartialUpdate, ChangeRange, CachedFileInfo, ExportMapEntry, ResolvedSymbol, BudgetStats, CacheStats, PartialUpdateStats, TypeCheckerUsageOptions, SymbolVisibility, SymbolKind, EntityType, IndexManager, ParameterInfo, FileEntityOptions, SymbolEntityOptions, DirectoryEntityOptions, RelationshipOptions, } from './types.js';
export { createHash, createShortHash, normalizeRelPath, detectLanguage, extractDependencies, calculateComplexity, parseFilePath, getPathDepth, isParentPath, isNoiseSymbol, createEntityId, processBatched, } from './utils.js';
export { CacheManager } from './CacheManager.js';
export type { CachedFileInfo, ExportMapEntry as CacheExportMapEntry } from './CacheManager.js';
export { DirectoryHandler } from './DirectoryHandler.js';
export { TypeCheckerBudget } from './TypeCheckerBudget.js';
export { SymbolExtractor } from './SymbolExtractor.js';
export { ModuleResolver } from './ModuleResolver.js';
export type { ResolvedSymbol, ExportMapEntry as ModuleExportMapEntry, ModuleResolverOptions } from './ModuleResolver.js';
export { RelationshipBuilder } from './RelationshipBuilder.js';
export type { RelationshipBuilderOptions } from './RelationshipBuilder.js';
export { IncrementalParser } from './IncrementalParser.js';
export type { ParseResult as IncrementalParseResult_Type, ParseError as IncrementalParseError, IncrementalParseResult as IncrementalResult, PartialUpdate as IncrementalPartialUpdate, ChangeRange as IncrementalChangeRange } from './IncrementalParser.js';
/**
 * Default export is the main ASTParserCore for backward compatibility
 */
export { ASTParserCore as default } from './ASTParserCore.js';
//# sourceMappingURL=index.d.ts.map