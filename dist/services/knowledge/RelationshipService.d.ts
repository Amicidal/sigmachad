/**
 * Relationship Service
 * Handles relationship management, normalization, and evidence merging
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { GraphRelationship, RelationshipType, RelationshipQuery } from '../../models/relationships.js';
export interface BulkRelationshipOptions {
    skipExisting?: boolean;
    mergeEvidence?: boolean;
    updateTimestamps?: boolean;
}
export interface RelationshipStats {
    total: number;
    byType: Record<string, number>;
    active: number;
    inactive: number;
    withEvidence: number;
}
export declare class RelationshipService extends EventEmitter {
    private neo4j;
    constructor(neo4j: Neo4jService);
    /**
     * Create or update a relationship
     */
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    /**
     * Bulk create relationships
     */
    createRelationshipsBulk(relationships: GraphRelationship[], options?: BulkRelationshipOptions): Promise<{
        created: number;
        updated: number;
        failed: number;
    }>;
    /**
     * Get relationships based on query
     */
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    /**
     * Delete a relationship
     */
    deleteRelationship(fromId: string, toId: string, type: RelationshipType): Promise<void>;
    /**
     * Mark relationships as inactive if not seen since a date
     */
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    /**
     * Update relationship evidence in bulk
     */
    upsertEdgeEvidenceBulk(updates: Array<{
        fromId: string;
        toId: string;
        type: RelationshipType;
        evidence: any[];
        locations?: any[];
    }>): Promise<void>;
    /**
     * Get relationship statistics
     */
    getRelationshipStats(): Promise<RelationshipStats>;
    /**
     * Merge duplicate relationships
     */
    mergeNormalizedDuplicates(): Promise<number>;
    /**
     * Normalize a relationship
     */
    private normalizeRelationship;
    /**
     * Generate a canonical relationship ID
     */
    private generateRelationshipId;
    /**
     * Extract properties for Neo4j storage
     */
    private extractRelationshipProperties;
    /**
     * Parse relationship from Neo4j result
     */
    private parseRelationshipFromNeo4j;
    /**
     * Update auxiliary data for a relationship
     */
    private updateRelationshipAuxiliary;
    /**
     * Build bulk merge query for relationships
     */
    private buildBulkMergeQuery;
    /**
     * Build bulk create query for relationships
     */
    private buildBulkCreateQuery;
}
//# sourceMappingURL=RelationshipService.d.ts.map