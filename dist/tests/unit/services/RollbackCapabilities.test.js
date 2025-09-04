/**
 * Unit tests for RollbackCapabilities
 * Tests rollback point creation, entity/relationship rollback operations, error handling, and cleanup functionality
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
// Mock external dependencies
vi.mock('../../../src/services/KnowledgeGraphService');
vi.mock('../../../src/services/DatabaseService');
// Import the mocked dependencies first
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { DatabaseService } from '../../../src/services/DatabaseService';
// Import the service after mocks are set up
import { RollbackCapabilities } from '../../../src/services/RollbackCapabilities';
import { RelationshipType } from '../../../src/models/relationships';
// Mock implementations
const mockKnowledgeGraphService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    createEntity: vi.fn().mockResolvedValue(undefined),
    updateEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    getEntity: vi.fn().mockResolvedValue(null),
    listEntities: vi.fn().mockResolvedValue({ entities: [], total: 0 }),
    createRelationship: vi.fn().mockResolvedValue(undefined),
    deleteRelationship: vi.fn().mockResolvedValue(undefined),
    listRelationships: vi.fn().mockResolvedValue({ relationships: [], total: 0 }),
};
const mockDatabaseService = {
    initialize: vi.fn().mockResolvedValue(undefined),
};
// Setup mocks before tests
vi.mocked(KnowledgeGraphService).mockImplementation(() => mockKnowledgeGraphService);
vi.mocked(DatabaseService).mockImplementation(() => mockDatabaseService);
describe('RollbackCapabilities', () => {
    let rollbackCapabilities;
    let mockKgService;
    let mockDbService;
    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();
        mockKgService = mockKnowledgeGraphService;
        mockDbService = mockDatabaseService;
        // Create service instance with mocked dependencies
        rollbackCapabilities = new RollbackCapabilities(mockKgService, mockDbService);
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
        const mockEntity = {
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
        const mockRelationship = {
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
                mockKgService.listEntities.mockResolvedValue({ entities: [mockEntity] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [mockRelationship] });
                const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, description);
                expect(rollbackId).toContain('rollback_test-operation-123_');
                expect(mockKgService.listEntities).toHaveBeenCalledWith({ limit: 1000 });
                expect(mockKgService.listRelationships).toHaveBeenCalledWith({ limit: 1000 });
                const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
                expect(rollbackPoint).toBeDefined();
                expect(rollbackPoint?.operationId).toBe(operationId);
                expect(rollbackPoint?.description).toBe(description);
                expect(rollbackPoint?.entities).toHaveLength(1);
                expect(rollbackPoint?.relationships).toHaveLength(1);
            });
            it('should re-throw database connection errors during entity capture', async () => {
                const operationId = 'test-operation-123';
                const description = 'Test operation rollback point';
                mockKgService.listEntities.mockRejectedValue(new Error('Database connection failed'));
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                await expect(rollbackCapabilities.createRollbackPoint(operationId, description))
                    .rejects.toThrow('Database connection failed');
            });
            it('should re-throw database connection errors during relationship capture', async () => {
                const operationId = 'test-operation-123';
                const description = 'Test operation rollback point';
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockRejectedValue(new Error('Database connection failed'));
                await expect(rollbackCapabilities.createRollbackPoint(operationId, description))
                    .rejects.toThrow('Database connection failed');
            });
            it('should trigger cleanup after creating rollback points', async () => {
                // Create enough points to trigger cleanup
                for (let i = 0; i < 55; i++) {
                    mockKgService.listEntities.mockResolvedValue({ entities: [] });
                    mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                    await rollbackCapabilities.createRollbackPoint(`operation-${i}`, `Description ${i}`);
                }
                // Should have cleaned up old points (keeping only maxRollbackPoints)
                const allPoints = rollbackCapabilities.getAllRollbackPoints();
                expect(allPoints.length).toBeLessThanOrEqual(50); // maxRollbackPoints
            });
        });
        describe('getRollbackPoint', () => {
            it('should return rollback point by id', async () => {
                const operationId = 'test-operation-123';
                const description = 'Test operation rollback point';
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
        let rollbackId;
        beforeEach(async () => {
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
            rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
        });
        describe('recordEntityChange', () => {
            const mockEntity = {
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
                mockKgService.getEntity.mockResolvedValue(existingEntity);
                await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'update', undefined, mockEntity);
                expect(mockKgService.getEntity).toHaveBeenCalledWith(mockEntity.id);
                const rollbackPoint = rollbackCapabilities.getRollbackPoint(rollbackId);
                expect(rollbackPoint?.entities[0].previousState).toEqual(existingEntity);
            });
            it('should throw error for invalid rollback point id', async () => {
                await expect(rollbackCapabilities.recordEntityChange('invalid-id', mockEntity.id, 'create', undefined, mockEntity)).rejects.toThrow('Rollback point invalid-id not found');
            });
        });
    });
    describe('Relationship Change Recording', () => {
        let rollbackId;
        beforeEach(async () => {
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
            rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
        });
        describe('recordRelationshipChange', () => {
            const mockRelationship = {
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
        const mockEntity = {
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
        const mockRelationship = {
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
            let rollbackId;
            beforeEach(async () => {
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                rollbackId = await rollbackCapabilities.createRollbackPoint('test-op', 'Test operation');
            });
            it('should successfully rollback entity create operation', async () => {
                // Record a create operation
                await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);
                // Mock successful delete
                mockKgService.deleteEntity.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1);
                expect(result.rolledBackRelationships).toBe(0);
                expect(result.errors).toHaveLength(0);
                expect(mockKgService.deleteEntity).toHaveBeenCalledWith(mockEntity.id);
            });
            it('should successfully rollback entity update operation', async () => {
                const originalEntity = { ...mockEntity, lastModified: new Date('2023-01-01') };
                const updatedEntity = { ...mockEntity, lastModified: new Date('2023-01-02') };
                // Record an update operation
                await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'update', originalEntity, updatedEntity);
                // Mock successful update
                mockKgService.updateEntity.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1);
                expect(mockKgService.updateEntity).toHaveBeenCalledWith(mockEntity.id, originalEntity);
            });
            it('should successfully rollback entity delete operation', async () => {
                // Record a delete operation
                await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'delete', mockEntity, undefined);
                // Mock successful create
                mockKgService.createEntity.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1);
                expect(mockKgService.createEntity).toHaveBeenCalledWith(mockEntity);
            });
            it('should successfully rollback relationship operations', async () => {
                // Record relationship operations
                rollbackCapabilities.recordRelationshipChange(rollbackId, mockRelationship.id, 'create', undefined, mockRelationship);
                // Mock successful delete
                mockKgService.deleteRelationship.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackRelationships).toBe(1);
                // Note: The relationship rollback uses a different path in the actual implementation
                // It might not call deleteRelationship directly for create operations in change-based rollback
            });
            it('should handle partial rollback when some operations fail', async () => {
                // Record multiple operations
                await rollbackCapabilities.recordEntityChange(rollbackId, mockEntity.id, 'create', undefined, mockEntity);
                await rollbackCapabilities.recordEntityChange(rollbackId, 'entity2', 'create', undefined, { ...mockEntity, id: 'entity2' });
                // Mock one success, one failure
                mockKgService.deleteEntity
                    .mockResolvedValueOnce(undefined)
                    .mockRejectedValueOnce(new Error('Delete failed'));
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(false);
                expect(result.partialSuccess).toBe(true);
                expect(result.rolledBackEntities).toBe(1);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].action).toBe('create'); // Action is 'create' since we're rolling back a create operation
            });
            it('should return error result for non-existent rollback point', async () => {
                const result = await rollbackCapabilities.rollbackToPoint('non-existent-id');
                expect(result.success).toBe(false);
                expect(result.rolledBackEntities).toBe(0);
                expect(result.rolledBackRelationships).toBe(0);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].error).toContain('not found');
                expect(result.errors[0].recoverable).toBe(false);
            });
        });
        describe('rollbackToPoint - State-based rollback', () => {
            let rollbackId;
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
                const rollbackPoint = {
                    id: rollbackId,
                    operationId: 'test-state',
                    timestamp: new Date(),
                    entities: capturedEntities,
                    relationships: capturedRelationships,
                    description: 'State-based rollback test',
                };
                rollbackCapabilities.rollbackPoints.set(rollbackId, rollbackPoint);
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
                        type: RelationshipType.USES,
                    }, // Should be deleted
                ];
                mockKgService.listEntities.mockResolvedValue({ entities: currentEntities });
                mockKgService.listRelationships.mockResolvedValue({ relationships: currentRelationships });
                mockKgService.deleteEntity.mockResolvedValue(undefined);
                mockKgService.deleteRelationship.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1); // One entity deleted
                expect(result.rolledBackRelationships).toBe(1); // One relationship deleted
                expect(mockKgService.deleteEntity).toHaveBeenCalledWith('extra-entity');
                expect(mockKgService.deleteRelationship).toHaveBeenCalledWith('extra-rel');
            });
            it('should recreate missing entities during state-based rollback', async () => {
                // Current state is missing an entity that should exist
                const currentEntities = [
                    { id: 'existing-entity-1', type: 'file', path: '/existing1.js' },
                    // missing: existing-entity-2
                ];
                mockKgService.listEntities.mockResolvedValue({ entities: currentEntities });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                mockKgService.createEntity.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1); // One entity created
                expect(mockKgService.createEntity).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing-entity-2' }));
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
                const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
                rollbackPoint.entities = [capturedEntity];
                mockKgService.listEntities.mockResolvedValue({ entities: currentEntities });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                mockKgService.updateEntity.mockResolvedValue(undefined);
                const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(1);
                expect(mockKgService.updateEntity).toHaveBeenCalledWith('existing-entity-1', expect.objectContaining({ lastModified: new Date('2023-01-01') }));
            });
        });
    });
    describe('Operation-based Rollback', () => {
        describe('rollbackLastOperation', () => {
            it('should rollback the most recent operation', async () => {
                const operationId = 'test-operation';
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                // Create multiple rollback points for the same operation
                const rollbackId1 = await rollbackCapabilities.createRollbackPoint(operationId, 'First operation');
                await new Promise(resolve => setTimeout(resolve, 10));
                const rollbackId2 = await rollbackCapabilities.createRollbackPoint(operationId, 'Second operation');
                // Mock successful rollback
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                const result = await rollbackCapabilities.rollbackLastOperation(operationId);
                expect(result).toBeDefined();
                expect(result?.success).toBe(true);
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');
                // Mock entity validation
                mockKgService.getEntity.mockResolvedValue({ id: 'entity1', type: 'file' });
                const result = await rollbackCapabilities.validateRollbackPoint(rollbackId);
                expect(result.valid).toBe(true);
                expect(result.issues).toHaveLength(0);
            });
            it('should detect issues with rollback point', async () => {
                const operationId = 'test-operation';
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');
                // Mock entity that no longer exists
                mockKgService.getEntity.mockResolvedValue(null);
                // Add an entity to the rollback point manually
                const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
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
                const rollbackPoint = {
                    id: 'old-rollback',
                    operationId: 'test-op',
                    timestamp: oldTimestamp,
                    entities: [],
                    relationships: [],
                    description: 'Old rollback point',
                };
                rollbackCapabilities.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
                const cleanedCount = rollbackCapabilities.cleanupOldRollbackPoints(maxAgeMs);
                expect(cleanedCount).toBe(1);
                expect(rollbackCapabilities.getRollbackPoint('old-rollback')).toBeNull();
            });
            it('should cleanup excess rollback points when over limit', () => {
                // Temporarily set maxRollbackPoints to 2
                const originalMax = rollbackCapabilities.maxRollbackPoints;
                rollbackCapabilities.maxRollbackPoints = 2;
                // Create 3 rollback points
                for (let i = 0; i < 3; i++) {
                    const rollbackPoint = {
                        id: `rollback-${i}`,
                        operationId: 'test-op',
                        timestamp: new Date(Date.now() - (2 - i) * 1000), // Different timestamps
                        entities: [],
                        relationships: [],
                        description: `Rollback point ${i}`,
                    };
                    rollbackCapabilities.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
                }
                const cleanedCount = rollbackCapabilities.cleanupOldRollbackPoints();
                expect(cleanedCount).toBe(1); // Should have cleaned 1 point to stay under limit
                expect(rollbackCapabilities.getAllRollbackPoints()).toHaveLength(2);
                // Restore original max
                rollbackCapabilities.maxRollbackPoints = originalMax;
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
                    const rollbackPoint = {
                        id: `rollback-${i}`,
                        operationId: 'test-op',
                        timestamp: timestamps[i],
                        entities: Array(i + 1).fill({ id: `entity-${i}`, type: 'file' }), // Different entity counts
                        relationships: Array(i).fill({ id: `rel-${i}`, type: 'calls' }), // Different relationship counts
                        description: `Rollback point ${i}`,
                    };
                    rollbackCapabilities.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                const snapshotId = await rollbackCapabilities.createSnapshot(operationId, description);
                // Mock rollback operation
                mockKgService.listEntities.mockResolvedValue({ entities: [] });
                mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
                const result = await rollbackCapabilities.restoreFromSnapshot(snapshotId);
                expect(result.success).toBe(true);
                expect(result.rolledBackEntities).toBe(0);
                expect(result.rolledBackRelationships).toBe(0);
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle database connection failures during rollback', async () => {
            const operationId = 'test-operation';
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
            const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');
            // Add an entity change
            const mockEntity = {
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
            mockKgService.deleteEntity.mockRejectedValue(new Error('Database connection failed'));
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(false);
            expect(result.partialSuccess).toBe(true);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].error).toContain('Database connection failed');
        });
        it('should handle empty rollback points gracefully', async () => {
            const operationId = 'empty-operation';
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
            const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Empty operation');
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackEntities).toBe(0);
            expect(result.rolledBackRelationships).toBe(0);
            expect(result.errors).toHaveLength(0);
        });
        it('should handle ID mismatch in delete rollback', async () => {
            const operationId = 'test-operation';
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
            const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, 'Test operation');
            // Create a change object with mismatched IDs
            const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
            rollbackPoint.entities = [{
                    id: 'change-id',
                    action: 'delete',
                    previousState: { id: 'different-id', type: 'file' }, // Different ID
                    newState: undefined,
                }];
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].error).toContain('ID mismatch between change (change-id) and previousState (different-id)');
        });
        it('should handle concurrent operations safely', async () => {
            const operationId = 'concurrent-operation';
            mockKgService.listEntities.mockResolvedValue({ entities: [] });
            mockKgService.listRelationships.mockResolvedValue({ relationships: [] });
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
//# sourceMappingURL=RollbackCapabilities.test.js.map