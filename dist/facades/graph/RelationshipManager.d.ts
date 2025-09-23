/**
 * RelationshipManager - Handles all relationship-specific operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */
import { GraphRelationship, RelationshipQuery } from "../../models/relationships.js";
interface RelationshipService {
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
    mergeNormalizedDuplicates(): Promise<number>;
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}
export declare class RelationshipManager {
    private relationshipService;
    constructor(relationshipService: RelationshipService);
    createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    queryRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
    listRelationships(query: RelationshipQuery): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    upsertRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    canonicalizeRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
    upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
    mergeNormalizedDuplicates(): Promise<number>;
    markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
    getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
    getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
    finalizeScan(scanStart: Date): Promise<void>;
}
export {};
//# sourceMappingURL=RelationshipManager.d.ts.map