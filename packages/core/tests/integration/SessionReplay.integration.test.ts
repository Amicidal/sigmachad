/**
 * Session Replay Integration Tests
 *
 * Comprehensive tests for session replay functionality including:
 * - Recording session events with snapshots
 * - Playback with various options and speeds
 * - Delta compression and validation
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { SessionReplay, ReplayConfig } from '../../src/services/SessionReplay.js';
import { SessionDocument, SessionEvent } from '../../src/services/SessionTypes.js';

describe('SessionReplay Integration Tests', () => {
  let redis: RedisClientType;
  let sessionReplay: SessionReplay;
  const testDbIndex = 15; // Use test database

  const replayConfig: ReplayConfig = {
    compressionEnabled: true,
    snapshotInterval: 5, // 5 seconds for testing
    maxReplayDuration: 300, // 5 minutes for testing
    enableStateValidation: true,
    enableDeltaCompression: true,
  };

  beforeEach(async () => {
    // Create Redis client for testing
    redis = createRedisClient({
      url: `redis://localhost:6379/${testDbIndex}`,
    });
    await redis.connect();
    await redis.flushDb(); // Clean test database

    sessionReplay = new SessionReplay(redis, replayConfig);
  });

  afterEach(async () => {
    if (sessionReplay) {
      await sessionReplay.shutdown();
    }
    if (redis) {
      await redis.flushDb();
      await redis.quit();
    }
  });

  describe('Session Recording', () => {
    it('should record complete session lifecycle', async () => {
      const sessionId = 'test-session-1';
      const initialState: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
        metadata: { project: 'test' },
      };

      // Start recording
      await sessionReplay.startRecording(sessionId, initialState);

      // Record multiple events
      const events: Omit<SessionEvent, 'seq' | 'timestamp'>[] = [
        {
          type: 'modified',
          changeInfo: {
            elementType: 'function',
            entityIds: ['func-1'],
            operation: 'modified',
          },
          actor: 'agent-1',
        },
        {
          type: 'handoff',
          changeInfo: {
            elementType: 'session',
            entityIds: [],
            operation: 'modified',
          },
          actor: 'agent-2',
        },
        {
          type: 'checkpoint',
          changeInfo: {
            elementType: 'session',
            entityIds: ['func-1'],
            operation: 'checkpoint',
          },
          actor: 'agent-1',
        },
      ];

      for (let i = 0; i < events.length; i++) {
        const event: SessionEvent = {
          ...events[i],
          seq: i + 1,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        };

        const updatedState: SessionDocument = {
          ...initialState,
          agentIds: event.type === 'handoff' ? ['agent-1', 'agent-2'] : initialState.agentIds,
          events: [...initialState.events, event],
        };

        await sessionReplay.recordEvent(sessionId, event, updatedState);
      }

      // Stop recording
      const replayId = await sessionReplay.stopRecording(sessionId);

      expect(replayId).toBeDefined();
      expect(replayId).toMatch(/^replay:test-session-1:\d+$/);

      // Verify replay was stored
      const replay = await sessionReplay.getReplay(replayId);
      expect(replay).toBeDefined();
      expect(replay!.originalSessionId).toBe(sessionId);
      expect(replay!.frames).toHaveLength(events.length + 1); // +1 for initial snapshot
      expect(replay!.metadata.validationPassed).toBe(true);
    });

    it('should create periodic snapshots during recording', async () => {
      const sessionId = 'test-session-2';
      const initialState: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      await sessionReplay.startRecording(sessionId, initialState);

      // Record 75 events to trigger periodic snapshots (every 50 events)
      for (let i = 0; i < 75; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i + 1,
          timestamp: new Date(Date.now() + i * 100).toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: 'agent-1',
        };

        const updatedState: SessionDocument = {
          ...initialState,
          events: [...Array(i + 1)].map((_, idx) => ({
            type: 'modified',
            seq: idx + 1,
            timestamp: new Date(Date.now() + idx * 100).toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: [`func-${idx}`],
              operation: 'modified',
            },
            actor: 'agent-1',
          })),
        };

        await sessionReplay.recordEvent(sessionId, event, updatedState);
      }

      const replayId = await sessionReplay.stopRecording(sessionId);
      const replay = await sessionReplay.getReplay(replayId);

      expect(replay).toBeDefined();

      // Should have snapshots at the beginning and after every 50 events
      const snapshotFrames = replay!.frames.filter(f => f.snapshot);
      expect(snapshotFrames.length).toBeGreaterThanOrEqual(2); // Initial + at least one periodic
    });

    it('should handle delta compression correctly', async () => {
      const sessionId = 'test-session-3';
      const initialState: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      await sessionReplay.startRecording(sessionId, initialState);

      // Record state change event
      const stateChangeEvent: SessionEvent = {
        type: 'broke',
        seq: 1,
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'function',
          entityIds: ['func-1'],
          operation: 'modified',
        },
        stateTransition: {
          from: 'working',
          to: 'broken',
          verifiedBy: 'test',
          confidence: 0.95,
        },
        actor: 'agent-1',
      };

      const updatedState: SessionDocument = {
        ...initialState,
        state: 'broken',
        events: [stateChangeEvent],
      };

      await sessionReplay.recordEvent(sessionId, stateChangeEvent, updatedState);

      // Record agent change event
      const agentChangeEvent: SessionEvent = {
        type: 'handoff',
        seq: 2,
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'session',
          entityIds: [],
          operation: 'modified',
        },
        actor: 'agent-2',
      };

      const finalState: SessionDocument = {
        ...updatedState,
        agentIds: ['agent-1', 'agent-2'],
        events: [stateChangeEvent, agentChangeEvent],
      };

      await sessionReplay.recordEvent(sessionId, agentChangeEvent, finalState);

      const replayId = await sessionReplay.stopRecording(sessionId);
      const replay = await sessionReplay.getReplay(replayId);

      expect(replay).toBeDefined();

      // Check delta compression data
      const framesWithDelta = replay!.frames.filter(f => f.deltaData);
      expect(framesWithDelta.length).toBeGreaterThan(0);

      // Verify delta content
      const stateChangeFrame = replay!.frames.find(f =>
        f.event?.type === 'broke' && f.deltaData
      );
      expect(stateChangeFrame?.deltaData).toHaveProperty('stateChange');

      const agentChangeFrame = replay!.frames.find(f =>
        f.event?.type === 'handoff' && f.deltaData
      );
      expect(agentChangeFrame?.deltaData).toHaveProperty('agentChange');
    });
  });

  describe('Session Playback', () => {
    let testReplayId: string;

    beforeEach(async () => {
      // Setup a recorded session for playback tests
      const sessionId = 'playback-test-session';
      const initialState: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      await sessionReplay.startRecording(sessionId, initialState);

      // Record several events with different timing
      const events = [
        { delay: 0, type: 'modified' as const, actor: 'agent-1' },
        { delay: 1000, type: 'handoff' as const, actor: 'agent-2' },
        { delay: 2000, type: 'checkpoint' as const, actor: 'agent-1' },
        { delay: 3000, type: 'broke' as const, actor: 'agent-2' },
      ];

      for (let i = 0; i < events.length; i++) {
        const { delay, type, actor } = events[i];
        const event: SessionEvent = {
          type,
          seq: i + 1,
          timestamp: new Date(Date.now() + delay).toISOString(),
          changeInfo: {
            elementType: type === 'handoff' ? 'session' : 'function',
            entityIds: type === 'handoff' ? [] : [`entity-${i}`],
            operation: type === 'checkpoint' ? 'checkpoint' : 'modified',
          },
          actor,
          ...(type === 'broke' && {
            stateTransition: {
              from: 'working',
              to: 'broken',
              verifiedBy: 'test',
              confidence: 0.95,
            },
          }),
        };

        await sessionReplay.recordEvent(sessionId, event);
      }

      testReplayId = await sessionReplay.stopRecording(sessionId);
    });

    it('should replay session with correct timing', async () => {
      const replaySession = await sessionReplay.startReplay(testReplayId);
      expect(replaySession).toBeDefined();

      const playedFrames: Array<{ frame: any; timestamp: number }> = [];
      const startTime = Date.now();

      await sessionReplay.playReplay(
        replaySession,
        async (frame, index) => {
          playedFrames.push({
            frame,
            timestamp: Date.now() - startTime,
          });
        },
        { speed: 10 } // 10x speed for faster testing
      );

      expect(playedFrames).toHaveLength(replaySession.frames.length);

      // Verify timing intervals (accounting for 10x speed)
      for (let i = 1; i < playedFrames.length; i++) {
        const prevFrame = playedFrames[i - 1];
        const currentFrame = playedFrames[i];
        const expectedInterval = 100; // 1000ms / 10x speed
        const actualInterval = currentFrame.timestamp - prevFrame.timestamp;

        // Allow some tolerance for timing
        expect(actualInterval).toBeGreaterThanOrEqual(expectedInterval - 50);
        expect(actualInterval).toBeLessThanOrEqual(expectedInterval + 200);
      }
    });

    it('should support filtered playback', async () => {
      const replaySession = await sessionReplay.startReplay(testReplayId, {
        filterEventTypes: ['handoff', 'broke'],
        onlyAgents: ['agent-2'],
      });

      expect(replaySession.frames.length).toBeLessThan(5); // Original had 5 frames (including snapshot)

      const playedFrames: any[] = [];
      await sessionReplay.playReplay(
        replaySession,
        async (frame) => {
          playedFrames.push(frame);
        },
        { speed: 0 } // No delay for testing
      );

      // Verify only filtered events are present
      const eventFrames = playedFrames.filter(f => f.event);
      eventFrames.forEach(frame => {
        expect(['handoff', 'broke']).toContain(frame.event.type);
        expect(frame.event.actor).toBe('agent-2');
      });
    });

    it('should support sequence range playback', async () => {
      const replaySession = await sessionReplay.startReplay(testReplayId, {
        startFromSequence: 2,
        endAtSequence: 3,
      });

      const playedFrames: any[] = [];
      await sessionReplay.playReplay(
        replaySession,
        async (frame) => {
          playedFrames.push(frame);
        },
        { speed: 0 }
      );

      const eventFrames = playedFrames.filter(f => f.event);
      eventFrames.forEach(frame => {
        expect(frame.event.seq).toBeGreaterThanOrEqual(2);
        expect(frame.event.seq).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Validation and Integrity', () => {
    it('should validate replay integrity', async () => {
      const sessionId = 'validation-test';
      const initialState: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      await sessionReplay.startRecording(sessionId, initialState);

      // Record events with proper sequence
      for (let i = 1; i <= 5; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: 'agent-1',
        };

        await sessionReplay.recordEvent(sessionId, event);
      }

      const replayId = await sessionReplay.stopRecording(sessionId);
      const replay = await sessionReplay.getReplay(replayId);

      expect(replay!.metadata.validationPassed).toBe(true);
    });

    it('should detect and report validation failures', async () => {
      const sessionId = 'invalid-test';
      await sessionReplay.startRecording(sessionId);

      // Manually insert invalid data to test validation
      const replaySession = (sessionReplay as any).activeReplays.get(sessionId);
      if (replaySession) {
        // Add frame with out-of-order sequence
        replaySession.frames.push({
          timestamp: new Date().toISOString(),
          sequenceNumber: 10,
          event: {
            type: 'modified',
            seq: 2, // Lower sequence after higher one
            timestamp: new Date().toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: ['func-1'],
              operation: 'modified',
            },
            actor: 'agent-1',
          },
        });

        replaySession.frames.push({
          timestamp: new Date().toISOString(),
          sequenceNumber: 11,
          event: {
            type: 'modified',
            seq: 1, // Even lower sequence
            timestamp: new Date().toISOString(),
            changeInfo: {
              elementType: 'function',
              entityIds: ['func-2'],
              operation: 'modified',
            },
            actor: 'agent-1',
          },
        });
      }

      const replayId = await sessionReplay.stopRecording(sessionId);
      const replay = await sessionReplay.getReplay(replayId);

      expect(replay!.metadata.validationPassed).toBe(false);
    });
  });

  describe('Replay Management', () => {
    it('should list replays with metadata', async () => {
      // Create multiple replays
      const sessionIds = ['list-test-1', 'list-test-2', 'list-test-3'];

      for (const sessionId of sessionIds) {
        await sessionReplay.startRecording(sessionId);

        const event: SessionEvent = {
          type: 'modified',
          seq: 1,
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: ['func-1'],
            operation: 'modified',
          },
          actor: 'agent-1',
        };

        await sessionReplay.recordEvent(sessionId, event);
        await sessionReplay.stopRecording(sessionId);
      }

      const replays = await sessionReplay.listReplays(10);

      expect(replays.length).toBe(sessionIds.length);

      replays.forEach(replay => {
        expect(replay.replayId).toBeDefined();
        expect(replay.metadata.originalSessionId).toBeDefined();
        expect(replay.metadata.status).toBe('completed');
      });
    });

    it('should get comprehensive replay statistics', async () => {
      // Create a few replays with different characteristics
      await sessionReplay.startRecording('stats-test-1');
      for (let i = 0; i < 10; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i + 1,
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: 'agent-1',
        };
        await sessionReplay.recordEvent('stats-test-1', event);
      }
      await sessionReplay.stopRecording('stats-test-1');

      await sessionReplay.startRecording('stats-test-2');
      for (let i = 0; i < 5; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i + 1,
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: 'agent-1',
        };
        await sessionReplay.recordEvent('stats-test-2', event);
      }
      await sessionReplay.stopRecording('stats-test-2');

      const stats = await sessionReplay.getReplayStats();

      expect(stats.totalSessions).toBe(2);
      expect(stats.totalFrames).toBeGreaterThan(15); // 10 + 5 events + snapshots
      expect(stats.storageUsed).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThan(0);
      expect(stats.averageSessionDuration).toBeGreaterThanOrEqual(0);
      expect(stats.oldestReplay).toBeDefined();
      expect(stats.newestReplay).toBeDefined();
    });

    it('should delete replays correctly', async () => {
      await sessionReplay.startRecording('delete-test');
      const event: SessionEvent = {
        type: 'modified',
        seq: 1,
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'function',
          entityIds: ['func-1'],
          operation: 'modified',
        },
        actor: 'agent-1',
      };
      await sessionReplay.recordEvent('delete-test', event);
      const replayId = await sessionReplay.stopRecording('delete-test');

      // Verify replay exists
      let replay = await sessionReplay.getReplay(replayId);
      expect(replay).toBeDefined();

      // Delete replay
      await sessionReplay.deleteReplay(replayId);

      // Verify replay is gone
      replay = await sessionReplay.getReplay(replayId);
      expect(replay).toBeNull();
    });

    it('should cleanup old replays', async () => {
      // Create replays with different ages (simulated by manipulating timestamps)
      const oldReplayIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        await sessionReplay.startRecording(`cleanup-test-${i}`);
        const replayId = await sessionReplay.stopRecording(`cleanup-test-${i}`);
        oldReplayIds.push(replayId);
      }

      // Manually set old timestamps in Redis for testing
      for (const replayId of oldReplayIds) {
        const oldTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
        await redis.zAdd('replay:index', { score: oldTimestamp, value: replayId });
      }

      const removedCount = await sessionReplay.cleanupOldReplays(7); // Remove replays older than 7 days

      expect(removedCount).toBe(oldReplayIds.length);

      // Verify replays are gone
      for (const replayId of oldReplayIds) {
        const replay = await sessionReplay.getReplay(replayId);
        expect(replay).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle recording errors gracefully', async () => {
      const sessionId = 'error-test';

      // Start recording
      await sessionReplay.startRecording(sessionId);

      // Try to stop recording for non-existent session
      await expect(
        sessionReplay.stopRecording('non-existent-session')
      ).rejects.toThrow('No active replay found');

      // Cleanup
      await sessionReplay.stopRecording(sessionId);
    });

    it('should handle Redis connection errors', async () => {
      // Disconnect Redis to simulate connection error
      await redis.quit();

      const sessionId = 'redis-error-test';

      await expect(
        sessionReplay.startRecording(sessionId)
      ).rejects.toThrow();
    });

    it('should handle corrupted replay data', async () => {
      // Create a valid replay first
      await sessionReplay.startRecording('corrupt-test');
      const replayId = await sessionReplay.stopRecording('corrupt-test');

      // Corrupt the frames data
      await redis.zAdd(`replay:frames:${replayId}`, { score: 1, value: 'invalid-json' });

      await expect(
        sessionReplay.getReplay(replayId)
      ).rejects.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large sessions efficiently', async () => {
      const sessionId = 'large-session-test';
      const eventCount = 1000;

      await sessionReplay.startRecording(sessionId);

      const startTime = Date.now();

      // Record many events
      for (let i = 0; i < eventCount; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i + 1,
          timestamp: new Date(Date.now() + i).toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: `agent-${i % 3 + 1}`,
        };

        await sessionReplay.recordEvent(sessionId, event);
      }

      const replayId = await sessionReplay.stopRecording(sessionId);
      const recordingTime = Date.now() - startTime;

      // Should complete within reasonable time (less than 10 seconds)
      expect(recordingTime).toBeLessThan(10000);

      const replay = await sessionReplay.getReplay(replayId);
      expect(replay!.frames.length).toBeGreaterThan(eventCount); // Events + snapshots

      // Test playback performance
      const playbackStartTime = Date.now();
      let frameCount = 0;

      await sessionReplay.playReplay(
        replay!,
        async () => {
          frameCount++;
        },
        { speed: 0 } // No delay for performance test
      );

      const playbackTime = Date.now() - playbackStartTime;
      expect(playbackTime).toBeLessThan(5000); // Should be fast with no delay
      expect(frameCount).toBe(replay!.frames.length);
    });

    it('should maintain bounded memory usage', async () => {
      const sessionId = 'memory-test';

      await sessionReplay.startRecording(sessionId);

      // Get initial memory stats
      const initialMemory = await redis.memory('USAGE', `replay:frames:replay:${sessionId}:*`);

      // Record events and monitor memory
      for (let i = 0; i < 100; i++) {
        const event: SessionEvent = {
          type: 'modified',
          seq: i + 1,
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: [`func-${i}`],
            operation: 'modified',
          },
          actor: 'agent-1',
        };

        await sessionReplay.recordEvent(sessionId, event);
      }

      const replayId = await sessionReplay.stopRecording(sessionId);

      // Check final memory usage
      const finalMemory = await redis.memory('USAGE', `replay:frames:${replayId}`);

      // Memory usage should be reasonable (less than 1MB for 100 events)
      expect(finalMemory).toBeLessThan(1024 * 1024);

      // Cleanup should free memory
      await sessionReplay.deleteReplay(replayId);

      const afterCleanupMemory = await redis.memory('USAGE', `replay:frames:${replayId}`);
      expect(afterCleanupMemory).toBe(0);
    });
  });
});