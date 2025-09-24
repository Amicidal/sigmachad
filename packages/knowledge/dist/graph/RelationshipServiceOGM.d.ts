/**
 * Relationship Service OGM Implementation
 * Migrated version using Neogma OGM instead of custom Cypher queries
 */
import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
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
export interface IRelationshipService extends EventEmitter {
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: BulkRelationshipOptions): Promise<{
        created: number;
        updated: number;
        failed: number;
    }>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    deleteRelationship(fromId: string, toId: string, type: RelationshipType): Promise<void>;
    updateRelationshipAuxiliary(relId: string, rel: GraphRelationship): Promise<void>;
    mergeNormalizedDuplicates(): Promise<number>;
    getRelationshipStats(): Promise<RelationshipStats>;
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    upsertEdgeEvidenceBulk(updates: Array<{
        fromId: string;
        toId: string;
        type: RelationshipType;
        evidence: any[];
        locations?: any[];
    }>): Promise<void>;
    getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}
export declare class RelationshipServiceOGM extends EventEmitter implements IRelationshipService {
    private neogmaService;
    private relationshipModels;
    private entityModels;
    constructor(neogmaService: NeogmaService);
    /**
     * Get the appropriate relationship model based on relationship type
     */
    private getRelationshipModel;
    /**
     * Create or update a relationship using Neogma
     */
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    /**
     * Create relationship using Cypher (fallback for complex operations)
     */
    private createRelationshipWithCypher;
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
     * Update auxiliary data for a relationship
     */
    updateRelationshipAuxiliary(relId: string, rel: GraphRelationship): Promise<void>;
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
     * Build bulk merge query for relationships
     */
    private buildBulkMergeQuery;
    /**
     * Build bulk create query for relationships
     */
    private buildBulkCreateQuery;
    /**
     * Get a single relationship by its ID
     */
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    /**
     * Get evidence nodes for a relationship edge
     */
    getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
    /**
     * Get edge sites for a relationship (locations where the relationship is used)
     */
    getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
    /**
     * Get edge candidates for a relationship (potential relationship targets)
     */
    getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=RelationshipServiceOGM.d.ts.map