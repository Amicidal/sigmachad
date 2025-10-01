/**
 * @file TestTypes.ts
 * @description TypeScript interfaces and types for temporal test tracking functionality
 *
 * Defines data structures for tracking test relationships, evolution, and metrics over time.
 * Based on the tests-relationships.md and temporal-relationships.md blueprints.
 */

import type { TestingRelationship } from '@memento/shared-types';

export type {
  TestMetadata,
  TestType,
  TestStatus,
  TestExecutionRecord,
  CoverageData,
  TestRelationshipType,
  TestEvidence,
  TestEvidenceType,
  TestEvolutionEvent,
  TestEvolutionEventType,
  TestHistorySnapshot,
  TestExecutionMetrics,
  TestTrend,
  TestTrendMetric,
  TrendPeriod,
  TrendDirection,
  TrendDataPoint,
  TestImpactAnalysis,
  RiskLevel,
  ImpactFactor,
  ImpactFactorType,
  TestTimelineQuery,
  TestTemporalQueryResult,
  TestObsolescenceAnalysis,
  ObsolescenceReason,
  ObsolescenceRecommendation,
  TestConfiguration,
} from '@memento/shared-types';

// Local alias: the testing domain uses a richer relationship shape that includes
// testId/entityId metadata. Expose it here as TestRelationship for temporal modules.
export type TestRelationship = TestingRelationship;
