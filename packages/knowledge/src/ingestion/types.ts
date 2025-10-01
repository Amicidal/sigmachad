/**
 * Knowledge-specific Ingestion Pipeline Types
 * Additional types specific to the knowledge package
 */

import {
  ChangeEvent,
  ChangeFragment,
  QueueConfig,
  QueueMetrics,
  TaskPayload,
  WorkerConfig,
  WorkerMetrics,
  WorkerResult,
  BatchConfig,
  BatchMetadata,
  BatchResult,
  PipelineConfig,
  PipelineMetrics,
  PipelineState,
  DependencyNode,
  DependencyDAG,
  StreamingWriteConfig,
  IdempotentBatch,
  EnrichmentTask,
  EnrichmentResult,
  IngestionTelemetry,
  AlertConfig,
  IngestionError,
  BatchProcessingError,
  WorkerError,
  QueueOverflowError,
  IngestionEvents,
} from '@memento/shared-types';

// Re-export shared types for convenience
export type {
  ChangeEvent,
  ChangeFragment,
  QueueConfig,
  QueueMetrics,
  TaskPayload,
  WorkerConfig,
  WorkerMetrics,
  WorkerResult,
  BatchConfig,
  BatchMetadata,
  BatchResult,
  PipelineConfig,
  PipelineMetrics,
  PipelineState,
  DependencyNode,
  DependencyDAG,
  StreamingWriteConfig,
  IdempotentBatch,
  EnrichmentTask,
  EnrichmentResult,
  IngestionTelemetry,
  AlertConfig,
  IngestionEvents,
};

// Re-export error classes as runtime values
export {
  IngestionError,
  BatchProcessingError,
  WorkerError,
  QueueOverflowError,
};
