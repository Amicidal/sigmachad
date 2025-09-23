/**
 * Version Manager
 * Handles version creation, pruning, and entity timeline operations
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
export interface VersionInfo {
    id: string;
    entityId: string;
    hash: string;
    timestamp: Date;
    changeSetId?: string;
    path?: string;
    language?: string;
}
export declare class VersionManager extends EventEmitter {
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
     * Prune old history data
     */
    pruneHistory(retentionDays: number, options?: {
        dryRun?: boolean;
        batchSize?: number;
    }): Promise<{
        versions: number;
        closedEdges: number;
        checkpoints: number;
    }>;
    /**
     * Get entity timeline
     */
    getEntityTimeline(entityId: string, options?: {
        startTime?: Date;
        endTime?: Date;
        limit?: number;
        includeContent?: boolean;
    }): Promise<VersionInfo[]>;
}
//# sourceMappingURL=VersionManager.d.ts.map