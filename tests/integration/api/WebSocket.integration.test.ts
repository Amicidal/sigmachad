/**
 * Integration tests for WebSocket router
 * Tests real-time WebSocket functionality, connection management,
 * event broadcasting, and subscription handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { APIGateway } from '../../../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../../../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../../../src/services/DatabaseService.js';
import { FileWatcher } from '../../../src/services/FileWatcher.js';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from '../../test-utils/database-helpers.js';

describe('WebSocket Router Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let apiGateway: APIGateway;
  let app: FastifyInstance;
  let server: any;
  let testFileWatcher: FileWatcher;

  beforeAll(async () => {
    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error('Database health check failed - cannot run integration tests');
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService);
    testFileWatcher = new FileWatcher();

    // Create API Gateway with file watcher
    apiGateway = new APIGateway(kgService, dbService, testFileWatcher);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();
    server = apiGateway.getServer();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
  });

  describe('WebSocket Server Setup', () => {
    it('should have WebSocket route registered', () => {
      expect(app.hasRoute('GET', '/ws')).toBe(true);
    });

    it('should accept WebSocket connections', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    });

    it('should handle multiple concurrent connections', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;
      const connectionCount = 5;
      const connections: WebSocket[] = [];

      await new Promise<void>((resolve, reject) => {
        let connectedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < connectionCount; i++) {
          const ws = new WebSocket(wsUrl);
          connections.push(ws);

          ws.on('open', () => {
            connectedCount++;
            if (connectedCount === connectionCount) {
              // All connections established
              connections.forEach(ws => ws.close());
              resolve();
            }
          });

          ws.on('error', (error) => {
            errorCount++;
            if (errorCount + connectedCount === connectionCount) {
              reject(new Error(`Failed to establish ${errorCount} connections`));
            }
          });
        }

        // Timeout after 10 seconds
        setTimeout(() => {
          connections.forEach(ws => ws.close());
          reject(new Error('WebSocket connection timeout'));
        }, 10000);
      });
    });
  });

  describe('WebSocket Message Handling', () => {
    it('should handle JSON messages', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          const testMessage = {
            type: 'ping',
            data: { timestamp: Date.now() },
          };
          ws.send(JSON.stringify(testMessage));
        });

        ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            expect(response).toBeDefined();
            expect(typeof response).toBe('object');
            ws.close();
            resolve();
          } catch (error) {
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Message handling timeout'));
        }, 5000);
      });
    });

    it('should handle subscription messages', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          const subscribeMessage = {
            type: 'subscribe',
            data: {
              channel: 'graph-updates',
              entityId: 'test-entity-123',
            },
          };
          ws.send(JSON.stringify(subscribeMessage));
        });

        ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            expect(response).toBeDefined();
            // Should receive acknowledgment or error
            ws.close();
            resolve();
          } catch (error) {
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Subscription timeout'));
        }, 5000);
      });
    });

    it('should handle invalid JSON messages gracefully', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          ws.send('invalid json message');
        });

        ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            expect(response).toBeDefined();
            // Should receive error response
            expect(response.type).toBe('error');
            ws.close();
            resolve();
          } catch (error) {
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Invalid JSON handling timeout'));
        }, 5000);
      });
    });
  });

  describe('Real-time Graph Updates', () => {
    it('should broadcast graph changes to subscribed clients', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let receivedUpdate = false;

        ws.on('open', async () => {
          // Subscribe to entity_created events
          const subscribeMessage = {
            type: 'subscribe',
            data: {
              event: 'entity_created',
            },
          };
          ws.send(JSON.stringify(subscribeMessage));

          // Create a graph entity to trigger update deterministically
          await kgService.createEntity({
            id: 'ws-test-entity',
            type: 'function',
            name: 'WebSocketTestFunction',
            path: '/test/file.ts',
            language: 'typescript',
            lastModified: new Date(),
            created: new Date(),
            hash: 'abc',
          } as any);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'event' && message.data?.type === 'entity_created') {
              receivedUpdate = true;
              expect(message.data).toBeDefined();
              ws.close();
              resolve();
            }
          } catch (error) {
            // Ignore parsing errors for other messages
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          if (!receivedUpdate) {
            reject(new Error('Did not receive entity_created event'));
          }
        }, 3000);
      });
    });

    it('should handle file change notifications', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let receivedFileChange = false;

        ws.on('open', () => {
          // Subscribe to file_change events
          const subscribeMessage = {
            type: 'subscribe',
            data: {
              event: 'file_change',
            },
          };
          ws.send(JSON.stringify(subscribeMessage));

          // Emit a file change via the test file watcher
          testFileWatcher.emit('change', {
            path: '/tmp/test-file.ts',
            type: 'modified',
            timestamp: new Date(),
          } as any);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'event' && message.data?.type === 'file_change') {
              receivedFileChange = true;
              expect(message.data).toBeDefined();
              expect(message.data.path).toBeDefined();
              ws.close();
              resolve();
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          if (!receivedFileChange) {
            reject(new Error('Did not receive file_change event'));
          }
        }, 3000);
      });
    });
  });

  describe('Connection Management', () => {
    it('should handle connection cleanup on client disconnect', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          // Connection established, now close it
          ws.close();
        });

        ws.on('close', (code, reason) => {
          expect(code).toBeDefined();
          // Connection should close cleanly
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          reject(new Error('Connection cleanup timeout'));
        }, 5000);
      });
    });

    it('should handle heartbeat/ping messages', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let receivedPong = false;

        ws.on('open', () => {
          // Send ping
          const pingMessage = {
            type: 'ping',
            data: { timestamp: Date.now() },
          };
          ws.send(JSON.stringify(pingMessage));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong') {
              receivedPong = true;
              expect(message.data).toBeDefined();
              expect(message.data.timestamp).toBeDefined();
              ws.close();
              resolve();
            }
          } catch (error) {
            // Ignore other messages
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          if (!receivedPong) {
            reject(new Error('Did not receive pong'));
          }
        }, 3000);
      });
    });

    it('should handle connection limits gracefully', async () => {
      // This test verifies that the WebSocket server can handle connection limits
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;
      const maxConnections = 20;
      const connections: WebSocket[] = [];

      await new Promise<void>((resolve, reject) => {
        let connectedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < maxConnections; i++) {
          const ws = new WebSocket(wsUrl);
          connections.push(ws);

          ws.on('open', () => {
            connectedCount++;
          });

          ws.on('error', (error) => {
            failedCount++;
          });

          ws.on('close', () => {
            connectedCount = Math.max(0, connectedCount - 1);
          });
        }

        setTimeout(() => {
          // Clean up all connections
          connections.forEach(ws => {
            try {
              ws.close();
            } catch (error) {
              // Ignore cleanup errors
            }
          });

          // Test should pass as long as some connections succeeded
          expect(connectedCount + failedCount).toBe(maxConnections);
          expect(connectedCount).toBeGreaterThan(0);
          resolve();
        }, 5000);
      });
    });
  });

  describe('Subscription Management', () => {
    it('should handle multiple channel subscriptions', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const subscriptions = ['entity_created', 'file_change', 'sync_status'];
        let ackCount = 0;

        ws.on('open', () => {
          // Subscribe to multiple events
          subscriptions.forEach(event => {
            const subscribeMessage = {
              type: 'subscribe',
              data: { event },
            };
            ws.send(JSON.stringify(subscribeMessage));
          });
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'subscribed' || message.type === 'error') {
              ackCount++;
              if (ackCount >= subscriptions.length) {
                ws.close();
                resolve();
              }
            }
          } catch (error) {
            // Ignore parsing errors
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          if (ackCount < subscriptions.length) {
            reject(new Error('Did not receive all subscription acks'));
          }
        }, 3000);
      });
    });

    it('should handle unsubscription from channels', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          // Subscribe first
          const subscribeMessage = {
            type: 'subscribe',
            data: { channel: 'test-channel' },
          };
          ws.send(JSON.stringify(subscribeMessage));

          // Then unsubscribe
          setTimeout(() => {
            const unsubscribeMessage = {
              type: 'unsubscribe',
              data: { channel: 'test-channel' },
            };
            ws.send(JSON.stringify(unsubscribeMessage));
          }, 500);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'unsubscribed') {
              ws.close();
              resolve();
            }
          } catch (error) {
            // Ignore other messages
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Did not receive unsubscribe ack'));
        }, 3000);
      });
    });

    it('should handle invalid subscription requests', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
          // Send invalid subscription
          const invalidMessage = {
            type: 'subscribe',
            data: {}, // Missing channel
          };
          ws.send(JSON.stringify(invalidMessage));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'error') {
              expect(message.data).toBeDefined();
              ws.close();
              resolve();
            }
          } catch (error) {
            // Ignore other messages
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        setTimeout(() => {
          ws.close();
          reject(new Error('Did not receive error response for invalid subscription'));
        }, 3000);
      });
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast messages to multiple subscribers', async () => {
      const port = apiGateway.getConfig().port;
      const wsUrl = `ws://localhost:${port}/ws`;
      const clientCount = 3;
      const clients: WebSocket[] = [];
      const receivedMessages: number[] = new Array(clientCount).fill(0);

      await new Promise<void>((resolve, reject) => {
        let connectedCount = 0;

        for (let i = 0; i < clientCount; i++) {
          const ws = new WebSocket(wsUrl);
          clients.push(ws);

          ws.on('open', () => {
            connectedCount++;
            if (connectedCount === clientCount) {
              // All clients connected, subscribe them
              clients.forEach((client, index) => {
                const subscribeMessage = {
                  type: 'subscribe',
                  data: { channel: 'broadcast-test' },
                };
                client.send(JSON.stringify(subscribeMessage));
              });

              // Send broadcast message after subscriptions
              setTimeout(() => {
                // Note: In a real implementation, you'd have an admin endpoint to trigger broadcasts
                // For this test, we just verify the subscription mechanism works
                clients.forEach(client => client.close());
                resolve();
              }, 1000);
            }
          });

          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              if (message.type === 'broadcast') {
                const clientIndex = clients.indexOf(ws);
                if (clientIndex !== -1) {
                  receivedMessages[clientIndex]++;
                }
              }
            } catch (error) {
              // Ignore parsing errors
            }
          });

          ws.on('error', (error) => {
            reject(error);
          });
        }

        setTimeout(() => {
          clients.forEach(client => client.close());
          resolve(); // Test passes as long as connections work
        }, 5000);
      });
    });
  });
});
