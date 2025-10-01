/**
 * Knowledge Graph Relationship Types for Memento
 * Re-exported from @memento/shared-types for backward compatibility
 */

// Re-export all relationship types from shared-types
export type {
  Relationship,
  StructuralRelationship,
  CodeRelationship,
  TestRelationship,
  SpecRelationship,
  TemporalRelationship,
  DocumentationRelationship,
  SecurityRelationship,
  PerformanceRelationship,
  SessionRelationship,
  GraphRelationship,
  RelationshipQuery,
  RelationshipFilter,
  PathQuery,
  PathResult,
  GraphTraversalQuery,
  TraversalResult,
  ImpactQuery,
  ImpactResult,
  EdgeEvidence,
  PerformanceMetricSample,
  PerformanceConfidenceInterval,
} from '@memento/shared-types';

export {
  RelationshipType,
  isStructuralRelationshipType,
  isPerformanceRelationshipType,
  isSessionRelationshipType,
  isDocumentationRelationshipType,
  PERFORMANCE_RELATIONSHIP_TYPES,
  SESSION_RELATIONSHIP_TYPES,
  CODE_RELATIONSHIP_TYPES,
  DOCUMENTATION_RELATIONSHIP_TYPES,
  STRUCTURAL_RELATIONSHIP_TYPE_SET,
  PERFORMANCE_RELATIONSHIP_TYPE_SET,
  SESSION_RELATIONSHIP_TYPE_SET,
  DOCUMENTATION_RELATIONSHIP_TYPE_SET,
} from '@memento/shared-types';

// Re-export types
export type {
  StructuralImportType,
  PerformanceRelationshipType,
  SessionRelationshipType,
  CodeRelationshipType,
  DocumentationRelationshipType,
  CodeEdgeSource,
  CodeEdgeKind,
  CodeResolution,
  CodeScope,
  DocumentationSource,
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationStatus,
  DocumentationCoverageScope,
  DocumentationQuality,
  DocumentationPolicyType,
  PerformanceTrend,
  PerformanceSeverity,
} from '@memento/shared-types';
