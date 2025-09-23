/**
 * RelationshipManager - Handles all relationship-specific operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */
export class RelationshipManager {
    constructor(relationshipService) {
        this.relationshipService = relationshipService;
    }
    async createRelationship(relationship) {
        return this.relationshipService.createRelationship(relationship);
    }
    async createRelationshipsBulk(relationships, options) {
        return this.relationshipService.createRelationshipsBulk(relationships, options);
    }
    async getRelationships(query) {
        return this.relationshipService.getRelationships(query);
    }
    async queryRelationships(query) {
        // Alias for getRelationships for backwards compatibility
        return this.getRelationships(query);
    }
    async deleteRelationship(fromId, toId, type) {
        return this.relationshipService.deleteRelationship(fromId, toId, type);
    }
    async listRelationships(query) {
        const relationships = await this.relationshipService.getRelationships(query);
        return {
            relationships,
            total: relationships.length,
        };
    }
    async getRelationshipById(relationshipId) {
        return this.relationshipService.getRelationshipById(relationshipId);
    }
    async upsertRelationship(relationship) {
        // Check if relationship exists and update, otherwise create
        const existing = await this.relationshipService.getRelationshipById(relationship.id);
        if (existing) {
            // For now, we'll just return the existing relationship
            // TODO: Implement proper update logic if needed
            return existing;
        }
        else {
            return this.relationshipService.createRelationship(relationship);
        }
    }
    async canonicalizeRelationship(relationship) {
        // For now, return the relationship as-is
        // TODO: Implement relationship canonicalization logic if needed
        return relationship;
    }
    async upsertEdgeEvidenceBulk(updates) {
        return this.relationshipService.upsertEdgeEvidenceBulk(updates);
    }
    async mergeNormalizedDuplicates() {
        return this.relationshipService.mergeNormalizedDuplicates();
    }
    async markInactiveEdgesNotSeenSince(since) {
        return this.relationshipService.markInactiveEdgesNotSeenSince(since);
    }
    async getEdgeEvidenceNodes(relationshipId, limit) {
        return this.relationshipService.getEdgeEvidenceNodes(relationshipId, limit);
    }
    async getEdgeSites(relationshipId, limit) {
        return this.relationshipService.getEdgeSites(relationshipId, limit);
    }
    async getEdgeCandidates(relationshipId, limit) {
        return this.relationshipService.getEdgeCandidates(relationshipId, limit);
    }
    async finalizeScan(scanStart) {
        // Mark edges as inactive if not seen since scan start
        await this.relationshipService.markInactiveEdgesNotSeenSince(scanStart);
    }
}
//# sourceMappingURL=RelationshipManager.js.map