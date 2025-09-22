// Original services
export { ASTParser } from './ASTParser.js';
export { DocumentationIntelligenceProvider } from './DocumentationIntelligenceProvider.js';
export { DocumentationParser } from './DocumentationParser.js';
export { ModuleIndexer } from './ModuleIndexer.js';

// Core database service
export { DatabaseService } from '../core/DatabaseService.js';

// New modular services
// export { Neo4jService, type Neo4jConfig } from './Neo4jService.js'; // Commented out to avoid duplicate export with database/index.js
export { EmbeddingService, type EmbeddingOptions, type SearchOptions, type SearchResult as EmbeddingSearchResult } from './EmbeddingService.js';
export { HistoryService, type CheckpointOptions, type VersionInfo, type CheckpointInfo, type HistoryMetrics } from './HistoryService.js';
export { AnalysisService, type ImpactMetrics, type DependencyMetrics } from './AnalysisService.js';

// OGM Services (Primary Implementation)
export {
  NeogmaService,
  EntityServiceOGM,
  RelationshipServiceOGM,
  SearchServiceOGM,
  type ListEntitiesOptions,
  type BulkCreateOptions,
  type BulkRelationshipOptions,
  type RelationshipStats,
  type IRelationshipService,
  type ISearchService,
  type StructuralSearchOptions,
  type SearchResult,
  type SemanticSearchOptions,
  type PatternSearchOptions,
  type SearchStats
} from './ogm/index.js';

// Main facade service
export { KnowledgeGraphService } from './KnowledgeGraphService.js';
export { KnowledgeGraphService as default } from './KnowledgeGraphService.js';
