/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */

export type {
  CodebaseEntity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  FunctionParameter,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  CoverageMetrics,
  TestPerformanceData,
  TestBenchmark,
  TestHistoricalData,
  TestPerformanceMetrics,
  TestExecution,
  Test,
  Spec,
  Change,
  Session,
  Version,
  Checkpoint,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssue,
  SecurityIssueEntity,
  Vulnerability,
  Entity,
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
  DocumentationCoverageScope,
  DocumentationQuality,
  DocumentationPolicyType,
} from '@memento/shared-types';

export {
  isFile,
  isDirectory,
  isSymbol,
  isFunction,
  isClass,
  isInterface,
  isTest,
  isSpec,
} from '@memento/shared-types';

// Re-export RelationshipType from relationships module for backward compatibility
export { RelationshipType } from './relationships.js';
