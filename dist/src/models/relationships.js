/**
 * Knowledge Graph Relationship Types for Memento
 * Based on the comprehensive knowledge graph design
 */
// Base relationship types
export var RelationshipType;
(function (RelationshipType) {
    // Structural relationships
    RelationshipType["BELONGS_TO"] = "BELONGS_TO";
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
    RelationshipType["USES"] = "USES";
    // Test relationships
    RelationshipType["TESTS"] = "TESTS";
    RelationshipType["VALIDATES"] = "VALIDATES";
    RelationshipType["LOCATED_IN"] = "LOCATED_IN";
    // Spec relationships
    RelationshipType["REQUIRES"] = "REQUIRES";
    RelationshipType["IMPACTS"] = "IMPACTS";
    RelationshipType["LINKED_TO"] = "LINKED_TO";
    // Temporal relationships
    RelationshipType["PREVIOUS_VERSION"] = "PREVIOUS_VERSION";
    RelationshipType["CHANGED_AT"] = "CHANGED_AT";
    RelationshipType["MODIFIED_BY"] = "MODIFIED_BY";
    RelationshipType["CREATED_IN"] = "CREATED_IN";
    RelationshipType["INTRODUCED_IN"] = "INTRODUCED_IN";
    RelationshipType["MODIFIED_IN"] = "MODIFIED_IN";
    RelationshipType["REMOVED_IN"] = "REMOVED_IN";
    // Documentation relationships
    RelationshipType["DESCRIBES_DOMAIN"] = "DESCRIBES_DOMAIN";
    RelationshipType["BELONGS_TO_DOMAIN"] = "BELONGS_TO_DOMAIN";
    RelationshipType["DOCUMENTED_BY"] = "DOCUMENTED_BY";
    RelationshipType["CLUSTER_MEMBER"] = "CLUSTER_MEMBER";
    RelationshipType["DOMAIN_RELATED"] = "DOMAIN_RELATED";
    // Security relationships
    RelationshipType["HAS_SECURITY_ISSUE"] = "HAS_SECURITY_ISSUE";
    RelationshipType["DEPENDS_ON_VULNERABLE"] = "DEPENDS_ON_VULNERABLE";
    RelationshipType["SECURITY_IMPACTS"] = "SECURITY_IMPACTS";
    // Performance relationships
    RelationshipType["PERFORMANCE_IMPACT"] = "PERFORMANCE_IMPACT";
    RelationshipType["COVERAGE_PROVIDES"] = "COVERAGE_PROVIDES";
    RelationshipType["PERFORMANCE_REGRESSION"] = "PERFORMANCE_REGRESSION";
})(RelationshipType || (RelationshipType = {}));
//# sourceMappingURL=relationships.js.map