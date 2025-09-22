/**
 * Neo4j OGM Services
 * Core OGM service implementations using Neogma
 */

// Core OGM services
export { NeogmaService } from './NeogmaService.js';
export { EntityServiceOGM } from './EntityServiceOGM.js';
export { RelationshipServiceOGM } from './RelationshipServiceOGM.js';
export { SearchServiceOGM } from './SearchServiceOGM.js';

// Service types
export type {
  ListEntitiesOptions,
  BulkCreateOptions
} from './EntityServiceOGM.js';

export type {
  BulkRelationshipOptions,
  RelationshipStats,
  IRelationshipService
} from './RelationshipServiceOGM.js';

// Search service interfaces and types
export type {
  ISearchService,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats
} from './ISearchService.js';