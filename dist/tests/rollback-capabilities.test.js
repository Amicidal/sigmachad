/**
 * Rollback Capabilities Service Unit Tests
 * Comprehensive tests for rollback point creation and restoration
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { RollbackCapabilities } from '../src/services/RollbackCapabilities.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { DatabaseService, createDatabaseConfig } from '../src/services/DatabaseService.js';
import { RelationshipType } from '../src/models/relationships.js';
describe('RollbackCapabilities', () => {
    let dbService;
    let kgService;
    let rollbackCapabilities;
    beforeAll(async () => {
        const dbConfig = createDatabaseConfig();
        dbService = new DatabaseService(dbConfig);
        await dbService.initialize();
        kgService = new KnowledgeGraphService(dbService);
        await kgService.initialize();
        rollbackCapabilities = new RollbackCapabilities(kgService, dbService);
    }, 30000);
    afterAll(async () => {
        await dbService.close();
    }, 10000);
    beforeEach(async () => {
        // Clean up test data
        await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "rollback_test_" DELETE n').catch(() => { });
        await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "rollback_test_" DELETE r').catch(() => { });
        // Clear rollback points
        rollbackCapabilities.rollbackPoints.clear();
        // Clear all entities and relationships to ensure clean state
        await dbService.falkordbQuery('MATCH (n) DELETE n').catch(() => { });
        await dbService.falkordbQuery('MATCH ()-[r]-() DELETE r').catch(() => { });
    });
    describe('Initialization', () => {
        it('should initialize successfully', () => {
            expect(rollbackCapabilities).toBeDefined();
            expect(rollbackCapabilities).toBeInstanceOf(RollbackCapabilities);
        });
    });
    describe('Rollback Point Creation', () => {
        it('should create a rollback point with empty state', async () => {
            const operationId = 'test_operation_1';
            const description = 'Test rollback point';
            const rollbackId = await rollbackCapabilities.createRollbackPoint(operationId, description);
            expect(rollbackId).toBeDefined();
            expect(typeof rollbackId).toBe('string');
            const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
            expect(rollbackPoint).toBeDefined();
            expect(rollbackPoint.operationId).toBe(operationId);
            expect(rollbackPoint.description).toBe(description);
            expect(rollbackPoint.entities).toEqual([]);
            expect(rollbackPoint.relationships).toEqual([]);
        });
        it('should create rollback point with current graph state', async () => {
            // Create some test entities and relationships first
            const testEntity = {
                id: 'rollback_test_file',
                type: 'file',
                path: '/test/test.ts',
                hash: 'abc123',
                language: 'typescript',
                size: 100,
                lines: 5,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            const testEntity2 = {
                id: 'rollback_test_file2',
                type: 'file',
                path: '/test/test2.ts',
                hash: 'def456',
                language: 'typescript',
                size: 200,
                lines: 10,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            await kgService.createEntity(testEntity);
            await kgService.createEntity(testEntity2);
            const testRelationship = {
                id: 'rollback_test_rel',
                type: RelationshipType.IMPORTS,
                fromEntityId: testEntity.id,
                toEntityId: testEntity2.id,
                created: new Date(),
                lastModified: new Date(),
                version: 1,
                metadata: {
                    importType: 'named',
                    importedNames: ['testFunction']
                }
            };
            await kgService.createRelationship(testRelationship);
            // Now create rollback point
            const rollbackId = await rollbackCapabilities.createRollbackPoint('test_operation_with_state', 'Test with existing state');
            const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
            expect(rollbackPoint.entities.length).toBeGreaterThan(0);
            expect(rollbackPoint.relationships.length).toBeGreaterThan(0);
            // Verify the state was captured
            const entityStates = rollbackPoint.entities;
            const relationshipStates = rollbackPoint.relationships;
            expect(entityStates.some((e) => e.id === testEntity.id)).toBe(true);
            expect(entityStates.some((e) => e.id === testEntity2.id)).toBe(true);
            expect(relationshipStates.some((r) => r.id === testRelationship.id)).toBe(true);
        });
        it('should generate unique rollback point IDs', async () => {
            const rollbackId1 = await rollbackCapabilities.createRollbackPoint('op1', 'desc1');
            const rollbackId2 = await rollbackCapabilities.createRollbackPoint('op2', 'desc2');
            expect(rollbackId1).not.toBe(rollbackId2);
            expect(rollbackId1).toMatch(/^rollback_/);
            expect(rollbackId2).toMatch(/^rollback_/);
        });
    });
    describe('Rollback Point Management', () => {
        let testRollbackId;
        beforeEach(async () => {
            testRollbackId = await rollbackCapabilities.createRollbackPoint('test_manage', 'Test management');
        });
        it('should list all rollback points', async () => {
            const points = rollbackCapabilities.getAllRollbackPoints();
            expect(points.length).toBeGreaterThan(0);
            expect(points.some(p => p.id === testRollbackId)).toBe(true);
        });
        it('should get rollback point by ID', async () => {
            const point = await rollbackCapabilities.getRollbackPoint(testRollbackId);
            expect(point).toBeDefined();
            expect(point?.id).toBe(testRollbackId);
            expect(point?.operationId).toBe('test_manage');
        });
        it('should return null for non-existent rollback point', async () => {
            const point = await rollbackCapabilities.getRollbackPoint('non_existent_id');
            expect(point).toBeNull();
        });
        it('should delete rollback point', async () => {
            const deleteResult = await rollbackCapabilities.deleteRollbackPoint(testRollbackId);
            expect(deleteResult).toBe(true);
            const point = await rollbackCapabilities.getRollbackPoint(testRollbackId);
            expect(point).toBeNull();
        });
        it('should return false when deleting non-existent rollback point', async () => {
            const deleteResult = await rollbackCapabilities.deleteRollbackPoint('non_existent_id');
            expect(deleteResult).toBe(false);
        });
    });
    describe('Rollback Execution', () => {
        it('should successfully rollback to empty state', async () => {
            const rollbackId = await rollbackCapabilities.createRollbackPoint('empty_rollback', 'Empty state test');
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackEntities).toBe(0);
            expect(result.rolledBackRelationships).toBe(0);
            expect(result.errors).toEqual([]);
            expect(result.partialSuccess).toBe(false);
        });
        it('should rollback entity creation', async () => {
            // Create a rollback point before adding entity
            const rollbackId = await rollbackCapabilities.createRollbackPoint('entity_create_rollback', 'Entity creation test');
            // Create a test entity
            const testEntity = {
                id: 'rollback_entity_create',
                type: 'file',
                path: '/rollback/rollback-create.ts',
                hash: 'rollback123',
                language: 'typescript',
                size: 50,
                lines: 3,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            await kgService.createEntity(testEntity);
            // Verify entity exists
            const existingEntity = await kgService.getEntity(testEntity.id);
            expect(existingEntity).toBeDefined();
            // Rollback
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackEntities).toBe(1);
            expect(result.errors).toEqual([]);
            // Verify entity was removed
            const rolledBackEntity = await kgService.getEntity(testEntity.id);
            expect(rolledBackEntity).toBeNull();
        });
        it('should rollback entity updates', async () => {
            // Create initial entity
            const testEntity = {
                id: 'rollback_entity_update',
                type: 'file',
                path: '/rollback/rollback-update.ts',
                hash: 'original123',
                language: 'typescript',
                size: 50,
                lines: 1,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            await kgService.createEntity(testEntity);
            // Create rollback point
            const rollbackId = await rollbackCapabilities.createRollbackPoint('entity_update_rollback', 'Entity update test');
            // Update the entity
            const updatedEntity = {
                ...testEntity,
                hash: 'updated456',
                size: 60
            };
            await kgService.updateEntity(updatedEntity.id, updatedEntity);
            // Verify update
            const currentEntity = await kgService.getEntity(testEntity.id);
            expect(currentEntity.hash).toBe('updated456');
            // Rollback
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackEntities).toBe(1);
            // Verify rollback restored original state
            const rolledBackEntity = await kgService.getEntity(testEntity.id);
            expect(rolledBackEntity.hash).toBe('original123');
            expect(rolledBackEntity.size).toBe(50);
        });
        it('should rollback relationship creation', async () => {
            // Create test entities
            const entity1 = {
                id: 'rollback_rel_entity1',
                type: 'file',
                path: '/rollback/entity1.ts',
                hash: 'entity1123',
                language: 'typescript',
                size: 100,
                lines: 1,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            const entity2 = {
                id: 'rollback_rel_entity2',
                type: 'file',
                path: '/rollback/entity2.ts',
                hash: 'entity2123',
                language: 'typescript',
                size: 100,
                lines: 1,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            await kgService.createEntity(entity1);
            await kgService.createEntity(entity2);
            // Create rollback point
            const rollbackId = await rollbackCapabilities.createRollbackPoint('relationship_create_rollback', 'Relationship creation test');
            // Create relationship
            const testRelationship = {
                id: 'rollback_relationship_create',
                type: RelationshipType.IMPORTS,
                fromEntityId: entity2.id,
                toEntityId: entity1.id,
                created: new Date(),
                lastModified: new Date(),
                version: 1,
                metadata: {
                    importType: 'named',
                    importedNames: ['test']
                }
            };
            await kgService.createRelationship(testRelationship);
            // Verify relationship exists
            const existingRelationships = await kgService.getRelationships({
                fromEntityId: testRelationship.fromEntityId,
                toEntityId: testRelationship.toEntityId,
                type: [testRelationship.type]
            });
            expect(existingRelationships.length).toBeGreaterThan(0);
            // Rollback
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackRelationships).toBe(1);
            // Verify relationship was removed
            const rolledBackRelationships = await kgService.getRelationships({
                fromEntityId: testRelationship.fromEntityId,
                toEntityId: testRelationship.toEntityId,
                type: [testRelationship.type]
            });
            expect(rolledBackRelationships.length).toBe(0);
        });
        it('should handle partial rollback failures gracefully', async () => {
            // Create rollback point
            const rollbackId = await rollbackCapabilities.createRollbackPoint('partial_failure_test', 'Partial failure test');
            // Create an entity
            const testEntity = {
                id: 'rollback_partial_failure',
                type: 'file',
                path: '/rollback/partial-failure.ts',
                hash: 'partial123',
                language: 'typescript',
                size: 100,
                lines: 1,
                lastModified: new Date(),
                created: new Date(),
                extension: '.ts',
                isTest: false,
                isConfig: false,
                dependencies: []
            };
            await kgService.createEntity(testEntity);
            // Manually corrupt the rollback point to simulate partial failure
            const rollbackPoint = rollbackCapabilities.rollbackPoints.get(rollbackId);
            rollbackPoint.entities.push({
                id: 'non_existent_entity',
                action: 'delete',
                previousState: { id: 'non_existent', type: 'file' }
            });
            // Attempt rollback
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(false);
            expect(result.partialSuccess).toBe(true);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.rolledBackEntities).toBeGreaterThanOrEqual(0);
        });
        it('should fail gracefully when rollback point does not exist', async () => {
            const result = await rollbackCapabilities.rollbackToPoint('non_existent_rollback_id');
            expect(result.success).toBe(false);
            expect(result.rolledBackEntities).toBe(0);
            expect(result.rolledBackRelationships).toBe(0);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0].error).toContain('not found');
        });
    });
    describe('Rollback Point Cleanup', () => {
        it('should clean up old rollback points', async () => {
            // Create multiple rollback points
            const rollbackIds = [];
            for (let i = 0; i < 5; i++) {
                const id = await rollbackCapabilities.createRollbackPoint(`cleanup_test_${i}`, `Cleanup test ${i}`);
                rollbackIds.push(id);
            }
            expect(rollbackCapabilities.rollbackPoints.size).toBe(5);
            // Clean up points older than 0 milliseconds (should clean all)
            const cleanedCount = await rollbackCapabilities.cleanupOldRollbackPoints(0);
            expect(cleanedCount).toBe(5);
            expect(rollbackCapabilities.rollbackPoints.size).toBe(0);
        });
        it('should respect age threshold when cleaning up', async () => {
            // Create rollback points with different ages
            const oldRollbackId = await rollbackCapabilities.createRollbackPoint('old_cleanup', 'Old point');
            // Manually set old timestamp
            const oldPoint = rollbackCapabilities.rollbackPoints.get(oldRollbackId);
            oldPoint.timestamp = new Date(Date.now() - 10000); // 10 seconds ago
            const newRollbackId = await rollbackCapabilities.createRollbackPoint('new_cleanup', 'New point');
            // Clean up points older than 5 seconds
            const cleanedCount = await rollbackCapabilities.cleanupOldRollbackPoints(5000);
            expect(cleanedCount).toBe(1);
            expect(rollbackCapabilities.rollbackPoints.has(oldRollbackId)).toBe(false);
            expect(rollbackCapabilities.rollbackPoints.has(newRollbackId)).toBe(true);
        });
    });
    describe('Concurrency and Thread Safety', () => {
        it('should handle concurrent rollback operations', async () => {
            // Create multiple rollback points
            const rollbackIds = [];
            for (let i = 0; i < 3; i++) {
                const id = await rollbackCapabilities.createRollbackPoint(`concurrent_test_${i}`, `Concurrent test ${i}`);
                rollbackIds.push(id);
            }
            // Execute rollbacks concurrently
            const rollbackPromises = rollbackIds.map(id => rollbackCapabilities.rollbackToPoint(id));
            const results = await Promise.all(rollbackPromises);
            // All should succeed
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
        it('should handle concurrent creation and cleanup', async () => {
            // Create points and clean up concurrently
            const createPromises = Array(5).fill(null).map((_, i) => rollbackCapabilities.createRollbackPoint(`concurrent_create_${i}`, `Create test ${i}`));
            const createResults = await Promise.all(createPromises);
            expect(createResults.length).toBe(5);
            // Clean up all
            const cleanupResult = await rollbackCapabilities.cleanupOldRollbackPoints(0);
            expect(cleanupResult).toBe(5);
        });
    });
    describe('Error Handling', () => {
        it('should handle database errors during rollback point creation', async () => {
            // Create a new rollback capabilities instance with mocked database service
            const mockDbService = {
                ...dbService,
                falkordbQuery: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            };
            // Create a mock knowledge graph service that uses the mocked database
            const mockKgService = {
                ...kgService,
                db: mockDbService,
                listEntities: jest.fn().mockRejectedValue(new Error('Database connection failed')),
                listRelationships: jest.fn().mockRejectedValue(new Error('Database connection failed'))
            };
            const mockRollbackCapabilities = new RollbackCapabilities(mockKgService, mockDbService);
            await expect(mockRollbackCapabilities.createRollbackPoint('error_test', 'Error test'))
                .rejects.toThrow('Database connection failed');
        });
        it('should handle invalid rollback point data', async () => {
            // Manually add invalid rollback point
            const invalidId = 'invalid_rollback_point';
            rollbackCapabilities.rollbackPoints.set(invalidId, {
                id: invalidId,
                operationId: 'test',
                timestamp: new Date(),
                entities: null, // Invalid: should be array
                relationships: undefined, // Invalid: should be array
                description: 'Invalid point'
            });
            const result = await rollbackCapabilities.rollbackToPoint(invalidId);
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should handle empty rollback points gracefully', async () => {
            const rollbackId = await rollbackCapabilities.createRollbackPoint('empty_test', 'Empty test');
            // Manually clear the state
            const point = rollbackCapabilities.rollbackPoints.get(rollbackId);
            point.entities = [];
            point.relationships = [];
            const result = await rollbackCapabilities.rollbackToPoint(rollbackId);
            expect(result.success).toBe(true);
            expect(result.rolledBackEntities).toBe(0);
            expect(result.rolledBackRelationships).toBe(0);
        });
    });
});
//# sourceMappingURL=rollback-capabilities.test.js.map