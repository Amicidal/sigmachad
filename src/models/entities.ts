/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */

import {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
} from "./relationships.js";

export interface CodebaseEntity {
  id: string;
  path: string;
  hash: string;
  language: string;
  lastModified: Date;
  created: Date;
  metadata?: Record<string, any>;
}

export interface File extends CodebaseEntity {
  type: "file";
  extension: string;
  size: number;
  lines: number;
  isTest: boolean;
  isConfig: boolean;
  dependencies: string[];
}

export interface Directory extends CodebaseEntity {
  type: "directory";
  children: string[];
  depth: number;
}

export interface Module extends CodebaseEntity {
  type: "module";
  name: string;
  version: string;
  packageJson: any;
  entryPoint: string;
}

export interface Symbol extends CodebaseEntity {
  type: "symbol";
  name: string;
  kind:
    | "function"
    | "class"
    | "interface"
    | "typeAlias"
    | "variable"
    | "property"
    | "method"
    | "unknown";
  signature: string;
  docstring: string;
  visibility: "public" | "private" | "protected";
  isExported: boolean;
  isDeprecated: boolean;
  location?: {
    line: number;
    column: number;
    start: number;
    end: number;
  };
}

export interface FunctionSymbol extends Symbol {
  kind: "function";
  parameters: FunctionParameter[];
  returnType: string;
  isAsync: boolean;
  isGenerator: boolean;
  complexity: number;
  calls: string[];
}

export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
  optional: boolean;
}

export interface ClassSymbol extends Symbol {
  kind: "class";
  extends: string[];
  implements: string[];
  methods: string[];
  properties: string[];
  isAbstract: boolean;
}

export interface InterfaceSymbol extends Symbol {
  kind: "interface";
  extends: string[];
  methods: string[];
  properties: string[];
}

export interface TypeAliasSymbol extends Symbol {
  kind: "typeAlias";
  aliasedType: string;
  isUnion: boolean;
  isIntersection: boolean;
}

export interface Test extends CodebaseEntity {
  type: "test";
  testType: "unit" | "integration" | "e2e";
  targetSymbol: string;
  framework: string;
  coverage: CoverageMetrics;
  status: "passing" | "failing" | "skipped" | "unknown";
  flakyScore: number; // 0-1, higher means more likely to be flaky
  lastRunAt?: Date;
  lastDuration?: number;
  executionHistory: TestExecution[];
  performanceMetrics: TestPerformanceMetrics;
  dependencies: string[]; // Symbols this test depends on
  tags: string[];
}

export interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestExecution {
  id: string;
  timestamp: Date;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: TestPerformanceData;
  environment?: Record<string, any>;
}

export interface TestPerformanceData {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  databaseQueries?: number;
  fileOperations?: number;
}

export interface TestPerformanceMetrics {
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: TestBenchmark[];
  historicalData: TestHistoricalData[];
}

export interface TestBenchmark {
  benchmark: string;
  value: number;
  status: "above" | "below" | "at";
  threshold: number;
}

export interface TestHistoricalData {
  timestamp: Date;
  executionTime: number;
  successRate: number;
  coveragePercentage: number;
}

export interface Spec extends CodebaseEntity {
  type: "spec";
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: "draft" | "approved" | "implemented" | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  updated: Date;
}

export interface Change {
  id: string;
  type: "change";
  changeType: "create" | "update" | "delete" | "rename" | "move";
  entityType: string;
  entityId: string;
  timestamp: Date;
  author?: string;
  commitHash?: string;
  diff?: string;
  previousState?: any;
  newState?: any;
  sessionId?: string;
  specId?: string;
}

export interface Session {
  id: string;
  type: "session";
  startTime: Date;
  endTime?: Date;
  agentType: string;
  userId?: string;
  changes: string[];
  specs: string[];
  status: "active" | "completed" | "failed";
  metadata?: Record<string, any>;
}

// Version snapshot of an entity (append-only)
export interface Version {
  id: string;
  type: "version";
  entityId: string; // id of the current/live entity node
  path?: string;
  hash: string;
  language?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Checkpoint descriptor for a materialized neighborhood
export interface Checkpoint {
  id: string;
  type: "checkpoint";
  checkpointId: string;
  timestamp: Date;
  reason: "daily" | "incident" | "manual";
  hops: number;
  seedEntities: string[];
  metadata?: Record<string, any>;
}

// Documentation-related entities for enhanced capabilities
export interface DocumentationNode extends CodebaseEntity {
  type: "documentation";
  title: string;
  content: string;
  docType: DocumentationNodeType;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  status: DocumentationStatus;
  docVersion: string;
  docHash: string;
  docIntent: DocumentationIntent;
  docSource: DocumentationSource;
  docLocale?: string;
  lastIndexed?: Date;
}

export interface BusinessDomain {
  id: string;
  type: "businessDomain";
  name: string;
  description: string;
  parentDomain?: string;
  criticality: "core" | "supporting" | "utility";
  stakeholders: string[];
  keyProcesses: string[];
  extractedFrom: string[];
}

export interface SemanticCluster {
  id: string;
  type: "semanticCluster";
  name: string;
  description: string;
  businessDomainId: string;
  clusterType: "feature" | "module" | "capability" | "service";
  cohesionScore: number;
  lastAnalyzed: Date;
  memberEntities: string[];
}

// Security-related entities
export interface SecurityIssue {
  id: string;
  type: "securityIssue";
  tool: string;
  ruleId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  cwe?: string;
  owasp?: string;
  affectedEntityId: string;
  lineNumber: number;
  codeSnippet: string;
  remediation: string;
  status: "open" | "fixed" | "accepted" | "false-positive";
  discoveredAt: Date;
  lastScanned: Date;
  confidence: number;
}

export interface Vulnerability {
  id: string;
  type: "vulnerability";
  packageName: string;
  version: string;
  vulnerabilityId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  cvssScore: number;
  affectedVersions: string;
  fixedInVersion: string;
  publishedAt: Date;
  lastUpdated: Date;
  exploitability: "high" | "medium" | "low";
}

// Union type for all entities
export type Entity =
  | File
  | Directory
  | Module
  | Symbol
  | FunctionSymbol
  | ClassSymbol
  | InterfaceSymbol
  | TypeAliasSymbol
  | Test
  | Spec
  | Change
  | Session
  | Version
  | Checkpoint
  | DocumentationNode
  | BusinessDomain
  | SemanticCluster
  | SecurityIssue
  | Vulnerability;

// Type guards for entity discrimination
export const isFile = (entity: Entity | null | undefined): entity is File =>
  entity != null && entity.type === "file";
export const isDirectory = (
  entity: Entity | null | undefined
): entity is Directory => entity != null && entity.type === "directory";
export const isSymbol = (entity: Entity | null | undefined): entity is Symbol =>
  entity != null && entity.type === "symbol";
export const isFunction = (
  entity: Entity | null | undefined
): entity is FunctionSymbol => isSymbol(entity) && entity.kind === "function";
export const isClass = (
  entity: Entity | null | undefined
): entity is ClassSymbol => isSymbol(entity) && entity.kind === "class";
export const isInterface = (
  entity: Entity | null | undefined
): entity is InterfaceSymbol => isSymbol(entity) && entity.kind === "interface";
export const isTest = (entity: Entity | null | undefined): entity is Test =>
  entity != null && entity.type === "test";
export const isSpec = (entity: Entity | null | undefined): entity is Spec =>
  entity != null && entity.type === "spec";

// Re-export RelationshipType from relationships module
export { RelationshipType } from "./relationships.js";
