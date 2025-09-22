/**
 * Conflict Resolution Service
 * Handles conflicts during graph synchronization operations
 */
import { Entity } from "../models/entities.js";
import { GraphRelationship } from "../models/relationships.js";
import { KnowledgeGraphService } from "./knowledge/KnowledgeGraphService.js";
export interface Conflict {
    id: string;
    type: "entity_version" | "entity_deletion" | "relationship_conflict" | "concurrent_modification";
    entityId?: string;
    relationshipId?: string;
    description: string;
    conflictingValues: {
        current: any;
        incoming: any;
    };
    diff?: Record<string, {
        current: any;
        incoming: any;
    }>;
    signature?: string;
    timestamp: Date;
    resolved: boolean;
    resolution?: ConflictResolutionResult;
    resolutionStrategy?: "overwrite" | "merge" | "skip" | "manual";
}
export interface ConflictResolution {
    strategy: "overwrite" | "merge" | "skip" | "manual";
    resolvedValue?: any;
    manualResolution?: string;
    timestamp: Date;
    resolvedBy: string;
}
export interface MergeStrategy {
    name: string;
    priority: number;
    canHandle: (conflict: Conflict) => boolean;
    resolve: (conflict: Conflict) => Promise<ConflictResolutionResult>;
}
export interface ConflictResolutionResult {
    strategy: "overwrite" | "merge" | "skip" | "manual";
    resolvedValue?: any;
    manualResolution?: string;
    timestamp: Date;
    resolvedBy: string;
}
export declare class ConflictResolution {
    private kgService;
    private conflicts;
    private mergeStrategies;
    private conflictListeners;
    private manualOverrides;
    private static readonly ENTITY_DIFF_IGNORES;
    private static readonly RELATIONSHIP_DIFF_IGNORES;
    constructor(kgService: KnowledgeGraphService);
    private initializeDefaultStrategies;
    addMergeStrategy(strategy: MergeStrategy): void;
    detectConflicts(incomingEntities: Entity[], incomingRelationships: GraphRelationship[]): Promise<Conflict[]>;
    resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<boolean>;
    resolveConflictsAuto(conflicts: Conflict[]): Promise<ConflictResolutionResult[]>;
    private resolveConflictAuto;
    getUnresolvedConflicts(): Conflict[];
    getResolvedConflicts(): Conflict[];
    getConflict(conflictId: string): Conflict | null;
    getConflictsForEntity(entityId: string): Conflict[];
    addConflictListener(listener: (conflict: Conflict) => void): void;
    removeConflictListener(listener: (conflict: Conflict) => void): void;
    private notifyConflictListeners;
    clearResolvedConflicts(): void;
    getConflictStatistics(): {
        total: number;
        resolved: number;
        unresolved: number;
        byType: Record<string, number>;
    };
    private computeEntityDiff;
    private computeRelationshipDiff;
    private prepareForDiff;
    private prepareValue;
    private computeObjectDiff;
    private deepEqual;
    private generateSignature;
    private generateConflictId;
    private upsertConflict;
    private diffEquals;
    private describeDiff;
    private applyResolution;
    private recordManualOverride;
    private normalizeRelationshipInput;
}
//# sourceMappingURL=ConflictResolution.d.ts.map