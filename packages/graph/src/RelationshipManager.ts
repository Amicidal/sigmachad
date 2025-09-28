/**
 * RelationshipManager - Handles all relationship-specific operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */

import { GraphRelationship, RelationshipQuery } from './relationships.js';

interface RelationshipService {
  createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship>;
  createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any>;
  getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
  deleteRelationship(fromId: string, toId: string, type: any): Promise<void>;
  getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null>;
  upsertEdgeEvidenceBulk(updates: any[]): Promise<void>;
  mergeNormalizedDuplicates(): Promise<number>;
  markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
  getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}

export class RelationshipManager {
  private relationshipService: RelationshipService;

  constructor(relationshipService: RelationshipService) {
    this.relationshipService = relationshipService;
  }

  async createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipService.createRelationship(relationship);
  }

  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any> {
    return this.relationshipService.createRelationshipsBulk(
      relationships,
      options
    );
  }

  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipService.getRelationships(query);
  }

  async queryRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    // Alias for getRelationships for backwards compatibility
    return this.getRelationships(query);
  }

  async deleteRelationship(
    fromId: string,
    toId: string,
    type: any
  ): Promise<void> {
    return this.relationshipService.deleteRelationship(fromId, toId, type);
  }

  async listRelationships(
    query: RelationshipQuery
  ): Promise<{ relationships: GraphRelationship[]; total: number }> {
    const relationships = await this.relationshipService.getRelationships(
      query
    );
    return {
      relationships,
      total: relationships.length,
    };
  }

  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    return this.relationshipService.getRelationshipById(relationshipId);
  }

  async upsertRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    // Check if relationship exists and update, otherwise create
    const existing = await this.relationshipService.getRelationshipById(
      relationship.id
    );
    if (existing) {
      // For now, we'll just return the existing relationship
      // TODO: Implement proper update logic if needed
      return existing;
    } else {
      return this.relationshipService.createRelationship(relationship);
    }
  }

  async canonicalizeRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    // For now, return the relationship as-is
    // TODO: Implement relationship canonicalization logic if needed
    return relationship;
  }

  async upsertEdgeEvidenceBulk(updates: any[]): Promise<void> {
    return this.relationshipService.upsertEdgeEvidenceBulk(updates);
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.relationshipService.mergeNormalizedDuplicates();
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.relationshipService.markInactiveEdgesNotSeenSince(since);
  }

  async getEdgeEvidenceNodes(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipService.getEdgeEvidenceNodes(relationshipId, limit);
  }

  async getEdgeSites(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationshipService.getEdgeSites(relationshipId, limit);
  }

  async getEdgeCandidates(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipService.getEdgeCandidates(relationshipId, limit);
  }

  async finalizeScan(scanStart: Date): Promise<void> {
    // Mark edges as inactive if not seen since scan start
    await this.relationshipService.markInactiveEdgesNotSeenSince(scanStart);
  }
}
