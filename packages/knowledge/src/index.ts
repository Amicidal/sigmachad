// Main exports
export * from './orchestration/KnowledgeGraphService';
export * from './types';
export * from './queries';
export * from './utils';
export * from './ISearchService';

// Parsing exports (explicit re-exports to avoid conflicts with types.ts)
export { ASTParser } from './parsing/ASTParser';
export { ASTParserCore } from './parsing/ASTParserCore';
export { IncrementalParser } from './parsing/IncrementalParser';
export { SymbolExtractor } from './parsing/SymbolExtractor';
export { ModuleIndexer } from './parsing/ModuleIndexer';
export { ModuleResolver } from './parsing/ModuleResolver';
export { TypeCheckerBudget } from './parsing/TypeCheckerBudget';
export { DirectoryHandler } from './parsing/DirectoryHandler';

// Graph exports
export * from './graph/Neo4jService';
export * from './graph/NeogmaService';
export * from './graph/CypherExecutor';
export * from './graph/GdsService';
export * from './graph/TemporalQueryService';
export * from './graph/GraphInitializer';
export * from './graph/HistoryService';
export * from './graph/RelationshipBuilder';
export * from './graph/EntityServiceOGM';
export * from './graph/RelationshipServiceOGM';
export * from './graph/SearchServiceOGM';

// Analysis exports (explicit class exports, types from AnalysisService only)
export { AnalysisService } from './analysis/AnalysisService';
export type {
  ImpactAnalysis,
  ImpactAnalysisRequest,
  DependencyAnalysis,
  PathQuery,
  EntityEdgeStats,
  ImpactMetrics,
  DependencyMetrics,
} from './analysis/AnalysisService';
export { DependencyAnalyzer } from './analysis/DependencyAnalyzer';
export { ImpactAnalyzer } from './analysis/ImpactAnalyzer';
export { PathAnalyzer } from './analysis/PathAnalyzer';
export type { PathResult } from './analysis/PathAnalyzer';
export * from './analysis/IntentExtractor';

// Embedding exports (explicit to avoid SearchResult conflicts)
export { EmbeddingService } from './embeddings/EmbeddingService';
export type {
  EmbeddingOptions,
  SearchOptions,
  EmbeddingResult,
  SearchResult as EmbeddingSearchResult,
} from './embeddings/EmbeddingService';
export * from './embeddings/VectorService';
export * from './embeddings/DocTokenizer';
export { DocumentationParser } from './embeddings/DocumentationParser';
export type {
  ParsedDocument,
  DomainExtraction,
  SyncResult,
  SearchResult as DocSearchResult,
} from './embeddings/DocumentationParser';
export * from './embeddings/DocumentationIntelligenceProvider';

// Orchestration exports
export * from './orchestration/KnowledgeGraphService';
export { SyncOrchestrator } from './orchestration/SyncOrchestrator';
export type {
  SyncResult as DocSyncResult,
  SearchResult as DocSyncSearchResult,
} from './orchestration/SyncOrchestrator';
export * from './orchestration/EventOrchestrator';
export * from './orchestration/CheckpointService';
export * from './orchestration/VersionManager';
export * from './orchestration/ServiceRegistry';
export * from './orchestration/CacheManager';
export * from './orchestration/PerformanceOptimizer';
export * from './orchestration/StatsCollector';

// High-Throughput Ingestion Pipeline exports
export * from './ingestion/index';
