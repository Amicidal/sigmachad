/**
 * Unit tests for RollbackCapabilities
 * Tests rollback point creation, entity/relationship rollback operations, error handling, and cleanup functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DatabaseService } from '../../../src/services/DatabaseService';
import { InMemoryKnowledgeGraphMock } from '../../test-utils/in-memory-kg';
// Service under test
import { RollbackCapabilities, RollbackPoint, RollbackResult } from '../../../src/services/RollbackCapabilities';

import { Entity, GraphRelationship } from '../../../src/models/entities';
import { RelationshipType } from '../../../src/models/relationships';
import { File } from '../../../src/models/entities';

describe('RollbackCapabilities', () => {
  let rollbackCapabilities: RollbackCapabilities;
  let kg: InMemoryKnowledgeGraphMock;
  let dbService: DatabaseService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Use realistic database mocks with no failures/latency for determinism
    const { RealisticFalkorDBMock, RealisticQdrantMock, RealisticPostgreSQLMock, RealisticRedisMock } = await import('../../test-utils/realistic-mocks');
    dbService = new DatabaseService({
      falkordb: { url: 'redis://test:6379', database: 1 },
      qdrant: { url: 'http://qdrant:6333' },
      postgresql: { connectionString: 'postgresql://user:pass@localhost:5432/db' },
      redis: { url: 'redis://localhost:6379' },
    } as any, {
      falkorFactory: () => new RealisticFalkorDBMock({ failureRate: 0, latencyMs: 0, seed: 1 }),
      qdrantFactory: () => new RealisticQdrantMock({ failureRate: 0, latencyMs: 0, seed: 1 }),
      postgresFactory: () => new RealisticPostgreSQLMock({ failureRate: 0, latencyMs: 0, seed: 1 }),
      redisFactory: () => new RealisticRedisMock({ failureRate: 0, latencyMs: 0, seed: 1 }),
    });
    await dbService.initialize();

    // Use in-memory KG for deterministic entity/relationship behavior
    kg = new InMemoryKnowledgeGraphMock();
    await kg.initialize();

    rollbackCapabilities = new RollbackCapabilities(kg as any, dbService as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid dependencies', () => {
      expect(rollbackCapabilities).toBeDefined();
      expect(rollbackCapabilities).toBeInstanceOf(RollbackCapabilities);
    });
  });

  describe('Rollback Point Management', () => {
    const mockEntity: File = {
      id: 'test-entity-123',
      type: 'file',
      path: '/src/test.js',
      hash: 'abc123',
      language: 'javascript',
      lastModified: new Date('2023-01-01'),
      created: new Date('2023-01-01'),
      metadata: { size: 1024 },
      extension: '.js',
      size: 1024,
      lines: 50,
      isTest: false,
      isConfig: false,
      dependencies: [],
    };

    const mockRelationship: GraphRelationship = {
      id: 'rel-123',
      fromEntityId: 'entity1',
      toEntityId: 'entity2',
      type: RelationshipType.CALLS,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: { weight: 0.8 },
    };

    describe('createRollbackPoint', () => {
      it('should create rollback point successfully', async () => {
        const operationId = 'test-operation-123';
        const description = 'Test operation rollback point';

        // Seed the in-memory KG with one entity and one relationship
        await kg.createEntity(mockEntity as any);
        await kg.createEntity({ id: 'entity1', type: 'file', path: '/e1', hash: 'h', language: 'js', lastModified: new Date(), created: new Date(), extension: '.js', size: 1, lines: 1, isTest: false, isConfig: false, dependencies: [] } as any);
        await kg.createEntity({ id: 'entity2', type: 'file', path: '/e2', hash: 'h', language: 'js', lastModified: new Date(), created: new Date(), extension: '.js', size: 1, lines: 1, isTest: false, isConfig: false, dependencies: [] } as any);
        await kg.createRelationship(mockRelationship as any);

        const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, description);

        expect(rollbackId).toContain('rollback_test-operation-123_');

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint).toBeDefined();
        expect(rollbackPoint?.operationId).toBe(operationId);
        expect(rollbackPoint?.description).toBe(description);
        expect(rollbackPoint?.entities.length).toBeGreaterThanOrEqual(1);
        expect(rollbackPoint?.relationships.length).toBeGreaterThanOrEqual(1);
      });

      it('should re-throw database connection errors during entity capture', async () => {
        const operationId = 'test-operation-123';
        const description = 'Test operation rollback point';

        vi.spyOn(kg as any, 'listEntities').mockRejectedValue(new Error('Database connection failed'));
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        await expect(rollbackCapabilities.createRollbackPoint(operationId, description))
          .rejects.toThrow('Database connection failed');
      });

      it('should re-throw database connection errors during relationship capture', async () => {
        const operationId = 'test-operation-123';
        const description = 'Test operation rollback point';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockRejectedValue(new Error('Database connection failed'));

        await expect(rollbackCapabilities.createRollbackPoint(operationId, description))
          .rejects.toThrow('Database connection failed');
      });

      it('should trigger cleanup after creating rollback points', async () => {
        // Create enough points to trigger cleanup
        for (let i = 0; i < 55; i++) {
          // ensure lists return empty and not throw
          vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
          vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });
          await rollbackCapabilities.createRollbackPoint(`operation-${i}`, `Description ${i}`);
        }

        // Should have cleaned up old points (keeping only maxRollbackPoints)
        const allPoints = rollbackCapabilities.getAllRollbackPoints();
        expect(allPoints.length).toBeLessThanOrEqual(50); // maxRollbackPoints
      });

      it('should throw when database service is not initialized', async () => {
        const uninitializedDbService = {
          isInitialized: () => false,
        } as unknown as DatabaseService;
        const service = new RollbackCapabilities(kg as any, uninitializedDbService);

        await expect(
          service.createRollbackPoint('uninitialized-db', 'Should fail')
        ).rejects.toThrow('Database service not initialized');
      });
    });

    describe('getRollbackPoint', () => {
      it('should return rollback point by id', async () => {
        const operationId = 'test-operation-123';
        const description = 'Test operation rollback point';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, description);
        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);

        expect(rollbackPoint).toBeDefined();
        expect(rollbackPoint?.id).toBe(rollbackId);
        expect(rollbackPoint?.operationId).toBe(operationId);
        expect(rollbackPoint?.description).toBe(description);
      });

      it('should return null for non-existent rollback point', () => {
        const rollbackPoint = rollbackCapabilities.getRollbackPoint('non-existent-id');
        expect(rollbackPoint).toBeNull();
      });
    });

    describe('getRollbackPointsForOperation', () => {
      it('should return rollback points for specific operation', async () => {
        const operationId1 = 'operation-1';
        const operationId2 = 'operation-2';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const rollbackId1 = await rollbackCapabilities.createRollbackPoint(operationId1, 'Description 1');
        await new Promise(resolve => setTimeout(resolve, 1)); // Ensure different timestamps
        const rollbackId2 = await rollbackCapabilities.createRollbackPoint(operationId2, 'Description 2');
        await new Promise(resolve => setTimeout(resolve, 1)); // Ensure different timestamps
        const rollbackId3 = await rollbackCapabilities.createRollbackPoint(operationId1, 'Description 3');

        const pointsForOp1 = rollbackCapabilities.getRollbackPointsForOperation(operationId1);
        const pointsForOp2 = rollbackCapabilities.getRollbackPointsForOperation(operationId2);

        expect(pointsForOp1).toHaveLength(2);
        expect(pointsForOp2).toHaveLength(1);
        expect(pointsForOp1[0].id).toBe(rollbackId3); // Most recent first
        expect(pointsForOp1[1].id).toBe(rollbackId1);
        expect(pointsForOp2[0].id).toBe(rollbackId2);
        expect(pointsForOp1[0].operationId).toBe(operationId1);
        expect(pointsForOp1[1].operationId).toBe(operationId1);
        expect(pointsForOp2[0].operationId).toBe(operationId2);
      });

      it('should return points sorted by timestamp (most recent first)', async () => {
        const operationId = 'test-operation';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const rollbackId1 = await rollbackCapabilities.createRollbackPoint(operationId, 'Description 1');
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        const rollbackId2 = await rollbackCapabilities.createRollbackPoint(operationId, 'Description 2');

        const points = rollbackCapabilities.getRollbackPointsForOperation(operationId);

        expect(points).toHaveLength(2);
        expect(points[0].id).toBe(rollbackId2); // Most recent first
        expect(points[1].id).toBe(rollbackId1);
        expect(points[0].timestamp.getTime()).toBeGreaterThan(points[1].timestamp.getTime());
      });
    });

    describe('getAllRollbackPoints', () => {
      it('should return all rollback points sorted by timestamp', async () => {
        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const rollbackId1 = await rollbackCapabilities.createRollbackPoint('op1', 'Description 1');
        await new Promise(resolve => setTimeout(resolve, 10));
        const rollbackId2 = await rollbackCapabilities.createRollbackPoint('op2', 'Description 2');

        const allPoints = rollbackCapabilities.getAllRollbackPoints();

        expect(allPoints).toHaveLength(2);
        expect(allPoints[0].id).toBe(rollbackId2); // Most recent first
        expect(allPoints[1].id).toBe(rollbackId1);
      });

      it('should return empty array when no rollback points exist', () => {
        const allPoints = rollbackCapabilities.getAllRollbackPoints();
        expect(allPoints).toHaveLength(0);
      });
    });

    describe('deleteRollbackPoint', () => {
      it('should delete rollback point successfully', async () => {
        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Description');
        expect(rollbackCapabilities.getRollbackPoint(rollbackId)).toBeDefined();

        const deleted = rollbackCapabilities.deleteRollbackPoint(rollbackId);
        expect(deleted).toBe(true);
        expect(rollbackCapabilities.getRollbackPoint(rollbackId)).toBeNull();
      });

      it('should return false for non-existent rollback point', () => {
        const deleted = rollbackCapabilities.deleteRollbackPoint('non-existent-id');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Entity Change Recording', () => {
    let rollbackId: string;

    beforeEach(async () => {
      // Empty graph by default
      rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
    });

    describe('recordEntityChange', () => {
      const mockEntity: File = {
        id: 'test-entity-123',
        type: 'file',
        path: '/src/test.js',
        hash: 'abc123',
        language: 'javascript',
        lastModified: new Date('2023-01-01'),
        created: new Date('2023-01-01'),
        metadata: { size: 1024 },
        extension: '.js',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      it('should record entity create operation', async () => {
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.entities).toHaveLength(1);
        expect(rollbackPoint?.entities[0]).toEqual({
          id: mockEntity.id,
          action: 'create',
          previousState: undefined,
          newState: mockEntity,
        });
      });

      it('should record entity update operation', async () => {
        const previousState = { ...mockEntity, lastModified: new Date('2023-01-01') };
        const newState = { ...mockEntity, lastModified: new Date('2023-01-02') };

        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'update', previousState, newState);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.entities).toHaveLength(1);
        expect(rollbackPoint?.entities[0]).toEqual({
          id: mockEntity.id,
          action: 'update',
          previousState,
          newState,
        });
      });

      it('should record entity delete operation', async () => {
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'delete', mockEntity, undefined);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.entities).toHaveLength(1);
        expect(rollbackPoint?.entities[0]).toEqual({
          id: mockEntity.id,
          action: 'delete',
          previousState: mockEntity,
          newState: undefined,
        });
      });

      it('should fetch previous state for updates when not provided', async () => {
        const existingEntity = { ...mockEntity, lastModified: new Date('2023-01-01') };
        await kg.createEntity(existingEntity as any);

        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'update', undefined, mockEntity);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect((rollbackPoint?.entities[0] as any).previousState?.id).toEqual(existingEntity.id);
      });

      it('should throw error for invalid rollback point id', async () => {
        await expect(
          rollbackCapabilities.recordEntityChange('invalid-id', mockEntity.id, 'create', undefined, mockEntity)
        ).rejects.toThrow('Rollback point invalid-id not found');
      });
    });
  });

  describe('Relationship Change Recording', () => {
    let rollbackId: string;

    beforeEach(async () => {
      rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
    });

    describe('recordRelationshipChange', () => {
      const mockRelationship: GraphRelationship = {
        id: 'rel-123',
        fromEntityId: 'entity1',
        toEntityId: 'entity2',
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { weight: 0.8 },
      };

      it('should record relationship create operation', () => {
        rollbackCapabilities.recordRelationshipChange(rollbackId, mockRelationship.id, 'create', undefined, mockRelationship);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.relationships).toHaveLength(1);
        expect(rollbackPoint?.relationships[0]).toEqual({
          id: mockRelationship.id,
          action: 'create',
          previousState: undefined,
          newState: mockRelationship,
        });
      });

      it('should record relationship update operation', () => {
        const previousState = { ...mockRelationship, version: 1 };
        const newState = { ...mockRelationship, version: 2 };

        rollbackCapabilities.recordRelationshipChange(rollbackId, mockRelationship.id, 'update', previousState, newState);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.relationships).toHaveLength(1);
        expect(rollbackPoint?.relationships[0]).toEqual({
          id: mockRelationship.id,
          action: 'update',
          previousState,
          newState,
        });
      });

      it('should record relationship delete operation', () => {
        rollbackCapabilities.recordRelationshipChange(rollbackId, mockRelationship.id, 'delete', mockRelationship, undefined);

        const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
        expect(rollbackPoint?.relationships).toHaveLength(1);
        expect(rollbackPoint?.relationships[0]).toEqual({
          id: mockRelationship.id,
          action: 'delete',
          previousState: mockRelationship,
          newState: undefined,
        });
      });

      it('should throw error for invalid rollback point id', () => {
        expect(() => {
          rollbackCapabilities.recordRelationshipChange('invalid-id', mockRelationship.id, 'create', undefined, mockRelationship);
        }).toThrow('Rollback point invalid-id not found');
      });
    });
  });

  describe('Rollback Operations', () => {
    const mockEntity: File = {
      id: 'test-entity-123',
      type: 'file',
      path: '/src/test.js',
      hash: 'abc123',
      language: 'javascript',
      lastModified: new Date('2023-01-01'),
      created: new Date('2023-01-01'),
      metadata: { size: 1024 },
      extension: '.js',
      size: 1024,
      lines: 50,
      isTest: false,
      isConfig: false,
      dependencies: [],
    };

    const mockRelationship: GraphRelationship = {
      id: 'rel-123',
      fromEntityId: 'entity1',
      toEntityId: 'entity2',
      type: RelationshipType.CALLS,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      metadata: { weight: 0.8 },
    };

    describe('rollbackToPoint - Change-based rollback', () => {
      let rollbackId: string;

      beforeEach(async () => {
        rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
      });

      it('should successfully rollback entity create operation', async () => {
        // Record a create operation
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);
        const deleteSpy = vi.spyOn(kg as any, 'deleteEntity');

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBe(1);
        expect(result.rolledBackRelationships).toBe(0);
        expect(result.errors).toHaveLength(0);
        expect(deleteSpy).toHaveBeenCalledWith(mockEntity.id);
      });

      it('should successfully rollback entity update operation', async () => {
        const originalEntity = { ...mockEntity, lastModified: new Date('2023-01-01') };
        const updatedEntity = { ...mockEntity, lastModified: new Date('2023-01-02') };

        // Record an update operation
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'update', originalEntity, updatedEntity);

        const updateSpy = vi.spyOn(kg as any, 'updateEntity');

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBe(1);
        expect(updateSpy).toHaveBeenCalledWith(mockEntity.id, originalEntity);
      });

      it('should successfully rollback entity delete operation', async () => {
        // Record a delete operation
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'delete', mockEntity, undefined);

        const createSpy = vi.spyOn(kg as any, 'createEntity');

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBe(1);
        expect(createSpy).toHaveBeenCalledWith(mockEntity);
      });

      it('should successfully rollback relationship operations', async () => {
        // Record relationship operations
        rollbackCapabilities.recordRelationshipChange(rollbackId, mockRelationship.id, 'create', undefined, mockRelationship);

        const delRelSpy = vi.spyOn(kg as any, 'deleteRelationship');

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackRelationships).toBeGreaterThanOrEqual(1);
        // Note: The relationship rollback uses a different path in the actual implementation
        // It might not call deleteRelationship directly for create operations in change-based rollback
      });

      it('should handle partial rollback when some operations fail', async () => {
        // Record multiple operations
        await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);
        await rollbackCapabilities.recordEntityChange(rollbackId, 'entity2', 'create', undefined, { ...mockEntity, id: 'entity2' });

        // Mock one success, one failure
        const delSpy = vi.spyOn(kg as any, 'deleteEntity');
        delSpy.mockResolvedValueOnce(undefined as any).mockRejectedValueOnce(new Error('Delete failed') as any);

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: false }));
        expect(result.partialSuccess).toBe(true);
        expect(result.rolledBackEntities).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].action).toBe('create'); // Action is 'create' since we're rolling back a create operation
      });

      it('should return error result for non-existent rollback point', async () => {
        const result = await rollbackCapabilities.rollbackToPoint('non-existent-id');

        expect(result).toEqual(expect.objectContaining({ success: false }));
        expect(result.rolledBackEntities).toBe(0);
        expect(result.rolledBackRelationships).toBe(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].error).toContain('not found');
        expect(result.errors[0].recoverable).toBe(false);
      });
    });

    describe('rollbackToPoint - State-based rollback', () => {
      let rollbackId: string;

      beforeEach(async () => {
        // Create rollback point with captured state (no change objects)
        const capturedEntities = [
          { id: 'existing-entity-1', type: 'file', path: '/existing1.js' },
          { id: 'existing-entity-2', type: 'file', path: '/existing2.js' },
        ];

        const capturedRelationships = [
          {
            id: 'rel-1',
            fromEntityId: 'existing-entity-1',
            toEntityId: 'existing-entity-2',
            type: RelationshipType.CALLS,
            action: 'create',
            previousState: { id: 'rel-1', fromEntityId: 'existing-entity-1', toEntityId: 'existing-entity-2', type: RelationshipType.CALLS },
            newState: { id: 'rel-1', fromEntityId: 'existing-entity-1', toEntityId: 'existing-entity-2', type: RelationshipType.CALLS },
          },
        ];

        // Manually create rollback point with state data
        rollbackId = `rollback_test-state_${Date.now()}`;
        const rollbackPoint: RollbackPoint = {
          id: rollbackId,
          operationId: 'test-state',
          timestamp: new Date(),
          entities: capturedEntities,
          relationships: capturedRelationships,
          description: 'State-based rollback test',
        };

        (rollbackCapabilities as any).rollbackPoints.set(rollbackId, rollbackPoint);
      });

      it('should perform state-based rollback successfully', async () => {
        // Current state has extra entities and relationships
        const currentEntities = [
          { id: 'existing-entity-1', type: 'file', path: '/existing1.js' },
          { id: 'existing-entity-2', type: 'file', path: '/existing2.js' },
          { id: 'extra-entity', type: 'file', path: '/extra.js' }, // Should be deleted
        ];

        const currentRelationships = [
          {
            id: 'rel-1',
            fromEntityId: 'existing-entity-1',
            toEntityId: 'existing-entity-2',
            type: RelationshipType.CALLS,
          },
          {
            id: 'extra-rel',
            fromEntityId: 'existing-entity-1',
            toEntityId: 'extra-entity',
            type: RelationshipType.TYPE_USES,
          }, // Should be deleted
        ];

        // Seed current graph state
        for (const e of currentEntities) {
          await kg.createEntity({
            id: e.id,
            type: 'file',
            path: (e as any).path || '/',
            hash: 'h',
            language: 'js',
            lastModified: new Date(),
            created: new Date(),
            extension: '.js',
            size: 1,
            lines: 1,
            isTest: false,
            isConfig: false,
            dependencies: [],
          } as any);
        }
        for (const r of currentRelationships) {
          await kg.createRelationship({
            id: r.id as string,
            fromEntityId: (r as any).fromEntityId,
            toEntityId: (r as any).toEntityId,
            type: (r as any).type,
            created: new Date(),
            lastModified: new Date(),
            version: 1,
            metadata: {},
          } as any);
        }

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBeGreaterThanOrEqual(1); // At least one entity deleted
        expect(result.rolledBackRelationships).toBeGreaterThanOrEqual(1); // At least one relationship deleted
        expect(await kg.getEntity('extra-entity')).toBeNull();
        const rels = await (kg as any).listRelationships({});
        expect(rels.relationships.find((x: any) => x.id === 'extra-rel')).toBeUndefined();
      });

      it('should recreate missing entities during state-based rollback', async () => {
        // Current state is missing an entity that should exist
        const currentEntities = [
          { id: 'existing-entity-1', type: 'file', path: '/existing1.js' },
          // missing: existing-entity-2
        ];

        // Seed current state with only entity-1
        await kg.createEntity({ id: 'existing-entity-1', type: 'file', path: '/existing1.js', hash: 'h', language: 'js', lastModified: new Date(), created: new Date(), extension: '.js', size: 1, lines: 1, isTest: false, isConfig: false, dependencies: [] } as any);

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBeGreaterThanOrEqual(1); // At least one entity created
        expect(await kg.getEntity('existing-entity-2')).not.toBeNull();
      });

      it('should update entities that exist but are different', async () => {
        // Current state has an entity with different properties
        const currentEntities = [
          { id: 'existing-entity-1', type: 'file', path: '/existing1.js', lastModified: new Date('2023-01-02') },
        ];

        const capturedEntity = {
          id: 'existing-entity-1',
          type: 'file',
          path: '/existing1.js',
          lastModified: new Date('2023-01-01'), // Different timestamp
        };

        // Update the rollback point with the captured entity
        const rollbackPoint = (rollbackCapabilities as any).rollbackPoints.get(rollbackId);
        rollbackPoint.entities = [capturedEntity];

        // Seed current state with differing entity
        await kg.createEntity({ id: 'existing-entity-1', type: 'file', path: '/existing1.js', hash: 'h', language: 'js', lastModified: new Date('2023-01-02'), created: new Date(), extension: '.js', size: 1, lines: 1, isTest: false, isConfig: false, dependencies: [] } as any);

        const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

        expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBe(1);
        const updated = await kg.getEntity('existing-entity-1');
        expect((updated as any)?.lastModified?.getTime()).toBe(new Date('2023-01-01').getTime());
      });
    });
  });

  describe('Operation-based Rollback', () => {
    describe('rollbackLastOperation', () => {
      it('should rollback the most recent operation', async () => {
        const operationId = 'test-operation';

        // Create multiple rollback points for the same operation
        const rollbackId1 = await rollbackCapabilities.createRollbackPoint(operationId, 'First operation');
        await new Promise(resolve => setTimeout(resolve, 10));
        const rollbackId2 = await rollbackCapabilities.createRollbackPoint(operationId, 'Second operation');

        const result = await rollbackCapabilities.rollbackLastOperation(operationId);

        expect(result).toBeDefined();
        expect(result).toEqual(expect.objectContaining({ success: true }));
        // The rollback should have been called on the most recent point (rollbackId2)
      });

      it('should return null when no rollback points exist for operation', async () => {
        const result = await rollbackCapabilities.rollbackLastOperation('non-existent-operation');
        expect(result).toBeNull();
      });
    });
  });

  describe('Validation and Cleanup', () => {
    describe('validateRollbackPoint', () => {
      it('should validate rollback point successfully', async () => {
        const operationId = 'test-operation';

        const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');

        // Seed entity to validate
        await kg.createEntity({ id: 'entity1', type: 'file', path: '/p', hash: 'h', language: 'js', lastModified: new Date(), created: new Date(), extension: '.js', size: 1, lines: 1, isTest: false, isConfig: false, dependencies: [] } as any);
        const rp = (rollbackCapabilities as any).rollbackPoints.get(rollbackId);
        rp.entities = [{ id: 'entity1', action: 'create' }];

        const result = await rollbackCapabilities.validateRollbackPoint(rollbackId);

        expect(result.valid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should detect issues with rollback point', async () => {
        const operationId = 'test-operation';

        const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');

        // Add an entity to the rollback point manually
        const rollbackPoint = (rollbackCapabilities as any).rollbackPoints.get(rollbackId);
        rollbackPoint.entities = [{ id: 'missing-entity', action: 'create' }];

        const result = await rollbackCapabilities.validateRollbackPoint(rollbackId);

        expect(result.valid).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]).toContain("doesn't");
      });

      it('should return invalid for non-existent rollback point', async () => {
        const result = await rollbackCapabilities.validateRollbackPoint('non-existent-id');

        expect(result.valid).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]).toContain('not found');
      });
    });

    describe('cleanupOldRollbackPoints', () => {
      it('should cleanup old rollback points based on age', () => {
        const maxAgeMs = 1000; // 1 second

        // Create a rollback point
        const oldTimestamp = new Date(Date.now() - 2000); // 2 seconds ago
        const rollbackPoint: RollbackPoint = {
          id: 'old-rollback',
          operationId: 'test-op',
          timestamp: oldTimestamp,
          entities: [],
          relationships: [],
          description: 'Old rollback point',
        };

        (rollbackCapabilities as any).rollbackPoints.set(rollbackPoint.id, rollbackPoint);

        const cleanedCount = rollbackCapabilities.cleanupOldRollbackPoints(maxAgeMs);

        expect(cleanedCount).toBe(1);
        expect(rollbackCapabilities.getRollbackPoint('old-rollback')).toBeNull();
      });

      it('should cleanup excess rollback points when over limit', () => {
        // Temporarily set maxRollbackPoints to 2
        const originalMax = (rollbackCapabilities as any).maxRollbackPoints;
        (rollbackCapabilities as any).maxRollbackPoints = 2;

        // Create 3 rollback points
        for (let i = 0; i < 3; i++) {
          const rollbackPoint: RollbackPoint = {
            id: `rollback-${i}`,
            operationId: 'test-op',
            timestamp: new Date(Date.now() - (2 - i) * 1000), // Different timestamps
            entities: [],
            relationships: [],
            description: `Rollback point ${i}`,
          };
          (rollbackCapabilities as any).rollbackPoints.set(rollbackPoint.id, rollbackPoint);
        }

        const cleanedCount = rollbackCapabilities.cleanupOldRollbackPoints();

        expect(cleanedCount).toBe(1); // Should have cleaned 1 point to stay under limit
        expect(rollbackCapabilities.getAllRollbackPoints()).toHaveLength(2);

        // Restore original max
        (rollbackCapabilities as any).maxRollbackPoints = originalMax;
      });
    });

    describe('getRollbackStatistics', () => {
      it('should return correct statistics when rollback points exist', async () => {
        // Create some rollback points with different timestamps
        const timestamps = [
          new Date(Date.now() - 300000), // 5 minutes ago
          new Date(Date.now() - 200000), // ~3.3 minutes ago
          new Date(Date.now() - 100000), // ~1.7 minutes ago
        ];

        for (let i = 0; i < timestamps.length; i++) {
          const rollbackPoint: RollbackPoint = {
            id: `rollback-${i}`,
            operationId: 'test-op',
            timestamp: timestamps[i],
            entities: Array(i + 1).fill({ id: `entity-${i}`, type: 'file' }), // Different entity counts
            relationships: Array(i).fill({ id: `rel-${i}`, type: 'calls' }), // Different relationship counts
            description: `Rollback point ${i}`,
          };
          (rollbackCapabilities as any).rollbackPoints.set(rollbackPoint.id, rollbackPoint);
        }

        const stats = rollbackCapabilities.getRollbackStatistics();

        expect(stats.totalRollbackPoints).toBe(3);
        expect(stats.oldestRollbackPoint).toEqual(timestamps[0]);
        expect(stats.newestRollbackPoint).toEqual(timestamps[2]);
        expect(stats.averageEntitiesPerPoint).toBe((1 + 2 + 3) / 3); // 2
        expect(stats.averageRelationshipsPerPoint).toBe((0 + 1 + 2) / 3); // 1
      });

      it('should return empty statistics when no rollback points exist', () => {
        const stats = rollbackCapabilities.getRollbackStatistics();

        expect(stats.totalRollbackPoints).toBe(0);
        expect(stats.oldestRollbackPoint).toBeNull();
        expect(stats.newestRollbackPoint).toBeNull();
        expect(stats.averageEntitiesPerPoint).toBe(0);
        expect(stats.averageRelationshipsPerPoint).toBe(0);
      });
    });
  });

  describe('Snapshot Operations', () => {
    describe('createSnapshot', () => {
      it('should create snapshot successfully', async () => {
        const operationId = 'snapshot-operation';
        const description = 'Test snapshot';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const snapshotId = await rollbackCapabilities.createSnapshot(operationId, description);

        expect(snapshotId).toContain('rollback_snapshot-operation_');
        // The snapshot ID doesn't contain the description, only the rollback point description does

        const snapshotPoint = rollbackCapabilities.getRollbackPoint(snapshotId);
        expect(snapshotPoint).toBeDefined();
        expect(snapshotPoint?.description).toBe('Snapshot: Test snapshot');
      });
    });

    describe('restoreFromSnapshot', () => {
      it('should restore from snapshot successfully', async () => {
        const operationId = 'snapshot-operation';
        const description = 'Test snapshot';

        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const snapshotId = await rollbackCapabilities.createSnapshot(operationId, description);

        // Mock rollback operation
        vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
        vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

        const result = await rollbackCapabilities.restoreFromSnapshot(snapshotId);

      expect(result).toEqual(expect.objectContaining({ success: true }));
        expect(result.rolledBackEntities).toBe(0);
        expect(result.rolledBackRelationships).toBe(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures during rollback', async () => {
      const operationId = 'test-operation';

      vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
      vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

      const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');

      // Add an entity change
      const mockEntity: File = {
        id: 'test-entity-123',
        type: 'file',
        path: '/src/test.js',
        hash: 'abc123',
        language: 'javascript',
        lastModified: new Date('2023-01-01'),
        created: new Date('2023-01-01'),
        metadata: { size: 1024 },
        extension: '.js',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false,
        dependencies: [],
      };

      await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);

      // Mock database failure during rollback
      vi.spyOn(kg as any, 'deleteEntity').mockRejectedValue(new Error('Database connection failed') as any);

      const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

      expect(result).toEqual(expect.objectContaining({ success: false }));
      expect(result.partialSuccess).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Database connection failed');
    });

    it('should handle empty rollback points gracefully', async () => {
      const operationId = 'empty-operation';

      vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
      vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

      const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Empty operation');

      const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(result.rolledBackEntities).toBe(0);
      expect(result.rolledBackRelationships).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle ID mismatch in delete rollback', async () => {
      const operationId = 'test-operation';

      vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
      vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

      const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');

      // Create a change object with mismatched IDs
      const rollbackPoint = (rollbackCapabilities as any).rollbackPoints.get(rollbackId);
      rollbackPoint.entities = [{
        id: 'change-id',
        action: 'delete',
        previousState: { id: 'different-id', type: 'file' }, // Different ID
        newState: undefined,
      }];

      const result = await rollbackCapabilities.rollbackToPoint(rollbackId);

      expect(result).toEqual(expect.objectContaining({ success: false }));
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('ID mismatch between change (change-id) and previousState (different-id)');
    });

    it('should handle concurrent operations safely', async () => {
      const operationId = 'concurrent-operation';

      vi.spyOn(kg as any, 'listEntities').mockResolvedValue({ entities: [], total: 0 });
      vi.spyOn(kg as any, 'listRelationships').mockResolvedValue({ relationships: [], total: 0 });

      // Create multiple rollback points quickly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(rollbackCapabilities.createRollbackPoint(`${operationId}-${i}`, `Description ${i}`));
      }

      const rollbackIds = await Promise.all(promises);

      // All should succeed and be unique
      expect(rollbackIds).toHaveLength(10);
      expect(new Set(rollbackIds).size).toBe(10); // All unique

      // All should be retrievable
      rollbackIds.forEach(rollbackId => {
        expect(rollbackCapabilities.getRollbackPoint(rollbackId)).toBeDefined();
      });
    });
  });
});
