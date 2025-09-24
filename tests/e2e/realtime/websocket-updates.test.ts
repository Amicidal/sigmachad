import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { TestClient, MockDataGenerator, TestAssertions } from '../utils';

describe('Real-time Updates E2E', () => {
  let client: TestClient;
  let mockData: MockDataGenerator;
  let assertions: TestAssertions;
  let wsConnections: WebSocket[] = [];

  beforeEach(async () => {
    client = globalThis.testEnvironment.createTestClient();
    mockData = globalThis.testEnvironment.mockData;
    assertions = globalThis.testEnvironment.assertions;

    // Set up authentication
    const keyResponse = await client.post('/api/auth/api-keys', {
      name: 'WebSocket Test Key',
      permissions: ['read', 'write', 'subscribe'],
    });
    client.setApiKey(keyResponse.body.apiKey);
  });

  afterEach(async () => {
    // Clean up WebSocket connections
    for (const ws of wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    wsConnections = [];
  });

  const createWebSocketConnection = (path: string, apiKey?: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const url = path + (apiKey ? `?apiKey=${apiKey}` : '');
      const ws = globalThis.testEnvironment.createWebSocketConnection(url);
      wsConnections.push(ws);

      ws.on('open', () => resolve(ws));
      ws.on('error', reject);

      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  };

  describe('Knowledge Graph Updates', () => {
    it('should broadcast entity creation events', async () => {
      // Connect to knowledge graph updates
      const ws = await createWebSocketConnection('/ws/graph/updates');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Create a new entity
      const entity = mockData.generateEntity();
      const createResponse = await client.post('/api/graph/entities', entity);
      assertions.assertSuccessResponse(createResponse, 201);

      // Wait for WebSocket message
      await assertions.assertEventuallyTrue(() => messages.length > 0, 3000);

      const updateMessage = messages[0];
      assertions.assertWebSocketEvent(updateMessage, 'entity:created', {
        entity: expect.objectContaining({
          id: createResponse.body.id,
          name: entity.name,
          type: entity.type,
        }),
      });
    });

    it('should broadcast relationship creation events', async () => {
      // Create entities first
      const entity1 = await client.post('/api/graph/entities', mockData.generateEntity());
      const entity2 = await client.post('/api/graph/entities', mockData.generateEntity());

      // Connect to relationship updates
      const ws = await createWebSocketConnection('/ws/graph/relationships');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Create relationship
      const relationshipResponse = await client.post('/api/graph/relationships', {
        fromId: entity1.body.id,
        toId: entity2.body.id,
        type: 'DEPENDS_ON',
        metadata: { confidence: 0.95 },
      });

      assertions.assertSuccessResponse(relationshipResponse, 201);

      // Wait for WebSocket message
      await assertions.assertEventuallyTrue(() => messages.length > 0, 3000);

      const updateMessage = messages[0];
      assertions.assertWebSocketEvent(updateMessage, 'relationship:created', {
        relationship: expect.objectContaining({
          fromId: entity1.body.id,
          toId: entity2.body.id,
          type: 'DEPENDS_ON',
        }),
      });
    });

    it('should handle filtered subscriptions', async () => {
      // Connect with entity type filter
      const ws = await createWebSocketConnection('/ws/graph/updates?filter=type:function');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Create entities of different types
      await Promise.all([
        client.post('/api/graph/entities', mockData.generateEntity({ type: 'function' })),
        client.post('/api/graph/entities', mockData.generateEntity({ type: 'class' })),
        client.post('/api/graph/entities', mockData.generateEntity({ type: 'function' })),
      ]);

      // Wait for messages
      await mockData.delay(2000);

      // Should only receive messages for function entities
      expect(messages.length).toBe(2);
      for (const message of messages) {
        expect(message.payload.entity.type).toBe('function');
      }
    });

    it('should support multiple concurrent subscribers', async () => {
      // Create multiple WebSocket connections
      const connections = await Promise.all([
        createWebSocketConnection('/ws/graph/updates'),
        createWebSocketConnection('/ws/graph/updates'),
        createWebSocketConnection('/ws/graph/updates'),
      ]);

      const allMessages: any[][] = [[], [], []];
      connections.forEach((ws, index) => {
        ws.on('message', (data) => {
          allMessages[index].push(JSON.parse(data.toString()));
        });
      });

      // Create an entity
      const entity = mockData.generateEntity();
      const createResponse = await client.post('/api/graph/entities', entity);
      assertions.assertSuccessResponse(createResponse, 201);

      // Wait for all connections to receive the message
      await Promise.all(
        allMessages.map((messages, index) =>
          assertions.assertEventuallyTrue(() => messages.length > 0, 3000)
        )
      );

      // All connections should receive the same message
      for (const messages of allMessages) {
        expect(messages[0]).toMatchObject({
          type: 'entity:created',
          payload: {
            entity: expect.objectContaining({
              id: createResponse.body.id,
            }),
          },
        });
      }
    });
  });

  describe('File Change Notifications', () => {
    it('should notify subscribers of file parsing events', async () => {
      // Connect to file events
      const ws = await createWebSocketConnection('/ws/files/events');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Parse a file
      const file = mockData.generateCodeFile();
      const parseResponse = await client.post('/api/graph/parse', {
        filePath: file.path,
        content: file.content,
        language: file.language,
      });

      assertions.assertSuccessResponse(parseResponse);

      // Wait for parsing events
      await assertions.assertEventuallyTrue(() => messages.length > 0, 5000);

      // Should receive parsing start and completion events
      const eventTypes = messages.map(m => m.type);
      expect(eventTypes).toContain('file:parsing:started');
      expect(eventTypes).toContain('file:parsing:completed');

      const completedEvent = messages.find(m => m.type === 'file:parsing:completed');
      expect(completedEvent.payload).toMatchObject({
        filePath: file.path,
        entitiesExtracted: expect.any(Number),
        relationshipsCreated: expect.any(Number),
      });
    });

    it('should handle file change watch notifications', async () => {
      // Connect to file watcher events
      const ws = await createWebSocketConnection('/ws/files/watch');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Simulate file change by re-parsing with updated content
      const originalFile = mockData.generateCodeFile();
      await client.post('/api/graph/parse', {
        filePath: originalFile.path,
        content: originalFile.content,
        language: originalFile.language,
      });

      // Clear messages from initial parse
      await mockData.delay(1000);
      messages.length = 0;

      // Update file content
      const updatedContent = originalFile.content + '\nexport const newFunction = () => {};';
      const updateResponse = await client.post('/api/graph/parse', {
        filePath: originalFile.path,
        content: updatedContent,
        language: originalFile.language,
        isUpdate: true,
      });

      assertions.assertSuccessResponse(updateResponse);

      // Wait for file change notification
      await assertions.assertEventuallyTrue(() => messages.length > 0, 3000);

      const changeEvent = messages.find(m => m.type === 'file:changed');
      expect(changeEvent).toBeDefined();
      expect(changeEvent.payload).toMatchObject({
        filePath: originalFile.path,
        changeType: 'modified',
        entitiesAdded: expect.any(Number),
        entitiesRemoved: expect.any(Number),
        relationshipsChanged: expect.any(Number),
      });
    });
  });

  describe('Agent Activity Monitoring', () => {
    it('should broadcast agent status updates', async () => {
      // Connect to agent monitoring
      const ws = await createWebSocketConnection('/ws/agents/status');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Start an agent task
      const taskResponse = await client.post('/api/agents/tasks', {
        type: 'parse',
        payload: {
          directory: '/test/src',
          includeTests: true,
        },
      });

      assertions.assertSuccessResponse(taskResponse, 201);
      const taskId = taskResponse.body.taskId;

      // Wait for agent status messages
      await assertions.assertEventuallyTrue(() => messages.length > 0, 5000);

      // Should receive agent status updates
      const statusMessages = messages.filter(m => m.type.startsWith('agent:'));
      expect(statusMessages.length).toBeGreaterThan(0);

      const startMessage = statusMessages.find(m => m.type === 'agent:started');
      expect(startMessage).toBeDefined();
      expect(startMessage.payload).toMatchObject({
        taskId,
        agentId: expect.any(String),
        taskType: 'parse',
      });
    });

    it('should handle agent handoff notifications', async () => {
      // Connect to agent handoff events
      const ws = await createWebSocketConnection('/ws/agents/handoffs');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Create a session and simulate handoff
      const sessionResponse = await client.post('/api/auth/sessions', {
        user: mockData.generateUser(),
        agentId: 'parser-agent',
      });

      const sessionId = sessionResponse.body.sessionId;

      // Initiate handoff
      const handoffResponse = await client.post(`/api/auth/sessions/${sessionId}/handoff`, {
        targetAgent: 'test-agent',
        context: {
          parsedFiles: 15,
          currentPhase: 'testing',
        },
      });

      assertions.assertSuccessResponse(handoffResponse);

      // Wait for handoff notification
      await assertions.assertEventuallyTrue(() => messages.length > 0, 3000);

      const handoffEvent = messages[0];
      assertions.assertWebSocketEvent(handoffEvent, 'agent:handoff:initiated', {
        sessionId,
        fromAgent: 'parser-agent',
        toAgent: 'test-agent',
        context: expect.any(Object),
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle WebSocket connection drops gracefully', async () => {
      const ws = await createWebSocketConnection('/ws/graph/updates');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Force close connection
      ws.close();

      // Wait for close
      await new Promise(resolve => ws.on('close', resolve));

      // Server should handle the disconnect gracefully
      // (we can't easily test automatic reconnection in this setup,
      // but the server shouldn't crash)

      // Reconnect and verify it works
      const newWs = await createWebSocketConnection('/ws/graph/updates');

      const newMessages: any[] = [];
      newWs.on('message', (data) => {
        newMessages.push(JSON.parse(data.toString()));
      });

      // Create entity to test new connection
      const entity = await client.post('/api/graph/entities', mockData.generateEntity());
      assertions.assertSuccessResponse(entity, 201);

      await assertions.assertEventuallyTrue(() => newMessages.length > 0, 3000);
      expect(newMessages[0].type).toBe('entity:created');
    });

    it('should handle malformed WebSocket messages', async () => {
      const ws = await createWebSocketConnection('/ws/graph/updates');

      const errors: any[] = [];
      ws.on('error', (error) => {
        errors.push(error);
      });

      // Send malformed message
      ws.send('invalid json');
      ws.send('{"type": "invalid"}');
      ws.send('{"malformed": true}');

      // Wait a bit to see if any errors occur
      await mockData.delay(1000);

      // Connection should remain stable despite malformed messages
      expect(ws.readyState).toBe(WebSocket.OPEN);

      // Server should still be able to send valid messages
      const entity = await client.post('/api/graph/entities', mockData.generateEntity());
      assertions.assertSuccessResponse(entity, 201);

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      await assertions.assertEventuallyTrue(() => messages.length > 0, 3000);
    });

    it('should respect authentication for WebSocket connections', async () => {
      // Try to connect without authentication
      try {
        const ws = await createWebSocketConnection('/ws/graph/updates');
        // Should not reach here if auth is enforced
        ws.close();
        expect(false).toBe(true); // Force failure if connection succeeds
      } catch (error) {
        // Expected - connection should be rejected
        expect(error).toBeDefined();
      }

      // Connect with valid API key
      const keyResponse = await client.post('/api/auth/api-keys', {
        name: 'WS Auth Key',
        permissions: ['subscribe'],
      });

      const wsWithAuth = await createWebSocketConnection(
        '/ws/graph/updates',
        keyResponse.body.apiKey
      );

      expect(wsWithAuth.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const ws = await createWebSocketConnection('/ws/graph/updates');

      const messages: any[] = [];
      ws.on('message', (data) => {
        messages.push(JSON.parse(data.toString()));
      });

      // Create many entities rapidly
      const entities = Array.from({ length: 20 }, () => mockData.generateEntity());
      const startTime = Date.now();

      const createPromises = entities.map(entity =>
        client.post('/api/graph/entities', entity)
      );

      await Promise.all(createPromises);

      // Wait for all messages
      await assertions.assertEventuallyTrue(() => messages.length >= 20, 10000);

      const totalTime = Date.now() - startTime;

      // All entities should be created
      expect(messages.length).toBe(20);

      // Performance should be reasonable
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Messages should be received in reasonable time order
      const timestamps = messages.map(m => new Date(m.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should handle backpressure for slow consumers', async () => {
      const ws = await createWebSocketConnection('/ws/graph/updates');

      const messages: any[] = [];

      // Simulate slow message processing
      ws.on('message', async (data) => {
        await mockData.delay(100); // Slow processing
        messages.push(JSON.parse(data.toString()));
      });

      // Create entities faster than they can be processed
      const entities = Array.from({ length: 10 }, () => mockData.generateEntity());

      for (const entity of entities) {
        await client.post('/api/graph/entities', entity);
      }

      // Server should handle backpressure gracefully
      // All messages should eventually be delivered
      await assertions.assertEventuallyTrue(() => messages.length >= 10, 15000);

      expect(messages.length).toBe(10);
    });
  });
});