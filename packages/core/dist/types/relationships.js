/**
 * Knowledge Graph Relationship Types for Memento
 * Based on the comprehensive knowledge graph design
 */
// Base relationship types
export var RelationshipType;
(function (RelationshipType) {
    // Structural relationships
    RelationshipType["CONTAINS"] = "CONTAINS";
    RelationshipType["DEFINES"] = "DEFINES";
    RelationshipType["EXPORTS"] = "EXPORTS";
    RelationshipType["IMPORTS"] = "IMPORTS";
    // Code relationships
    RelationshipType["CALLS"] = "CALLS";
    RelationshipType["REFERENCES"] = "REFERENCES";
    RelationshipType["IMPLEMENTS"] = "IMPLEMENTS";
    RelationshipType["EXTENDS"] = "EXTENDS";
    RelationshipType["DEPENDS_ON"] = "DEPENDS_ON";
    RelationshipType["OVERRIDES"] = "OVERRIDES";
    RelationshipType["READS"] = "READS";
    RelationshipType["WRITES"] = "WRITES";
    RelationshipType["THROWS"] = "THROWS";
    // Type usage relationships (distinct from module/package deps)
    RelationshipType["TYPE_USES"] = "TYPE_USES";
    RelationshipType["RETURNS_TYPE"] = "RETURNS_TYPE";
    RelationshipType["PARAM_TYPE"] = "PARAM_TYPE";
    // Test relationships
    RelationshipType["TESTS"] = "TESTS";
    RelationshipType["VALIDATES"] = "VALIDATES";
    // Spec relationships
    RelationshipType["REQUIRES"] = "REQUIRES";
    RelationshipType["IMPACTS"] = "IMPACTS";
    RelationshipType["IMPLEMENTS_SPEC"] = "IMPLEMENTS_SPEC";
    // Temporal relationships
    RelationshipType["PREVIOUS_VERSION"] = "PREVIOUS_VERSION";
    RelationshipType["MODIFIED_BY"] = "MODIFIED_BY";
    RelationshipType["CREATED_IN"] = "CREATED_IN";
    RelationshipType["MODIFIED_IN"] = "MODIFIED_IN";
    RelationshipType["REMOVED_IN"] = "REMOVED_IN";
    RelationshipType["OF"] = "OF";
    // Documentation relationships
    RelationshipType["DESCRIBES_DOMAIN"] = "DESCRIBES_DOMAIN";
    RelationshipType["BELONGS_TO_DOMAIN"] = "BELONGS_TO_DOMAIN";
    RelationshipType["DOCUMENTED_BY"] = "DOCUMENTED_BY";
    RelationshipType["CLUSTER_MEMBER"] = "CLUSTER_MEMBER";
    RelationshipType["DOMAIN_RELATED"] = "DOMAIN_RELATED";
    RelationshipType["GOVERNED_BY"] = "GOVERNED_BY";
    RelationshipType["DOCUMENTS_SECTION"] = "DOCUMENTS_SECTION";
    // Security relationships
    RelationshipType["HAS_SECURITY_ISSUE"] = "HAS_SECURITY_ISSUE";
    RelationshipType["DEPENDS_ON_VULNERABLE"] = "DEPENDS_ON_VULNERABLE";
    RelationshipType["SECURITY_IMPACTS"] = "SECURITY_IMPACTS";
    // Performance relationships
    RelationshipType["PERFORMANCE_IMPACT"] = "PERFORMANCE_IMPACT";
    RelationshipType["PERFORMANCE_REGRESSION"] = "PERFORMANCE_REGRESSION";
    RelationshipType["COVERAGE_PROVIDES"] = "COVERAGE_PROVIDES";
    // Session-based temporal relationships
    RelationshipType["SESSION_MODIFIED"] = "SESSION_MODIFIED";
    RelationshipType["SESSION_IMPACTED"] = "SESSION_IMPACTED";
    RelationshipType["SESSION_CHECKPOINT"] = "SESSION_CHECKPOINT";
    RelationshipType["BROKE_IN"] = "BROKE_IN";
    RelationshipType["FIXED_IN"] = "FIXED_IN";
    RelationshipType["DEPENDS_ON_CHANGE"] = "DEPENDS_ON_CHANGE";
    // Checkpoint relationships
    RelationshipType["CHECKPOINT_INCLUDES"] = "CHECKPOINT_INCLUDES";
})(RelationshipType || (RelationshipType = {}));
const STRUCTURAL_RELATIONSHIP_TYPE_SET = new Set([
    RelationshipType.CONTAINS,
    RelationshipType.DEFINES,
    RelationshipType.EXPORTS,
    RelationshipType.IMPORTS,
]);
export const isStructuralRelationshipType = (type) => STRUCTURAL_RELATIONSHIP_TYPE_SET.has(type);
export const PERFORMANCE_RELATIONSHIP_TYPES = [
    RelationshipType.PERFORMANCE_IMPACT,
    RelationshipType.PERFORMANCE_REGRESSION,
];
const PERFORMANCE_RELATIONSHIP_TYPE_SET = new Set(PERFORMANCE_RELATIONSHIP_TYPES);
export const isPerformanceRelationshipType = (type) => PERFORMANCE_RELATIONSHIP_TYPE_SET.has(type);
export const SESSION_RELATIONSHIP_TYPES = [
    RelationshipType.SESSION_MODIFIED,
    RelationshipType.SESSION_IMPACTED,
    RelationshipType.SESSION_CHECKPOINT,
    RelationshipType.BROKE_IN,
    RelationshipType.FIXED_IN,
    RelationshipType.DEPENDS_ON_CHANGE,
];
const SESSION_RELATIONSHIP_TYPE_SET = new Set(SESSION_RELATIONSHIP_TYPES);
export const isSessionRelationshipType = (type) => SESSION_RELATIONSHIP_TYPE_SET.has(type);
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
];
// Documentation relationship helpers
export const DOCUMENTATION_RELATIONSHIP_TYPES = [
    RelationshipType.DESCRIBES_DOMAIN,
    RelationshipType.BELONGS_TO_DOMAIN,
    RelationshipType.DOCUMENTED_BY,
    RelationshipType.CLUSTER_MEMBER,
    RelationshipType.DOMAIN_RELATED,
    RelationshipType.GOVERNED_BY,
    RelationshipType.DOCUMENTS_SECTION,
];
const DOCUMENTATION_RELATIONSHIP_TYPE_SET = new Set(DOCUMENTATION_RELATIONSHIP_TYPES);
export const isDocumentationRelationshipType = (type) => DOCUMENTATION_RELATIONSHIP_TYPE_SET.has(type);
//# sourceMappingURL=relationships.js.map