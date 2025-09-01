/**
 * Conflict Resolution Service Unit Tests
 * Comprehensive tests for conflict detection and resolution
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ConflictResolution, Conflict } from '../src/services/ConflictResolution.js';
import { Entity, File } from '../src/models/entities.js';
import { GraphRelationship, RelationshipType } from '../src/models/relationships.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';

describe('ConflictResolution', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let conflictResolution: ConflictResolution;

  beforeAll(async () => {
    const dbConfig = createDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
    conflictResolution = new ConflictResolution(kgService);
  }, 30000);

  afterAll(async () => {
    await dbService.close();
  }, 10000);

  beforeEach(async () => {
    // Clean up test data
    await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_conflict_" DELETE n').catch(() => {});
    await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "test_conflict_" DELETE r').catch(() => {});

    // Clear all conflicts from previous tests
    (conflictResolution as any).conflicts.clear();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(conflictResolution).toBeDefined();
      expect(conflictResolution).toBeInstanceOf(ConflictResolution);
    });

    it('should have empty conflicts initially', () => {
      const unresolved = conflictResolution.getUnresolvedConflicts();
      const resolved = conflictResolution.getResolvedConflicts();
      expect(unresolved.length).toBe(0);
      expect(resolved.length).toBe(0);
    });
  });

  describe('Conflict Detection', () => {
    const baseTime = new Date('2024-01-01T10:00:00Z');

    const existingEntity: File = {
      id: 'test_conflict_existing',
      type: 'file',
      path: '/test/existing.ts',
      hash: 'old_hash',
      language: 'typescript',
      lastModified: new Date(baseTime.getTime() + 2000), // Newer (existing)
      created: new Date(baseTime.getTime() - 2000),
      extension: '.ts',
      size: 1024,
      lines: 50,
      isTest: false,
      isConfig: false,
      dependencies: []
    };

    const incomingEntity: File = {
      id: 'test_conflict_existing',
      type: 'file',
      path: '/test/existing.ts',
      hash: 'new_hash',
      language: 'typescript',
      lastModified: new Date(baseTime.getTime() + 1000), // Older (incoming)
      created: new Date(baseTime.getTime() - 2000),
      extension: '.ts',
      size: 2048,
      lines: 100,
      isTest: false,
      isConfig: false,
      dependencies: []
    };

    const newEntity: File = {
      id: 'test_conflict_new',
      type: 'file',
      path: '/test/new.ts',
      hash: 'new_hash',
      language: 'typescript',
      lastModified: new Date(),
      created: new Date(),
      extension: '.ts',
      size: 512,
      lines: 25,
      isTest: false,
      isConfig: false,
      dependencies: []
    };

    it('should detect entity version conflicts', async () => {
      // Create existing entity
      await kgService.createEntity(existingEntity);

      // Detect conflicts with incoming changes
      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('entity_version');
      expect(conflicts[0].entityId).toBe(existingEntity.id);
      expect(conflicts[0].description).toContain('has been modified more recently');
      expect(conflicts[0].resolved).toBe(false);
    });

    it('should not detect conflicts for new entities', async () => {
      const conflicts = await conflictResolution.detectConflicts([newEntity], []);

      expect(conflicts.length).toBe(0);
    });

    it('should detect relationship conflicts', async () => {
      // Create entities first
      await kgService.createEntity(existingEntity);

      const existingRel: GraphRelationship = {
        id: 'test_rel_existing',
        type: RelationshipType.IMPORTS,
        fromEntityId: existingEntity.id,
        toEntityId: 'test_target',
        created: new Date(baseTime.getTime() - 1000),
        lastModified: new Date(baseTime.getTime() + 2000), // Newer (existing)
        version: 1,
        metadata: {}
      };

      const incomingRel: GraphRelationship = {
        id: 'test_rel_existing',
        type: RelationshipType.IMPORTS,
        fromEntityId: existingEntity.id,
        toEntityId: 'test_target',
        created: new Date(baseTime.getTime() - 1000),
        lastModified: new Date(baseTime.getTime() + 1000), // Older (incoming)
        version: 2,
        metadata: {}
      };

      // Create existing relationship
      await kgService.createRelationship(existingRel);

      // Detect conflicts
      const conflicts = await conflictResolution.detectConflicts([], [incomingRel]);

      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      const relConflict = conflicts.find(c => c.type === 'relationship_conflict');
      expect(relConflict).toBeDefined();
      expect(relConflict?.relationshipId).toBe(existingRel.id);
    });

    it('should store detected conflicts internally', async () => {
      await kgService.createEntity(existingEntity);

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      expect(conflicts.length).toBe(1);

      // Check that conflicts are stored
      const unresolved = conflictResolution.getUnresolvedConflicts();
      expect(unresolved.length).toBe(1);
      expect(unresolved[0].id).toBe(conflicts[0].id);
    });

    it('should retrieve conflicts by ID', () => {
      const conflict: Conflict = {
        id: 'test_retrieve_conflict',
        type: 'entity_version',
        entityId: 'test_entity',
        description: 'Test conflict',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      // Manually add conflict to internal map for testing
      (conflictResolution as any).conflicts.set(conflict.id, conflict);

      const retrieved = conflictResolution.getConflict(conflict.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(conflict.id);
      expect(retrieved?.type).toBe(conflict.type);
    });

    it('should return null for non-existent conflict', () => {
      const retrieved = conflictResolution.getConflict('non_existent');
      expect(retrieved).toBeNull();
    });

    it('should get conflicts for specific entity', async () => {
      const conflict1: Conflict = {
        id: 'test_entity_conflict_1',
        type: 'entity_version',
        entityId: 'test_entity_1',
        description: 'Conflict 1',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      const conflict2: Conflict = {
        id: 'test_entity_conflict_2',
        type: 'entity_version',
        entityId: 'test_entity_2',
        description: 'Conflict 2',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      (conflictResolution as any).conflicts.set(conflict1.id, conflict1);
      (conflictResolution as any).conflicts.set(conflict2.id, conflict2);

      const entityConflicts = conflictResolution.getConflictsForEntity('test_entity_1');
      expect(entityConflicts.length).toBe(1);
      expect(entityConflicts[0].id).toBe('test_entity_conflict_1');
    });
  });

  describe('Conflict Resolution', () => {
    const testConflict: Conflict = {
      id: 'test_resolve_conflict',
      type: 'entity_version',
      entityId: 'test_entity',
      description: 'Test conflict for resolution',
      conflictingValues: {
        current: { id: 'test_entity', type: 'file' },
        incoming: { id: 'test_entity', type: 'file', size: 2048 }
      },
      timestamp: new Date(),
      resolved: false
    };

    beforeEach(() => {
      // Add conflict to internal map
      (conflictResolution as any).conflicts.set(testConflict.id, { ...testConflict });
    });

    it('should resolve conflicts with overwrite strategy', async () => {
      const resolution = {
        strategy: 'overwrite' as const,
        resolvedValue: testConflict.conflictingValues.incoming,
        timestamp: new Date(),
        resolvedBy: 'system'
      };

      const success = await conflictResolution.resolveConflict(testConflict.id, resolution as any);
      expect(success).toBe(true);

      const resolvedConflict = conflictResolution.getConflict(testConflict.id);
      expect(resolvedConflict?.resolved).toBe(true);
      expect(resolvedConflict?.resolution?.strategy).toBe('overwrite');
    });

    it('should resolve conflicts with merge strategy', async () => {
      const resolution = {
        strategy: 'merge' as const,
        resolvedValue: { ...testConflict.conflictingValues.current, ...testConflict.conflictingValues.incoming },
        timestamp: new Date(),
        resolvedBy: 'system'
      };

      const success = await conflictResolution.resolveConflict(testConflict.id, resolution as any);
      expect(success).toBe(true);

      const resolvedConflict = conflictResolution.getConflict(testConflict.id);
      expect(resolvedConflict?.resolved).toBe(true);
      expect(resolvedConflict?.resolution?.strategy).toBe('merge');
    });

    it('should resolve conflicts with skip strategy', async () => {
      const resolution: any = {
        strategy: 'skip',
        timestamp: new Date(),
        resolvedBy: 'system'
      };

      const success = await conflictResolution.resolveConflict(testConflict.id, resolution);
      expect(success).toBe(true);

      const resolvedConflict = conflictResolution.getConflict(testConflict.id);
      expect(resolvedConflict?.resolved).toBe(true);
      expect(resolvedConflict?.resolution?.strategy).toBe('skip');
    });

    it('should handle manual resolution', async () => {
      const resolution: any = {
        strategy: 'manual',
        manualResolution: 'User decided to keep current version',
        timestamp: new Date(),
        resolvedBy: 'user'
      };

      const success = await conflictResolution.resolveConflict(testConflict.id, resolution);
      expect(success).toBe(true);

      const resolvedConflict = conflictResolution.getConflict(testConflict.id);
      expect(resolvedConflict?.resolved).toBe(true);
      expect(resolvedConflict?.resolution?.strategy).toBe('manual');
      expect(resolvedConflict?.resolution?.manualResolution).toBe('User decided to keep current version');
    });

    it('should not resolve already resolved conflicts', async () => {
      // First resolve the conflict
      const resolution: any = {
        strategy: 'overwrite',
        resolvedValue: testConflict.conflictingValues.incoming,
        timestamp: new Date(),
        resolvedBy: 'system'
      };

      await conflictResolution.resolveConflict(testConflict.id, resolution);

      // Try to resolve again
      const success = await conflictResolution.resolveConflict(testConflict.id, resolution);
      expect(success).toBe(false);
    });

    it('should not resolve non-existent conflicts', async () => {
      const resolution: any = {
        strategy: 'overwrite',
        resolvedValue: {},
        timestamp: new Date(),
        resolvedBy: 'system'
      };

      const success = await conflictResolution.resolveConflict('non_existent', resolution);
      expect(success).toBe(false);
    });
  });

  describe('Automatic Resolution', () => {
    it('should automatically resolve conflicts using merge strategies', async () => {
      const existingEntity: File = {
        id: 'test_auto_entity',
        type: 'file',
        path: '/test/auto.ts',
        hash: 'old_hash',
        language: 'typescript',
        lastModified: new Date(Date.now() - 2000), // Older
        created: new Date(Date.now() - 3000),
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: []
      };

      const incomingEntity: File = {
        id: 'test_auto_entity',
        type: 'file',
        path: '/test/auto.ts',
        hash: 'new_hash',
        language: 'typescript',
        lastModified: new Date(Date.now() + 1000), // Newer
        created: new Date(Date.now() - 3000),
        extension: '.ts',
        size: 2048,
        lines: 100,
        isTest: false,
        isConfig: false,
        dependencies: []
      };

      await kgService.createEntity(existingEntity);

      const conflicts = await conflictResolution.detectConflicts([incomingEntity], []);
      expect(conflicts.length).toBe(1);

      const resolutions = await conflictResolution.resolveConflictsAuto(conflicts);
      expect(resolutions.length).toBe(1);
      expect(resolutions[0].strategy).toBe('overwrite'); // Should use the highest priority strategy
      expect(resolutions[0].resolvedBy).toBe('system');

      // Check that conflict is marked as resolved
      const resolvedConflict = conflictResolution.getConflict(conflicts[0].id);
      expect(resolvedConflict?.resolved).toBe(true);
    });
  });

  describe('Conflict Management', () => {
    it('should clear resolved conflicts', () => {
      const resolvedConflict: Conflict = {
        id: 'test_clear_resolved',
        type: 'entity_version',
        entityId: 'entity1',
        description: 'Resolved conflict',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: true,
        resolution: {
          strategy: 'overwrite',
          resolvedValue: {},
          timestamp: new Date(),
          resolvedBy: 'system'
        }
      };

      const unresolvedConflict: Conflict = {
        id: 'test_clear_unresolved',
        type: 'entity_version',
        entityId: 'entity2',
        description: 'Unresolved conflict',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      (conflictResolution as any).conflicts.set(resolvedConflict.id, resolvedConflict);
      (conflictResolution as any).conflicts.set(unresolvedConflict.id, unresolvedConflict);

      expect(conflictResolution.getResolvedConflicts().length).toBe(1);
      expect(conflictResolution.getUnresolvedConflicts().length).toBe(1);

      conflictResolution.clearResolvedConflicts();

      expect(conflictResolution.getResolvedConflicts().length).toBe(0);
      expect(conflictResolution.getUnresolvedConflicts().length).toBe(1);
    });

    it('should calculate conflict statistics', () => {
      const resolvedConflict: Conflict = {
        id: 'test_stats_resolved',
        type: 'entity_version',
        entityId: 'entity1',
        description: 'Resolved conflict',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: true,
        resolution: {
          strategy: 'overwrite',
          resolvedValue: {},
          timestamp: new Date(),
          resolvedBy: 'system'
        }
      };

      const unresolvedConflict1: Conflict = {
        id: 'test_stats_unresolved_1',
        type: 'entity_version',
        entityId: 'entity2',
        description: 'Unresolved conflict 1',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      const unresolvedConflict2: Conflict = {
        id: 'test_stats_unresolved_2',
        type: 'relationship_conflict',
        relationshipId: 'rel1',
        description: 'Unresolved conflict 2',
        conflictingValues: { current: {}, incoming: {} },
        timestamp: new Date(),
        resolved: false
      };

      (conflictResolution as any).conflicts.set(resolvedConflict.id, resolvedConflict);
      (conflictResolution as any).conflicts.set(unresolvedConflict1.id, unresolvedConflict1);
      (conflictResolution as any).conflicts.set(unresolvedConflict2.id, unresolvedConflict2);

      const stats = conflictResolution.getConflictStatistics();

      expect(stats.total).toBe(3);
      expect(stats.resolved).toBe(1);
      expect(stats.unresolved).toBe(2);
      expect(stats.byType['entity_version']).toBe(2);
      expect(stats.byType['relationship_conflict']).toBe(1);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove conflict listeners', () => {
      const listener = jest.fn();

      conflictResolution.addConflictListener(listener);
      expect((conflictResolution as any).conflictListeners.has(listener)).toBe(true);

      conflictResolution.removeConflictListener(listener);
      expect((conflictResolution as any).conflictListeners.has(listener)).toBe(false);
    });

    it('should notify conflict listeners when conflicts are detected', async () => {
      const listener = jest.fn();
      conflictResolution.addConflictListener(listener);

      const existingEntity: File = {
        id: 'test_listener_entity',
        type: 'file',
        path: '/test/listener.ts',
        hash: 'hash',
        language: 'typescript',
        lastModified: new Date(Date.now() - 1000),
        created: new Date(),
        extension: '.ts',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: []
      };

      const incomingEntity: File = {
        ...existingEntity,
        lastModified: new Date(Date.now() + 1000)
      };

      await kgService.createEntity(existingEntity);

      await conflictResolution.detectConflicts([incomingEntity], []);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'entity_version',
          entityId: existingEntity.id
        })
      );

      conflictResolution.removeConflictListener(listener);
    });
  });
});
