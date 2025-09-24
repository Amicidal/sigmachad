/**
 * Checkpoint Service
 * Handles checkpoint creation, management, and member operations
 */
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { TimeRangeParams } from "../../../models/types.js";
export interface CheckpointOptions {
    reason: "daily" | "incident" | "manual";
    hops?: number;
    window?: TimeRangeParams;
    description?: string;
}
export interface CheckpointInfo {
    id: string;
    timestamp: Date;
    reason: string;
    seedEntities: string[];
    memberCount: number;
    metadata?: Record<string, any>;
}
export interface CheckpointSummary {
    checkpoint: CheckpointInfo;
    members: Entity[];
    relationships: number;
    lastActivity?: Date;
}
export declare class CheckpointService extends EventEmitter {
    private neo4j;
    private readonly historyEnabled;
    constructor(neo4j: Neo4jService);
    /**
     * Create a checkpoint capturing a subgraph state
     */
    createCheckpoint(seedEntities: string[], options: CheckpointOptions): Promise<{
        checkpointId: string;
        memberCount: number;
    }>;
    /**
     * List checkpoints with optional filtering
     */
    listCheckpoints(options?: {
        reason?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): Promise<CheckpointInfo[]>;
    /**
     * Get checkpoint information
     */
    getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null>;
    /**
     * Get checkpoint members
     */
    getCheckpointMembers(checkpointId: string): Promise<Entity[]>;
    /**
     * Get checkpoint summary with members and relationships
     */
    getCheckpointSummary(checkpointId: string): Promise<CheckpointSummary | null>;
    /**
     * Delete a checkpoint
     */
    deleteCheckpoint(checkpointId: string): Promise<void>;
    /**
     * Export checkpoint data
     */
    exportCheckpoint(checkpointId: string): Promise<any>;
    /**
     * Import checkpoint data
     */
    importCheckpoint(checkpointData: any): Promise<string>;
}
//# sourceMappingURL=CheckpointService.d.ts.map