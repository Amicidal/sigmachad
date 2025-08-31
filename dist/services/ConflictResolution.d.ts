/**
 * Conflict Resolution Service
 * Handles conflicts during graph synchronization operations
 */
import { Entity, GraphRelationship } from '../models/entities.js';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
export interface Conflict {
    id: string;
    type: 'entity_version' | 'entity_deletion' | 'relationship_conflict' | 'concurrent_modification';
    entityId?: string;
    relationshipId?: string;
    description: string;
    conflictingValues: {
        current: any;
        incoming: any;
    };
    timestamp: Date;
    resolved: boolean;
    resolution?: ConflictResolution;
    resolutionStrategy?: 'overwrite' | 'merge' | 'skip' | 'manual';
}
export interface ConflictResolution {
    strategy: 'overwrite' | 'merge' | 'skip' | 'manual';
    resolvedValue?: any;
    manualResolution?: string;
    timestamp: Date;
    resolvedBy: string;
}
export interface MergeStrategy {
    name: string;
    priority: number;
    canHandle: (conflict: Conflict) => boolean;
    resolve: (conflict: Conflict) => Promise<ConflictResolution>;
}
export declare class ConflictResolution {
    private kgService;
    private conflicts;
    private mergeStrategies;
    private conflictListeners;
    constructor(kgService: KnowledgeGraphService);
    private initializeDefaultStrategies;
    addMergeStrategy(strategy: MergeStrategy): void;
    detectConflicts(incomingEntities: Entity[], incomingRelationships: GraphRelationship[]): Promise<Conflict[]>;
    resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<boolean>;
    resolveConflictsAuto(conflicts: Conflict[]): Promise<ConflictResolution[]>;
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
}
//# sourceMappingURL=ConflictResolution.d.ts.map