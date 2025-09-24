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
    siteId?: string;
    siteHash?: string;
    evidence?: any[];
    locations?: any[];
    sites?: any[];
    validFrom?: Date;
    validTo?: Date | null;
}
export declare enum RelationshipType {
    CONTAINS = "CONTAINS",
    DEFINES = "DEFINES",
    EXPORTS = "EXPORTS",
    IMPORTS = "IMPORTS",
    CALLS = "CALLS",
    REFERENCES = "REFERENCES",
    IMPLEMENTS = "IMPLEMENTS",
    EXTENDS = "EXTENDS",
    DEPENDS_ON = "DEPENDS_ON",
    OVERRIDES = "OVERRIDES",
    READS = "READS",
    WRITES = "WRITES",
    THROWS = "THROWS",
    TYPE_USES = "TYPE_USES",
    RETURNS_TYPE = "RETURNS_TYPE",
    PARAM_TYPE = "PARAM_TYPE",
    TESTS = "TESTS",
    VALIDATES = "VALIDATES",
    REQUIRES = "REQUIRES",
    IMPACTS = "IMPACTS",
    IMPLEMENTS_SPEC = "IMPLEMENTS_SPEC",
    PREVIOUS_VERSION = "PREVIOUS_VERSION",
    MODIFIED_BY = "MODIFIED_BY",
    CREATED_IN = "CREATED_IN",
    MODIFIED_IN = "MODIFIED_IN",
    REMOVED_IN = "REMOVED_IN",
    OF = "OF",
    DESCRIBES_DOMAIN = "DESCRIBES_DOMAIN",
    BELONGS_TO_DOMAIN = "BELONGS_TO_DOMAIN",
    DOCUMENTED_BY = "DOCUMENTED_BY",
    CLUSTER_MEMBER = "CLUSTER_MEMBER",
    DOMAIN_RELATED = "DOMAIN_RELATED",
    GOVERNED_BY = "GOVERNED_BY",
    DOCUMENTS_SECTION = "DOCUMENTS_SECTION",
    HAS_SECURITY_ISSUE = "HAS_SECURITY_ISSUE",
    DEPENDS_ON_VULNERABLE = "DEPENDS_ON_VULNERABLE",
    SECURITY_IMPACTS = "SECURITY_IMPACTS",
    PERFORMANCE_IMPACT = "PERFORMANCE_IMPACT",
    PERFORMANCE_REGRESSION = "PERFORMANCE_REGRESSION",
    COVERAGE_PROVIDES = "COVERAGE_PROVIDES",
    SESSION_MODIFIED = "SESSION_MODIFIED",
    SESSION_IMPACTED = "SESSION_IMPACTED",
    SESSION_CHECKPOINT = "SESSION_CHECKPOINT",
    BROKE_IN = "BROKE_IN",
    FIXED_IN = "FIXED_IN",
    DEPENDS_ON_CHANGE = "DEPENDS_ON_CHANGE",
    CHECKPOINT_INCLUDES = "CHECKPOINT_INCLUDES"
}
export type StructuralImportType = "default" | "named" | "namespace" | "wildcard" | "side-effect";
export interface StructuralRelationship extends Relationship {
    type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS;
    importType?: StructuralImportType;
    importAlias?: string;
    importDepth?: number;
    isNamespace?: boolean;
    isReExport?: boolean;
    reExportTarget?: string | null;
    language?: string;
    symbolKind?: string;
    modulePath?: string;
    resolutionState?: "resolved" | "unresolved" | "partial";
    metadata?: Record<string, any> & {
        languageSpecific?: Record<string, any>;
    };
    confidence?: number;
    scope?: CodeScope;
    firstSeenAt?: Date;
    lastSeenAt?: Date;
}
export declare const isStructuralRelationshipType: (type: RelationshipType) => type is StructuralRelationship["type"];
export declare const PERFORMANCE_RELATIONSHIP_TYPES: readonly [RelationshipType.PERFORMANCE_IMPACT, RelationshipType.PERFORMANCE_REGRESSION];
export type PerformanceRelationshipType = (typeof PERFORMANCE_RELATIONSHIP_TYPES)[number];
export declare const isPerformanceRelationshipType: (type: RelationshipType) => type is PerformanceRelationshipType;
export declare const SESSION_RELATIONSHIP_TYPES: readonly [RelationshipType.SESSION_MODIFIED, RelationshipType.SESSION_IMPACTED, RelationshipType.SESSION_CHECKPOINT, RelationshipType.BROKE_IN, RelationshipType.FIXED_IN, RelationshipType.DEPENDS_ON_CHANGE];
export type SessionRelationshipType = (typeof SESSION_RELATIONSHIP_TYPES)[number];
export declare const isSessionRelationshipType: (type: RelationshipType) => type is SessionRelationshipType;
export type CodeEdgeSource = 'ast' | 'type-checker' | 'heuristic' | 'index' | 'runtime' | 'lsp';
export type CodeEdgeKind = 'call' | 'identifier' | 'instantiation' | 'type' | 'read' | 'write' | 'override' | 'inheritance' | 'return' | 'param' | 'decorator' | 'annotation' | 'throw' | 'dependency';
export declare const CODE_RELATIONSHIP_TYPES: readonly [RelationshipType.CALLS, RelationshipType.REFERENCES, RelationshipType.IMPLEMENTS, RelationshipType.EXTENDS, RelationshipType.DEPENDS_ON, RelationshipType.OVERRIDES, RelationshipType.READS, RelationshipType.WRITES, RelationshipType.THROWS, RelationshipType.TYPE_USES, RelationshipType.RETURNS_TYPE, RelationshipType.PARAM_TYPE];
export type CodeRelationshipType = (typeof CODE_RELATIONSHIP_TYPES)[number];
export declare const DOCUMENTATION_RELATIONSHIP_TYPES: readonly [RelationshipType.DESCRIBES_DOMAIN, RelationshipType.BELONGS_TO_DOMAIN, RelationshipType.DOCUMENTED_BY, RelationshipType.CLUSTER_MEMBER, RelationshipType.DOMAIN_RELATED, RelationshipType.GOVERNED_BY, RelationshipType.DOCUMENTS_SECTION];
export type DocumentationRelationshipType = (typeof DOCUMENTATION_RELATIONSHIP_TYPES)[number];
export declare const isDocumentationRelationshipType: (type: RelationshipType) => type is DocumentationRelationshipType;
export type DocumentationSource = 'parser' | 'manual' | 'llm' | 'imported' | 'sync' | 'other';
export type DocumentationIntent = 'ai-context' | 'governance' | 'mixed';
export type DocumentationNodeType = 'readme' | 'api-docs' | 'design-doc' | 'architecture' | 'user-guide';
export type DocumentationStatus = 'active' | 'deprecated' | 'draft';
export type DocumentationCoverageScope = 'api' | 'behavior' | 'operational' | 'security' | 'compliance';
export type DocumentationQuality = 'complete' | 'partial' | 'outdated';
export type DocumentationPolicyType = 'adr' | 'runbook' | 'compliance' | 'manual' | 'decision-log';
export interface EdgeEvidence {
    source: CodeEdgeSource;
    confidence?: number;
    location?: {
        path?: string;
        line?: number;
        column?: number;
    };
    note?: string;
    extractorVersion?: string;
}
export interface CodeRelationship extends Relationship {
    type: CodeRelationshipType;
    /** @deprecated prefer confidence */
    strength?: number;
    context?: string;
    occurrencesScan?: number;
    occurrencesTotal?: number;
    occurrencesRecent?: number;
    confidence?: number;
    inferred?: boolean;
    resolved?: boolean;
    source?: CodeEdgeSource;
    kind?: CodeEdgeKind;
    location?: {
        path?: string;
        line?: number;
        column?: number;
    };
    usedTypeChecker?: boolean;
    isExported?: boolean;
    active?: boolean;
    evidence?: EdgeEvidence[];
    locations?: Array<{
        path?: string;
        line?: number;
        column?: number;
    }>;
    siteId?: string;
    sites?: string[];
    siteHash?: string;
    why?: string;
    callee?: string;
    paramName?: string;
    importDepth?: number;
    importAlias?: string;
    isMethod?: boolean;
    resolution?: CodeResolution;
    scope?: CodeScope;
    accessPath?: string;
    ambiguous?: boolean;
    candidateCount?: number;
    arity?: number;
    awaited?: boolean;
    receiverType?: string;
    dynamicDispatch?: boolean;
    overloadIndex?: number;
    genericArguments?: string[];
    operator?: string;
    dataFlowId?: string;
    purity?: 'pure' | 'impure' | 'unknown';
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
    to_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
    to_ref_file?: string;
    to_ref_symbol?: string;
    to_ref_name?: string;
    from_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
    from_ref_file?: string;
    from_ref_symbol?: string;
    from_ref_name?: string;
    firstSeenAt?: Date;
    lastSeenAt?: Date;
}
export type CodeResolution = 'direct' | 'via-import' | 'type-checker' | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';
export interface TestRelationship extends Relationship {
    type: RelationshipType.TESTS | RelationshipType.VALIDATES;
    testType?: 'unit' | 'integration' | 'e2e';
    coverage?: number;
}
export interface SpecRelationship extends Relationship {
    type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.IMPLEMENTS_SPEC;
    impactLevel?: 'high' | 'medium' | 'low';
    priority?: 'critical' | 'high' | 'medium' | 'low';
}
export interface TemporalRelationship extends Relationship {
    type: RelationshipType.PREVIOUS_VERSION | RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN | RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN | RelationshipType.OF;
    changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
    author?: string;
    commitHash?: string;
}
export interface DocumentationRelationship extends Relationship {
    type: DocumentationRelationshipType;
    confidence?: number;
    inferred?: boolean;
    source?: DocumentationSource;
    docIntent?: DocumentationIntent;
    sectionAnchor?: string;
    sectionTitle?: string;
    summary?: string;
    docVersion?: string;
    docHash?: string;
    documentationQuality?: DocumentationQuality;
    coverageScope?: DocumentationCoverageScope;
    evidence?: Array<{
        type: 'heading' | 'snippet' | 'link';
        value: string;
    }>;
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
    type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE | RelationshipType.SECURITY_IMPACTS;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
    status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
    cvssScore?: number;
}
export type PerformanceTrend = "regression" | "improvement" | "neutral";
export type PerformanceSeverity = "critical" | "high" | "medium" | "low";
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
    type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED | RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN | RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;
    sessionId: string;
    timestamp: Date;
    sequenceNumber: number;
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
    changeInfo?: {
        elementType: 'function' | 'class' | 'import' | 'test';
        elementName: string;
        operation: 'added' | 'modified' | 'deleted' | 'renamed';
        semanticHash?: string;
        affectedLines?: number;
    };
    stateTransition?: {
        from: 'working' | 'broken' | 'unknown';
        to: 'working' | 'broken' | 'unknown';
        verifiedBy: 'test' | 'build' | 'manual';
        confidence: number;
        criticalChange?: {
            entityId: string;
            beforeSnippet?: string;
            afterSnippet?: string;
        };
    };
    impact?: {
        severity: 'high' | 'medium' | 'low';
        testsFailed?: string[];
        testsFixed?: string[];
        buildError?: string;
        performanceImpact?: number;
    };
}
export type GraphRelationship = StructuralRelationship | CodeRelationship | TestRelationship | SpecRelationship | TemporalRelationship | DocumentationRelationship | SecurityRelationship | PerformanceRelationship | SessionRelationship;
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
    to_ref_kind?: 'entity' | 'fileSymbol' | 'external';
    to_ref_file?: string;
    to_ref_symbol?: string;
    to_ref_name?: string;
    from_ref_kind?: 'entity' | 'fileSymbol' | 'external';
    from_ref_file?: string;
    from_ref_symbol?: string;
    from_ref_name?: string;
    siteHash?: string;
    arityEq?: number;
    arityMin?: number;
    arityMax?: number;
    awaited?: boolean;
    isMethod?: boolean;
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
    sessionId?: string | string[];
    sessionIds?: string[];
    sequenceNumber?: number | number[];
    sequenceNumberMin?: number;
    sequenceNumberMax?: number;
    timestampFrom?: Date | string;
    timestampTo?: Date | string;
    actor?: string | string[];
    impactSeverity?: 'critical' | 'high' | 'medium' | 'low' | Array<'critical' | 'high' | 'medium' | 'low'>;
    stateTransitionTo?: 'working' | 'broken' | 'unknown' | Array<'working' | 'broken' | 'unknown'>;
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
//# sourceMappingURL=relationships.d.ts.map