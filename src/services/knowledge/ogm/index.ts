/**
 * OGM Migration Components
 * Exports all components needed for the Neo4j OGM migration
 */

// Core services
export { NeogmaService } from './NeogmaService.js';
export { EntityServiceOGM } from './EntityServiceOGM.js';
export { SearchServiceOGM } from './SearchServiceOGM.js';

// Migration infrastructure
export { FeatureFlagService, getFeatureFlagService } from './FeatureFlags.js';
export { MigrationTracker, getMigrationTracker } from './MigrationTracker.js';
export { MigrationErrorHandler, getMigrationErrorHandler } from './ErrorHandler.js';

// Service adapters
export { EntityServiceAdapter, IEntityService } from './ServiceAdapter.js';
export { SearchServiceAdapter } from './SearchServiceAdapter.js';

// Testing and validation
export { MigrationCompatibilityTest } from './MigrationCompatibilityTest.js';

// Types
export type {
  FeatureFlagConfig,
  ServiceMetrics,
  MigrationMetrics,
  OperationRecord,
  ErrorContext,
  ErrorHandlingStrategy,
  CompatibilityTestResult,
  CompatibilityReport
} from './FeatureFlags.js';

export type {
  ListEntitiesOptions,
  BulkCreateOptions
} from './EntityServiceOGM.js';

// Search service interfaces and types
export type {
  ISearchService,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats
} from './ISearchService.js';