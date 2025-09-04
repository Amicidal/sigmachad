/**
 * Integration tests for KnowledgeGraphService
 * Tests graph operations, vector embeddings, and entity relationships across databases
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService';
import { DatabaseService } from '../../../src/services/DatabaseService';
import { setupTestDatabase, cleanupTestDatabase, clearTestData, TEST_DATABASE_CONFIG } from '../../test-utils/database-helpers';
import { CodebaseEntity, RelationshipType, GraphSearchRequest, GraphRelationship } from '../../../src/models';

describe('KnowledgeGraphService Integration', () => {
  let kgService: KnowledgeGraphService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = await setupTestDatabase();
    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();
  }, 30000);

  afterAll(async () => {
    await cleanupTestDatabase(dbService);
  });

  beforeEach(async () => {
    await clearTestData(dbService);
  });

  describe('Entity CRUD Operations', () => {
    it('should create and retrieve entities successfully', async () => {
      const testEntity: CodebaseEntity = {
        id: 'test-entity-1',
        path: 'src/test.ts',
        hash: 'abc123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file',
        size: 1024,
        lines: 50,
        isTest: false,
        isConfig: false
      };

      await kgService.createEntity(testEntity);
      const retrieved = await kgService.getEntity(testEntity.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testEntity.id);
      expect(retrieved?.path).toBe(testEntity.path);
      expect(retrieved?.language).toBe(testEntity.language);
      expect(retrieved?.type).toBe('file');
    });

    it('should create entities with different types', async () => {
      const entities: CodebaseEntity[] = [
        {
          id: 'function-entity',
          path: 'src/utils/helper.ts',
          hash: 'func123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'symbol',
          kind: 'function',
          signature: 'function helper(): void',
          startLine: 10,
          endLine: 15
        },
        {
          id: 'class-entity',
          path: 'src/models/User.ts',
          hash: 'class123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'symbol',
          kind: 'class',
          signature: 'class User',
          startLine: 1,
          endLine: 50
        }
      ];

      for (const entity of entities) {
        await kgService.createEntity(entity);
        const retrieved = await kgService.getEntity(entity.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.type).toBe(entity.type);
      }
    });

    it('should update entities correctly', async () => {
      const originalEntity: CodebaseEntity = {
        id: 'update-test-entity',
        path: 'src/original.ts',
        hash: 'orig123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file',
        size: 512,
        lines: 25
      };

      await kgService.createEntity(originalEntity);

      // Update the entity
      const updates: Partial<CodebaseEntity> = {
        size: 2048,
        lines: 100,
        lastModified: new Date()
      };

      await kgService.createOrUpdateEntity({ ...originalEntity, ...updates });

      const updated = await kgService.getEntity(originalEntity.id);
      expect(updated?.size).toBe(2048);
      expect(updated?.lines).toBe(100);
    });

    it('should delete entities and their relationships', async () => {
      const entity1: CodebaseEntity = {
        id: 'delete-test-1',
        path: 'src/delete1.ts',
        hash: 'del123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file'
      };

      const entity2: CodebaseEntity = {
        id: 'delete-test-2',
        path: 'src/delete2.ts',
        hash: 'del456',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file'
      };

      await kgService.createEntity(entity1);
      await kgService.createEntity(entity2);

      // Create relationship
      const relationship: GraphRelationship = {
        id: 'delete-rel-1',
        fromEntityId: entity1.id,
        toEntityId: entity2.id,
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      };

      await kgService.createRelationship(relationship);

      // Delete entity and check relationships are also deleted
      await kgService.deleteEntity(entity1.id);

      const deletedEntity = await kgService.getEntity(entity1.id);
      expect(deletedEntity).toBeNull();

      const remainingRelationships = await kgService.getRelationships({
        fromEntityId: entity1.id
      });
      expect(remainingRelationships.length).toBe(0);
    });
  });

  describe('Relationship Operations', () => {
    let testEntities: CodebaseEntity[];

    beforeEach(async () => {
      testEntities = [
        {
          id: 'rel-entity-1',
          path: 'src/main.ts',
          hash: 'main123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'rel-entity-2',
          path: 'src/utils.ts',
          hash: 'utils123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        }
      ];

      for (const entity of testEntities) {
        await kgService.createEntity(entity);
      }
    });

    it('should create and query relationships', async () => {
      const relationship: GraphRelationship = {
        id: 'test-relationship-1',
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.IMPORTS,
        created: new Date(),
        lastModified: new Date(),
        version: 1,
        metadata: { importType: 'named' }
      };

      await kgService.createRelationship(relationship);

      const retrievedRelationships = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
        type: RelationshipType.IMPORTS
      });

      expect(retrievedRelationships.length).toBe(1);
      expect(retrievedRelationships[0].type).toBe(RelationshipType.IMPORTS);
      expect(retrievedRelationships[0].fromEntityId).toBe(testEntities[0].id);
      expect(retrievedRelationships[0].toEntityId).toBe(testEntities[1].id);
    });

    it('should handle multiple relationship types', async () => {
      const relationships: GraphRelationship[] = [
        {
          id: 'multi-rel-1',
          fromEntityId: testEntities[0].id,
          toEntityId: testEntities[1].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        },
        {
          id: 'multi-rel-2',
          fromEntityId: testEntities[0].id,
          toEntityId: testEntities[1].id,
          type: RelationshipType.REFERENCES,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        }
      ];

      for (const rel of relationships) {
        await kgService.createRelationship(rel);
      }

      const allRelationships = await kgService.getRelationships({
        fromEntityId: testEntities[0].id
      });

      expect(allRelationships.length).toBe(2);
      const types = allRelationships.map(r => r.type);
      expect(types).toContain(RelationshipType.CALLS);
      expect(types).toContain(RelationshipType.REFERENCES);
    });

    it('should query relationships by time range', async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      const relationship: GraphRelationship = {
        id: 'time-rel-1',
        fromEntityId: testEntities[0].id,
        toEntityId: testEntities[1].id,
        type: RelationshipType.DEPENDS_ON,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      };

      await kgService.createRelationship(relationship);

      const timeRangeResults = await kgService.getRelationships({
        fromEntityId: testEntities[0].id,
        since: pastDate,
        until: futureDate
      });

      expect(timeRangeResults.length).toBe(1);
      expect(timeRangeResults[0].id).toBe(relationship.id);
    });
  });

  describe('Search Operations', () => {
    let searchEntities: CodebaseEntity[];

    beforeEach(async () => {
      searchEntities = [
        {
          id: 'search-entity-1',
          path: 'src/components/Button.ts',
          hash: 'button123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file',
          content: 'export const Button = () => <button>Click me</button>;'
        },
        {
          id: 'search-entity-2',
          path: 'src/utils/helpers.ts',
          hash: 'helpers123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file',
          content: 'export const formatDate = (date: Date) => date.toISOString();'
        },
        {
          id: 'search-entity-3',
          path: 'src/models/User.ts',
          hash: 'user123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file',
          content: 'export interface User { id: string; name: string; email: string; }'
        }
      ];

      for (const entity of searchEntities) {
        await kgService.createEntity(entity);
      }
    });

    it('should perform structural search by entity type', async () => {
      const searchRequest: GraphSearchRequest = {
        query: '',
        searchType: 'structural',
        entityTypes: ['file']
      };

      const results = await kgService.search(searchRequest);
      expect(results.length).toBeGreaterThanOrEqual(3);
      results.forEach(result => {
        expect(result.type).toBe('file');
      });
    });

    it('should perform structural search by language', async () => {
      const searchRequest: GraphSearchRequest = {
        query: '',
        searchType: 'structural',
        entityTypes: ['file'],
        filters: {
          language: 'typescript'
        }
      };

      const results = await kgService.search(searchRequest);
      expect(results.length).toBeGreaterThanOrEqual(3);
      results.forEach(result => {
        expect(result.language).toBe('typescript');
      });
    });

    it('should perform structural search by path pattern', async () => {
      const searchRequest: GraphSearchRequest = {
        query: '',
        searchType: 'structural',
        entityTypes: ['file'],
        filters: {
          path: 'components'
        }
      };

      const results = await kgService.search(searchRequest);
      expect(results.some(r => r.path?.includes('components'))).toBe(true);
    });

    it('should find entities by type', async () => {
      const fileEntities = await kgService.findEntitiesByType('file');
      expect(fileEntities.length).toBeGreaterThanOrEqual(3);
      fileEntities.forEach(entity => {
        expect(entity.type).toBe('file');
      });
    });
  });

  describe('Path Finding and Traversal', () => {
    let traversalEntities: CodebaseEntity[];

    beforeEach(async () => {
      traversalEntities = [
        {
          id: 'traversal-1',
          path: 'src/index.ts',
          hash: 'idx123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'traversal-2',
          path: 'src/components/App.ts',
          hash: 'app123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'traversal-3',
          path: 'src/utils/api.ts',
          hash: 'api123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        }
      ];

      for (const entity of traversalEntities) {
        await kgService.createEntity(entity);
      }

      // Create relationships to form a graph
      const relationships: GraphRelationship[] = [
        {
          id: 'traversal-rel-1',
          fromEntityId: traversalEntities[0].id,
          toEntityId: traversalEntities[1].id,
          type: RelationshipType.IMPORTS,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        },
        {
          id: 'traversal-rel-2',
          fromEntityId: traversalEntities[1].id,
          toEntityId: traversalEntities[2].id,
          type: RelationshipType.CALLS,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        }
      ];

      for (const rel of relationships) {
        await kgService.createRelationship(rel);
      }
    });

    it('should find paths between entities', async () => {
      const paths = await kgService.findPaths({
        startEntityId: traversalEntities[0].id,
        endEntityId: traversalEntities[2].id,
        maxDepth: 3
      });

      expect(paths.length).toBeGreaterThan(0);
      // Paths should contain the connected entities
      expect(paths.some(path => path.includes(traversalEntities[0].id))).toBe(true);
    });

    it('should traverse graph from starting entity', async () => {
      const connectedEntities = await kgService.traverseGraph({
        startEntityId: traversalEntities[0].id,
        maxDepth: 2
      });

      expect(connectedEntities.length).toBeGreaterThan(0);
      const connectedIds = connectedEntities.map(e => e.id);
      expect(connectedIds).toContain(traversalEntities[1].id);
    });

    it('should traverse graph with specific relationship types', async () => {
      const connectedEntities = await kgService.traverseGraph({
        startEntityId: traversalEntities[0].id,
        relationshipTypes: [RelationshipType.IMPORTS],
        maxDepth: 2
      });

      expect(connectedEntities.length).toBeGreaterThan(0);
      const connectedIds = connectedEntities.map(e => e.id);
      expect(connectedIds).toContain(traversalEntities[1].id);
      // Should not contain traversal-3 since it's connected via CALLS, not IMPORTS
      expect(connectedIds).not.toContain(traversalEntities[2].id);
    });
  });

  describe('Batch Operations and Performance', () => {
    it('should handle batch entity creation efficiently', async () => {
      const batchEntities: CodebaseEntity[] = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-entity-${i}`,
        path: `src/batch/file${i}.ts`,
        hash: `batch${i}23`,
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file',
        content: `export const func${i} = () => console.log('Batch ${i}');`
      }));

      const startTime = Date.now();
      await kgService.createEmbeddingsBatch(batchEntities);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify all entities were created
      for (const entity of batchEntities) {
        const retrieved = await kgService.getEntity(entity.id);
        expect(retrieved).toBeDefined();
      }
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = 5;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const entity: CodebaseEntity = {
          id: `concurrent-entity-${i}`,
          path: `src/concurrent/file${i}.ts`,
          hash: `conc${i}23`,
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        };

        promises.push(kgService.createEntity(entity));
      }

      await Promise.all(promises);

      // Verify all entities were created
      for (let i = 0; i < concurrentOperations; i++) {
        const retrieved = await kgService.getEntity(`concurrent-entity-${i}`);
        expect(retrieved).toBeDefined();
      }
    });
  });

  describe('Entity Dependencies and Analysis', () => {
    let dependencyEntities: CodebaseEntity[];

    beforeEach(async () => {
      dependencyEntities = [
        {
          id: 'dep-main',
          path: 'src/main.ts',
          hash: 'main456',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'dep-helper',
          path: 'src/helpers.ts',
          hash: 'help456',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'dep-util',
          path: 'src/utils.ts',
          hash: 'util456',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        }
      ];

      for (const entity of dependencyEntities) {
        await kgService.createEntity(entity);
      }

      // Create dependency relationships
      const depRelationships: GraphRelationship[] = [
        {
          id: 'dep-rel-1',
          fromEntityId: dependencyEntities[0].id,
          toEntityId: dependencyEntities[1].id,
          type: RelationshipType.DEPENDS_ON,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        },
        {
          id: 'dep-rel-2',
          fromEntityId: dependencyEntities[1].id,
          toEntityId: dependencyEntities[2].id,
          type: RelationshipType.USES,
          created: new Date(),
          lastModified: new Date(),
          version: 1
        }
      ];

      for (const rel of depRelationships) {
        await kgService.createRelationship(rel);
      }
    });

    it('should analyze entity dependencies', async () => {
      const analysis = await kgService.getEntityDependencies(dependencyEntities[0].id);

      expect(analysis).toBeDefined();
      expect(analysis.entityId).toBe(dependencyEntities[0].id);
      expect(analysis.directDependencies.length).toBeGreaterThan(0);
      expect(analysis.reverseDependencies.length).toBe(0); // No reverse deps in this setup
    });

    it('should generate entity examples', async () => {
      const examples = await kgService.getEntityExamples(dependencyEntities[0].id);

      expect(examples).toBeDefined();
      expect(examples.entityId).toBe(dependencyEntities[0].id);
      expect(examples.signature).toBeDefined();
      // Usage examples depend on relationships, may be empty in simple test
      expect(Array.isArray(examples.usageExamples)).toBe(true);
    });
  });

  describe('List and Query Operations', () => {
    beforeEach(async () => {
      const listEntities: CodebaseEntity[] = [
        {
          id: 'list-file-1',
          path: 'src/components/Button.ts',
          hash: 'list123',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'list-file-2',
          path: 'src/utils/helpers.ts',
          hash: 'list456',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        },
        {
          id: 'list-file-3',
          path: 'tests/unit/Button.test.ts',
          hash: 'list789',
          language: 'typescript',
          lastModified: new Date(),
          created: new Date(),
          type: 'file'
        }
      ];

      for (const entity of listEntities) {
        await kgService.createEntity(entity);
      }
    });

    it('should list entities by type', async () => {
      const result = await kgService.listEntities({ type: 'file' });

      expect(result.entities.length).toBeGreaterThanOrEqual(3);
      expect(result.total).toBeGreaterThanOrEqual(3);
      result.entities.forEach(entity => {
        expect(entity.type).toBe('file');
      });
    });

    it('should list entities by language', async () => {
      const result = await kgService.listEntities({ language: 'typescript' });

      expect(result.entities.length).toBeGreaterThanOrEqual(3);
      result.entities.forEach(entity => {
        expect(entity.language).toBe('typescript');
      });
    });

    it('should support pagination', async () => {
      const result = await kgService.listEntities({ limit: 2, offset: 1 });

      expect(result.entities.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('should list relationships with pagination', async () => {
      const result = await kgService.listRelationships({ limit: 5 });

      expect(result.relationships.length).toBeLessThanOrEqual(5);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent entity retrieval gracefully', async () => {
      const result = await kgService.getEntity('non-existent-entity-123');
      expect(result).toBeNull();
    });

    it('should handle invalid relationship creation', async () => {
      const invalidRelationship: GraphRelationship = {
        id: 'invalid-rel',
        fromEntityId: 'non-existent-from',
        toEntityId: 'non-existent-to',
        type: RelationshipType.CALLS,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      };

      // Should not throw, but relationship may not be created if entities don't exist
      await expect(kgService.createRelationship(invalidRelationship)).rejects.toThrow();
    });

    it('should handle search with invalid parameters', async () => {
      const invalidSearch: GraphSearchRequest = {
        query: '',
        searchType: 'structural',
        entityTypes: ['invalid-type' as any]
      };

      const results = await kgService.search(invalidSearch);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle empty search queries', async () => {
      const emptySearch: GraphSearchRequest = {
        query: '',
        searchType: 'structural'
      };

      const results = await kgService.search(emptySearch);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle concurrent entity updates', async () => {
      const entity: CodebaseEntity = {
        id: 'concurrent-update-test',
        path: 'src/concurrent.ts',
        hash: 'concur123',
        language: 'typescript',
        lastModified: new Date(),
        created: new Date(),
        type: 'file',
        size: 100
      };

      await kgService.createEntity(entity);

      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        kgService.createOrUpdateEntity({
          ...entity,
          size: entity.size! + i * 10
        })
      );

      await Promise.allSettled(updatePromises);

      // Entity should exist and have been updated
      const updated = await kgService.getEntity(entity.id);
      expect(updated).toBeDefined();
    });
  });
});
