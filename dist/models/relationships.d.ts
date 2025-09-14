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
    HAS_SECURITY_ISSUE = "HAS_SECURITY_ISSUE",
    DEPENDS_ON_VULNERABLE = "DEPENDS_ON_VULNERABLE",
    SECURITY_IMPACTS = "SECURITY_IMPACTS",
    PERFORMANCE_IMPACT = "PERFORMANCE_IMPACT",
    PERFORMANCE_REGRESSION = "PERFORMANCE_REGRESSION",
    SESSION_MODIFIED = "SESSION_MODIFIED",
    SESSION_IMPACTED = "SESSION_IMPACTED",
    SESSION_CHECKPOINT = "SESSION_CHECKPOINT",
    BROKE_IN = "BROKE_IN",
    FIXED_IN = "FIXED_IN",
    DEPENDS_ON_CHANGE = "DEPENDS_ON_CHANGE",
    CHECKPOINT_INCLUDES = "CHECKPOINT_INCLUDES"
}
export interface StructuralRelationship extends Relationship {
    type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS;
}
export interface CodeRelationship extends Relationship {
    type: RelationshipType.CALLS | RelationshipType.REFERENCES | RelationshipType.IMPLEMENTS | RelationshipType.EXTENDS | RelationshipType.DEPENDS_ON;
    strength?: number;
    context?: string;
}
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
    type: RelationshipType.DESCRIBES_DOMAIN | RelationshipType.BELONGS_TO_DOMAIN | RelationshipType.DOCUMENTED_BY | RelationshipType.CLUSTER_MEMBER;
    confidence?: number;
    inferred?: boolean;
    source?: string;
}
export interface SecurityRelationship extends Relationship {
    type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE | RelationshipType.SECURITY_IMPACTS;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
    status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
    cvssScore?: number;
}
export interface PerformanceRelationship extends Relationship {
    type: RelationshipType.PERFORMANCE_IMPACT | RelationshipType.PERFORMANCE_REGRESSION;
    executionTime?: number;
    memoryUsage?: number;
    coveragePercentage?: number;
    benchmarkValue?: number;
}
export interface SessionRelationship extends Relationship {
    type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED | RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN | RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;
    sessionId: string;
    timestamp: Date;
    sequenceNumber: number;
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