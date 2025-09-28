export type GraphRelationship = StructuralRelationship | CodeRelationship | TestRelationship | SpecRelationship | TemporalRelationship | DocumentationRelationship | SecurityRelationship | PerformanceRelationship | SessionRelationship;
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
interface BaseRelationship {
    source: string;
    target: string;
    type: RelationshipType;
    properties: Record<string, any>;
    createdAt: Date;
}
export interface StructuralRelationship extends BaseRelationship {
    type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS;
}
export interface CodeRelationship extends BaseRelationship {
    type: RelationshipType.CALLS | RelationshipType.REFERENCES | RelationshipType.IMPLEMENTS | RelationshipType.EXTENDS;
}
export type TestRelationship = BaseRelationship & {
    type: RelationshipType.TESTS;
};
export type SpecRelationship = BaseRelationship & {
    type: RelationshipType.IMPLEMENTS_SPEC;
};
export type TemporalRelationship = BaseRelationship & {
    type: RelationshipType.PREVIOUS_VERSION | RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN | RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN | RelationshipType.OF;
};
export type DocumentationRelationship = BaseRelationship & {
    type: RelationshipType.DESCRIBES_DOMAIN | RelationshipType.BELONGS_TO_DOMAIN | RelationshipType.DOCUMENTED_BY | RelationshipType.CLUSTER_MEMBER | RelationshipType.DOMAIN_RELATED | RelationshipType.GOVERNED_BY | RelationshipType.DOCUMENTS_SECTION;
};
export type SecurityRelationship = BaseRelationship & {
    type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE | RelationshipType.SECURITY_IMPACTS;
};
export type PerformanceRelationship = BaseRelationship & {
    type: RelationshipType.PERFORMANCE_IMPACT | RelationshipType.PERFORMANCE_REGRESSION | RelationshipType.COVERAGE_PROVIDES;
};
export type SessionRelationship = BaseRelationship & {
    type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED | RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN | RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE | RelationshipType.CHECKPOINT_INCLUDES;
};
export {};
