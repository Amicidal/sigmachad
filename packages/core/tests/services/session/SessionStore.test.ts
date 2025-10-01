/**
 * SessionStore Unit Tests
 *
 * Comprehensive tests for Redis-backed session storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionStore } from '@memento/core/services/SessionStore';
import {
  SessionEvent,
  SessionCreationOptions,
  SessionNotFoundError,
  SessionError
} from '@memento/core/services/SessionTypes';

// Mock Redis
const mockRedis = {
  connect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue(undefined),
  exists: vi.fn(),
  hSet: vi.fn(),
  hGetAll: vi.fn(),
  hGet: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  zAdd: vi.fn(),
  zRange: vi.fn(),
  zRangeByScore: vi.fn(),
  zCard: vi.fn(),
  keys: vi.fn(),
  ttl: vi.fn(),
  ping: vi.fn().mockResolvedValue('PONG'),
  publish: vi.fn(),
  subscribe: vi.fn(),
  memory: vi.fn().mockResolvedValue(1024),
  on: vi.fn(),
};

const mockCreateClient = vi.fn(() => mockRedis);

vi.mock('redis', () => ({
  createClient: mockCreateClient,
}));

describe('SessionStore', () => {
  let sessionStore: SessionStore;
  const testConfig = {
    host: 'localhost',
    port: 6379,
    db: 15, // Use test database
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStore = new SessionStore(testConfig);
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    if (sessionStore) {
      await sessionStore.close();
    }
  });

  describe('Session Creation', () => {
    it('should create a new session successfully', async () => {
      const sessionId = 'test-session-1';
      const agentId = 'agent-1';
      const options: SessionCreationOptions = {
        ttl: 1800,
        metadata: { test: 'data' },
      };

      mockRedis.exists.mockResolvedValue(0); // Session doesn't exist
      mockRedis.hSet.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.zAdd.mockResolvedValue(1);

      await sessionStore.createSession(sessionId, agentId, options);

      expect(mockRedis.exists).toHaveBeenCalledWith('session:test-session-1');
      expect(mockRedis.hSet).toHaveBeenCalledWith('session:test-session-1', {
        agentIds: JSON.stringify([agentId]),
        state: 'working',
        events: '0',
        metadata: JSON.stringify(options.metadata),
      });
      expect(mockRedis.expire).toHaveBeenCalledWith('session:test-session-1', 1800);
      expect(mockRedis.zAdd).toHaveBeenCalledWith('events:test-session-1', { score: 0, value: 'INIT' });
    });

    it('should throw error if session already exists', async () => {
      const sessionId = 'existing-session';
      const agentId = 'agent-1';

      mockRedis.exists.mockResolvedValue(1); // Session exists

      await expect(sessionStore.createSession(sessionId, agentId))
        .rejects.toThrow('Session already exists');
    });

    it('should create session with initial entity IDs', async () => {
      const sessionId = 'test-session-2';
      const agentId = 'agent-1';
      const options: SessionCreationOptions = {
        initialEntityIds: ['entity-1', 'entity-2'],
      };

      mockRedis.exists.mockResolvedValue(0);
      mockRedis.hSet.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.zAdd.mockResolvedValue(1);

      await sessionStore.createSession(sessionId, agentId, options);

      // Should add initial event
      expect(mockRedis.zAdd).toHaveBeenCalledTimes(2); // INIT + initial event
    });
  });

  describe('Session Retrieval', () => {
    it('should get existing session', async () => {
      const sessionId = 'test-session';
      const mockSessionData = {
        agentIds: JSON.stringify(['agent-1', 'agent-2']),
        state: 'working',
        events: '5',
        metadata: JSON.stringify({ test: 'data' }),
      };

      const mockEvents = [
        JSON.stringify({
          seq: 1,
          type: 'start',
          timestamp: new Date().toISOString(),
          changeInfo: { elementType: 'session', entityIds: [], operation: 'init' },
          actor: 'agent-1',
        }),
      ];

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hGetAll.mockResolvedValue(mockSessionData);
      mockRedis.zRange.mockResolvedValue(mockEvents);

      const session = await sessionStore.getSession(sessionId);

      expect(session).toBeTruthy();
      expect(session!.sessionId).toBe(sessionId);
      expect(session!.agentIds).toEqual(['agent-1', 'agent-2']);
      expect(session!.state).toBe('working');
      expect(session!.events).toHaveLength(1);
    });

    it('should return null for non-existent session', async () => {
      const sessionId = 'non-existent';

      mockRedis.exists.mockResolvedValue(0);

      const session = await sessionStore.getSession(sessionId);

      expect(session).toBeNull();
    });
  });

  describe('Session Updates', () => {
    it('should update session data', async () => {
      const sessionId = 'test-session';
      const updates = {
        state: 'broken' as const,
        agentIds: ['agent-1', 'agent-2', 'agent-3'],
      };

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.hSet.mockResolvedValue(1);

      await sessionStore.updateSession(sessionId, updates);

      expect(mockRedis.hSet).toHaveBeenCalledWith('session:test-session', {
        agentIds: JSON.stringify(updates.agentIds),
        state: updates.state,
      });
    });

    it('should throw error for non-existent session', async () => {
      const sessionId = 'non-existent';
      const updates = { state: 'broken' as const };

      mockRedis.exists.mockResolvedValue(0);

      await expect(sessionStore.updateSession(sessionId, updates))
        .rejects.toThrow(SessionNotFoundError);
    });
  });

  describe('Event Management', () => {
    it('should add event to session', async () => {
      const sessionId = 'test-session';
      const event: SessionEvent = {
        seq: 1,
        type: 'modified',
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'function',
          entityIds: ['entity-1'],
          operation: 'modified',
        },
        actor: 'agent-1',
      };

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.hSet.mockResolvedValue(1);

      await sessionStore.addEvent(sessionId, event);

      expect(mockRedis.zAdd).toHaveBeenCalledWith('events:test-session', {
        score: event.seq,
        value: JSON.stringify(event),
      });
    });

    it('should update session state when event has state transition', async () => {
      const sessionId = 'test-session';
      const event: SessionEvent = {
        seq: 2,
        type: 'broke',
        timestamp: new Date().toISOString(),
        changeInfo: {
          elementType: 'function',
          entityIds: ['entity-1'],
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

      mockRedis.exists.mockResolvedValue(1);
      mockRedis.zAdd.mockResolvedValue(1);
      mockRedis.hSet.mockResolvedValue(1);

      await sessionStore.addEvent(sessionId, event);

      expect(mockRedis.hSet).toHaveBeenCalledWith('session:test-session', {
        state: 'broken',
      });
    });

    it('should get events by sequence range', async () => {
      const sessionId = 'test-session';
      const mockEvents = [
        JSON.stringify({ seq: 3, type: 'test_pass' }),
        JSON.stringify({ seq: 4, type: 'modified' }),
        JSON.stringify({ seq: 5, type: 'broke' }),
      ];

      mockRedis.zRangeByScore.mockResolvedValue(mockEvents);

      const events = await sessionStore.getEvents(sessionId, 3, 5);

      expect(mockRedis.zRangeByScore).toHaveBeenCalledWith('events:test-session', 3, 5);
      expect(events).toHaveLength(3);
      expect(events[0].seq).toBe(3);
      expect(events[2].seq).toBe(5);
    });

    it('should get recent events', async () => {
      const sessionId = 'test-session';
      const mockEvents = [
        'INIT', // Should be filtered out
        JSON.stringify({ seq: 8, type: 'modified' }),
        JSON.stringify({ seq: 9, type: 'checkpoint' }),
      ];

      mockRedis.zRange.mockResolvedValue(mockEvents);

      const events = await sessionStore.getRecentEvents(sessionId, 10);

      expect(mockRedis.zRange).toHaveBeenCalledWith('events:test-session', -10, -1);
      expect(events).toHaveLength(2); // INIT filtered out
      expect(events[0].seq).toBe(8);
      expect(events[1].seq).toBe(9);
    });
  });

  describe('Agent Management', () => {
    it('should add agent to session', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-2';

      mockRedis.hGetAll.mockResolvedValue({
        agentIds: JSON.stringify(['agent-1']),
        state: 'working',
      });
      mockRedis.hSet.mockResolvedValue(1);

      await sessionStore.addAgent(sessionId, agentId);

      expect(mockRedis.hSet).toHaveBeenCalledWith('session:test-session', {
        agentIds: JSON.stringify(['agent-1', 'agent-2']),
      });
    });

    it('should remove agent from session', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-2';

      mockRedis.hGetAll.mockResolvedValue({
        agentIds: JSON.stringify(['agent-1', 'agent-2']),
        state: 'working',
      });
      mockRedis.hSet.mockResolvedValue(1);

      await sessionStore.removeAgent(sessionId, agentId);

      expect(mockRedis.hSet).toHaveBeenCalledWith('session:test-session', {
        agentIds: JSON.stringify(['agent-1']),
      });
    });

    it('should set grace TTL when last agent removed', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-1';

      mockRedis.hGetAll.mockResolvedValue({
        agentIds: JSON.stringify(['agent-1']),
        state: 'working',
      });
      mockRedis.expire.mockResolvedValue(1);

      await sessionStore.removeAgent(sessionId, agentId);

      expect(mockRedis.expire).toHaveBeenCalledWith('session:test-session', 300);
      expect(mockRedis.expire).toHaveBeenCalledWith('events:test-session', 300);
    });
  });

  describe('TTL Management', () => {
    it('should set TTL for session and events', async () => {
      const sessionId = 'test-session';
      const ttl = 1800;

      mockRedis.expire.mockResolvedValue(1);

      await sessionStore.setTTL(sessionId, ttl);

      expect(mockRedis.expire).toHaveBeenCalledWith('session:test-session', ttl);
      expect(mockRedis.expire).toHaveBeenCalledWith('events:test-session', ttl);
    });
  });

  describe('Pub/Sub Operations', () => {
    it('should publish session update', async () => {
      const sessionId = 'test-session';
      const message = { type: 'modified', seq: 5 };

      mockRedis.publish.mockResolvedValue(1);

      await sessionStore.publishSessionUpdate(sessionId, message);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'session:test-session',
        JSON.stringify(message)
      );
    });

    it('should subscribe to session updates', async () => {
      const sessionId = 'test-session';
      const callback = vi.fn();

      mockRedis.subscribe.mockResolvedValue(undefined);

      await sessionStore.subscribeToSession(sessionId, callback);

      expect(mockRedis.subscribe).toHaveBeenCalledWith(
        'session:test-session',
        expect.any(Function)
      );
    });
  });

  describe('Administrative Operations', () => {
    it('should get session statistics', async () => {
      mockRedis.keys.mockResolvedValue(['session:1', 'session:2', 'session:3']);
      mockRedis.hGetAll.mockResolvedValue({
        agentIds: JSON.stringify(['agent-1', 'agent-2']),
      });
      mockRedis.zCard.mockResolvedValue(5);
      mockRedis.memory.mockResolvedValue(2048);

      const stats = await sessionStore.getStats();

      expect(stats.activeSessions).toBe(3);
      expect(stats.agentsActive).toBeGreaterThan(0);
      expect(stats.redisMemoryUsage).toBe(2048);
    });

    it('should list active sessions', async () => {
      mockRedis.keys.mockResolvedValue([
        'session:sess-1',
        'session:sess-2',
        'session:sess-3',
      ]);

      const sessions = await sessionStore.listActiveSessions();

      expect(sessions).toEqual(['sess-1', 'sess-2', 'sess-3']);
    });

    it('should cleanup expired sessions', async () => {
      mockRedis.keys.mockResolvedValue(['session:1', 'session:2']);
      mockRedis.ttl
        .mockResolvedValueOnce(-1) // Expired
        .mockResolvedValueOnce(3600); // Not expired
      mockRedis.del.mockResolvedValue(2);

      await sessionStore.cleanup();

      expect(mockRedis.del).toHaveBeenCalledWith(['session:1', 'events:1']);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when Redis is responsive', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const health = await sessionStore.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.error).toBeUndefined();
    });

    it('should return unhealthy status when Redis is unresponsive', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const health = await sessionStore.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBe('Connection failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis connection lost'));

      await expect(sessionStore.getSession('test'))
        .rejects.toThrow(SessionError);
    });

    it('should emit error events on Redis failures', async () => {
      const errorHandler = vi.fn();
      sessionStore.on('error', errorHandler);

      // Simulate Redis error
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      try {
        await sessionStore.exists('test-session');
      } catch (_error) {
        // Expected to throw
      }

      // Should not emit error for this case since it's handled in exists()
      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe('Session Existence Check', () => {
    it('should return true for existing session', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const exists = await sessionStore.exists('test-session');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const exists = await sessionStore.exists('test-session');

      expect(exists).toBe(false);
    });

    it('should return false on Redis error', async () => {
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const exists = await sessionStore.exists('test-session');

      expect(exists).toBe(false);
    });
  });
});
