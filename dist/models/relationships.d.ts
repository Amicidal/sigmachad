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
}
export declare enum RelationshipType {
    BELONGS_TO = "BELONGS_TO",
    CONTAINS = "CONTAINS",
    DEFINES = "DEFINES",
    EXPORTS = "EXPORTS",
    IMPORTS = "IMPORTS",
    CALLS = "CALLS",
    REFERENCES = "REFERENCES",
    IMPLEMENTS = "IMPLEMENTS",
    EXTENDS = "EXTENDS",
    DEPENDS_ON = "DEPENDS_ON",
    USES = "USES",
    TESTS = "TESTS",
    VALIDATES = "VALIDATES",
    LOCATED_IN = "LOCATED_IN",
    REQUIRES = "REQUIRES",
    IMPACTS = "IMPACTS",
    LINKED_TO = "LINKED_TO",
    PREVIOUS_VERSION = "PREVIOUS_VERSION",
    CHANGED_AT = "CHANGED_AT",
    MODIFIED_BY = "MODIFIED_BY",
    CREATED_IN = "CREATED_IN",
    INTRODUCED_IN = "INTRODUCED_IN",
    MODIFIED_IN = "MODIFIED_IN",
    REMOVED_IN = "REMOVED_IN",
    DESCRIBES_DOMAIN = "DESCRIBES_DOMAIN",
    BELONGS_TO_DOMAIN = "BELONGS_TO_DOMAIN",
    DOCUMENTED_BY = "DOCUMENTED_BY",
    CLUSTER_MEMBER = "CLUSTER_MEMBER",
    DOMAIN_RELATED = "DOMAIN_RELATED",
    HAS_SECURITY_ISSUE = "HAS_SECURITY_ISSUE",
    DEPENDS_ON_VULNERABLE = "DEPENDS_ON_VULNERABLE",
    SECURITY_IMPACTS = "SECURITY_IMPACTS",
    PERFORMANCE_IMPACT = "PERFORMANCE_IMPACT",
    COVERAGE_PROVIDES = "COVERAGE_PROVIDES",
    PERFORMANCE_REGRESSION = "PERFORMANCE_REGRESSION"
}
export interface StructuralRelationship extends Relationship {
    type: RelationshipType.BELONGS_TO | RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS;
}
export interface CodeRelationship extends Relationship {
    type: RelationshipType.CALLS | RelationshipType.REFERENCES | RelationshipType.IMPLEMENTS | RelationshipType.EXTENDS | RelationshipType.DEPENDS_ON | RelationshipType.USES;
    strength?: number;
    context?: string;
}
export interface TestRelationship extends Relationship {
    type: RelationshipType.TESTS | RelationshipType.VALIDATES | RelationshipType.LOCATED_IN;
    testType?: 'unit' | 'integration' | 'e2e';
    coverage?: number;
}
export interface SpecRelationship extends Relationship {
    type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.LINKED_TO;
    impactLevel?: 'high' | 'medium' | 'low';
    priority?: 'critical' | 'high' | 'medium' | 'low';
}
export interface TemporalRelationship extends Relationship {
    type: RelationshipType.PREVIOUS_VERSION | RelationshipType.CHANGED_AT | RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN | RelationshipType.INTRODUCED_IN | RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN;
    changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
    author?: string;
    commitHash?: string;
}
export interface DocumentationRelationship extends Relationship {
    type: RelationshipType.DESCRIBES_DOMAIN | RelationshipType.BELONGS_TO_DOMAIN | RelationshipType.DOCUMENTED_BY | RelationshipType.CLUSTER_MEMBER | RelationshipType.DOMAIN_RELATED;
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
    type: RelationshipType.PERFORMANCE_IMPACT | RelationshipType.COVERAGE_PROVIDES | RelationshipType.PERFORMANCE_REGRESSION;
    executionTime?: number;
    memoryUsage?: number;
    coveragePercentage?: number;
    benchmarkValue?: number;
}
export type GraphRelationship = StructuralRelationship | CodeRelationship | TestRelationship | SpecRelationship | TemporalRelationship | DocumentationRelationship | SecurityRelationship | PerformanceRelationship;
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