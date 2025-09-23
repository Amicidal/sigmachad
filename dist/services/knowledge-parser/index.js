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
export { ASTParserCore } from './ASTParserCore.js';
// Shared utilities
export { createHash, createShortHash, normalizeRelPath, detectLanguage, extractDependencies, calculateComplexity, parseFilePath, getPathDepth, isParentPath, isNoiseSymbol, createEntityId, processBatched, } from './utils.js';
// Individual modules for advanced usage
export { CacheManager } from './CacheManager.js';
export { DirectoryHandler } from './DirectoryHandler.js';
export { TypeCheckerBudget } from './TypeCheckerBudget.js';
export { SymbolExtractor } from './SymbolExtractor.js';
export { ModuleResolver } from './ModuleResolver.js';
export { RelationshipBuilder } from './RelationshipBuilder.js';
export { IncrementalParser } from './IncrementalParser.js';
/**
 * Default export is the main ASTParserCore for backward compatibility
 */
export { ASTParserCore as default } from './ASTParserCore.js';
//# sourceMappingURL=index.js.map