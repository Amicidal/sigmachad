/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */

import {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
} from './relationships.js';

// Import common types from shared-types
import type {
  CodebaseEntity,
  Entity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Test,
  Spec,
  Change,
  Session,
  Version,
  Checkpoint,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssueEntity,
  Vulnerability,
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
} from '@memento/shared-types';

// Re-export common types for backward compatibility
export type {
  CodebaseEntity,
  Entity,
  File,
  Directory,
  Module,
  Symbol,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Test,
  Spec,
  Change,
  Session,
  Version,
  Checkpoint,
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  SecurityIssueEntity,
  Vulnerability,
  CheckpointReason,
  CheckpointCreateRequest,
  TemporalGraphQuery,
  HistoryConfig,
};

// Re-export documentation types
export type {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
};
