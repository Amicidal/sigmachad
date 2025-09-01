/**
 * Rollback Capabilities Integration Tests
 * Tests for rollback point creation and restoration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { RollbackCapabilities } from '../src/services/RollbackCapabilities.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { DatabaseService, createTestDatabaseConfig } from '../src/services/DatabaseService.js';

describe('RollbackCapabilities Integration', () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let rollbackCapabilities: RollbackCapabilities;

  beforeAll(async () => {
    const dbConfig = createTestDatabaseConfig();
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
    await dbService.falkordbQuery('MATCH (n) WHERE n.id STARTS WITH "test_" DELETE n').catch(() => {});
    await dbService.falkordbQuery('MATCH ()-[r]-() WHERE r.id STARTS WITH "test_" DELETE r').catch(() => {});

    // Clear rollback points
    (rollbackCapabilities as any).rollbackPoints.clear();
  });

  describe('Basic Functionality', () => {
    it('should initialize successfully', () => {
      expect(rollbackCapabilities).toBeDefined();
    });

    it('should create rollback point', async () => {
      const rollbackId = await rollbackCapabilities.createRollbackPoint('test_op', 'Test operation');
      expect(rollbackId).toBeDefined();
      expect(typeof rollbackId).toBe('string');
    });

    it('should list rollback points', async () => {
      await rollbackCapabilities.createRollbackPoint('test_op1', 'Test operation 1');
      await rollbackCapabilities.createRollbackPoint('test_op2', 'Test operation 2');

      const points = await rollbackCapabilities.listRollbackPoints();
      expect(points.length).toBeGreaterThanOrEqual(2);
    });

    it('should rollback to a point', async () => {
      const rollbackId = await rollbackCapabilities.createRollbackPoint('test_rollback', 'Test rollback');
      expect(rollbackId).toBeDefined();

      await rollbackCapabilities.rollbackToPoint(rollbackId);
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });
});
