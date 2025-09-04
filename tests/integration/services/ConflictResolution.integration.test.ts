/**
 * Integration tests for ConflictResolution service
 * Tests conflict detection, resolution strategies, and listener functionality with real database operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ConflictResolution, Conflict, ConflictResolutionResult } from '../../../src/services/ConflictResolution';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { DatabaseService, createTestDatabaseConfig } from '../../../src/services/DatabaseService';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers';
import { Entity, GraphRelationship } from '../../../src/models/entities';

describe('ConflictResolution Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let conflictResolution: ConflictResolution;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService);
    conflictResolution = new ConflictResolution(kgService);

    // Ensure database is healthy
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }
  }, 30000);

  afterAll(async () => {
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
      // Clear conflicts between tests
      (conflictResolution as any).conflicts.clear();
    }
  });

  describe('Conflict Detection Integration', () => {
    it('should detect entity version conflicts with real database entities', async () => {
      // Create an existing entity in the database
      const existingEntity: Entity = {
        id: 'test-entity-1',
        type: 'file',
        path: 'test.ts',
        hash: 'abc123',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date('2024-01-01T00:00:00Z'),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      // Create incoming entity with newer timestamp
      const incomingEntity: Entity = {
        id: 'test-entity-1',
        type: 'file',
        path: 'test.ts',
        hash: 'def456',
        language: 'typescript',
        lastModified: new Date('2024-01-02T00:00:00Z'),
        created: new Date('2024-01-01T00:00:00Z'),
        status: 'active'
      };

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'entity_version',
        entityId: 'test-entity-1',
        resolved: false
      });

      // Verify the conflict contains correct entity data
      expect(conflicts[0].conflictingValues.current.id).toBe('test-entity-1');
      expect(conflicts[0].conflictingValues.incoming.lastModified).toEqual(new Date('2024-01-02T00:00:00Z'));
    });

    it('should detect relationship conflicts with real database operations', async () => {
      // Create entities first
      const sourceEntity: Entity = {
        id: 'source-entity',
        type: 'function',
        path: 'source.ts',
        hash: 'src123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        status: 'active'
      };

      const targetEntity: Entity = {
        id: 'target-entity',
        type: 'class',
        path: 'target.ts',
        hash: 'tgt123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(sourceEntity);
      await kgService.createEntity(targetEntity);

      // Create incoming relationship
      const incomingRelationship: GraphRelationship = {
        id: 'test-relationship',
        type: 'depends_on',
        sourceId: 'source-entity',
        targetId: 'target-entity',
        metadata: { strength: 0.8 },
        created: new Date(),
        lastModified: new Date()
      };

      const conflicts = await conflictResolution.detectConflicts([], [incomingRelationship]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'relationship_conflict',
        relationshipId: 'test-relationship',
        resolved: false
      });
    });

    it('should handle multiple entity and relationship conflicts simultaneously', async () => {
      // Create multiple existing entities
      const entities: Entity[] = [
        {
          id: 'multi-entity-1',
          type: 'file',
          path: 'file1.ts',
          hash: 'hash1',
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        },
        {
          id: 'multi-entity-2',
          type: 'function',
          path: 'func.ts',
          hash: 'hash2',
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        }
      ];

      for (const entity of entities) {
        await kgService.createEntity(entity);
      }

      // Create incoming entities and relationships
      const incomingEntities: Entity[] = [
        {
          id: 'multi-entity-1',
          type: 'file',
          path: 'file1.ts',
          hash: 'newhash1',
          language: 'typescript',
          lastModified: new Date('2024-01-02T00:00:00Z'),
          created: new Date(),
          status: 'active'
        },
        {
          id: 'multi-entity-2',
          type: 'function',
          path: 'func.ts',
          hash: 'newhash2',
          language: 'typescript',
          lastModified: new Date('2024-01-03T00:00:00Z'),
          created: new Date(),
          status: 'active'
        }
      ];

      const incomingRelationships: GraphRelationship[] = [
        {
          id: 'rel-1',
          type: 'depends_on',
          sourceId: 'multi-entity-1',
          targetId: 'multi-entity-2',
          metadata: { strength: 0.9 },
          created: new Date(),
          lastModified: new Date()
        },
        {
          id: 'rel-2',
          type: 'imports',
          sourceId: 'multi-entity-2',
          targetId: 'multi-entity-1',
          metadata: { strength: 0.7 },
          created: new Date(),
          lastModified: new Date()
        }
      ];

      const conflicts = await conflictResolution.detectConflicts(incomingEntities, incomingRelationships);

      // Should detect 2 entity conflicts + 2 relationship conflicts = 4 total
      expect(conflicts).toHaveLength(4);

      const entityConflicts = conflicts.filter(c => c.type === 'entity_version');
      const relationshipConflicts = conflicts.filter(c => c.type === 'relationship_conflict');

      expect(entityConflicts).toHaveLength(2);
      expect(relationshipConflicts).toHaveLength(2);

      // Verify entity conflicts have correct IDs
      const entityIds = entityConflicts.map(c => c.entityId).sort();
      expect(entityIds).toEqual(['multi-entity-1', 'multi-entity-2']);
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should resolve entity version conflict with overwrite strategy', async () => {
      // Create existing entity
      const existingEntity: Entity = {
        id: 'resolve-test-entity',
        type: 'file',
        path: 'resolve.ts',
        hash: 'oldhash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      // Create incoming entity with conflict
      const incomingEntity: Entity = {
        id: 'resolve-test-entity',
        type: 'file',
        path: 'resolve.ts',
        hash: 'newhash',
        language: 'typescript',
        lastModified: new Date('2024-01-02T00:00:00Z'),
        created: new Date(),
        status: 'active',
        content: 'console.log("updated");'
      };

      // Detect conflict
      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      expect(conflicts).toHaveLength(1);
      const conflictId = conflicts[0].id;

      // Resolve with overwrite strategy
      const resolution = {
        strategy: 'overwrite' as const,
        resolvedValue: incomingEntity,
        timestamp: new Date(),
        resolvedBy: 'test-user'
      };

      const result = await conflictResolution.resolveConflict(conflictId, resolution);
      expect(result).toBe(true);

      // Verify conflict is resolved
      const storedConflict = (conflictResolution as any).conflicts.get(conflictId);
      expect(storedConflict.resolved).toBe(true);
      expect(storedConflict.resolution).toEqual(resolution);

      // Verify entity was updated in knowledge graph
      const updatedEntity = await kgService.getEntity('resolve-test-entity');
      expect(updatedEntity?.hash).toBe('newhash');
      expect(updatedEntity?.lastModified).toEqual(new Date('2024-01-02T00:00:00Z'));
    });

    it('should resolve conflict with merge strategy for entity properties', async () => {
      // Create existing entity
      const existingEntity: Entity = {
        id: 'merge-test-entity',
        type: 'file',
        path: 'merge.ts',
        hash: 'mergehash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active',
        metadata: { author: 'user1', version: 1 }
      };

      await kgService.createEntity(existingEntity);

      // Create incoming entity with different properties
      const incomingEntity: Entity = {
        id: 'merge-test-entity',
        type: 'file',
        path: 'merge.ts',
        hash: 'newmergehash',
        language: 'typescript',
        lastModified: new Date('2024-01-02T00:00:00Z'),
        created: new Date(),
        status: 'active',
        metadata: { description: 'updated file', version: 2 }
      };

      // Detect conflict
      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      const conflictId = conflicts[0].id;

      // Manually resolve with merge strategy
      const mergedEntity = {
        ...existingEntity,
        hash: incomingEntity.hash,
        lastModified: incomingEntity.lastModified,
        metadata: {
          ...existingEntity.metadata,
          ...incomingEntity.metadata
        }
      };

      const resolution = {
        strategy: 'merge' as const,
        resolvedValue: mergedEntity,
        timestamp: new Date(),
        resolvedBy: 'test-user'
      };

      const result = await conflictResolution.resolveConflict(conflictId, resolution);
      expect(result).toBe(true);

      // Verify merged entity was updated
      const updatedEntity = await kgService.getEntity('merge-test-entity');
      expect(updatedEntity?.metadata?.author).toBe('user1'); // From existing
      expect(updatedEntity?.metadata?.description).toBe('updated file'); // From incoming
      expect(updatedEntity?.metadata?.version).toBe(2); // From incoming (overwrites existing)
    });

    it('should handle manual resolution strategy', async () => {
      // Create conflict
      const existingEntity: Entity = {
        id: 'manual-test-entity',
        type: 'file',
        path: 'manual.ts',
        hash: 'manualhash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        id: 'manual-test-entity',
        type: 'file',
        path: 'manual.ts',
        hash: 'newmanualhash',
        language: 'typescript',
        lastModified: new Date('2024-01-02T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      const conflictId = conflicts[0].id;

      // Resolve with manual strategy
      const resolution = {
        strategy: 'manual' as const,
        manualResolution: 'Manually resolved: kept existing version',
        timestamp: new Date(),
        resolvedBy: 'admin-user'
      };

      const result = await conflictResolution.resolveConflict(conflictId, resolution);
      expect(result).toBe(true);

      // Verify manual resolution is stored
      const storedConflict = (conflictResolution as any).conflicts.get(conflictId);
      expect(storedConflict.resolution?.manualResolution).toBe('Manually resolved: kept existing version');
      expect(storedConflict.resolution?.resolvedBy).toBe('admin-user');
    });
  });

  describe('Auto Resolution Integration', () => {
    it('should automatically resolve conflicts using default strategies', async () => {
      // Create existing entity
      const existingEntity: Entity = {
        id: 'auto-resolve-entity',
        type: 'file',
        path: 'auto.ts',
        hash: 'autohash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      // Create incoming entity
      const incomingEntity: Entity = {
        id: 'auto-resolve-entity',
        type: 'file',
        path: 'auto.ts',
        hash: 'newautohash',
        language: 'typescript',
        lastModified: new Date('2024-01-02T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      // Detect conflicts
      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);

      // Auto-resolve conflicts
      const resolutions = await conflictResolution.resolveConflictsAuto(conflicts);

      expect(resolutions).toHaveLength(1);
      expect(resolutions[0]).toMatchObject({
        strategy: 'overwrite', // Should use last_write_wins strategy
        resolvedBy: 'system'
      });

      // Verify conflict is resolved
      const conflictId = conflicts[0].id;
      const storedConflict = (conflictResolution as any).conflicts.get(conflictId);
      expect(storedConflict.resolved).toBe(true);
      expect(storedConflict.resolutionStrategy).toBe('overwrite');
    });

    it('should handle multiple conflicts with auto resolution', async () => {
      // Create entities
      const entities: Entity[] = [
        {
          id: 'auto-multi-1',
          type: 'file',
          path: 'auto1.ts',
          hash: 'hash1',
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        },
        {
          id: 'auto-multi-2',
          type: 'function',
          path: 'auto2.ts',
          hash: 'hash2',
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        }
      ];

      for (const entity of entities) {
        await kgService.createEntity(entity);
      }

      // Create conflicts
      const incomingEntities: Entity[] = entities.map(entity => ({
        ...entity,
        hash: `new${entity.hash}`,
        lastModified: new Date('2024-01-02T00:00:00Z')
      }));

      const conflicts = await conflictResolution.detectConflicts(incomingEntities, []);

      // Auto-resolve all conflicts
      const resolutions = await conflictResolution.resolveConflictsAuto(conflicts);

      expect(resolutions).toHaveLength(2);
      resolutions.forEach(resolution => {
        expect(resolution.strategy).toBe('overwrite');
        expect(resolution.resolvedBy).toBe('system');
      });

      // Verify all conflicts are resolved
      const unresolvedConflicts = conflictResolution.getUnresolvedConflicts();
      expect(unresolvedConflicts).toHaveLength(0);

      const resolvedConflicts = conflictResolution.getResolvedConflicts();
      expect(resolvedConflicts).toHaveLength(2);
    });
  });

  describe('Conflict Statistics and Management', () => {
    it('should track conflict statistics across multiple operations', async () => {
      // Create multiple entities and conflicts
      const entities: Entity[] = [];
      for (let i = 0; i < 5; i++) {
        entities.push({
          id: `stats-entity-${i}`,
          type: 'file',
          path: `stats${i}.ts`,
          hash: `hash${i}`,
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        });
      }

      for (const entity of entities) {
        await kgService.createEntity(entity);
      }

      // Create conflicts
      const incomingEntities = entities.map(entity => ({
        ...entity,
        hash: `new${entity.hash}`,
        lastModified: new Date('2024-01-02T00:00:00Z')
      }));

      await conflictResolution.detectConflicts(incomingEntities, []);

      // Check initial statistics
      let stats = conflictResolution.getConflictStatistics();
      expect(stats.total).toBe(5);
      expect(stats.unresolved).toBe(5);
      expect(stats.resolved).toBe(0);
      expect(stats.byType.entity_version).toBe(5);

      // Resolve some conflicts
      const unresolvedConflicts = conflictResolution.getUnresolvedConflicts();
      for (let i = 0; i < 3; i++) {
        await conflictResolution.resolveConflict(unresolvedConflicts[i].id, {
          strategy: 'overwrite',
          resolvedValue: incomingEntities[i],
          timestamp: new Date(),
          resolvedBy: 'test-user'
        });
      }

      // Check updated statistics
      stats = conflictResolution.getConflictStatistics();
      expect(stats.total).toBe(5);
      expect(stats.unresolved).toBe(2);
      expect(stats.resolved).toBe(3);
      expect(stats.byType.entity_version).toBe(5);
    });

    it('should provide conflict retrieval methods', async () => {
      // Create and resolve conflicts
      const existingEntity: Entity = {
        id: 'retrieve-test-entity',
        type: 'file',
        path: 'retrieve.ts',
        hash: 'retrievehash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        ...existingEntity,
        hash: 'newretrievehash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      await conflictResolution.detectConflicts([incomingEntity], []);
      const conflicts = conflictResolution.getUnresolvedConflicts();
      const conflictId = conflicts[0].id;

      // Test retrieval methods
      const retrievedConflict = conflictResolution.getConflict(conflictId);
      expect(retrievedConflict).toEqual(conflicts[0]);

      const entityConflicts = conflictResolution.getConflictsForEntity('retrieve-test-entity');
      expect(entityConflicts).toHaveLength(1);
      expect(entityConflicts[0].entityId).toBe('retrieve-test-entity');

      // Resolve and test resolved conflicts
      await conflictResolution.resolveConflict(conflictId, {
        strategy: 'overwrite',
        resolvedValue: incomingEntity,
        timestamp: new Date(),
        resolvedBy: 'test-user'
      });

      const unresolvedConflicts = conflictResolution.getUnresolvedConflicts();
      const resolvedConflicts = conflictResolution.getResolvedConflicts();

      expect(unresolvedConflicts).toHaveLength(0);
      expect(resolvedConflicts).toHaveLength(1);
      expect(resolvedConflicts[0].resolved).toBe(true);
    });
  });

  describe('Conflict Listener Integration', () => {
    it('should notify listeners when conflicts are detected', async () => {
      const listener = vi.fn();
      conflictResolution.addConflictListener(listener);

      // Create entity and conflict
      const existingEntity: Entity = {
        id: 'listener-test-entity',
        type: 'file',
        path: 'listener.ts',
        hash: 'listenerhash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        ...existingEntity,
        hash: 'newlistenerhash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      await conflictResolution.detectConflicts([incomingEntity], []);

      expect(listener).toHaveBeenCalledTimes(1);
      const calledWith = listener.mock.calls[0][0];
      expect(calledWith).toMatchObject({
        type: 'entity_version',
        entityId: 'listener-test-entity',
        resolved: false
      });
    });

    it('should handle multiple listeners and listener errors gracefully', async () => {
      const goodListener = vi.fn();
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      conflictResolution.addConflictListener(goodListener);
      conflictResolution.addConflictListener(errorListener);

      // Create conflict
      const existingEntity: Entity = {
        id: 'error-test-entity',
        type: 'file',
        path: 'error.ts',
        hash: 'errorhash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        ...existingEntity,
        hash: 'newerrorhash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      // Should not throw despite listener error
      await expect(conflictResolution.detectConflicts([incomingEntity], [])).resolves.not.toThrow();

      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(errorListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle bulk conflict detection efficiently', async () => {
      const bulkSize = 50;
      const entities: Entity[] = [];

      // Create bulk entities
      for (let i = 0; i < bulkSize; i++) {
        entities.push({
          id: `bulk-entity-${i}`,
          type: 'file',
          path: `bulk${i}.ts`,
          hash: `bulkhash${i}`,
          language: 'typescript',
          lastModified: new Date('2024-01-01T00:00:00Z'),
          created: new Date(),
          status: 'active'
        });
      }

      // Store entities in database
      for (const entity of entities) {
        await kgService.createEntity(entity);
      }

      // Create incoming entities with conflicts
      const incomingEntities = entities.map(entity => ({
        ...entity,
        hash: `new${entity.hash}`,
        lastModified: new Date('2024-01-02T00:00:00Z')
      }));

      const startTime = Date.now();
      const conflicts = await conflictResolution.detectConflicts(incomingEntities, []);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(conflicts).toHaveLength(bulkSize);
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for bulk operations
    });

    it('should maintain consistent performance with growing conflict sets', async () => {
      const iterations = 5;
      const conflictsPerIteration = 20;
      const performanceResults: number[] = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        const entities: Entity[] = [];

        // Create entities for this iteration
        for (let i = 0; i < conflictsPerIteration; i++) {
          entities.push({
            id: `perf-entity-${iteration}-${i}`,
            type: 'file',
            path: `perf${iteration}-${i}.ts`,
            hash: `perfhash${iteration}-${i}`,
            language: 'typescript',
            lastModified: new Date('2024-01-01T00:00:00Z'),
            created: new Date(),
            status: 'active'
          });
        }

        // Store entities
        for (const entity of entities) {
          await kgService.createEntity(entity);
        }

        // Create conflicts
        const incomingEntities = entities.map(entity => ({
          ...entity,
          hash: `new${entity.hash}`,
          lastModified: new Date('2024-01-02T00:00:00Z')
        }));

        const startTime = Date.now();
        await conflictResolution.detectConflicts(incomingEntities, []);
        const endTime = Date.now();

        performanceResults.push(endTime - startTime);
      }

      // Verify performance consistency
      const avgDuration = performanceResults.reduce((sum, d) => sum + d, 0) / performanceResults.length;
      const maxDuration = Math.max(...performanceResults);
      const minDuration = Math.min(...performanceResults);

      expect(avgDuration).toBeLessThan(2000); // Average < 2 seconds
      expect(maxDuration - minDuration).toBeLessThan(avgDuration * 0.5); // Variance < 50% of average
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures during conflict resolution', async () => {
      // Create conflict
      const existingEntity: Entity = {
        id: 'db-error-entity',
        type: 'file',
        path: 'dberror.ts',
        hash: 'dberrorhash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        ...existingEntity,
        hash: 'newdberrorhash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      const conflictId = conflicts[0].id;

      // Mock kgService.updateEntity to throw error
      const originalUpdateEntity = kgService.updateEntity;
      kgService.updateEntity = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Attempt resolution
      const result = await conflictResolution.resolveConflict(conflictId, {
        strategy: 'overwrite',
        resolvedValue: incomingEntity,
        timestamp: new Date(),
        resolvedBy: 'test-user'
      });

      expect(result).toBe(false);

      // Restore original method
      kgService.updateEntity = originalUpdateEntity;
    });

    it('should handle concurrent conflict resolution attempts', async () => {
      // Create conflict
      const existingEntity: Entity = {
        id: 'concurrent-entity',
        type: 'file',
        path: 'concurrent.ts',
        hash: 'concurrenthash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active'
      };

      await kgService.createEntity(existingEntity);

      const incomingEntity: Entity = {
        ...existingEntity,
        hash: 'newconcurrenthash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      const conflictId = conflicts[0].id;

      // Attempt concurrent resolution
      const resolution1 = conflictResolution.resolveConflict(conflictId, {
        strategy: 'overwrite',
        resolvedValue: incomingEntity,
        timestamp: new Date(),
        resolvedBy: 'user1'
      });

      const resolution2 = conflictResolution.resolveConflict(conflictId, {
        strategy: 'merge',
        resolvedValue: {},
        timestamp: new Date(),
        resolvedBy: 'user2'
      });

      const [result1, result2] = await Promise.all([resolution1, resolution2]);

      // One should succeed, one should fail
      expect([result1, result2]).toContain(true);
      expect([result1, result2]).toContain(false);

      // Conflict should be resolved
      const storedConflict = (conflictResolution as any).conflicts.get(conflictId);
      expect(storedConflict.resolved).toBe(true);
    });

    it('should handle invalid entity IDs gracefully', async () => {
      const invalidEntity: Entity = {
        id: '', // Invalid empty ID
        type: 'file',
        path: 'invalid.ts',
        hash: 'invalidhash',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        status: 'active'
      };

      // Should not throw, but should handle gracefully
      await expect(conflictResolution.detectConflicts([invalidEntity], [])).resolves.toEqual([]);
    });

    it('should handle very large conflict payloads', async () => {
      const largeEntity: Entity = {
        id: 'large-entity',
        type: 'file',
        path: 'large.ts',
        hash: 'largehash',
        language: 'typescript',
        lastModified: new Date('2024-01-01T00:00:00Z'),
        created: new Date(),
        status: 'active',
        content: 'x'.repeat(100000), // 100KB content
        metadata: { largeField: 'y'.repeat(50000) } // Large metadata
      };

      await kgService.createEntity(largeEntity);

      const incomingEntity: Entity = {
        ...largeEntity,
        hash: 'newlargehash',
        lastModified: new Date('2024-01-02T00:00:00Z')
      };

      const startTime = Date.now();
      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      const endTime = Date.now();

      expect(conflicts).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(2000); // Should handle large payloads efficiently
    });
  });
});
