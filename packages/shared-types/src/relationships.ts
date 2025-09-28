export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  created: Date;
  lastModified: Date;
  version: number;
  metadata?: Record<string, any>;
  siteId?: string;
  siteHash?: string;
  evidence?: any[];
  locations?: any[];
  sites?: any[];
  // Optional temporal validity (history mode)
  validFrom?: Date;
  validTo?: Date | null;
}

// Base relationship types
export enum RelationshipType {
  // Structural relationships
  CONTAINS = 'CONTAINS',
  DEFINES = 'DEFINES',
  EXPORTS = 'EXPORTS',
  IMPORTS = 'IMPORTS',

  // Code relationships
  CALLS = 'CALLS',
  REFERENCES = 'REFERENCES',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  DEPENDS_ON = 'DEPENDS_ON',
  OVERRIDES = 'OVERRIDES',
  READS = 'READS',
  WRITES = 'WRITES',
  THROWS = 'THROWS',
  // Type usage relationships (distinct from module/package deps)
  TYPE_USES = 'TYPE_USES',
  RETURNS_TYPE = 'RETURNS_TYPE',
  PARAM_TYPE = 'PARAM_TYPE',

  // Test relationships
  TESTS = 'TESTS',
  VALIDATES = 'VALIDATES',

  // Spec relationships
  REQUIRES = 'REQUIRES',
  IMPACTS = 'IMPACTS',
  IMPLEMENTS_SPEC = 'IMPLEMENTS_SPEC',

  // Temporal relationships
  PREVIOUS_VERSION = 'PREVIOUS_VERSION',
  MODIFIED_BY = 'MODIFIED_BY',
  CREATED_IN = 'CREATED_IN',
  MODIFIED_IN = 'MODIFIED_IN',
  REMOVED_IN = 'REMOVED_IN',
  OF = 'OF',

  // Documentation relationships
  DESCRIBES_DOMAIN = 'DESCRIBES_DOMAIN',
  BELONGS_TO_DOMAIN = 'BELONGS_TO_DOMAIN',
  DOCUMENTED_BY = 'DOCUMENTED_BY',
  CLUSTER_MEMBER = 'CLUSTER_MEMBER',
  DOMAIN_RELATED = 'DOMAIN_RELATED',
  GOVERNED_BY = 'GOVERNED_BY',
  DOCUMENTS_SECTION = 'DOCUMENTS_SECTION',

  // Security relationships
  HAS_SECURITY_ISSUE = 'HAS_SECURITY_ISSUE',
  DEPENDS_ON_VULNERABLE = 'DEPENDS_ON_VULNERABLE',
  SECURITY_IMPACTS = 'SECURITY_IMPACTS',

  // Performance relationships
  PERFORMANCE_IMPACT = 'PERFORMANCE_IMPACT',
  PERFORMANCE_REGRESSION = 'PERFORMANCE_REGRESSION',
  COVERAGE_PROVIDES = 'COVERAGE_PROVIDES',

  // Session-based temporal relationships
  SESSION_MODIFIED = 'SESSION_MODIFIED',
  SESSION_IMPACTED = 'SESSION_IMPACTED',
  SESSION_CHECKPOINT = 'SESSION_CHECKPOINT',
  BROKE_IN = 'BROKE_IN',
  FIXED_IN = 'FIXED_IN',
  DEPENDS_ON_CHANGE = 'DEPENDS_ON_CHANGE',

  // Checkpoint relationships
  CHECKPOINT_INCLUDES = 'CHECKPOINT_INCLUDES',
}

// Specific relationship interfaces with additional properties
export type StructuralImportType =
  | 'default'
  | 'named'
  | 'namespace'
  | 'wildcard'
  | 'side-effect';

export interface StructuralRelationship extends Relationship {
  type:
    | RelationshipType.CONTAINS
    | RelationshipType.DEFINES
    | RelationshipType.EXPORTS
    | RelationshipType.IMPORTS;
  importType?: StructuralImportType;
  importAlias?: string;
  importDepth?: number;
  isNamespace?: boolean;
  isReExport?: boolean;
  reExportTarget?: string | null;
  language?: string;
  symbolKind?: string;
  modulePath?: string;
  resolutionState?: 'resolved' | 'unresolved' | 'partial';
  metadata?: Record<string, any> & {
    languageSpecific?: Record<string, any>;
  };
  confidence?: number;
  scope?: CodeScope;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

export const STRUCTURAL_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>([
  RelationshipType.CONTAINS,
  RelationshipType.DEFINES,
  RelationshipType.EXPORTS,
  RelationshipType.IMPORTS,
]);

export const isStructuralRelationshipType = (
  type: RelationshipType
): type is StructuralRelationship['type'] =>
  STRUCTURAL_RELATIONSHIP_TYPE_SET.has(type);

export const PERFORMANCE_RELATIONSHIP_TYPES = [
  RelationshipType.PERFORMANCE_IMPACT,
  RelationshipType.PERFORMANCE_REGRESSION,
] as const;

const PERFORMANCE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  PERFORMANCE_RELATIONSHIP_TYPES
);

export type PerformanceRelationshipType =
  (typeof PERFORMANCE_RELATIONSHIP_TYPES)[number];

export const isPerformanceRelationshipType = (
  type: RelationshipType
): type is PerformanceRelationshipType =>
  PERFORMANCE_RELATIONSHIP_TYPE_SET.has(type);

export const SESSION_RELATIONSHIP_TYPES = [
  RelationshipType.SESSION_MODIFIED,
  RelationshipType.SESSION_IMPACTED,
  RelationshipType.SESSION_CHECKPOINT,
  RelationshipType.BROKE_IN,
  RelationshipType.FIXED_IN,
  RelationshipType.DEPENDS_ON_CHANGE,
] as const;

const SESSION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  SESSION_RELATIONSHIP_TYPES
);

export type SessionRelationshipType =
  (typeof SESSION_RELATIONSHIP_TYPES)[number];

export const isSessionRelationshipType = (
  type: RelationshipType
): type is SessionRelationshipType => SESSION_RELATIONSHIP_TYPE_SET.has(type);

// Normalized code-edge source and kind enums (string unions)
// Tightened to a known set to avoid downstream drift; map producer-specific tags to these centrally.
export type CodeEdgeSource =
  | 'ast'
  | 'type-checker'
  | 'heuristic'
  | 'index'
  | 'runtime'
  | 'lsp';
// Added 'throw' to align with THROWS edge metadata; keep narrow, purposeful union
export type CodeEdgeKind =
  | 'call'
  | 'identifier'
  | 'instantiation'
  | 'type'
  | 'read'
  | 'write'
  | 'override'
  | 'inheritance'
  | 'return'
  | 'param'
  | 'decorator'
  | 'annotation'
  | 'throw'
  | 'dependency';

// Shared list of relationship types that describe code edges.
export const CODE_RELATIONSHIP_TYPES = [
  RelationshipType.CALLS,
  RelationshipType.REFERENCES,
  RelationshipType.IMPLEMENTS,
  RelationshipType.EXTENDS,
  RelationshipType.DEPENDS_ON,
  RelationshipType.OVERRIDES,
  RelationshipType.READS,
  RelationshipType.WRITES,
  RelationshipType.THROWS,
  RelationshipType.TYPE_USES,
  RelationshipType.RETURNS_TYPE,
  RelationshipType.PARAM_TYPE,
] as const;

export type CodeRelationshipType = (typeof CODE_RELATIONSHIP_TYPES)[number];

// Documentation relationship helpers
export const DOCUMENTATION_RELATIONSHIP_TYPES = [
  RelationshipType.DESCRIBES_DOMAIN,
  RelationshipType.BELONGS_TO_DOMAIN,
  RelationshipType.DOCUMENTED_BY,
  RelationshipType.CLUSTER_MEMBER,
  RelationshipType.DOMAIN_RELATED,
  RelationshipType.GOVERNED_BY,
  RelationshipType.DOCUMENTS_SECTION,
] as const;

export type DocumentationRelationshipType =
  (typeof DOCUMENTATION_RELATIONSHIP_TYPES)[number];

const DOCUMENTATION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  DOCUMENTATION_RELATIONSHIP_TYPES
);

export const isDocumentationRelationshipType = (
  type: RelationshipType
): type is DocumentationRelationshipType =>
  DOCUMENTATION_RELATIONSHIP_TYPE_SET.has(type);

export type DocumentationSource =
  | 'parser'
  | 'manual'
  | 'llm'
  | 'imported'
  | 'sync'
  | 'other';

export type DocumentationIntent = 'ai-context' | 'governance' | 'mixed';

export type DocumentationNodeType =
  | 'readme'
  | 'api-docs'
  | 'design-doc'
  | 'architecture'
  | 'user-guide';

export type DocumentationStatus = 'active' | 'deprecated' | 'draft';

export type DocumentationCoverageScope =
  | 'api'
  | 'behavior'
  | 'operational'
  | 'security'
  | 'compliance';

export type DocumentationQuality = 'complete' | 'partial' | 'outdated';

export type DocumentationPolicyType =
  | 'adr'
  | 'runbook'
  | 'compliance'
  | 'manual'
  | 'decision-log';

// Structured evidence entries allowing multiple sources per edge
export interface EdgeEvidence {
  source: CodeEdgeSource;
  confidence?: number; // 0-1
  location?: { path?: string; line?: number; column?: number };
  note?: string;
  // Optional extractor/schema versioning for auditability
  extractorVersion?: string;
}

export interface CodeRelationship extends Relationship {
  type: CodeRelationshipType;
  /** @deprecated prefer confidence */
  strength?: number;
  context?: string; // human-readable context like "path:line"

  // Promoted evidence fields for consistent access across code-edge types
  // Per-scan occurrences (emission-local). For lifetime counts see occurrencesTotal
  occurrencesScan?: number; // occurrences observed in this ingestion/scan
  occurrencesTotal?: number; // monotonic total occurrences accumulated over time
  occurrencesRecent?: number; // optional decayed or windowed count
  confidence?: number; // 0-1 confidence in inferred edge
  inferred?: boolean; // whether edge was inferred (vs resolved deterministically)
  resolved?: boolean; // whether the target was resolved deterministically
  source?: CodeEdgeSource; // primary analysis source
  kind?: CodeEdgeKind; // normalized code-edge kind
  location?: { path?: string; line?: number; column?: number };
  // Extra flags used by AST/type-checker based extraction
  usedTypeChecker?: boolean;
  isExported?: boolean;
  // Edge liveness
  active?: boolean; // whether this edge is currently observed in code

  // Richer evidence: optional multi-source backing data and sampled locations
  evidence?: EdgeEvidence[];
  locations?: Array<{ path?: string; line?: number; column?: number }>;

  // Multiplicity-aware fields (sampling, without changing canonical edge identity)
  siteId?: string; // hash of path:line:column:accessPath for this emission
  sites?: string[]; // bounded list of siteIds observed
  siteHash?: string; // stable semantic-ish hash for the site to survive minor line shifts

  // Human-friendly explanation for inferred edges
  why?: string;

  // Optional hoisted details when available
  callee?: string; // for CALLS edges
  paramName?: string; // for PARAM_TYPE edges
  importDepth?: number; // for deep import resolution
  importAlias?: string; // alias used for imported reference, if any
  isMethod?: boolean; // for CALLS: whether it was a method (obj.method())

  // Structured semantics and context (optional; also present in metadata)
  resolution?: CodeResolution; // how the target was resolved
  scope?: CodeScope; // local/imported/external
  accessPath?: string; // full symbol/call access path if applicable
  ambiguous?: boolean; // whether multiple candidates were plausible
  candidateCount?: number; // number of candidates when ambiguous

  // CALLS-only convenience fields (optional)
  arity?: number; // number of call arguments
  awaited?: boolean; // whether call is awaited
  receiverType?: string; // static type of the call receiver (for method calls)
  dynamicDispatch?: boolean; // method resolved via dynamic dispatch/duck typing
  overloadIndex?: number; // chosen overload index when resolved
  genericArguments?: string[]; // stringified generic args if known

  // WRITES-only convenience field (optional)
  operator?: string; // assignment operator (e.g., '=', '+=')

  // Dataflow/analysis annotations (optional, lightweight)
  dataFlowId?: string; // correlates related READS/WRITES in basic dataflow
  purity?: 'pure' | 'impure' | 'unknown';

  // Future target reference structure (non-breaking optional)
  fromRef?: {
    kind: 'entity' | 'fileSymbol' | 'external';
    id?: string;
    file?: string;
    symbol?: string;
    name?: string;
  };
  toRef?: {
    kind: 'entity' | 'fileSymbol' | 'external';
    id?: string;
    file?: string;
    symbol?: string;
    name?: string;
  };
  // Promoted toRef scalars for efficient querying/indexing (kept in sync with toRef when present)
  to_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;

  // Promoted fromRef scalars for efficient querying/indexing (mirrors to_ref_*)
  from_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;

  // Observation window (peristence): when this edge was first/last seen in code
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

// Resolution and scope helpers for code edges
export type CodeResolution =
  | 'direct'
  | 'via-import'
  | 'type-checker'
  | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';

export interface TestRelationship extends Relationship {
  type: RelationshipType.TESTS | RelationshipType.VALIDATES;
  testType?: 'unit' | 'integration' | 'e2e';
  coverage?: number; // percentage of coverage this relationship represents
}

export interface SpecRelationship extends Relationship {
  type:
    | RelationshipType.REQUIRES
    | RelationshipType.IMPACTS
    | RelationshipType.IMPLEMENTS_SPEC;
  impactLevel?: 'high' | 'medium' | 'low';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface TemporalRelationship extends Relationship {
  type:
    | RelationshipType.PREVIOUS_VERSION
    | RelationshipType.MODIFIED_BY
    | RelationshipType.CREATED_IN
    | RelationshipType.MODIFIED_IN
    | RelationshipType.REMOVED_IN
    | RelationshipType.OF;
  changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
  author?: string;
  commitHash?: string;
}

export interface DocumentationRelationship extends Relationship {
  type: DocumentationRelationshipType;
  confidence?: number; // 0-1, confidence in the relationship
  inferred?: boolean; // whether this was inferred vs explicitly stated
  source?: DocumentationSource; // source of the relationship
  docIntent?: DocumentationIntent;
  sectionAnchor?: string;
  sectionTitle?: string;
  summary?: string;
  docVersion?: string;
  docHash?: string;
  documentationQuality?: DocumentationQuality;
  coverageScope?: DocumentationCoverageScope;
  evidence?: Array<{ type: 'heading' | 'snippet' | 'link'; value: string }>;
  tags?: string[];
  stakeholders?: string[];
  domainPath?: string;
  taxonomyVersion?: string;
  updatedFromDocAt?: Date;
  lastValidated?: Date;
  strength?: number;
  similarityScore?: number;
  clusterVersion?: string;
  role?: 'core' | 'supporting' | 'entry-point' | 'integration';
  docEvidenceId?: string;
  docAnchor?: string;
  embeddingVersion?: string;
  policyType?: DocumentationPolicyType;
  effectiveFrom?: Date;
  expiresAt?: Date | null;
  relationshipType?: 'depends_on' | 'overlaps' | 'shares_owner' | string;
  docLocale?: string;
}

export interface SecurityRelationship extends Relationship {
  type:
    | RelationshipType.HAS_SECURITY_ISSUE
    | RelationshipType.DEPENDS_ON_VULNERABLE
    | RelationshipType.SECURITY_IMPACTS;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
  cvssScore?: number;
}

export type PerformanceTrend = 'regression' | 'improvement' | 'neutral';

export type PerformanceSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface PerformanceConfidenceInterval {
  lower?: number;
  upper?: number;
}

export interface PerformanceMetricSample {
  timestamp?: Date;
  value: number;
  runId?: string;
  environment?: string;
  unit?: string;
}

export interface PerformanceRelationship extends Relationship {
  type: PerformanceRelationshipType;
  metricId: string;
  scenario?: string;
  environment?: string;
  baselineValue?: number;
  currentValue?: number;
  unit?: string;
  delta?: number;
  percentChange?: number;
  sampleSize?: number;
  confidenceInterval?: PerformanceConfidenceInterval | null;
  trend?: PerformanceTrend;
  severity?: PerformanceSeverity;
  riskScore?: number;
  runId?: string;
  policyId?: string;
  detectedAt?: Date;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[];
  evidence?: EdgeEvidence[];
  metadata?: Record<string, any> & {
    metrics?: Array<Record<string, any>>;
  };
}

export interface SessionRelationship extends Relationship {
  type:
    | RelationshipType.SESSION_MODIFIED
    | RelationshipType.SESSION_IMPACTED
    | RelationshipType.SESSION_CHECKPOINT
    | RelationshipType.BROKE_IN
    | RelationshipType.FIXED_IN
    | RelationshipType.DEPENDS_ON_CHANGE;

  // Session tracking
  sessionId: string;
  timestamp: Date; // Precise timestamp of the event
  sequenceNumber: number; // Order within session
  eventId?: string;
  actor?: string;
  annotations?: string[];
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  checkpointId?: string;
  checkpointStatus?: 'pending' | 'completed' | 'failed' | 'manual_intervention';
  checkpointDetails?: {
    reason?: 'daily' | 'incident' | 'manual';
    hopCount?: number;
    attempts?: number;
    seedEntityIds?: string[];
    jobId?: string;
    error?: string;
    updatedAt?: Date;
  };

  // Semantic change information (for SESSION_MODIFIED)
  changeInfo?: {
    elementType: 'function' | 'class' | 'import' | 'test';
    elementName: string;
    operation: 'added' | 'modified' | 'deleted' | 'renamed';
    semanticHash?: string; // Hash of the semantic unit, not full file
    affectedLines?: number; // Approximate lines changed
  };

  // State transition tracking (for BROKE_IN, FIXED_IN, SESSION_CHECKPOINT)
  stateTransition?: {
    from: 'working' | 'broken' | 'unknown';
    to: 'working' | 'broken' | 'unknown';
    verifiedBy: 'test' | 'build' | 'manual';
    confidence: number; // 0-1, confidence in state determination
    criticalChange?: {
      entityId: string;
      beforeSnippet?: string; // Just the relevant lines before
      afterSnippet?: string; // Just the relevant lines after
    };
  };

  // Impact information (for SESSION_IMPACTED)
  impact?: {
    severity: 'high' | 'medium' | 'low';
    testsFailed?: string[];
    testsFixed?: string[];
    buildError?: string;
    performanceImpact?: number; // Performance delta if measurable
  };
}

// Union type for all relationships
export type GraphRelationship =
  | StructuralRelationship
  | CodeRelationship
  | TestRelationship
  | SpecRelationship
  | TemporalRelationship
  | DocumentationRelationship
  | SecurityRelationship
  | PerformanceRelationship
  | SessionRelationship;

// Query interfaces for relationship operations
export interface RelationshipQuery {
  fromEntityId?: string;
  toEntityId?: string;
  type?: RelationshipType | RelationshipType[];
  entityTypes?: string[];
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  domainPath?: string | string[];
  domainPrefix?: string | string[];
  docIntent?: DocumentationIntent | DocumentationIntent[];
  docType?: DocumentationNodeType | DocumentationNodeType[];
  docStatus?: DocumentationStatus | DocumentationStatus[];
  docLocale?: string | string[];
  coverageScope?: DocumentationCoverageScope | DocumentationCoverageScope[];
  embeddingVersion?: string | string[];
  clusterId?: string | string[];
  clusterVersion?: string | string[];
  stakeholder?: string | string[];
  tag?: string | string[];
  lastValidatedAfter?: Date;
  lastValidatedBefore?: Date;
  metricId?: string | string[];
  environment?: string | string[];
  severity?: PerformanceSeverity | PerformanceSeverity[];
  trend?: PerformanceTrend | PerformanceTrend[];
  detectedAfter?: Date;
  detectedBefore?: Date;
  resolvedAfter?: Date;
  resolvedBefore?: Date;
  // Extended filters for code edges (optional)
  kind?: CodeEdgeKind | CodeEdgeKind[];
  source?: CodeEdgeSource | CodeEdgeSource[];
  resolution?: CodeResolution | CodeResolution[];
  scope?: CodeScope | CodeScope[];
  confidenceMin?: number;
  confidenceMax?: number;
  inferred?: boolean;
  resolved?: boolean;
  active?: boolean;
  firstSeenSince?: Date;
  lastSeenSince?: Date;
  // Promoted toRef scalars for efficient querying
  to_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;
  // Promoted fromRef scalars for efficient querying (optional)
  from_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;
  // Site identity filtering
  siteHash?: string;
  // Additional code-edge filters (optional)
  arityEq?: number;
  arityMin?: number;
  arityMax?: number;
  awaited?: boolean;
  isMethod?: boolean;
  // CALLS/WRITES convenience filters
  operator?: string;
  callee?: string;
  importDepthMin?: number;
  importDepthMax?: number;
  importAlias?: string | string[];
  importType?: StructuralImportType | StructuralImportType[];
  isNamespace?: boolean;
  language?: string | string[];
  symbolKind?: string | string[];
  modulePath?: string | string[];
  modulePathPrefix?: string;
  // Session relationship filters
  sessionId?: string | string[];
  sessionIds?: string[];
  sequenceNumber?: number | number[];
  sequenceNumberMin?: number;
  sequenceNumberMax?: number;
  timestampFrom?: Date | string;
  timestampTo?: Date | string;
  actor?: string | string[];
  impactSeverity?:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | Array<'critical' | 'high' | 'medium' | 'low'>;
  stateTransitionTo?:
    | 'working'
    | 'broken'
    | 'unknown'
    | Array<'working' | 'broken' | 'unknown'>;
}

export interface RelationshipFilter {
  types?: RelationshipType[];
  directions?: ('outgoing' | 'incoming')[];
  depths?: number[];
  weights?: {
    min?: number;
    max?: number;
  };
}

// Path finding interfaces
export interface PathQuery {
  startEntityId: string;
  endEntityId?: string;
  relationshipTypes?: RelationshipType[];
  maxDepth?: number;
  direction?: 'outgoing' | 'incoming' | 'both';
}

export interface PathResult {
  path: GraphRelationship[];
  totalLength: number;
  relationshipTypes: RelationshipType[];
  entities: string[];
}

// Graph traversal interfaces
export interface GraphTraversalQuery {
  startEntityId: string;
  relationshipTypes: RelationshipType[];
  direction: 'outgoing' | 'incoming' | 'both';
  maxDepth?: number;
  limit?: number;
  filter?: {
    entityTypes?: string[];
    properties?: Record<string, any>;
  };
}

export interface TraversalResult {
  entities: any[];
  relationships: GraphRelationship[];
  paths: PathResult[];
  visited: string[];
}

// Impact analysis interfaces
export interface ImpactQuery {
  entityId: string;
  changeType: 'modify' | 'delete' | 'rename';
  includeIndirect?: boolean;
  maxDepth?: number;
  relationshipTypes?: RelationshipType[];
}

export interface ImpactResult {
  directImpact: {
    entities: any[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: any[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  totalAffectedEntities: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
