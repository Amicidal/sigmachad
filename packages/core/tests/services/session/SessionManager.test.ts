/**
 * SessionManager Unit Tests
 *
 * Tests for the main session management service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../../../src/services/SessionManager.js';
import { SessionStore } from '../../../src/services/SessionStore.js';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  SessionManagerConfig,
  SessionNotFoundError,
} from '../../../src/services/SessionTypes.js';

// Mock SessionStore
vi.mock('../../../src/services/SessionStore.js');

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockSessionStore: any;
  let mockKnowledgeGraph: any;

  const testConfig: SessionManagerConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
      db: 15,
    },
    defaultTTL: 1800,
    checkpointInterval: 5,
    maxEventsPerSession: 100,
    graceTTL: 180,
    enableFailureSnapshots: false,
    pubSubChannels: {
      global: 'test:global:sessions',
      session: 'test:session:',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock store instance
    mockSessionStore = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      updateSession: vi.fn(),
      deleteSession: vi.fn(),
      addEvent: vi.fn(),
      getEvents: vi.fn(),
      getRecentEvents: vi.fn(),
      addAgent: vi.fn(),
      removeAgent: vi.fn(),
      setTTL: vi.fn(),
      exists: vi.fn(),
      publishSessionUpdate: vi.fn(),
      subscribeToSession: vi.fn(),
      getStats: vi.fn(),
      listActiveSessions: vi.fn(),
      cleanup: vi.fn(),
      healthCheck: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
    };

    // Mock the constructor
    (SessionStore as any).mockImplementation(() => mockSessionStore);

    // Create mock knowledge graph
    mockKnowledgeGraph = {
      query: vi.fn(),
      neo4j: {
        query: vi.fn(),
      },
    };

    sessionManager = new SessionManager(testConfig, mockKnowledgeGraph);
  });

  afterEach(async () => {
    if (sessionManager) {
      await sessionManager.close();
    }
  });

  describe('Session Creation', () => {
    it('should create a new session successfully', async () => {
      const agentId = 'agent-1';
      const options: SessionCreationOptions = {
        ttl: 1800,
        metadata: { project: 'test' },
      };

      mockSessionStore.createSession.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);

      const sessionId = await sessionManager.createSession(agentId, options);

      expect(sessionId).toBe('sess-mock-uuid-1234');
      expect(mockSessionStore.createSession).toHaveBeenCalledWith(
        sessionId,
        agentId,
        { ...options, ttl: 1800 }
      );
      expect(mockSessionStore.publishSessionUpdate).toHaveBeenCalledWith(
        'test:global:sessions',
        {
          type: 'new',
          sessionId,
          initiator: agentId,
        }
      );
    });

    it('should use default TTL when not specified', async () => {
      const agentId = 'agent-1';

      mockSessionStore.createSession.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);

      await sessionManager.createSession(agentId);

      expect(mockSessionStore.createSession).toHaveBeenCalledWith(
        expect.any(String),
        agentId,
        { ttl: 1800 } // Default TTL from config
      );
    });
  });

  describe('Session Joining and Leaving', () => {
    it('should allow agent to join existing session', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-2';

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      mockSessionStore.getSession.mockResolvedValue(mockSession);
      mockSessionStore.addAgent.mockResolvedValue(undefined);
      mockSessionStore.addEvent.mockResolvedValue(undefined);
      mockSessionStore.subscribeToSession.mockResolvedValue(undefined);

      await sessionManager.joinSession(sessionId, agentId);

      expect(mockSessionStore.addAgent).toHaveBeenCalledWith(sessionId, agentId);
      expect(mockSessionStore.subscribeToSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Function)
      );
    });

    it('should throw error when joining non-existent session', async () => {
      const sessionId = 'non-existent';
      const agentId = 'agent-1';

      mockSessionStore.getSession.mockResolvedValue(null);

      await expect(sessionManager.joinSession(sessionId, agentId))
        .rejects.toThrow(SessionNotFoundError);
    });

    it('should allow agent to leave session', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-1';

      mockSessionStore.removeAgent.mockResolvedValue(undefined);
      mockSessionStore.addEvent.mockResolvedValue(undefined);

      await sessionManager.leaveSession(sessionId, agentId);

      expect(mockSessionStore.removeAgent).toHaveBeenCalledWith(sessionId, agentId);
    });
  });

  describe('Event Emission', () => {
    it('should emit event with sequence number and timestamp', async () => {
      const sessionId = 'test-session';
      const actor = 'agent-1';
      const eventData = {
        type: 'modified' as const,
        changeInfo: {
          elementType: 'function' as const,
          entityIds: ['entity-1'],
          operation: 'modified' as const,
        },
      };

      mockSessionStore.addEvent.mockResolvedValue(undefined);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);

      await sessionManager.emitEvent(sessionId, eventData, actor);

      expect(mockSessionStore.addEvent).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          ...eventData,
          seq: 1, // First event
          timestamp: expect.any(String),
          actor,
        })
      );
      expect(mockSessionStore.setTTL).toHaveBeenCalledWith(sessionId, 1800);
    });

    it('should increment sequence numbers correctly', async () => {
      const sessionId = 'test-session';
      const actor = 'agent-1';
      const eventData = {
        type: 'modified' as const,
        changeInfo: {
          elementType: 'function' as const,
          entityIds: ['entity-1'],
          operation: 'modified' as const,
        },
      };

      mockSessionStore.addEvent.mockResolvedValue(undefined);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);

      // Emit first event
      await sessionManager.emitEvent(sessionId, eventData, actor);
      // Emit second event
      await sessionManager.emitEvent(sessionId, eventData, actor);

      expect(mockSessionStore.addEvent).toHaveBeenNthCalledWith(
        1,
        sessionId,
        expect.objectContaining({ seq: 1 })
      );
      expect(mockSessionStore.addEvent).toHaveBeenNthCalledWith(
        2,
        sessionId,
        expect.objectContaining({ seq: 2 })
      );
    });

    it('should trigger auto-checkpoint at interval', async () => {
      const sessionId = 'test-session';
      const actor = 'agent-1';
      const eventData = {
        type: 'modified' as const,
        changeInfo: {
          elementType: 'function' as const,
          entityIds: ['entity-1'],
          operation: 'modified' as const,
        },
      };

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      mockSessionStore.addEvent.mockResolvedValue(undefined);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      mockSessionStore.getSession.mockResolvedValue(mockSession);

      // Emit 5 events (matches checkpointInterval)
      for (let i = 0; i < 5; i++) {
        await sessionManager.emitEvent(sessionId, eventData, actor);
      }

      // The 5th event should trigger checkpoint
      expect(mockSessionStore.getSession).toHaveBeenCalled();
    });
  });

  describe('Checkpointing', () => {
    it('should create checkpoint and set grace TTL', async () => {
      const sessionId = 'test-session';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'modified',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: mockEvents,
      };

      mockSessionStore.getSession.mockResolvedValue(mockSession);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      mockKnowledgeGraph.query.mockResolvedValue([]);

      const checkpointId = await sessionManager.checkpoint(sessionId);

      expect(checkpointId).toMatch(/^cp-\d+-[a-z0-9]+$/);
      expect(mockSessionStore.setTTL).toHaveBeenCalledWith(sessionId, 180); // Grace TTL
      expect(mockSessionStore.publishSessionUpdate).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'checkpoint_complete',
          checkpointId,
        })
      );
    });

    it('should append KG anchor when knowledge graph is available', async () => {
      const sessionId = 'test-session';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'modified',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1', 'entity-2'],
            operation: 'modified',
          },
          impact: {
            severity: 'high',
            perfDelta: -10,
          },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: mockEvents,
      };

      mockSessionStore.getSession.mockResolvedValue(mockSession);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      mockKnowledgeGraph.query.mockResolvedValue([]);

      await sessionManager.checkpoint(sessionId);

      expect(mockKnowledgeGraph.query).toHaveBeenCalledWith(
        expect.stringContaining('UNWIND $entityIds'),
        expect.objectContaining({
          entityIds: ['entity-1', 'entity-2'],
          anchor: expect.objectContaining({
            sessionId,
            outcome: 'working',
            keyImpacts: ['entity-1'], // High severity impact
            perfDelta: -10,
            actors: ['agent-1'],
          }),
        })
      );
    });

    it('should handle broken state detection', async () => {
      const sessionId = 'test-session';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
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
          impact: {
            severity: 'critical',
          },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'broken',
        events: mockEvents,
      };

      mockSessionStore.getSession.mockResolvedValue(mockSession);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      mockKnowledgeGraph.query.mockResolvedValue([]);

      await sessionManager.checkpoint(sessionId);

      expect(mockKnowledgeGraph.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          anchor: expect.objectContaining({
            outcome: 'broken',
          }),
        })
      );
    });
  });

  describe('Administrative Operations', () => {
    it('should list active sessions', async () => {
      const mockSessions = ['session-1', 'session-2', 'session-3'];
      mockSessionStore.listActiveSessions.mockResolvedValue(mockSessions);

      const sessions = await sessionManager.listActiveSessions();

      expect(sessions).toEqual(mockSessions);
      expect(mockSessionStore.listActiveSessions).toHaveBeenCalled();
    });

    it('should get sessions by agent', async () => {
      const agentId = 'agent-1';
      const mockAllSessions = ['session-1', 'session-2', 'session-3'];
      const mockSession1: SessionDocument = {
        sessionId: 'session-1',
        agentIds: ['agent-1', 'agent-2'],
        state: 'working',
        events: [],
      };
      const mockSession2: SessionDocument = {
        sessionId: 'session-2',
        agentIds: ['agent-2'],
        state: 'working',
        events: [],
      };
      const mockSession3: SessionDocument = {
        sessionId: 'session-3',
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      mockSessionStore.listActiveSessions.mockResolvedValue(mockAllSessions);
      mockSessionStore.getSession
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2)
        .mockResolvedValueOnce(mockSession3);

      const agentSessions = await sessionManager.getSessionsByAgent(agentId);

      expect(agentSessions).toEqual(['session-1', 'session-3']);
    });

    it('should get statistics from store', async () => {
      const mockStats = {
        activeSessions: 5,
        totalEvents: 50,
        averageEventsPerSession: 10,
        checkpointsCreated: 8,
        failureSnapshots: 1,
        agentsActive: 3,
        redisMemoryUsage: 1024,
      };

      mockSessionStore.getStats.mockResolvedValue(mockStats);

      const stats = await sessionManager.getStats();

      expect(stats).toEqual(mockStats);
      expect(mockSessionStore.getStats).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when store is healthy', async () => {
      const mockStoreHealth = {
        healthy: true,
        latency: 10,
      };
      const mockSessions = ['session-1', 'session-2'];

      mockSessionStore.healthCheck.mockResolvedValue(mockStoreHealth);
      mockSessionStore.listActiveSessions.mockResolvedValue(mockSessions);

      const health = await sessionManager.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.sessionManager).toBe(true);
      expect(health.store).toEqual(mockStoreHealth);
      expect(health.activeSessions).toBe(2);
    });

    it('should return unhealthy status when store is unhealthy', async () => {
      const mockStoreHealth = {
        healthy: false,
        latency: 0,
        error: 'Connection failed',
      };

      mockSessionStore.healthCheck.mockResolvedValue(mockStoreHealth);

      const health = await sessionManager.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.store.healthy).toBe(false);
    });
  });

  describe('Maintenance', () => {
    it('should perform maintenance operations', async () => {
      const mockActiveSessions = ['session-1', 'session-2'];
      mockSessionStore.cleanup.mockResolvedValue(undefined);
      mockSessionStore.listActiveSessions.mockResolvedValue(mockActiveSessions);

      await sessionManager.performMaintenance();

      expect(mockSessionStore.cleanup).toHaveBeenCalled();
      expect(mockSessionStore.listActiveSessions).toHaveBeenCalled();
    });

    it('should clean up orphaned sequence trackers', async () => {
      // Create a session to populate sequence tracker
      mockSessionStore.createSession.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      await sessionManager.createSession('agent-1');

      // Mock no active sessions
      mockSessionStore.cleanup.mockResolvedValue(undefined);
      mockSessionStore.listActiveSessions.mockResolvedValue([]);

      await sessionManager.performMaintenance();

      // Should clean up the sequence tracker for the orphaned session
      expect(mockSessionStore.cleanup).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      const agentId = 'agent-1';
      mockSessionStore.createSession.mockRejectedValue(new Error('Redis connection failed'));

      await expect(sessionManager.createSession(agentId))
        .rejects.toThrow('Failed to create session');
    });

    it('should handle knowledge graph errors gracefully during checkpoint', async () => {
      const sessionId = 'test-session';
      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [{
          seq: 1,
          type: 'modified',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          actor: 'agent-1',
        }],
      };

      mockSessionStore.getSession.mockResolvedValue(mockSession);
      mockSessionStore.setTTL.mockResolvedValue(undefined);
      mockSessionStore.publishSessionUpdate.mockResolvedValue(undefined);
      mockKnowledgeGraph.query.mockRejectedValue(new Error('KG error'));

      // Should not throw even if KG fails
      await expect(sessionManager.checkpoint(sessionId)).resolves.toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should close store and clear resources', async () => {
      mockSessionStore.close.mockResolvedValue(undefined);

      await sessionManager.close();

      expect(mockSessionStore.close).toHaveBeenCalled();
    });
  });
});