/**
 * Knowledge Graph Relationship Types for Memento
 * Based on the comprehensive knowledge graph design
 */

export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  created: Date;
  lastModified: Date;
  version: number;
  metadata?: Record<string, any>;
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

  // Security relationships
  HAS_SECURITY_ISSUE = 'HAS_SECURITY_ISSUE',
  DEPENDS_ON_VULNERABLE = 'DEPENDS_ON_VULNERABLE',
  SECURITY_IMPACTS = 'SECURITY_IMPACTS',

  // Performance relationships
  PERFORMANCE_IMPACT = 'PERFORMANCE_IMPACT',
  PERFORMANCE_REGRESSION = 'PERFORMANCE_REGRESSION',

  // Session-based temporal relationships
  SESSION_MODIFIED = 'SESSION_MODIFIED',
  SESSION_IMPACTED = 'SESSION_IMPACTED',
  SESSION_CHECKPOINT = 'SESSION_CHECKPOINT',
  BROKE_IN = 'BROKE_IN',
  FIXED_IN = 'FIXED_IN',
  DEPENDS_ON_CHANGE = 'DEPENDS_ON_CHANGE',

  // Checkpoint relationships
  CHECKPOINT_INCLUDES = 'CHECKPOINT_INCLUDES'
}

// Specific relationship interfaces with additional properties
export interface StructuralRelationship extends Relationship {
  type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS;
}

// Normalized code-edge source and kind enums (string unions)
export type CodeEdgeSource = 'ast' | 'type-checker' | 'heuristic' | 'index' | 'call-typecheck' | string;
// Added 'throw' to align with THROWS edge metadata; keep narrow, purposeful union
export type CodeEdgeKind = 'call' | 'identifier' | 'instantiation' | 'type' | 'read' | 'write' | 'override' | 'inheritance' | 'return' | 'param' | 'decorator' | 'annotation' | 'throw';

// Structured evidence entries allowing multiple sources per edge
export interface EdgeEvidence {
  source: CodeEdgeSource;
  confidence?: number; // 0-1
  location?: { path?: string; line?: number; column?: number };
  note?: string;
}

export interface CodeRelationship extends Relationship {
  type: RelationshipType.CALLS | RelationshipType.REFERENCES |
        RelationshipType.IMPLEMENTS | RelationshipType.EXTENDS |
        RelationshipType.DEPENDS_ON | RelationshipType.OVERRIDES |
        RelationshipType.READS | RelationshipType.WRITES |
        RelationshipType.THROWS | RelationshipType.RETURNS_TYPE |
        RelationshipType.PARAM_TYPE;
  strength?: number; // 0-1, how strong the relationship is
  context?: string; // human-readable context like "path:line"

  // Promoted evidence fields for consistent access across code-edge types
  occurrences?: number; // count of occurrences (e.g., call sites)
  confidence?: number; // 0-1 confidence in inferred edge
  inferred?: boolean; // whether edge was inferred (vs resolved deterministically)
  resolved?: boolean; // whether the target was resolved deterministically
  source?: CodeEdgeSource; // primary analysis source
  kind?: CodeEdgeKind; // normalized code-edge kind
  location?: { path?: string; line?: number; column?: number };
  // Extra flags used by AST/type-checker based extraction
  usedTypeChecker?: boolean;
  isExported?: boolean;

  // Richer evidence: optional multi-source backing data and sampled locations
  evidence?: EdgeEvidence[];
  locations?: Array<{ path?: string; line?: number; column?: number }>;

  // Optional hoisted details when available
  callee?: string; // for CALLS edges
  paramName?: string; // for PARAM_TYPE edges
  importDepth?: number; // for deep import resolution
  importAlias?: string; // alias used for imported reference, if any
  usedTypeChecker?: boolean; // whether TS checker was used
  isExported?: boolean; // whether target was exported

  // Structured semantics and context (optional; also present in metadata)
  resolution?: CodeResolution; // how the target was resolved
  scope?: CodeScope; // local/imported/external
  accessPath?: string; // full symbol/call access path if applicable

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
  fromRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };
  toRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };
}

// Resolution and scope helpers for code edges
export type CodeResolution = 'direct' | 'via-import' | 'type-checker' | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';

export interface TestRelationship extends Relationship {
  type: RelationshipType.TESTS | RelationshipType.VALIDATES;
  testType?: 'unit' | 'integration' | 'e2e';
  coverage?: number; // percentage of coverage this relationship represents
}

export interface SpecRelationship extends Relationship {
  type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.IMPLEMENTS_SPEC;
  impactLevel?: 'high' | 'medium' | 'low';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface TemporalRelationship extends Relationship {
  type: RelationshipType.PREVIOUS_VERSION |
        RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN |
        RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN |
        RelationshipType.OF;
  changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
  author?: string;
  commitHash?: string;
}

export interface DocumentationRelationship extends Relationship {
  type: RelationshipType.DESCRIBES_DOMAIN | RelationshipType.BELONGS_TO_DOMAIN |
        RelationshipType.DOCUMENTED_BY | RelationshipType.CLUSTER_MEMBER;
  confidence?: number; // 0-1, confidence in the relationship
  inferred?: boolean; // whether this was inferred vs explicitly stated
  source?: string; // source of the relationship (file, line, etc.)
}

export interface SecurityRelationship extends Relationship {
  type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE |
        RelationshipType.SECURITY_IMPACTS;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
  cvssScore?: number;
}

export interface PerformanceRelationship extends Relationship {
  type: RelationshipType.PERFORMANCE_IMPACT | RelationshipType.PERFORMANCE_REGRESSION;
  executionTime?: number; // in milliseconds
  memoryUsage?: number; // in bytes
  coveragePercentage?: number;
  benchmarkValue?: number;
}

export interface SessionRelationship extends Relationship {
  type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED |
        RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN |
        RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;
  
  // Session tracking
  sessionId: string;
  timestamp: Date; // Precise timestamp of the event
  sequenceNumber: number; // Order within session
  
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
export interface TraversalQuery {
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
