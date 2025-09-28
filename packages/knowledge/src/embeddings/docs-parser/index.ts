// Re-exports for backward compatibility
export { DocTokenizer } from '../DocTokenizer.js';
export { IntentExtractor } from '../../analysis/IntentExtractor.js';
export { SyncOrchestrator } from '../../orchestration/SyncOrchestrator.js';
export { ParsedDocument } from '../DocTokenizer.js';
export { DomainExtraction } from '../../analysis/IntentExtractor.js';

// Import types from SyncOrchestrator to avoid conflicts
export type {
  SyncResult,
  SearchResult,
} from '../../orchestration/SyncOrchestrator.js';
