/**
 * Knowledge Graph Relationship Types for Memento
 * Based on the comprehensive knowledge graph design
 * Note: Core relationship types are now imported from @memento/shared-types
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
  StructuralImportType,
  CodeEdgeSource,
  CodeEdgeKind,
  CodeRelationshipType,
  DocumentationRelationshipType,
  DocumentationSource,
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationStatus,
  DocumentationCoverageScope,
  DocumentationQuality,
  DocumentationPolicyType,
  EdgeEvidence,
  CodeResolution,
  CodeScope,
  PerformanceTrend,
  PerformanceSeverity,
  PerformanceConfidenceInterval,
  PerformanceMetricSample,
  SessionRelationshipType,
  PerformanceRelationshipType,
} from '@memento/shared-types';

export {
  RelationshipType,
  STRUCTURAL_RELATIONSHIP_TYPE_SET,
  isStructuralRelationshipType,
  PERFORMANCE_RELATIONSHIP_TYPE_SET,
  isPerformanceRelationshipType,
  SESSION_RELATIONSHIP_TYPE_SET,
  isSessionRelationshipType,
  CODE_RELATIONSHIP_TYPES,
  DOCUMENTATION_RELATIONSHIP_TYPES,
  isDocumentationRelationshipType,
} from '@memento/shared-types';
