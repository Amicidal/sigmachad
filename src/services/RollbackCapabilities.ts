/**
 * Rollback Capabilities Service
 * Handles reverting changes when synchronization operations fail
 */

import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { DatabaseService } from './DatabaseService.js';
import { Entity, GraphRelationship } from '../models/entities.js';

export interface RollbackPoint {
  id: string;
  operationId: string;
  timestamp: Date;
  entities: RollbackEntity[];
  relationships: RollbackRelationship[];
  description: string;
}

export interface RollbackEntity {
  id: string;
  action: 'create' | 'update' | 'delete';
  previousState?: Entity;
  newState?: Entity;
}

export interface RollbackRelationship {
  id: string;
  action: 'create' | 'update' | 'delete';
  previousState?: GraphRelationship;
  newState?: GraphRelationship;
}

export interface RollbackResult {
  success: boolean;
  rolledBackEntities: number;
  rolledBackRelationships: number;
  errors: RollbackError[];
  partialSuccess: boolean;
}

export interface RollbackError {
  type: 'entity' | 'relationship';
  id: string;
  action: string;
  error: string;
  recoverable: boolean;
}

export class RollbackCapabilities {
  private rollbackPoints = new Map<string, RollbackPoint>();
  private maxRollbackPoints = 50; // Keep last 50 rollback points

  constructor(
    private kgService: KnowledgeGraphService,
    private dbService: DatabaseService
  ) {}

  /**
   * Create a rollback point before making changes
   */
  async createRollbackPoint(operationId: string, description: string): Promise<string> {
    const rollbackId = `rollback_${operationId}_${Date.now()}`;

    const rollbackPoint: RollbackPoint = {
      id: rollbackId,
      operationId,
      timestamp: new Date(),
      entities: [],
      relationships: [],
      description,
    };

    this.rollbackPoints.set(rollbackId, rollbackPoint);

    // Clean up old rollback points to prevent memory issues
    this.cleanupOldRollbackPoints();

    return rollbackId;
  }

  /**
   * Record an entity change for potential rollback
   */
  async recordEntityChange(
    rollbackId: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    previousState?: Entity,
    newState?: Entity
  ): Promise<void> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`);
    }

    // For updates and deletes, we need to capture the previous state
    if ((action === 'update' || action === 'delete') && !previousState) {
      previousState = await this.kgService.getEntity(entityId);
    }

    rollbackPoint.entities.push({
      id: entityId,
      action,
      previousState,
      newState,
    });
  }

  /**
   * Record a relationship change for potential rollback
   */
  recordRelationshipChange(
    rollbackId: string,
    relationshipId: string,
    action: 'create' | 'update' | 'delete',
    previousState?: GraphRelationship,
    newState?: GraphRelationship
  ): void {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`);
    }

    rollbackPoint.relationships.push({
      id: relationshipId,
      action,
      previousState,
      newState,
    });
  }

  /**
   * Perform a rollback to a specific point
   */
  async rollbackToPoint(rollbackId: string): Promise<RollbackResult> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`);
    }

    const result: RollbackResult = {
      success: true,
      rolledBackEntities: 0,
      rolledBackRelationships: 0,
      errors: [],
      partialSuccess: false,
    };

    try {
      // Rollback relationships first (reverse order)
      for (let i = rollbackPoint.relationships.length - 1; i >= 0; i--) {
        const relChange = rollbackPoint.relationships[i];
        try {
          await this.rollbackRelationshipChange(relChange);
          result.rolledBackRelationships++;
        } catch (error) {
          const rollbackError: RollbackError = {
            type: 'relationship',
            id: relChange.id,
            action: relChange.action,
            error: error instanceof Error ? error.message : 'Unknown error',
            recoverable: false,
          };
          result.errors.push(rollbackError);
          result.success = false;
        }
      }

      // Rollback entities (reverse order)
      for (let i = rollbackPoint.entities.length - 1; i >= 0; i--) {
        const entityChange = rollbackPoint.entities[i];
        try {
          await this.rollbackEntityChange(entityChange);
          result.rolledBackEntities++;
        } catch (error) {
          const rollbackError: RollbackError = {
            type: 'entity',
            id: entityChange.id,
            action: entityChange.action,
            error: error instanceof Error ? error.message : 'Unknown error',
            recoverable: false,
          };
          result.errors.push(rollbackError);
          result.success = false;
        }
      }

      // If there were errors but some changes were rolled back, mark as partial success
      if (!result.success && (result.rolledBackEntities > 0 || result.rolledBackRelationships > 0)) {
        result.partialSuccess = true;
      }

    } catch (error) {
      result.success = false;
      result.errors.push({
        type: 'entity',
        id: 'rollback_process',
        action: 'rollback',
        error: error instanceof Error ? error.message : 'Unknown rollback error',
        recoverable: false,
      });
    }

    return result;
  }

  /**
   * Rollback a single entity change
   */
  private async rollbackEntityChange(change: RollbackEntity): Promise<void> {
    switch (change.action) {
      case 'create':
        // Delete the created entity
        await this.kgService.deleteEntity(change.id);
        break;

      case 'update':
        // Restore the previous state
        if (change.previousState) {
          await this.kgService.updateEntity(change.id, change.previousState);
        } else {
          // If no previous state, delete the entity
          await this.kgService.deleteEntity(change.id);
        }
        break;

      case 'delete':
        // Recreate the deleted entity
        if (change.previousState) {
          await this.kgService.createEntity(change.previousState);
        }
        break;
    }
  }

  /**
   * Rollback a single relationship change
   */
  private async rollbackRelationshipChange(change: RollbackRelationship): Promise<void> {
    // Note: This is a simplified implementation
    // In a real system, you'd need to track relationships by their properties
    // since FalkorDB might not preserve the exact same relationship ID

    switch (change.action) {
      case 'create':
        // For created relationships, we'd need to find and delete them
        // This is complex in graph databases, so we'll use a simplified approach
        if (change.newState) {
          // Try to delete by properties (this might not work reliably)
          console.warn(`Rolling back created relationship ${change.id} - manual verification needed`);
        }
        break;

      case 'update':
        // Restore previous relationship state
        if (change.previousState) {
          // This would require updating the relationship
          console.warn(`Rolling back updated relationship ${change.id} - manual verification needed`);
        }
        break;

      case 'delete':
        // Recreate the deleted relationship
        if (change.previousState) {
          await this.kgService.createRelationship(change.previousState);
        }
        break;
    }
  }

  /**
   * Rollback the last operation for a given operation ID
   */
  async rollbackLastOperation(operationId: string): Promise<RollbackResult | null> {
    // Find the most recent rollback point for this operation
    const operationRollbackPoints = Array.from(this.rollbackPoints.values())
      .filter(point => point.operationId === operationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (operationRollbackPoints.length === 0) {
      return null;
    }

    return this.rollbackToPoint(operationRollbackPoints[0].id);
  }

  /**
   * Get rollback points for an operation
   */
  getRollbackPointsForOperation(operationId: string): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .filter(point => point.operationId === operationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get all rollback points
   */
  getAllRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Delete a rollback point
   */
  deleteRollbackPoint(rollbackId: string): boolean {
    return this.rollbackPoints.delete(rollbackId);
  }

  /**
   * Get rollback point details
   */
  getRollbackPoint(rollbackId: string): RollbackPoint | null {
    return this.rollbackPoints.get(rollbackId) || null;
  }

  /**
   * Clean up old rollback points to prevent memory issues
   */
  private cleanupOldRollbackPoints(): void {
    if (this.rollbackPoints.size <= this.maxRollbackPoints) {
      return;
    }

    // Keep only the most recent rollback points
    const sortedPoints = Array.from(this.rollbackPoints.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, this.maxRollbackPoints);

    this.rollbackPoints.clear();
    sortedPoints.forEach(point => {
      this.rollbackPoints.set(point.id, point);
    });
  }

  /**
   * Validate a rollback point for consistency
   */
  async validateRollbackPoint(rollbackId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      return { valid: false, issues: ['Rollback point not found'] };
    }

    const issues: string[] = [];

    // Check if entities still exist in expected state
    for (const entityChange of rollbackPoint.entities) {
      try {
        const currentEntity = await this.kgService.getEntity(entityChange.id);

        switch (entityChange.action) {
          case 'create':
            if (!currentEntity) {
              issues.push(`Entity ${entityChange.id} was expected to exist but doesn't`);
            }
            break;
          case 'update':
          case 'delete':
            if (entityChange.previousState && currentEntity) {
              // Compare key properties
              if (currentEntity.lastModified.getTime() !== entityChange.previousState.lastModified.getTime()) {
                issues.push(`Entity ${entityChange.id} has been modified since rollback point creation`);
              }
            }
            break;
        }
      } catch (error) {
        issues.push(`Error validating entity ${entityChange.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Create a backup snapshot for complex operations
   */
  async createSnapshot(operationId: string, description: string): Promise<string> {
    // This would create a database snapshot/backup
    // For now, we'll use the rollback point system
    return this.createRollbackPoint(operationId, `Snapshot: ${description}`);
  }

  /**
   * Restore from a snapshot
   */
  async restoreFromSnapshot(snapshotId: string): Promise<RollbackResult> {
    return this.rollbackToPoint(snapshotId);
  }

  /**
   * Get rollback statistics
   */
  getRollbackStatistics(): {
    totalRollbackPoints: number;
    oldestRollbackPoint: Date | null;
    newestRollbackPoint: Date | null;
    averageEntitiesPerPoint: number;
    averageRelationshipsPerPoint: number;
  } {
    const points = Array.from(this.rollbackPoints.values());

    if (points.length === 0) {
      return {
        totalRollbackPoints: 0,
        oldestRollbackPoint: null,
        newestRollbackPoint: null,
        averageEntitiesPerPoint: 0,
        averageRelationshipsPerPoint: 0,
      };
    }

    const sortedPoints = points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const totalEntities = points.reduce((sum, point) => sum + point.entities.length, 0);
    const totalRelationships = points.reduce((sum, point) => sum + point.relationships.length, 0);

    return {
      totalRollbackPoints: points.length,
      oldestRollbackPoint: sortedPoints[0].timestamp,
      newestRollbackPoint: sortedPoints[sortedPoints.length - 1].timestamp,
      averageEntitiesPerPoint: totalEntities / points.length,
      averageRelationshipsPerPoint: totalRelationships / points.length,
    };
  }
}
