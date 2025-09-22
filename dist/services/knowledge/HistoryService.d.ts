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
}
//# sourceMappingURL=HistoryService.d.ts.map