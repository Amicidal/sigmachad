/**
 * ISearchService Interface
 * Defines the contract that both legacy and OGM search services must implement
 */

import { EventEmitter } from 'events';
import { ISearchService as IBaseSearchService } from '@memento/shared-types';

// Re-export search-related types so consumers can import from '@memento/knowledge/ISearchService'
export type {
  Entity,
  GraphSearchRequest,
  GraphExamples,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats,
} from '@memento/shared-types';

/**
 * Common interface that both SearchService implementations should follow
 * Extends the base search service interface with additional methods
 */
export interface ISearchService extends IBaseSearchService {
  // Additional knowledge-specific methods can be added here
}
