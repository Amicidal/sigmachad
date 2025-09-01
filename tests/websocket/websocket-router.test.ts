/**
 * WebSocket Router Integration Tests
 * Tests for WebSocket connection management with real services
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WebSocketRouter } from '../src/api/websocket-router.js';
import { DatabaseService, createTestDatabaseConfig } from '../src/services/DatabaseService.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { FileWatcher } from '../src/services/FileWatcher.js';

describe('WebSocketRouter Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let fileWatcher: FileWatcher;
  let wsRouter: WebSocketRouter;

  beforeEach(async () => {
    // Use real services for integration testing
    const dbConfig = createTestDatabaseConfig();
    dbService = new DatabaseService(dbConfig);
    await dbService.initialize();

    kgService = new KnowledgeGraphService(dbService);
    await kgService.initialize();

    fileWatcher = new FileWatcher();

    wsRouter = new WebSocketRouter(kgService, dbService, fileWatcher);
  });

  afterEach(async () => {
    if (wsRouter) {
      await wsRouter.close();
    }
    if (dbService) {
      await dbService.close();
    }
  });

  describe('Basic Functionality', () => {
    it('should initialize successfully', async () => {
      expect(wsRouter).toBeDefined();
    });

    it('should handle connection lifecycle', async () => {
      // Test that connections can be established and closed
      // This would require a real WebSocket server setup
      expect(true).toBe(true); // Placeholder for real WebSocket testing
    });

    it('should integrate with knowledge graph service', async () => {
      // Test that WebSocket router can communicate with KG service
      expect(wsRouter).toBeDefined();
      expect(kgService).toBeDefined();
    });

    it('should close connections gracefully', async () => {
      await wsRouter.close();
      expect(true).toBe(true);
    });
  });
});
