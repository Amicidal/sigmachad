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
    // Security relationships
    RelationshipType["HAS_SECURITY_ISSUE"] = "HAS_SECURITY_ISSUE";
    RelationshipType["DEPENDS_ON_VULNERABLE"] = "DEPENDS_ON_VULNERABLE";
    RelationshipType["SECURITY_IMPACTS"] = "SECURITY_IMPACTS";
    // Performance relationships
    RelationshipType["PERFORMANCE_IMPACT"] = "PERFORMANCE_IMPACT";
    RelationshipType["PERFORMANCE_REGRESSION"] = "PERFORMANCE_REGRESSION";
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
//# sourceMappingURL=relationships.js.map