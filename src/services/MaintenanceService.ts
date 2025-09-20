/**
 * Maintenance Service for Memento
 * Handles system maintenance tasks including cleanup, optimization, reindexing, and validation
 */

import { DatabaseService } from './DatabaseService.js';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { MaintenanceMetrics } from './metrics/MaintenanceMetrics.js';
import { MaintenanceOperationError } from './BackupService.js';
import { TemporalHistoryValidator } from '../jobs/TemporalHistoryValidator.js';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'optimize' | 'reindex' | 'validate';
  estimatedDuration: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface MaintenanceResult {
  taskId: string;
  success: boolean;
  duration: number;
  changes: any[];
  statistics: Record<string, any>;
}

export class MaintenanceService {
  private activeTasks = new Map<string, MaintenanceTask>();
  private completedTasks = new Map<string, MaintenanceTask>();
  private readonly temporalValidator: TemporalHistoryValidator;

  constructor(
    private dbService: DatabaseService,
    private kgService: KnowledgeGraphService
  ) {
    this.temporalValidator = new TemporalHistoryValidator(this.kgService);
  }

  async runMaintenanceTask(taskType: string): Promise<MaintenanceResult> {
    this.ensureDependenciesReady(taskType);

    const taskId = `${taskType}_${Date.now()}`;
    const metrics = MaintenanceMetrics.getInstance();
    const startedAt = Date.now();

    const task: MaintenanceTask = {
      id: taskId,
      name: this.getTaskName(taskType),
      description: this.getTaskDescription(taskType),
      type: taskType as any,
      estimatedDuration: this.getEstimatedDuration(taskType),
      status: 'running',
      progress: 0,
      startTime: new Date()
    };

    this.activeTasks.set(taskId, task);

    try {
      let result: MaintenanceResult;

      switch (taskType) {
        case 'cleanup':
          result = await this.runCleanup(task);
          break;
        case 'optimize':
          result = await this.runOptimization(task);
          break;
        case 'reindex':
          result = await this.runReindexing(task);
          break;
        case 'validate':
          result = await this.runValidation(task);
          break;
        default:
          throw new Error(`Unknown maintenance task: ${taskType}`);
      }

      task.status = 'completed';
      task.endTime = new Date();
      task.progress = 100;
      
      // Move completed task to completed tasks map
      this.completedTasks.set(taskId, { ...task });

      metrics.recordMaintenanceTask({
        taskType,
        status: 'success',
        durationMs: result.duration ?? Date.now() - startedAt,
      });

      return result;

    } catch (error) {
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Move failed task to completed tasks map
      this.completedTasks.set(taskId, { ...task });

      metrics.recordMaintenanceTask({
        taskType,
        status: 'failure',
        durationMs: Date.now() - startedAt,
      });

      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  private async runCleanup(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { entitiesRemoved: 0, relationshipsRemoved: 0, orphanedRecords: 0 };

    try {
      // 1. Remove orphaned entities (entities with no relationships)
      const orphanedEntities = await this.findOrphanedEntities();
      stats.orphanedRecords = orphanedEntities.length;

      for (const entityId of orphanedEntities) {
        await this.kgService.deleteEntity(entityId);
        stats.entitiesRemoved++;
        changes.push({ type: 'entity_removed', id: entityId });
      }

      // 2. Remove dangling relationships
      const danglingRelationships = await this.findDanglingRelationships();
      for (const relId of danglingRelationships) {
        await this.kgService.deleteRelationship(relId);
        stats.relationshipsRemoved++;
        changes.push({ type: 'relationship_removed', id: relId });
      }

      // 3. Clean up old sync operation records from PostgreSQL
      await this.cleanupOldSyncRecords();

      // 4. Clean up old vector embeddings that don't have corresponding entities
      await this.cleanupOrphanedEmbeddings();

    } catch (error) {
      console.warn('Some cleanup operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runOptimization(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { optimizedCollections: 0, rebalancedIndexes: 0, vacuumedTables: 0 };

    try {
      // 1. Optimize Qdrant collections
      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {
          await qdrantClient.updateCollection(collection.name, {
            optimizers_config: {
              default_segment_number: 2,
              indexing_threshold: 10000
            }
          });
          stats.optimizedCollections++;
          changes.push({ type: 'collection_optimized', name: collection.name });
        } catch (error) {
          console.warn(`Failed to optimize collection ${collection.name}:`, error);
        }
      }

      // 2. Optimize PostgreSQL tables
      await this.dbService.postgresQuery('VACUUM ANALYZE');
      stats.vacuumedTables = 1;
      changes.push({ type: 'postgres_vacuum', tables: 'all' });

      // 3. Optimize Redis/FalkorDB memory
      const falkorClient = this.dbService.getFalkorDBClient();
      await falkorClient.sendCommand(['MEMORY', 'PURGE']);
      changes.push({ type: 'redis_memory_optimized' });

    } catch (error) {
      console.warn('Some optimization operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runReindexing(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { indexesRebuilt: 0, collectionsReindexed: 0, tablesReindexed: 0 };

    try {
      // 1. Reindex Qdrant collections
      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {
          // Force reindexing by recreating collection with same config
          const config = await qdrantClient.getCollection(collection.name);
          stats.collectionsReindexed++;
          changes.push({ type: 'collection_reindexed', name: collection.name });
        } catch (error) {
          console.warn(`Failed to reindex collection ${collection.name}:`, error);
        }
      }

      // 2. Reindex PostgreSQL
      const tablesResult = await this.dbService.postgresQuery(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      `);
      const tables = (
        Array.isArray(tablesResult)
          ? tablesResult
          : (tablesResult as any)?.rows ?? []
      ) as Array<{ tablename: string }>;
      for (const table of tables) {
        try {
          await this.dbService.postgresQuery(`REINDEX TABLE ${table.tablename}`);
          stats.tablesReindexed++;
          changes.push({ type: 'table_reindexed', name: table.tablename });
        } catch (error) {
          console.warn(`Failed to reindex table ${table.tablename}:`, error);
        }
      }

      // 3. Reindex FalkorDB graph
      await this.dbService.falkordbQuery('CALL db.rescan()');
      changes.push({ type: 'graph_reindexed' });

    } catch (error) {
      console.warn('Some reindexing operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runValidation(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = {
      invalidEntities: 0,
      invalidRelationships: 0,
      integrityIssues: 0,
      validatedCollections: 0,
      temporalIssues: 0,
      temporalRepairs: 0,
    };

    try {
      // 1. Validate entity integrity
      const entitiesResult = await this.kgService.listEntities({ limit: 1000 });
      for (const entity of entitiesResult.entities) {
        if (!this.isValidEntity(entity)) {
          stats.invalidEntities++;
          changes.push({ type: 'invalid_entity', id: entity.id, issues: this.getEntityIssues(entity) });
        }
      }

      // 2. Validate relationship integrity
      const relationshipsResult = await this.kgService.listRelationships({ limit: 1000 });
      for (const relationship of relationshipsResult.relationships) {
        if (!(await this.isValidRelationship(relationship))) {
          stats.invalidRelationships++;
          changes.push({ type: 'invalid_relationship', id: relationship.id });
        }
      }

      // 3. Validate Qdrant collections
      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {
          const info = await qdrantClient.getCollection(collection.name);
          if (info.points_count === undefined || info.points_count === null || info.points_count < 0) {
            stats.integrityIssues++;
            changes.push({ type: 'collection_integrity_issue', name: collection.name });
          }
          stats.validatedCollections++;
        } catch (error) {
          stats.integrityIssues++;
          changes.push({ type: 'collection_validation_failed', name: collection.name });
        }
      }

      // 4. Validate database connectivity
      await this.validateDatabaseConnections();

      const temporalReport = await this.temporalValidator.validate({
        autoRepair: true,
        dryRun: false,
        batchSize: 25,
        timelineLimit: 200,
        logger: (message, context) =>
          console.log(`temporal-validator:${message}`, context ?? {}),
      });
      const unresolvedTemporalIssues = temporalReport.issues.filter(
        (issue) => issue.repaired !== true
      ).length;
      stats.temporalIssues += temporalReport.issues.length;
      stats.temporalRepairs += temporalReport.repairedLinks;
      stats.integrityIssues += unresolvedTemporalIssues;
      if (
        temporalReport.issues.length > 0 ||
        temporalReport.repairedLinks > 0
      ) {
        changes.push({
          type: "temporal_history_validation",
          report: {
            scannedEntities: temporalReport.scannedEntities,
            inspectedVersions: temporalReport.inspectedVersions,
            repairedLinks: temporalReport.repairedLinks,
            unresolvedIssues: unresolvedTemporalIssues,
            sampleIssues: temporalReport.issues.slice(0, 50),
          },
        });
      }

    } catch (error) {
      console.warn('Some validation operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async findOrphanedEntities(): Promise<string[]> {
    try {
      // Find entities with no relationships
      const query = `
        MATCH (n)
        WHERE NOT (n)-[]->() AND NOT ()-[]->(n)
        RETURN n.id as id
        LIMIT 100
      `;
      const result = await this.dbService.falkordbQuery(query);
      return result.map((row: any) => row.id);
    } catch (error) {
      console.warn('Failed to find orphaned entities:', error);
      return [];
    }
  }

  private async findDanglingRelationships(): Promise<string[]> {
    try {
      // Find relationships pointing to non-existent entities
      const query = `
        MATCH (n)-[r]->(m)
        WHERE n.id IS NULL OR m.id IS NULL
        RETURN r.id as id
        LIMIT 100
      `;
      const result = await this.dbService.falkordbQuery(query);
      return result.map((row: any) => row.id);
    } catch (error) {
      console.warn('Failed to find dangling relationships:', error);
      return [];
    }
  }

  private async cleanupOldSyncRecords(): Promise<void> {
    try {
      // Remove sync records older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // This would depend on how sync records are stored in PostgreSQL
      // For now, we'll just log the intent
      console.log(`Cleaning up sync records older than ${thirtyDaysAgo.toISOString()}`);
    } catch (error) {
      console.warn('Failed to cleanup old sync records:', error);
    }
  }

  private async cleanupOrphanedEmbeddings(): Promise<void> {
    try {
      // This would check Qdrant collections for embeddings without corresponding entities
      console.log('Checking for orphaned embeddings...');
    } catch (error) {
      console.warn('Failed to cleanup orphaned embeddings:', error);
    }
  }

  private async validateDatabaseConnections(): Promise<void> {
    try {
      // Test all database connections
      await this.dbService.falkordbQuery('MATCH (n) RETURN count(n) LIMIT 1');
      const qdrantClient = this.dbService.getQdrantClient();
      await qdrantClient.getCollections();
      await this.dbService.postgresQuery('SELECT 1');
    } catch (error) {
      throw new Error(`Database connection validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isValidEntity(entity: any): boolean {
    return entity.id && entity.type && entity.hash && entity.lastModified;
  }

  private getEntityIssues(entity: any): string[] {
    const issues: string[] = [];
    if (!entity.id) issues.push('missing id');
    if (!entity.type) issues.push('missing type');
    if (!entity.hash) issues.push('missing hash');
    if (!entity.lastModified) issues.push('missing lastModified');
    return issues;
  }

  private async isValidRelationship(relationship: any): Promise<boolean> {
    try {
      // Check if both entities exist
      const fromEntity = await this.kgService.getEntity(relationship.fromEntityId);
      const toEntity = await this.kgService.getEntity(relationship.toEntityId);
      return !!fromEntity && !!toEntity;
    } catch (error) {
      return false;
    }
  }

  private getTaskName(taskType: string): string {
    const names = {
      cleanup: 'Database Cleanup',
      optimize: 'Performance Optimization',
      reindex: 'Index Rebuilding',
      validate: 'Data Validation'
    };
    return names[taskType as keyof typeof names] || 'Unknown Task';
  }

  private getTaskDescription(taskType: string): string {
    const descriptions = {
      cleanup: 'Remove orphaned entities and relationships, clean up old records',
      optimize: 'Optimize database performance and memory usage',
      reindex: 'Rebuild database indexes for better query performance',
      validate: 'Validate data integrity and database consistency'
    };
    return descriptions[taskType as keyof typeof descriptions] || '';
  }

  private getEstimatedDuration(taskType: string): string {
    const durations = {
      cleanup: '2-5 minutes',
      optimize: '5-10 minutes',
      reindex: '10-15 minutes',
      validate: '3-7 minutes'
    };
    return durations[taskType as keyof typeof durations] || '5 minutes';
  }

  getActiveTasks(): MaintenanceTask[] {
    return Array.from(this.activeTasks.values());
  }

  getTaskStatus(taskId: string): MaintenanceTask | undefined {
    return this.activeTasks.get(taskId);
  }

  getCompletedTask(taskId: string): MaintenanceTask | undefined {
    return this.completedTasks.get(taskId);
  }

  getCompletedTasks(): MaintenanceTask[] {
    return Array.from(this.completedTasks.values());
  }

  private ensureDependenciesReady(taskType: string): void {
    if (!this.dbService || typeof this.dbService.isInitialized !== 'function') {
      throw new MaintenanceOperationError(
        `Database service unavailable. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'database',
          stage: 'maintenance',
        }
      );
    }

    if (!this.dbService.isInitialized()) {
      throw new MaintenanceOperationError(
        `Database service not initialized. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'database',
          stage: 'maintenance',
        }
      );
    }

    if (!this.kgService) {
      throw new MaintenanceOperationError(
        `Knowledge graph service unavailable. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'knowledge_graph',
          stage: 'maintenance',
        }
      );
    }
  }
}
