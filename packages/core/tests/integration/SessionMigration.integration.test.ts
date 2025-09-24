/**
 * Session Migration Integration Tests
 *
 * Comprehensive tests for session migration functionality including:
 * - Full, incremental, and selective migrations
 * - Cross-instance synchronization
 * - Conflict detection and resolution
 * - Migration validation and rollback
 * - Performance and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { SessionMigration, MigrationConfig } from '../../src/services/SessionMigration.js';
import { SessionDocument, SessionEvent, RedisConfig } from '../../src/services/SessionTypes.js';

describe('SessionMigration Integration Tests', () => {
  let sourceRedis: RedisClientType;
  let targetRedis: RedisClientType;
  let sessionMigration: SessionMigration;

  const sourceDb = 14;
  const targetDb = 15;

  const migrationConfig: MigrationConfig = {
    sourceRedis: {
      host: 'localhost',
      port: 6379,
      db: sourceDb,
      url: `redis://localhost:6379/${sourceDb}`,
    },
    targetRedis: {
      host: 'localhost',
      port: 6379,
      db: targetDb,
      url: `redis://localhost:6379/${targetDb}`,
    },
    batchSize: 10,
    migrationTimeout: 30,
    enableValidation: true,
    enableCompression: false,
    retryAttempts: 3,
    backupBeforeMigration: false,
  };

  beforeEach(async () => {
    // Create Redis clients
    sourceRedis = createRedisClient({
      url: `redis://localhost:6379/${sourceDb}`,
    });
    targetRedis = createRedisClient({
      url: `redis://localhost:6379/${targetDb}`,
    });

    await sourceRedis.connect();
    await targetRedis.connect();

    // Clean both databases
    await sourceRedis.flushDb();
    await targetRedis.flushDb();

    // Setup test data in source
    await setupTestSessions();

    sessionMigration = new SessionMigration(migrationConfig);
    await sessionMigration.initialize();
  });

  afterEach(async () => {
    if (sessionMigration) {
      await sessionMigration.shutdown();
    }
    if (sourceRedis) {
      await sourceRedis.flushDb();
      await sourceRedis.quit();
    }
    if (targetRedis) {
      await targetRedis.flushDb();
      await targetRedis.quit();
    }
  });

  async function setupTestSessions(): Promise<void> {
    const sessions = [
      {
        sessionId: 'session-1',
        agentIds: ['agent-1'],
        state: 'working',
        events: [
          {
            seq: 1,
            type: 'modified',
            timestamp: new Date(Date.now() - 10000).toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: ['func-1'],
              operation: 'modified',
            },
            actor: 'agent-1',
          },
        ],
      },
      {
        sessionId: 'session-2',
        agentIds: ['agent-1', 'agent-2'],
        state: 'broken',
        events: [
          {
            seq: 1,
            type: 'modified',
            timestamp: new Date(Date.now() - 5000).toISOString(),
            changeInfo: {
              elementType: 'class',
              entityIds: ['class-1'],
              operation: 'modified',
            },
            actor: 'agent-1',
          },
          {
            seq: 2,
            type: 'broke',
            timestamp: new Date(Date.now() - 2000).toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: ['func-2'],
              operation: 'modified',
            },
            stateTransition: {
              from: 'working',
              to: 'broken',
              verifiedBy: 'test',
              confidence: 0.95,
            },
            actor: 'agent-2',
          },
        ],
      },
      {
        sessionId: 'session-3',
        agentIds: ['agent-3'],
        state: 'working',
        events: [
          {
            seq: 1,
            type: 'checkpoint',
            timestamp: new Date().toISOString(),
            changeInfo: {
              elementType: 'session',
              entityIds: ['session-3'],
              operation: 'checkpoint',
            },
            actor: 'agent-3',
          },
        ],
      },
    ];

    for (const session of sessions) {
      const sessionKey = `session:${session.sessionId}`;
      const eventsKey = `events:${session.sessionId}`;

      // Store session metadata
      await sourceRedis.hSet(sessionKey, {
        agentIds: JSON.stringify(session.agentIds),
        state: session.state,
        events: session.events.length.toString(),
      });

      // Store events
      if (session.events.length > 0) {
        const eventEntries = session.events.map(event => ({
          score: event.seq,
          value: JSON.stringify(event),
        }));
        await sourceRedis.zAdd(eventsKey, eventEntries);
      }

      // Set TTL for some sessions
      if (session.sessionId === 'session-1') {
        await sourceRedis.expire(sessionKey, 3600);
        await sourceRedis.expire(eventsKey, 3600);
      }
    }
  }

  describe('Full Migration', () => {
    it('should migrate all sessions successfully', async () => {
      const taskId = await sessionMigration.startFullMigration({
        validateAfter: true,
      });

      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^migration-\d+$/);

      // Wait for migration to complete
      await waitForMigrationCompletion(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.migratedSessions).toBe(3);
      expect(task?.progress.failedSessions).toBe(0);

      // Verify all sessions were migrated
      const targetSessionKeys = await targetRedis.keys('session:*');
      expect(targetSessionKeys).toHaveLength(3);

      // Verify session data integrity
      for (const sessionKey of targetSessionKeys) {
        const sessionData = await targetRedis.hGetAll(sessionKey);
        expect(sessionData).toBeDefined();
        expect(sessionData.agentIds).toBeDefined();
        expect(sessionData.state).toBeDefined();

        const sessionId = sessionKey.replace('session:', '');
        const eventsKey = `events:${sessionId}`;
        const events = await targetRedis.zRange(eventsKey, 0, -1);
        expect(events.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should preserve TTL during migration', async () => {
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      // Check TTL for session-1 which had TTL set
      const sourceTTL = await sourceRedis.ttl('session:session-1');
      const targetTTL = await targetRedis.ttl('session:session-1');

      expect(targetTTL).toBeGreaterThan(0);
      expect(Math.abs(sourceTTL - targetTTL)).toBeLessThan(10); // Allow small difference
    });

    it('should handle migration with validation', async () => {
      const taskId = await sessionMigration.startFullMigration({
        validateAfter: true,
      });

      await waitForMigrationCompletion(taskId);

      const validationResults = await sessionMigration.validateMigration(taskId);

      expect(validationResults.totalChecked).toBe(3);
      expect(validationResults.passed).toBe(3);
      expect(validationResults.failed).toBe(0);

      validationResults.details.forEach(detail => {
        expect(detail.passed).toBe(true);
      });
    });
  });

  describe('Incremental Migration', () => {
    it('should migrate only recent sessions', async () => {
      // First, do a baseline migration
      const baselineTaskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(baselineTaskId);

      // Add new session to source after baseline
      await sourceRedis.hSet('session:session-4', {
        agentIds: JSON.stringify(['agent-4']),
        state: 'working',
        events: '1',
      });

      const newEvent = {
        seq: 1,
        type: 'created',
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'session',
          entityIds: ['session-4'],
          operation: 'created',
        },
        actor: 'agent-4',
      };

      await sourceRedis.zAdd('events:session-4', {
        score: 1,
        value: JSON.stringify(newEvent),
      });

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start incremental migration
      const incrementalTaskId = await sessionMigration.startIncrementalMigration(
        new Date(Date.now() - 1000).toISOString(), // Last 1 second
        { validateAfter: true }
      );

      await waitForMigrationCompletion(incrementalTaskId);

      const task = sessionMigration.getMigrationStatus(incrementalTaskId);
      expect(task?.status).toBe('completed');

      // Should have migrated the new session
      const targetSession4 = await targetRedis.hGetAll('session:session-4');
      expect(targetSession4.agentIds).toBe(JSON.stringify(['agent-4']));
    });

    it('should detect changes in existing sessions', async () => {
      // Modify an existing session
      await sourceRedis.zAdd('events:session-1', {
        score: 2,
        value: JSON.stringify({
          seq: 2,
          type: 'modified',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: ['func-new'],
            operation: 'modified',
          },
          actor: 'agent-1',
        }),
      });

      await sourceRedis.hSet('session:session-1', 'events', '2');

      const taskId = await sessionMigration.startIncrementalMigration(
        new Date(Date.now() - 1000).toISOString()
      );

      await waitForMigrationCompletion(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.migratedSessions).toBeGreaterThan(0);
    });
  });

  describe('Selective Migration', () => {
    it('should migrate only specified sessions', async () => {
      const selectedSessions = ['session-1', 'session-3'];
      const taskId = await sessionMigration.startSelectiveMigration(
        selectedSessions,
        { validateAfter: true }
      );

      await waitForMigrationCompletion(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.migratedSessions).toBe(2);

      // Verify only selected sessions were migrated
      const targetSessions = await targetRedis.keys('session:*');
      const targetSessionIds = targetSessions.map(key => key.replace('session:', ''));

      expect(targetSessionIds.sort()).toEqual(selectedSessions.sort());

      // Verify session-2 was not migrated
      const session2Exists = await targetRedis.exists('session:session-2');
      expect(session2Exists).toBe(0);
    });

    it('should handle non-existent sessions gracefully', async () => {
      const selectedSessions = ['session-1', 'non-existent-session', 'session-3'];
      const taskId = await sessionMigration.startSelectiveMigration(selectedSessions);

      await waitForMigrationCompletion(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.migratedSessions).toBe(2); // Only existing sessions
    });
  });

  describe('Cross-Instance Synchronization', () => {
    it('should setup cross-instance sync', async () => {
      const sessionId = 'session-1';
      await sessionMigration.setupCrossInstanceSync(
        sessionId,
        'target-instance',
        'manual'
      );

      const syncStatus = sessionMigration.getCrossInstanceStatus(sessionId);
      expect(syncStatus).toBeDefined();
      expect(syncStatus?.sessionId).toBe(sessionId);
      expect(syncStatus?.syncMode).toBe('manual');
      expect(syncStatus?.targetInstance).toBe('target-instance');
    });

    it('should sync session data between instances', async () => {
      const sessionId = 'session-1';

      // Setup cross-instance sync
      await sessionMigration.setupCrossInstanceSync(sessionId, 'target-instance');

      // Manually sync the session
      await sessionMigration.syncSession(sessionId);

      // Verify session was synced to target
      const targetSession = await targetRedis.hGetAll(`session:${sessionId}`);
      expect(targetSession).toBeDefined();
      expect(targetSession.state).toBe('working');

      const syncStatus = sessionMigration.getCrossInstanceStatus(sessionId);
      expect(syncStatus?.lastSyncTime).toBeDefined();
    });

    it('should detect and handle conflicts', async () => {
      const sessionId = 'session-1';

      // Create conflicting data in target
      await targetRedis.hSet(`session:${sessionId}`, {
        agentIds: JSON.stringify(['agent-1', 'agent-conflict']),
        state: 'broken', // Different from source
        events: '1',
      });

      await sessionMigration.setupCrossInstanceSync(sessionId, 'target-instance');

      // This should detect conflicts
      await sessionMigration.syncSession(sessionId);

      const syncStatus = sessionMigration.getCrossInstanceStatus(sessionId);
      expect(syncStatus?.conflicts.length).toBeGreaterThan(0);

      // Check specific conflicts
      const stateConflict = syncStatus?.conflicts.find(c => c.field === 'state');
      expect(stateConflict).toBeDefined();
      expect(stateConflict?.sourceValue).toBe('working');
      expect(stateConflict?.targetValue).toBe('broken');
    });

    it('should list all cross-instance sessions', async () => {
      const sessionIds = ['session-1', 'session-2'];

      for (const sessionId of sessionIds) {
        await sessionMigration.setupCrossInstanceSync(sessionId, 'target-instance');
      }

      const crossInstanceSessions = sessionMigration.listCrossInstanceSessions();
      expect(crossInstanceSessions).toHaveLength(2);

      const sessionIdsList = crossInstanceSessions.map(s => s.sessionId);
      expect(sessionIdsList.sort()).toEqual(sessionIds.sort());
    });
  });

  describe('Migration Validation', () => {
    it('should validate data integrity after migration', async () => {
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      const validationResults = await sessionMigration.validateMigration(taskId);

      expect(validationResults.totalChecked).toBe(3);
      expect(validationResults.passed).toBe(3);
      expect(validationResults.failed).toBe(0);

      validationResults.details.forEach(detail => {
        expect(detail.passed).toBe(true);
        expect(detail.mismatches).toBeUndefined();
      });
    });

    it('should detect data mismatches', async () => {
      // First migrate data
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      // Corrupt target data
      await targetRedis.hSet('session:session-1', 'state', 'corrupted');
      await targetRedis.hSet('session:session-2', 'agentIds', JSON.stringify(['wrong-agent']));

      // Validate migration
      const validationResults = await sessionMigration.validateMigration(taskId);

      expect(validationResults.failed).toBe(2);

      const session1Detail = validationResults.details.find(d => d.sessionId === 'session-1');
      expect(session1Detail?.passed).toBe(false);
      expect(session1Detail?.mismatches).toContain(expect.stringContaining('State mismatch'));

      const session2Detail = validationResults.details.find(d => d.sessionId === 'session-2');
      expect(session2Detail?.passed).toBe(false);
      expect(session2Detail?.mismatches).toContain('Agent IDs mismatch');
    });

    it('should handle validation errors gracefully', async () => {
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      // Delete a session from target to cause validation error
      await targetRedis.del('session:session-1');

      const validationResults = await sessionMigration.validateMigration(taskId);

      expect(validationResults.failed).toBeGreaterThan(0);

      const session1Detail = validationResults.details.find(d => d.sessionId === 'session-1');
      expect(session1Detail?.passed).toBe(false);
      expect(session1Detail?.mismatches).toContain('Session exists in only one instance');
    });
  });

  describe('Migration Management', () => {
    it('should track migration progress', async () => {
      const taskId = await sessionMigration.startFullMigration();

      // Check initial status
      let task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('running');
      expect(task?.progress.totalSessions).toBe(3);

      await waitForMigrationCompletion(taskId);

      // Check final status
      task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.endTime).toBeDefined();
      expect(task?.progress.migratedSessions).toBe(3);
    });

    it('should cancel running migration', async () => {
      const taskId = await sessionMigration.startFullMigration();

      // Immediately cancel
      await sessionMigration.cancelMigration(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('cancelled');
      expect(task?.endTime).toBeDefined();
    });

    it('should handle cancellation of non-existent migration', async () => {
      await expect(
        sessionMigration.cancelMigration('non-existent-task')
      ).rejects.toThrow('Migration task not found');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle batch processing efficiently', async () => {
      // Create many sessions for batch testing
      const sessionCount = 50;
      for (let i = 4; i <= sessionCount + 3; i++) {
        await sourceRedis.hSet(`session:session-${i}`, {
          agentIds: JSON.stringify([`agent-${i}`]),
          state: 'working',
          events: '1',
        });

        await sourceRedis.zAdd(`events:session-${i}`, {
          score: 1,
          value: JSON.stringify({
            seq: 1,
            type: 'created',
            timestamp: new Date().toISOString(),
            changeInfo: {
              elementType: 'session',
              entityIds: [`session-${i}`],
              operation: 'created',
            },
            actor: `agent-${i}`,
          }),
        });
      }

      const startTime = Date.now();
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);
      const duration = Date.now() - startTime;

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.migratedSessions).toBe(sessionCount); // 50 new + 3 original

      // Should complete within reasonable time (less than 30 seconds)
      expect(duration).toBeLessThan(30000);

      // Verify all sessions migrated
      const targetSessions = await targetRedis.keys('session:*');
      expect(targetSessions).toHaveLength(sessionCount);
    });

    it('should maintain performance with large events', async () => {
      const sessionId = 'large-session';
      const eventCount = 100;

      // Create session with many events
      await sourceRedis.hSet(`session:${sessionId}`, {
        agentIds: JSON.stringify(['agent-large']),
        state: 'working',
        events: eventCount.toString(),
      });

      const eventEntries = [];
      for (let i = 1; i <= eventCount; i++) {
        eventEntries.push({
          score: i,
          value: JSON.stringify({
            seq: i,
            type: 'modified',
            timestamp: new Date(Date.now() + i * 1000).toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: [`func-${i}`],
              operation: 'modified',
            },
            actor: 'agent-large',
            metadata: {
              largeData: 'x'.repeat(1000), // 1KB of data per event
            },
          }),
        });
      }

      await sourceRedis.zAdd(`events:${sessionId}`, eventEntries);

      const startTime = Date.now();
      const taskId = await sessionMigration.startSelectiveMigration([sessionId]);
      await waitForMigrationCompletion(taskId);
      const duration = Date.now() - startTime;

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');

      // Verify all events migrated
      const targetEvents = await targetRedis.zRange(`events:${sessionId}`, 0, -1);
      expect(targetEvents).toHaveLength(eventCount);

      // Should handle large session efficiently
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection failures', async () => {
      // Disconnect target Redis to simulate failure
      await targetRedis.quit();

      const taskId = await sessionMigration.startFullMigration();

      // Wait a moment for the migration to attempt and fail
      await new Promise(resolve => setTimeout(resolve, 1000));

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBeDefined();
    });

    it('should handle malformed session data', async () => {
      // Add malformed session data
      await sourceRedis.hSet('session:malformed', {
        agentIds: 'invalid-json',
        state: 'working',
        events: 'not-a-number',
      });

      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      const task = sessionMigration.getMigrationStatus(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress.failedSessions).toBeGreaterThan(0);
    });

    it('should handle validation timeouts', async () => {
      const taskId = await sessionMigration.startFullMigration();
      await waitForMigrationCompletion(taskId);

      // Simulate validation error by requesting validation for non-existent task
      await expect(
        sessionMigration.validateMigration('non-existent-task')
      ).rejects.toThrow('Migration task not found');
    });
  });

  // Helper function to wait for migration completion
  async function waitForMigrationCompletion(taskId: string, maxWaitTime = 30000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTime) {
      const task = sessionMigration.getMigrationStatus(taskId);
      if (task && ['completed', 'failed', 'cancelled'].includes(task.status)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Migration ${taskId} did not complete within ${maxWaitTime}ms`);
  }
});