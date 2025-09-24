import { describe, it, expect, beforeEach } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('Knowledge Graph Operations E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;

  beforeEach(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;

    // Set up authentication
    const keyResponse = await client.post('/api/auth/api-keys', {
      name: 'Graph Test Key',
      permissions: ['read', 'write'],
    });
    client.setApiKey(keyResponse.body.apiKey);
  });

  describe('Code Parsing and Indexing', () => {
    it('should parse and index TypeScript files', async () => {
      const typeScriptFile = mockData.generateCodeFile({
        path: 'src/services/UserService.ts',
        content: `
import { Repository } from './Repository';
import { User, CreateUserData } from '../types/User';

export class UserService {
  constructor(private repository: Repository<User>) {}

  async createUser(data: CreateUserData): Promise<User> {
    const user = await this.repository.save({
      ...data,
      id: generateId(),
      createdAt: new Date(),
    });
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }

  private generateId(): string {
    return Math.random().toString(36);
  }
}

function generateId(): string {
  return Date.now().toString();
}
`,
        language: 'typescript',
      });

      const parseResponse = await client.post('/api/graph/parse', {
        filePath: typeScriptFile.path,
        content: typeScriptFile.content,
        language: typeScriptFile.language,
      });

      assertions.assertSuccessResponse(parseResponse);
      expect(parseResponse.body).toMatchObject({
        entitiesExtracted: expect.any(Number),
        relationshipsCreated: expect.any(Number),
        processingTimeMs: expect.any(Number),
      });

      // Verify entities were created
      const entitiesResponse = await client.get('/api/graph/entities', {
        filePath: typeScriptFile.path,
      });

      assertions.assertSuccessResponse(entitiesResponse);
      expect(entitiesResponse.body.items.length).toBeGreaterThan(0);

      // Should extract class, methods, functions, and imports
      const entityTypes = entitiesResponse.body.items.map((e: any) => e.type);
      expect(entityTypes).toContain('class');
      expect(entityTypes).toContain('method');
      expect(entityTypes).toContain('function');
      expect(entityTypes).toContain('import');

      // Verify specific entities
      const userServiceClass = entitiesResponse.body.items.find(
        (e: any) => e.name === 'UserService' && e.type === 'class'
      );
      expect(userServiceClass).toBeDefined();
      assertions.assertValidEntity(userServiceClass);
    });

    it('should handle complex dependency relationships', async () => {
      // Create multiple related files
      const files = [
        {
          path: 'src/types/User.ts',
          content: `
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
}
`,
          language: 'typescript',
        },
        {
          path: 'src/repositories/Repository.ts',
          content: `
export abstract class Repository<T> {
  abstract save(entity: T): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
}
`,
          language: 'typescript',
        },
        {
          path: 'src/services/UserService.ts',
          content: `
import { Repository } from '../repositories/Repository';
import { User, CreateUserData } from '../types/User';

export class UserService {
  constructor(private repository: Repository<User>) {}

  async createUser(data: CreateUserData): Promise<User> {
    return this.repository.save({
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
    });
  }

  private generateId(): string {
    return Math.random().toString(36);
  }
}
`,
          language: 'typescript',
        },
      ];

      // Parse all files
      for (const file of files) {
        const parseResponse = await client.post('/api/graph/parse', {
          filePath: file.path,
          content: file.content,
          language: file.language,
        });
        assertions.assertSuccessResponse(parseResponse);
      }

      // Wait for relationship resolution
      await mockData.delay(2000);

      // Verify import relationships were created
      const relationshipsResponse = await client.get('/api/graph/relationships', {
        type: 'IMPORTS',
      });

      assertions.assertSuccessResponse(relationshipsResponse);
      expect(relationshipsResponse.body.items.length).toBeGreaterThan(0);

      // Verify specific import relationships
      const userServiceImports = relationshipsResponse.body.items.filter(
        (r: any) => r.fromEntity?.name === 'UserService'
      );

      expect(userServiceImports.length).toBeGreaterThanOrEqual(2); // Should import Repository and User types
    });

    it('should handle incremental parsing and updates', async () => {
      const originalFile = mockData.generateCodeFile({
        path: 'src/utils/helper.ts',
        content: `
export function originalFunction(value: string): string {
  return value.toUpperCase();
}
`,
        language: 'typescript',
      });

      // Initial parse
      const initialParseResponse = await client.post('/api/graph/parse', {
        filePath: originalFile.path,
        content: originalFile.content,
        language: originalFile.language,
      });

      assertions.assertSuccessResponse(initialParseResponse);

      // Get initial entities
      const initialEntitiesResponse = await client.get('/api/graph/entities', {
        filePath: originalFile.path,
      });

      const initialEntityCount = initialEntitiesResponse.body.items.length;
      expect(initialEntityCount).toBeGreaterThan(0);

      // Update file with additional content
      const updatedContent = originalFile.content + `
export function newFunction(input: number): number {
  return input * 2;
}

export class HelperClass {
  process(data: any): any {
    return originalFunction(String(data));
  }
}
`;

      const updateParseResponse = await client.post('/api/graph/parse', {
        filePath: originalFile.path,
        content: updatedContent,
        language: originalFile.language,
        isUpdate: true,
      });

      assertions.assertSuccessResponse(updateParseResponse);

      // Get updated entities
      const updatedEntitiesResponse = await client.get('/api/graph/entities', {
        filePath: originalFile.path,
      });

      const updatedEntityCount = updatedEntitiesResponse.body.items.length;
      expect(updatedEntityCount).toBeGreaterThan(initialEntityCount);

      // Verify new entities were added
      const entityNames = updatedEntitiesResponse.body.items.map((e: any) => e.name);
      expect(entityNames).toContain('newFunction');
      expect(entityNames).toContain('HelperClass');
      expect(entityNames).toContain('originalFunction'); // Original should still exist
    });
  });

  describe('Directory Processing', () => {
    it('should process entire directory structures', async () => {
      // Simulate directory processing by parsing multiple files
      const directoryFiles = [
        {
          path: 'src/components/Button.tsx',
          content: `
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
`,
        },
        {
          path: 'src/components/Input.tsx',
          content: `
import React from 'react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ value, onChange, placeholder }) => {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};
`,
        },
        {
          path: 'src/components/Form.tsx',
          content: `
import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export const Form: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    console.log({ name, email });
  };

  return (
    <form>
      <Input value={name} onChange={setName} placeholder="Name" />
      <Input value={email} onChange={setEmail} placeholder="Email" />
      <Button onClick={handleSubmit}>Submit</Button>
    </form>
  );
};
`,
        },
      ];

      // Start directory processing
      const processResponse = await client.post('/api/graph/process-directory', {
        directoryPath: 'src/components',
        files: directoryFiles.map(f => ({
          path: f.path,
          content: f.content,
          language: 'typescript',
        })),
        options: {
          includeTests: false,
          followImports: true,
          extractRelationships: true,
        },
      });

      assertions.assertSuccessResponse(processResponse);
      expect(processResponse.body).toMatchObject({
        filesProcessed: 3,
        entitiesExtracted: expect.any(Number),
        relationshipsCreated: expect.any(Number),
        processingTimeMs: expect.any(Number),
      });

      // Verify cross-file relationships were created
      const relationshipsResponse = await client.get('/api/graph/relationships', {
        type: 'IMPORTS',
        scope: 'src/components',
      });

      assertions.assertSuccessResponse(relationshipsResponse);

      // Form should import Button and Input
      const formImports = relationshipsResponse.body.items.filter(
        (r: any) => r.fromEntity?.name === 'Form'
      );

      expect(formImports.length).toBeGreaterThanOrEqual(2);
      const importedNames = formImports.map((r: any) => r.toEntity?.name);
      expect(importedNames).toContain('Button');
      expect(importedNames).toContain('Input');
    });

    it('should handle high-throughput ingestion pipeline', async () => {
      // Generate large dataset
      const largeDataset = mockData.generateMultipleCodeFiles(30);

      // Start high-throughput processing
      const startTime = Date.now();
      const pipelineResponse = await client.post('/api/graph/ingestion/start', {
        files: largeDataset.map(f => ({
          path: f.path,
          content: f.content,
          language: f.language,
        })),
        options: {
          batchSize: 10,
          maxWorkers: 4,
          enableTelemetry: true,
        },
      });

      assertions.assertSuccessResponse(pipelineResponse, 202); // Accepted for processing
      const processingId = pipelineResponse.body.processingId;

      // Monitor processing progress
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max

      while (!processingComplete && attempts < maxAttempts) {
        const statusResponse = await client.get(`/api/graph/ingestion/status/${processingId}`);
        assertions.assertSuccessResponse(statusResponse);

        const status = statusResponse.body.status;
        if (status === 'completed') {
          processingComplete = true;
        } else if (status === 'failed') {
          throw new Error(`Processing failed: ${statusResponse.body.error}`);
        }

        if (!processingComplete) {
          await mockData.delay(1000);
          attempts++;
        }
      }

      expect(processingComplete).toBe(true);

      const totalTime = Date.now() - startTime;
      const results = await client.get(`/api/graph/ingestion/results/${processingId}`);

      assertions.assertSuccessResponse(results);
      expect(results.body).toMatchObject({
        filesProcessed: 30,
        entitiesExtracted: expect.any(Number),
        relationshipsCreated: expect.any(Number),
        throughputLOCPerMinute: expect.any(Number),
      });

      // Performance assertion
      assertions.assertBatchProcessingPerformance(30, totalTime, 0.5); // At least 0.5 files per second
    });
  });

  describe('Graph Querying and Analysis', () => {
    it('should perform complex graph traversals', async () => {
      // Create a complex dependency graph
      const entities = await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ServiceA', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ServiceB', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ServiceC', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'UtilA', type: 'function' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'UtilB', type: 'function' })),
      ]);

      // Create complex relationships: A -> B -> C, A -> UtilA, B -> UtilB, C -> UtilA
      const relationships = [
        { fromId: entities[0].body.id, toId: entities[1].body.id, type: 'DEPENDS_ON' },
        { fromId: entities[1].body.id, toId: entities[2].body.id, type: 'DEPENDS_ON' },
        { fromId: entities[0].body.id, toId: entities[3].body.id, type: 'USES' },
        { fromId: entities[1].body.id, toId: entities[4].body.id, type: 'USES' },
        { fromId: entities[2].body.id, toId: entities[3].body.id, type: 'USES' },
      ];

      for (const rel of relationships) {
        await client.post('/api/graph/relationships', rel);
      }

      // Perform graph traversal query
      const traversalResponse = await client.post('/api/graph/traverse', {
        startNodeId: entities[0].body.id, // ServiceA
        direction: 'outgoing',
        maxDepth: 3,
        relationshipTypes: ['DEPENDS_ON', 'USES'],
        includeStartNode: true,
      });

      assertions.assertSuccessResponse(traversalResponse);
      expect(traversalResponse.body).toMatchObject({
        nodes: expect.any(Array),
        edges: expect.any(Array),
        paths: expect.any(Array),
      });

      // Should include all connected nodes
      const nodeIds = traversalResponse.body.nodes.map((n: any) => n.id);
      expect(nodeIds).toContain(entities[0].body.id); // ServiceA
      expect(nodeIds).toContain(entities[1].body.id); // ServiceB
      expect(nodeIds).toContain(entities[2].body.id); // ServiceC
      expect(nodeIds).toContain(entities[3].body.id); // UtilA
      expect(nodeIds).toContain(entities[4].body.id); // UtilB
    });

    it('should identify circular dependencies', async () => {
      // Create circular dependency: A -> B -> C -> A
      const entities = await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ModuleA', type: 'module' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ModuleB', type: 'module' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'ModuleC', type: 'module' })),
      ]);

      // Create circular relationships
      await Promise.all([
        client.post('/api/graph/relationships', {
          fromId: entities[0].body.id,
          toId: entities[1].body.id,
          type: 'DEPENDS_ON',
        }),
        client.post('/api/graph/relationships', {
          fromId: entities[1].body.id,
          toId: entities[2].body.id,
          type: 'DEPENDS_ON',
        }),
        client.post('/api/graph/relationships', {
          fromId: entities[2].body.id,
          toId: entities[0].body.id,
          type: 'DEPENDS_ON',
        }),
      ]);

      // Detect circular dependencies
      const circularResponse = await client.get('/api/graph/analysis/circular-dependencies', {
        relationshipType: 'DEPENDS_ON',
        maxDepth: 10,
      });

      assertions.assertSuccessResponse(circularResponse);
      expect(circularResponse.body.cycles.length).toBeGreaterThan(0);

      const cycle = circularResponse.body.cycles[0];
      expect(cycle.nodes.length).toBe(3);
      expect(cycle.severity).toBe('high'); // 3-node cycles are typically high severity

      // Verify the cycle includes all three modules
      const cycleNodeIds = cycle.nodes.map((n: any) => n.id);
      expect(cycleNodeIds).toContain(entities[0].body.id);
      expect(cycleNodeIds).toContain(entities[1].body.id);
      expect(cycleNodeIds).toContain(entities[2].body.id);
    });

    it('should perform community detection and clustering', async () => {
      // Create multiple clusters of related entities
      const clusterA = await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'AuthService', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'UserService', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'SessionManager', type: 'class' })),
      ]);

      const clusterB = await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'PaymentService', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'BillingService', type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'InvoiceGenerator', type: 'class' })),
      ]);

      // Create tight relationships within clusters
      const clusterARelationships = [
        { fromId: clusterA[0].body.id, toId: clusterA[1].body.id, type: 'USES' },
        { fromId: clusterA[1].body.id, toId: clusterA[2].body.id, type: 'USES' },
        { fromId: clusterA[0].body.id, toId: clusterA[2].body.id, type: 'MANAGES' },
      ];

      const clusterBRelationships = [
        { fromId: clusterB[0].body.id, toId: clusterB[1].body.id, type: 'DEPENDS_ON' },
        { fromId: clusterB[1].body.id, toId: clusterB[2].body.id, type: 'USES' },
        { fromId: clusterB[0].body.id, toId: clusterB[2].body.id, type: 'TRIGGERS' },
      ];

      // Add weak relationship between clusters
      const crossClusterRelationship = {
        fromId: clusterA[1].body.id, // UserService
        toId: clusterB[0].body.id,   // PaymentService
        type: 'CALLS',
      };

      await Promise.all([
        ...clusterARelationships.map(rel => client.post('/api/graph/relationships', rel)),
        ...clusterBRelationships.map(rel => client.post('/api/graph/relationships', rel)),
        client.post('/api/graph/relationships', crossClusterRelationship),
      ]);

      // Perform community detection
      const clusteringResponse = await client.post('/api/graph/analysis/clustering', {
        algorithm: 'modularity',
        minClusterSize: 2,
        includeMetrics: true,
      });

      assertions.assertSuccessResponse(clusteringResponse);
      expect(clusteringResponse.body.clusters.length).toBeGreaterThanOrEqual(2);

      // Verify clusters were properly identified
      const clusters = clusteringResponse.body.clusters;
      for (const cluster of clusters) {
        expect(cluster.nodes.length).toBeGreaterThanOrEqual(2);
        expect(cluster.modularity).toBeGreaterThan(0);
      }
    });
  });

  describe('Graph Maintenance and Optimization', () => {
    it('should handle graph cleanup and garbage collection', async () => {
      // Create entities and relationships
      const entities = await Promise.all(
        Array.from({ length: 10 }, () =>
          client.post('/api/graph/entities', mockData.generateEntity())
        )
      );

      // Create some relationships
      for (let i = 0; i < entities.length - 1; i++) {
        await client.post('/api/graph/relationships', {
          fromId: entities[i].body.id,
          toId: entities[i + 1].body.id,
          type: 'CONNECTS_TO',
        });
      }

      // Delete some entities
      const toDelete = entities.slice(0, 3);
      for (const entity of toDelete) {
        await client.delete(`/api/graph/entities/${entity.body.id}`);
      }

      // Run cleanup
      const cleanupResponse = await client.post('/api/graph/maintenance/cleanup', {
        removeOrphanedRelationships: true,
        removeUnreferencedNodes: true,
        compactStorage: true,
      });

      assertions.assertSuccessResponse(cleanupResponse);
      expect(cleanupResponse.body).toMatchObject({
        orphanedRelationshipsRemoved: expect.any(Number),
        unreferencedNodesRemoved: expect.any(Number),
        storageCompacted: true,
      });

      // Verify cleanup was effective
      const remainingEntitiesResponse = await client.get('/api/graph/entities');
      const remainingIds = remainingEntitiesResponse.body.items.map((e: any) => e.id);

      for (const deletedEntity of toDelete) {
        expect(remainingIds).not.toContain(deletedEntity.body.id);
      }
    });

    it('should perform graph health checks and validation', async () => {
      // Create some potentially problematic data
      const entity = await client.post('/api/graph/entities', mockData.generateEntity());

      // Create self-referencing relationship (potential issue)
      await client.post('/api/graph/relationships', {
        fromId: entity.body.id,
        toId: entity.body.id,
        type: 'SELF_REFERENCE',
      });

      // Run health check
      const healthResponse = await client.get('/api/graph/health', {
        checks: ['integrity', 'performance', 'consistency'],
        includeDetails: true,
      });

      assertions.assertSuccessResponse(healthResponse);
      expect(healthResponse.body).toMatchObject({
        overall: expect.stringMatching(/healthy|warning|unhealthy/),
        checks: expect.any(Object),
        metrics: expect.any(Object),
      });

      // Should include integrity check results
      expect(healthResponse.body.checks.integrity).toBeDefined();
      expect(healthResponse.body.checks.performance).toBeDefined();
      expect(healthResponse.body.checks.consistency).toBeDefined();
    });

    it('should handle graph backup and restore', async () => {
      // Create test data
      const entities = await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'BackupTest1' })),
        client.post('/api/graph/entities', mockData.generateEntity({ name: 'BackupTest2' })),
      ]);

      await client.post('/api/graph/relationships', {
        fromId: entities[0].body.id,
        toId: entities[1].body.id,
        type: 'TEST_RELATIONSHIP',
      });

      // Create backup
      const backupResponse = await client.post('/api/graph/backup', {
        includeMetadata: true,
        compressionLevel: 'medium',
      });

      assertions.assertSuccessResponse(backupResponse, 201);
      const backupId = backupResponse.body.backupId;
      expect(backupId).toBeDefined();

      // Clear graph
      await globalThis.testEnvironment.resetDatabases();

      // Verify graph is empty
      const emptyResponse = await client.get('/api/graph/entities');
      expect(emptyResponse.body.items).toHaveLength(0);

      // Restore from backup
      const restoreResponse = await client.post('/api/graph/restore', {
        backupId,
        overwriteExisting: true,
      });

      assertions.assertSuccessResponse(restoreResponse);

      // Verify data was restored
      const restoredResponse = await client.get('/api/graph/entities');
      expect(restoredResponse.body.items.length).toBeGreaterThanOrEqual(2);

      const restoredNames = restoredResponse.body.items.map((e: any) => e.name);
      expect(restoredNames).toContain('BackupTest1');
      expect(restoredNames).toContain('BackupTest2');
    });
  });
});