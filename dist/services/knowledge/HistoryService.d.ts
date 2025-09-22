/**
 * History Service
 * Handles temporal versioning, checkpoints, and history pruning
 */
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '../../models/entities.js';
import { RelationshipType } from '../../models/relationships.js';
import { TimeRangeParams, TraversalQuery } from '../../models/types.js';
export interface CheckpointOptions {
    reason: 'daily' | 'incident' | 'manual';
    hops?: number;
    window?: TimeRangeParams;
    description?: string;
}
export interface VersionInfo {
    id: string;
    entityId: string;
    hash: string;
    timestamp: Date;
    changeSetId?: string;
    path?: string;
    language?: string;
}
export interface CheckpointInfo {
    id: string;
    timestamp: Date;
    reason: string;
    seedEntities: string[];
    memberCount: number;
    metadata?: Record<string, any>;
}
export interface HistoryMetrics {
    versions: number;
    checkpoints: number;
    checkpointMembers: {
        avg: number;
        min: number;
        max: number;
    };
    temporalEdges: {
        open: number;
        closed: number;
    };
    lastPrune?: {
        retentionDays: number;
        cutoff: string;
        versions: number;
        closedEdges: number;
        checkpoints: number;
    };
}
export declare class HistoryService extends EventEmitter {
    private neo4j;
    private readonly historyEnabled;
    constructor(neo4j: Neo4jService);
    /**
     * Append a version for an entity
     */
    appendVersion(entity: Entity, options?: {
        changeSetId?: string;
        timestamp?: Date;
    }): Promise<string>;
    /**
     * Create a checkpoint capturing a subgraph state
     */
    createCheckpoint(seedEntities: string[], options: CheckpointOptions): Promise<{
        checkpointId: string;
        memberCount: number;
    }>;
    /**
     * Open a temporal edge with validity period
     */
    openEdge(fromId: string, toId: string, type: RelationshipType, timestamp?: Date, changeSetId?: string): Promise<void>;
    /**
     * Close a temporal edge
     */
    closeEdge(fromId: string, toId: string, type: RelationshipType, timestamp?: Date): Promise<void>;
    /**
     * Prune old history data
     */
    pruneHistory(retentionDays: number, options?: {
        dryRun?: boolean;
    }): Promise<{
        versionsDeleted: number;
        edgesClosed: number;
        checkpointsDeleted: number;
    }>;
    /**
     * Time-travel traversal
     */
    timeTravelTraversal(query: TraversalQuery): Promise<{
        nodes: Entity[];
        edges: any[];
    }>;
    /**
     * List checkpoints with filtering
     */
    listCheckpoints(options?: {
        reason?: string;
        since?: Date;
        until?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: CheckpointInfo[];
        total: number;
    }>;
    /**
     * Get history metrics
     */
    getHistoryMetrics(): Promise<HistoryMetrics>;
    private parseEntity;
    private parseRelationship;
    /**
     * Get checkpoint details
     */
    getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null>;
    /**
     * Get checkpoint members
     */
    getCheckpointMembers(checkpointId: string): Promise<Entity[]>;
    /**
     * Get checkpoint summary
     */
    getCheckpointSummary(checkpointId: string): Promise<{
        checkpoint: CheckpointInfo;
        members: Entity[];
        stats: {
            entityTypes: Record<string, number>;
            totalRelationships: number;
            relationshipTypes: Record<string, number>;
        };
    } | null>;
    /**
     * Delete checkpoint
     */
    deleteCheckpoint(checkpointId: string): Promise<void>;
    /**
     * Export checkpoint data
     */
    exportCheckpoint(checkpointId: string): Promise<{
        checkpoint: CheckpointInfo;
        entities: Entity[];
        relationships: any[];
    } | null>;
    /**
     * Import checkpoint data
     */
    importCheckpoint(checkpointData: {
        checkpoint: CheckpointInfo;
        entities: Entity[];
        relationships: any[];
    }): Promise<string>;
    /**
     * Get entity timeline
     */
    getEntityTimeline(entityId: string, options?: {
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<{
        entity: Entity | null;
        versions: VersionInfo[];
        relationships: any[];
    }>;
    /**
     * Get relationship timeline
     */
    getRelationshipTimeline(relationshipId: string, options?: {
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Get session timeline
     */
    getSessionTimeline(sessionId: string, options?: {
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<{
        versions: VersionInfo[];
        relationships: any[];
        checkpoints: CheckpointInfo[];
    }>;
    /**
     * Get session impacts
     */
    getSessionImpacts(sessionId: string): Promise<{
        entitiesModified: Entity[];
        relationshipsCreated: any[];
        relationshipsClosed: any[];
        metrics: {
            totalEntities: number;
            totalRelationships: number;
            timespan?: {
                start: Date;
                end: Date;
            };
        };
    }>;
    /**
     * Get sessions affecting an entity
     */
    getSessionsAffectingEntity(entityId: string, options?: {
        since?: Date;
        until?: Date;
        limit?: number;
    }): Promise<{
        sessions: string[];
        details: Array<{
            sessionId: string;
            versionCount: number;
            relationshipCount: number;
            timespan: {
                start: Date;
                end: Date;
            };
        }>;
    }>;
    /**
     * Get changes for a session
     */
    getChangesForSession(sessionId: string, options?: {
        entityTypes?: string[];
        relationshipTypes?: string[];
        limit?: number;
    }): Promise<{
        versions: VersionInfo[];
        relationships: any[];
        summary: {
            entitiesAffected: number;
            relationshipsAffected: number;
            entityTypes: Record<string, number>;
            relationshipTypes: Record<string, number>;
        };
    }>;
}
//# sourceMappingURL=HistoryService.d.ts.map