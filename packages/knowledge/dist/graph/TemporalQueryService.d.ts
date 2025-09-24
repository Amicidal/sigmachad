/**
 * Temporal Query Service
 * Handles temporal traversals, metrics, and complex time-based queries
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { RelationshipType } from "../../../models/relationships.js";
import { TraversalQuery } from "../../../models/types.js";
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
export interface SessionImpact {
    sessionId: string;
    changes: number;
    entities: string[];
    relationships: number;
    timestamp: Date;
}
export declare class TemporalQueryService extends EventEmitter {
    private neo4j;
    private readonly historyEnabled;
    constructor(neo4j: Neo4jService);
    /**
     * Open a temporal edge with validity period
     */
    openEdge(fromId: string, toId: string, type: RelationshipType, timestamp?: Date, changeSetId?: string): Promise<void>;
    /**
     * Close a temporal edge
     */
    closeEdge(fromId: string, toId: string, type: RelationshipType, timestamp?: Date): Promise<void>;
    /**
     * Time travel traversal - query relationships as they existed at a point in time
     */
    timeTravelTraversal(query: TraversalQuery): Promise<any>;
    /**
     * Get comprehensive history metrics
     */
    getHistoryMetrics(): Promise<HistoryMetrics>;
    /**
     * Get relationship timeline
     */
    getRelationshipTimeline(relationshipId: string, options?: {
        startTime?: Date;
        endTime?: Date;
        includeVersions?: boolean;
    }): Promise<any[]>;
    /**
     * Get session timeline
     */
    getSessionTimeline(sessionId: string, options?: {
        startTime?: Date;
        endTime?: Date;
        includeRelationships?: boolean;
    }): Promise<any[]>;
    /**
     * Get impacts of a session on the graph
     */
    getSessionImpacts(sessionId: string): Promise<SessionImpact>;
    /**
     * Get sessions that affected a specific entity
     */
    getSessionsAffectingEntity(entityId: string, options?: {
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Get all changes for a specific session
     */
    getChangesForSession(sessionId: string, options?: {
        includeRelationships?: boolean;
        includeEntityDetails?: boolean;
    }): Promise<any>;
}
//# sourceMappingURL=TemporalQueryService.d.ts.map