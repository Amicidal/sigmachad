import type { TimeRangeParams } from './api-types.js';
import type {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
  DocumentationCoverageScope,
  DocumentationQuality,
  DocumentationPolicyType,
} from './relationships.js';
import type { SecurityIssue, Vulnerability } from './security.js';

export interface CodebaseEntity {
  id: string;
  type?: string;
  path: string;
  name?: string;
  hash?: string;
  language?: string;
  created?: Date;
  lastModified?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

export interface File extends CodebaseEntity {
  type: 'file';
  name: string;
  hash: string;
  language: string;
  extension: string;
  size: number;
  lines: number;
  isTest: boolean;
  isConfig: boolean;
  dependencies: string[];
}

export interface Directory extends CodebaseEntity {
  type: 'directory';
  name?: string;
  children: string[];
  depth?: number;
  fileCount?: number;
  subdirectoryCount?: number;
}

export interface Module extends CodebaseEntity {
  type: 'module';
  name: string;
  version: string;
  packageJson: any;
  entryPoint: string;
  exports?: string[];
  imports?: string[];
  dependencies?: string[];
  isEntryPoint?: boolean;
}

export interface Symbol extends CodebaseEntity {
  type: 'symbol';
  name: string;
  kind:
    | 'function'
    | 'class'
    | 'interface'
    | 'typeAlias'
    | 'variable'
    | 'property'
    | 'method'
    | 'unknown';
  signature: string;
  docstring: string;
  visibility: 'public' | 'private' | 'protected';
  isExported: boolean;
  isDeprecated: boolean;
  hash: string;
  language: string;
  lastModified: Date;
  location?: {
    line: number;
    column: number;
    start: number;
    end: number;
  };
}

export interface FunctionParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface FunctionSymbol extends Symbol {
  kind: 'function';
  parameters: FunctionParameter[];
  returnType: string;
  isAsync: boolean;
  isGenerator: boolean;
  complexity: number;
  calls: string[];
}

export interface ClassSymbol extends Symbol {
  kind: 'class';
  extends?: string[];
  implements?: string[];
  methods: string[];
  properties: string[];
  constructors?: string[];
  isAbstract: boolean;
}

export interface InterfaceSymbol extends Symbol {
  kind: 'interface';
  extends?: string[];
  methods: string[];
  properties: string[];
}

export interface TypeAliasSymbol extends Symbol {
  kind: 'typeAlias';
  aliasedType: string;
  isUnion?: boolean;
  isIntersection?: boolean;
}

export interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestPerformanceData {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  databaseQueries?: number;
  fileOperations?: number;
}

export interface TestBenchmark {
  benchmark: string;
  value: number;
  status: 'above' | 'below' | 'at';
  threshold: number;
}

export interface TestHistoricalData {
  timestamp: Date;
  executionTime: number;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  coveragePercentage: number;
  runId?: string;
}

export interface TestPerformanceMetrics {
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  benchmarkComparisons: TestBenchmark[];
  historicalData: TestHistoricalData[];
  averageDuration?: number;
  p95Duration?: number;
  slowestRuns?: number[];
  fastestRuns?: number[];
}

export interface TestExecution {
  id: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: TestPerformanceData;
  environment?: Record<string, any>;
}

export interface Test extends CodebaseEntity {
  type: 'test';
  testType: 'unit' | 'integration' | 'e2e';
  targetSymbol: string;
  framework: string;
  coverage: CoverageMetrics;
  status: 'passing' | 'failing' | 'skipped' | 'unknown';
  flakyScore: number;
  lastRunAt?: Date;
  lastDuration?: number;
  executionHistory: TestExecution[];
  performanceMetrics: TestPerformanceMetrics;
  dependencies: string[];
  tags: string[];
}

export interface Spec extends CodebaseEntity {
  type: 'spec';
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'draft' | 'approved' | 'implemented' | 'deprecated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  tags?: string[];
  updated: Date;
}

export interface Change {
  id: string;
  type: 'change';
  changeType: 'create' | 'update' | 'delete' | 'rename' | 'move';
  entityType: string;
  entityId: string;
  timestamp: Date;
  author?: string;
  commitHash?: string;
  diff?: string;
  previousState?: unknown;
  newState?: unknown;
  sessionId?: string;
  specId?: string;
}

export interface Session {
  id: string;
  type: 'session';
  startTime: Date;
  endTime?: Date;
  agentType: string;
  userId?: string;
  changes: string[];
  specs: string[];
  status: 'active' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface Version {
  id: string;
  type: 'version';
  entityId: string;
  hash: string;
  timestamp: Date;
  path?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export type CheckpointReason = 'daily' | 'incident' | 'manual';

export interface Checkpoint {
  id: string;
  type: 'checkpoint';
  checkpointId: string;
  timestamp: Date;
  hops: number;
  seedEntities: string[];
  reason?: CheckpointReason;
  metadata?: Record<string, any>;
}

export interface DocumentationNode extends CodebaseEntity {
  type: 'documentation';
  title: string;
  content: string;
  docType?: DocumentationNodeType;
  businessDomains?: string[];
  stakeholders?: string[];
  technologies?: string[];
  status?: DocumentationStatus;
  docVersion?: string;
  docHash?: string;
  docIntent?: DocumentationIntent;
  docSource?: DocumentationSource;
  docLocale?: string;
  lastIndexed?: Date;
  coverageScope?: DocumentationCoverageScope;
  quality?: DocumentationQuality;
  policyType?: DocumentationPolicyType;
  tags?: string[];
}

export interface BusinessDomain extends CodebaseEntity {
  type: 'businessDomain' | 'business-domain';
  name: string;
  description: string;
  parentDomain?: string;
  criticality: 'core' | 'supporting' | 'utility';
  stakeholders: string[];
  keyProcesses: string[];
  extractedFrom?: string[];
}

export interface SemanticCluster extends CodebaseEntity {
  type: 'semanticCluster' | 'semantic-cluster';
  name: string;
  description: string;
  businessDomainId?: string;
  clusterType?: 'feature' | 'module' | 'capability' | 'service';
  cohesionScore?: number;
  lastAnalyzed?: Date;
  memberEntities?: string[];
  concepts?: string[];
  confidence?: number;
}

export type SecurityIssueEntity = SecurityIssue;

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
  | SecurityIssueEntity
  | Vulnerability;

export interface CheckpointCreateRequest {
  seedEntities: string[];
  reason: CheckpointReason;
  hops?: number;
  window?: TimeRangeParams;
}

export interface TemporalGraphQuery {
  startId: string;
  atTime?: Date;
  since?: Date;
  until?: Date;
  maxDepth?: number;
}

export interface HistoryConfig {
  enabled?: boolean;
  retentionDays?: number;
  checkpoint?: {
    hops?: number;
    embedVersions?: boolean;
  };
}

export const isFile = (
  entity: Entity | null | undefined,
): entity is File => entity != null && entity.type === 'file';

export const isDirectory = (
  entity: Entity | null | undefined,
): entity is Directory => entity != null && entity.type === 'directory';

export const isSymbol = (
  entity: Entity | null | undefined,
): entity is Symbol => entity != null && entity.type === 'symbol';

export const isFunction = (
  entity: Entity | null | undefined,
): entity is FunctionSymbol =>
  isSymbol(entity) && entity.kind === 'function';

export const isClass = (
  entity: Entity | null | undefined,
): entity is ClassSymbol => isSymbol(entity) && entity.kind === 'class';

export const isInterface = (
  entity: Entity | null | undefined,
): entity is InterfaceSymbol => isSymbol(entity) && entity.kind === 'interface';

export const isTest = (
  entity: Entity | null | undefined,
): entity is Test => entity != null && entity.type === 'test';

export const isSpec = (
  entity: Entity | null | undefined,
): entity is Spec => entity != null && entity.type === 'spec';

export type { SecuritySeverity, SecurityIssue, Vulnerability } from './security.js';
