/**
 * ISearchService Interface
 * Defines the contract that both legacy and OGM search services must implement
 */

import { EventEmitter } from 'events';
import {
  Entity,
  GraphSearchRequest,
  GraphExamples,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats,
  ISearchService as IBaseSearchService,
} from '@memento/shared-types.js';

/**
 * Common interface that both SearchService implementations should follow
 * Extends the base search service interface with additional methods
 */
export interface ISearchService extends IBaseSearchService {
  // Additional knowledge-specific methods can be added here
}
