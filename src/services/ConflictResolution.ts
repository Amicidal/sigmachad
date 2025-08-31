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

export class ConflictResolution {
  private conflicts = new Map<string, Conflict>();
  private mergeStrategies: MergeStrategy[] = [];
  private conflictListeners = new Set<(conflict: Conflict) => void>();

  constructor(private kgService: KnowledgeGraphService) {
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {
    // Strategy 1: Last Write Wins (highest priority)
    this.addMergeStrategy({
      name: 'last_write_wins',
      priority: 100,
      canHandle: () => true,
      resolve: async (conflict) => ({
        strategy: 'overwrite',
        resolvedValue: conflict.conflictingValues.incoming,
        timestamp: new Date(),
        resolvedBy: 'system',
      }),
    });

    // Strategy 2: Merge properties (for entity conflicts)
    this.addMergeStrategy({
      name: 'property_merge',
      priority: 50,
      canHandle: (conflict) => conflict.type === 'entity_version',
      resolve: async (conflict) => {
        const current = conflict.conflictingValues.current as Entity;
        const incoming = conflict.conflictingValues.incoming as Entity;

        const merged = { ...current };

        // Merge metadata
        if (incoming.metadata && current.metadata) {
          merged.metadata = { ...current.metadata, ...incoming.metadata };
        }

        // Use newer lastModified
        if (incoming.lastModified > current.lastModified) {
          merged.lastModified = incoming.lastModified;
        }

        return {
          strategy: 'merge',
          resolvedValue: merged,
          timestamp: new Date(),
          resolvedBy: 'system',
        };
      },
    });

    // Strategy 3: Skip on deletion conflicts
    this.addMergeStrategy({
      name: 'skip_deletions',
      priority: 25,
      canHandle: (conflict) => conflict.type === 'entity_deletion',
      resolve: async (conflict) => ({
        strategy: 'skip',
        timestamp: new Date(),
        resolvedBy: 'system',
      }),
    });
  }

  addMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategies.push(strategy);
    this.mergeStrategies.sort((a, b) => b.priority - a.priority);
  }

  async detectConflicts(
    incomingEntities: Entity[],
    incomingRelationships: GraphRelationship[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check entity conflicts
    for (const incomingEntity of incomingEntities) {
      const existingEntity = await this.kgService.getEntity(incomingEntity.id);

      if (existingEntity) {
        // Check for version conflicts
        if (existingEntity.lastModified > incomingEntity.lastModified) {
          conflicts.push({
            id: `conflict_entity_${incomingEntity.id}_${Date.now()}`,
            type: 'entity_version',
            entityId: incomingEntity.id,
            description: `Entity ${incomingEntity.id} has been modified more recently`,
            conflictingValues: {
              current: existingEntity,
              incoming: incomingEntity,
            },
            timestamp: new Date(),
            resolved: false,
          });
        }
      }
    }

    // Check relationship conflicts
    for (const incomingRel of incomingRelationships) {
      // Check if relationship already exists with different properties
      const existingRelationships = await this.kgService.getRelationships({
        fromEntityId: incomingRel.fromEntityId,
        toEntityId: incomingRel.toEntityId,
        type: [incomingRel.type],
      });

      for (const existingRel of existingRelationships) {
        if (existingRel.lastModified > incomingRel.lastModified) {
          conflicts.push({
            id: `conflict_rel_${incomingRel.id}_${Date.now()}`,
            type: 'relationship_conflict',
            relationshipId: incomingRel.id,
            description: `Relationship ${incomingRel.id} has been modified more recently`,
            conflictingValues: {
              current: existingRel,
              incoming: incomingRel,
            },
            timestamp: new Date(),
            resolved: false,
          });
        }
      }
    }

    // Store conflicts
    for (const conflict of conflicts) {
      this.conflicts.set(conflict.id, conflict);
      this.notifyConflictListeners(conflict);
    }

    return conflicts;
  }

  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<boolean> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.resolved) {
      return false;
    }

    conflict.resolved = true;
    conflict.resolution = resolution;

    // Apply resolution
    try {
      switch (resolution.strategy) {
        case 'overwrite':
          if (conflict.entityId) {
            await this.kgService.updateEntity(conflict.entityId, resolution.resolvedValue);
          }
          break;

        case 'merge':
          if (conflict.entityId) {
            await this.kgService.updateEntity(conflict.entityId, resolution.resolvedValue);
          }
          break;

        case 'skip':
          // Do nothing - skip the conflicting change
          break;

        case 'manual':
          // Store for manual resolution
          break;
      }

      return true;
    } catch (error) {
      console.error(`Failed to apply conflict resolution for ${conflictId}:`, error);
      return false;
    }
  }

  async resolveConflictsAuto(conflicts: Conflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflictAuto(conflict);
      if (resolution) {
        resolutions.push(resolution);
      }
    }

    return resolutions;
  }

  private async resolveConflictAuto(conflict: Conflict): Promise<ConflictResolution | null> {
    // Find the highest priority strategy that can handle this conflict
    for (const strategy of this.mergeStrategies) {
      if (strategy.canHandle(conflict)) {
        try {
          const resolution = await strategy.resolve(conflict);
          conflict.resolved = true;
          conflict.resolution = resolution;
          conflict.resolutionStrategy = resolution.strategy;
          return resolution;
        } catch (error) {
          console.warn(`Strategy ${strategy.name} failed for conflict ${conflict.id}:`, error);
        }
      }
    }

    return null;
  }

  getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }

  getResolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter(c => c.resolved);
  }

  getConflict(conflictId: string): Conflict | null {
    return this.conflicts.get(conflictId) || null;
  }

  getConflictsForEntity(entityId: string): Conflict[] {
    return Array.from(this.conflicts.values()).filter(
      c => c.entityId === entityId && !c.resolved
    );
  }

  addConflictListener(listener: (conflict: Conflict) => void): void {
    this.conflictListeners.add(listener);
  }

  removeConflictListener(listener: (conflict: Conflict) => void): void {
    this.conflictListeners.delete(listener);
  }

  private notifyConflictListeners(conflict: Conflict): void {
    for (const listener of this.conflictListeners) {
      try {
        listener(conflict);
      } catch (error) {
        console.error('Error in conflict listener:', error);
      }
    }
  }

  clearResolvedConflicts(): void {
    for (const [id, conflict] of this.conflicts) {
      if (conflict.resolved) {
        this.conflicts.delete(id);
      }
    }
  }

  getConflictStatistics(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<string, number>;
  } {
    const allConflicts = Array.from(this.conflicts.values());
    const resolved = allConflicts.filter(c => c.resolved);
    const unresolved = allConflicts.filter(c => !c.resolved);

    const byType: Record<string, number> = {};
    for (const conflict of allConflicts) {
      byType[conflict.type] = (byType[conflict.type] || 0) + 1;
    }

    return {
      total: allConflicts.length,
      resolved: resolved.length,
      unresolved: unresolved.length,
      byType,
    };
  }
}
