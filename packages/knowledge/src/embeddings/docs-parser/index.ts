// Re-exports for backward compatibility
export { DocTokenizer } from '../DocTokenizer';
export { IntentExtractor } from '../../analysis/IntentExtractor';
export { SyncOrchestrator } from '../../orchestration/SyncOrchestrator';
export { ParsedDocument } from '../DocTokenizer';
export { DomainExtraction } from '../../analysis/IntentExtractor';

// Import types from SyncOrchestrator to avoid conflicts
export type {
  SyncResult,
  SearchResult,
} from '../../orchestration/SyncOrchestrator';
