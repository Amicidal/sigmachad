// Original services
export { default as ASTParser } from './ASTParser.js';
export { default as DocumentationIntelligenceProvider } from './DocumentationIntelligenceProvider.js';
export { default as DocumentationParser } from './DocumentationParser.js';
export { default as ModuleIndexer } from './ModuleIndexer.js';

// Core database service
export { DatabaseService } from '../core/DatabaseService.js';

// New modular services
export { Neo4jService, type Neo4jConfig } from './Neo4jService.js';
export { EntityService, type ListEntitiesOptions, type BulkCreateOptions } from './EntityService.js';
export { RelationshipService, type BulkRelationshipOptions, type RelationshipStats } from './RelationshipService.js';
export { EmbeddingService, type EmbeddingOptions, type SearchOptions, type SearchResult as EmbeddingSearchResult } from './EmbeddingService.js';
export { SearchService, type StructuralSearchOptions, type SearchResult } from './SearchService.js';
export { HistoryService, type CheckpointOptions, type VersionInfo, type CheckpointInfo, type HistoryMetrics } from './HistoryService.js';
export { AnalysisService, type ImpactMetrics, type DependencyMetrics } from './AnalysisService.js';

// Main facade service
export { KnowledgeGraphService } from './KnowledgeGraphService.js';
export { KnowledgeGraphService as default } from './KnowledgeGraphService.js';