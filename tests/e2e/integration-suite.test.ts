import { describe, it, expect, beforeAll } from 'vitest';
import { TestClient, MockDataGenerator, TestAssertions } from './utils';
import { sampleProjectFiles, getAllSampleProjectFiles } from './fixtures/sample-project';

describe('Full Integration E2E Suite', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;
  let apiKey: string;

  beforeAll(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;

    // Set up authentication for the entire suite
    const keyResponse = await client.post('/api/auth/api-keys', {
      name: 'Integration Test Key',
      permissions: ['read', 'write', 'admin'],
    });
    assertions.assertSuccessResponse(keyResponse, 201);
    apiKey = keyResponse.body.apiKey;
    client.setApiKey(apiKey);
  });

  it('should complete full workflow: parse → index → search → analyze', async () => {
    // Step 1: Parse sample project files
    const projectFiles = getAllSampleProjectFiles();
    const parseResults = [];

    for (const file of projectFiles) {
      const parseResponse = await client.post('/api/graph/parse', {
        filePath: file.path,
        content: file.content,
        language: 'typescript',
      });

      assertions.assertSuccessResponse(parseResponse);
      parseResults.push(parseResponse.body);
    }

    // Verify all files were parsed
    expect(parseResults.length).toBe(projectFiles.length);
    const totalEntities = parseResults.reduce((sum, result) => sum + result.entitiesExtracted, 0);
    expect(totalEntities).toBeGreaterThan(0);

    // Wait for indexing to complete
    await mockData.delay(3000);

    // Step 2: Verify entities were created
    const entitiesResponse = await client.get('/api/graph/entities');
    assertions.assertSuccessResponse(entitiesResponse);
    expect(entitiesResponse.body.items.length).toBeGreaterThanOrEqual(totalEntities);

    // Step 3: Test search functionality
    const searchResponse = await client.get('/api/graph/search', {
      query: 'UserService',
      type: 'text',
    });

    assertions.assertSuccessResponse(searchResponse);
    assertions.assertValidSearchResults(searchResponse.body, 'UserService');

    const userServiceEntity = searchResponse.body.items.find(
      (item: any) => item.name === 'UserService' && item.type === 'class'
    );
    expect(userServiceEntity).toBeDefined();

    // Step 4: Test semantic search
    const semanticResponse = await client.post('/api/graph/semantic-search', {
      query: 'user management and validation',
      threshold: 0.6,
      limit: 5,
    });

    assertions.assertSuccessResponse(semanticResponse);
    assertions.assertSemanticSearchResults(semanticResponse.body);

    // Step 5: Analyze relationships
    const relationshipsResponse = await client.get('/api/graph/relationships', {
      type: 'IMPORTS',
    });

    assertions.assertSuccessResponse(relationshipsResponse);
    expect(relationshipsResponse.body.items.length).toBeGreaterThan(0);

    // Verify UserService imports were detected
    const userServiceImports = relationshipsResponse.body.items.filter(
      (rel: any) => rel.fromEntity?.name === 'UserService'
    );
    expect(userServiceImports.length).toBeGreaterThan(0);

    // Step 6: Test impact analysis
    if (userServiceEntity) {
      const impactResponse = await client.get(`/api/graph/impact/${userServiceEntity.id}`, {
        direction: 'incoming',
        maxDepth: 2,
      });

      assertions.assertSuccessResponse(impactResponse);
      expect(impactResponse.body.affectedEntities).toBeInstanceOf(Array);
    }

    // Step 7: Test graph traversal
    const traversalResponse = await client.post('/api/graph/traverse', {
      startNodeId: userServiceEntity.id,
      direction: 'outgoing',
      maxDepth: 2,
      relationshipTypes: ['IMPORTS', 'USES', 'DEPENDS_ON'],
    });

    assertions.assertSuccessResponse(traversalResponse);
    expect(traversalResponse.body.nodes.length).toBeGreaterThan(1);
    expect(traversalResponse.body.edges.length).toBeGreaterThan(0);
  }, 60000); // 60 second timeout for this comprehensive test

  it('should handle real-time updates during file modifications', async () => {
    // Set up WebSocket connection for real-time updates
    const ws = globalThis.testEnvironment.createWebSocketConnection(`/ws/graph/updates?apiKey=${apiKey}`);

    const messages: any[] = [];
    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });

    // Wait for connection to establish
    await new Promise(resolve => {
      ws.on('open', resolve);
      setTimeout(resolve, 2000); // Fallback timeout
    });

    // Modify an existing file
    const updatedUserService = `
import { User, CreateUserData, UpdateUserData } from '../types/User';
import { UserRepository } from '../repositories/UserRepository';
import { ValidationService } from './ValidationService';
import { EmailService } from './EmailService';
import { LoggingService } from './LoggingService'; // New import

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private validationService: ValidationService,
    private emailService: EmailService,
    private loggingService: LoggingService // New dependency
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    this.loggingService.log('Creating user', data); // New functionality
    await this.validationService.validateCreateUser(data);

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await this.userRepository.create(data);
    await this.emailService.sendWelcomeEmail(user);
    this.loggingService.log('User created', user); // New functionality

    return user;
  }

  // ... rest of the methods remain the same
}
`;

    // Parse updated file
    const updateResponse = await client.post('/api/graph/parse', {
      filePath: 'src/services/UserService.ts',
      content: updatedUserService,
      language: 'typescript',
      isUpdate: true,
    });

    assertions.assertSuccessResponse(updateResponse);

    // Wait for WebSocket messages
    await assertions.assertEventuallyTrue(() => messages.length > 0, 5000);

    // Verify we received real-time updates
    const entityUpdates = messages.filter(m => m.type === 'entity:updated' || m.type === 'entity:created');
    const relationshipUpdates = messages.filter(m => m.type === 'relationship:created');

    expect(entityUpdates.length + relationshipUpdates.length).toBeGreaterThan(0);

    ws.close();
  }, 30000);

  it('should maintain data consistency across multiple operations', async () => {
    // Create entities and relationships
    const entity1 = await client.post('/api/graph/entities', mockData.generateEntity({ name: 'ConsistencyTest1' }));
    const entity2 = await client.post('/api/graph/entities', mockData.generateEntity({ name: 'ConsistencyTest2' }));

    assertions.assertSuccessResponse(entity1, 201);
    assertions.assertSuccessResponse(entity2, 201);

    // Create relationship
    const relationship = await client.post('/api/graph/relationships', {
      fromId: entity1.body.id,
      toId: entity2.body.id,
      type: 'CONSISTENCY_TEST',
      metadata: { testId: 'consistency-check' },
    });

    assertions.assertSuccessResponse(relationship, 201);

    // Verify entities exist
    const entity1Check = await client.get(`/api/graph/entities/${entity1.body.id}`);
    const entity2Check = await client.get(`/api/graph/entities/${entity2.body.id}`);

    assertions.assertSuccessResponse(entity1Check);
    assertions.assertSuccessResponse(entity2Check);

    // Verify relationship exists
    const relationshipCheck = await client.get(`/api/graph/relationships/${relationship.body.id}`);
    assertions.assertSuccessResponse(relationshipCheck);

    // Delete one entity
    const deleteResponse = await client.delete(`/api/graph/entities/${entity1.body.id}`);
    assertions.assertSuccessResponse(deleteResponse);

    // Verify entity is deleted
    const deletedEntityCheck = await client.get(`/api/graph/entities/${entity1.body.id}`);
    assertions.assertNotFound(deletedEntityCheck);

    // Verify orphaned relationship handling
    // (This behavior depends on implementation - might cascade delete or mark as orphaned)
    const orphanedRelationshipCheck = await client.get(`/api/graph/relationships/${relationship.body.id}`);
    expect([200, 404]).toContain(orphanedRelationshipCheck.statusCode);

    // Run cleanup to handle any orphaned relationships
    const cleanupResponse = await client.post('/api/graph/maintenance/cleanup', {
      removeOrphanedRelationships: true,
    });

    assertions.assertSuccessResponse(cleanupResponse);
  });

  it('should handle concurrent operations without data corruption', async () => {
    // Create multiple clients for concurrent operations
    const clients = Array.from({ length: 3 }, () => {
      const newClient = globalThis.testEnvironment.createTestClient();
      newClient.setApiKey(apiKey);
      return newClient;
    });

    // Perform concurrent entity creation
    const concurrentEntities = Array.from({ length: 10 }, (_, i) =>
      mockData.generateEntity({ name: `ConcurrentEntity${i}` })
    );

    const createPromises = concurrentEntities.map((entity, index) => {
      const clientIndex = index % clients.length;
      return clients[clientIndex].post('/api/graph/entities', entity);
    });

    const createResults = await Promise.allSettled(createPromises);

    // All creates should succeed
    const successful = createResults.filter(r => r.status === 'fulfilled' && r.value.statusCode === 201);
    expect(successful.length).toBe(concurrentEntities.length);

    // Verify no duplicate entities were created
    const entitiesResponse = await client.get('/api/graph/entities', {
      name: 'ConcurrentEntity*',
    });

    assertions.assertSuccessResponse(entitiesResponse);
    assertions.assertNoDuplicateIds(entitiesResponse.body.items);

    // Verify all expected entities exist
    const entityNames = entitiesResponse.body.items.map((e: any) => e.name);
    for (let i = 0; i < 10; i++) {
      expect(entityNames).toContain(`ConcurrentEntity${i}`);
    }
  });

  it('should recover gracefully from service failures', async () => {
    // This test simulates service recovery scenarios
    // In a real environment, you might temporarily stop services

    // Test API resilience with invalid data
    const invalidRequests = [
      client.post('/api/graph/entities', { invalid: 'data' }),
      client.post('/api/graph/relationships', { incomplete: 'relationship' }),
      client.post('/api/graph/parse', { malformed: 'parse request' }),
    ];

    const results = await Promise.allSettled(invalidRequests);

    // All should fail gracefully (not crash the service)
    for (const result of results) {
      expect(result.status).toBe('fulfilled'); // Request completed (didn't crash)
      if (result.status === 'fulfilled') {
        expect(result.value.statusCode).toBeGreaterThanOrEqual(400); // Error response
      }
    }

    // Verify API is still responsive after errors
    const healthCheck = await client.get('/api/health');
    assertions.assertSuccessResponse(healthCheck);
    expect(healthCheck.body.status).toMatch(/healthy|degraded/);
  });
});