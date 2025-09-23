/**
 * HistoryManager - Handles all temporal and history operations
 * Moved from KnowledgeGraphService.ts during refactoring
 */
import { Entity } from "../../../../models/entities.js";
interface HistoryService {
    appendVersion(entity: Entity, options?: any): Promise<string>;
    createCheckpoint(seedEntities: string[], options: any): Promise<any>;
    pruneHistory(retentionDays: number, options?: any): Promise<any>;
    listCheckpoints(options?: any): Promise<any>;
    getHistoryMetrics(): Promise<any>;
    timeTravelTraversal(query: any): Promise<any>;
    exportCheckpoint(checkpointId: string): Promise<any>;
    importCheckpoint(checkpointData: any): Promise<any>;
    getCheckpoint(checkpointId: string): Promise<any>;
    getCheckpointMembers(checkpointId: string): Promise<any>;
    getCheckpointSummary(checkpointId: string): Promise<any>;
    deleteCheckpoint(checkpointId: string): Promise<void>;
    getEntityTimeline(entityId: string, options?: any): Promise<any>;
    getRelationshipTimeline(relationshipId: string, options?: any): Promise<any>;
    getSessionTimeline(sessionId: string, options?: any): Promise<any>;
    getSessionImpacts(sessionId: string): Promise<any>;
    getSessionsAffectingEntity(entityId: string, options?: any): Promise<any>;
    getChangesForSession(sessionId: string, options?: any): Promise<any>;
    openEdge(fromId: string, toId: string, type: any, ts?: Date, changeSetId?: string): Promise<void>;
    closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
}
interface Neo4jService {
    executeCypher(query: string, params: any): Promise<any>;
}
export declare class HistoryManager {
    private historyService;
    private neo4jService;
    constructor(historyService: HistoryService, neo4jService: Neo4jService);
    appendVersion(entity: Entity, options?: any): Promise<string>;
    createCheckpoint(seedEntities: string[], options: any): Promise<any>;
    pruneHistory(retentionDays: number, options?: any): Promise<any>;
    listCheckpoints(options?: any): Promise<any>;
    getHistoryMetrics(): Promise<any>;
    timeTravelTraversal(query: any): Promise<any>;
    exportCheckpoint(checkpointId: string): Promise<any>;
    importCheckpoint(checkpointData: any): Promise<any>;
    getCheckpoint(checkpointId: string): Promise<any>;
    getCheckpointMembers(checkpointId: string): Promise<any>;
    getCheckpointSummary(checkpointId: string): Promise<any>;
    deleteCheckpoint(checkpointId: string): Promise<void>;
    getEntityTimeline(entityId: string, options?: any): Promise<any>;
    getRelationshipTimeline(relationshipId: string, options?: any): Promise<any>;
    getSessionTimeline(sessionId: string, options?: any): Promise<any>;
    getSessionImpacts(sessionId: string): Promise<any>;
    getSessionsAffectingEntity(entityId: string, options?: any): Promise<any>;
    getChangesForSession(sessionId: string, options?: any): Promise<any>;
    openEdge(fromId: string, toId: string, type: any, ts?: Date, changeSetId?: string): Promise<void>;
    closeEdge(fromId: string, toId: string, type: any, ts?: Date): Promise<void>;
    repairPreviousVersionLink(versionId: string): Promise<void>;
    annotateSessionRelationshipsWithCheckpoint(sessionId: string, checkpointId: string, relationshipIds?: string[], timestamp?: Date): Promise<void>;
    createSessionCheckpointLink(sessionId: string, checkpointId: string, metadata?: Record<string, any>): Promise<void>;
}
export {};
//# sourceMappingURL=HistoryManager.d.ts.map