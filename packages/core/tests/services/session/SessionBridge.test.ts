/**
 * SessionBridge Unit Tests
 *
 * Tests for multi-agent session coordination and query functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionBridge } from '@memento/core/services/SessionBridge';
import {
  SessionDocument,
  SessionEvent,
  SessionQuery,
} from '@memento/core/services/SessionTypes';

describe('SessionBridge', () => {
  let sessionBridge: SessionBridge;
  let mockSessionManager: any;
  let mockKnowledgeGraph: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock session manager
    mockSessionManager = {
      getSession: vi.fn(),
      listActiveSessions: vi.fn(),
      healthCheck: vi.fn(),
    };

    // Create mock knowledge graph
    mockKnowledgeGraph = {
      query: vi.fn(),
      neo4j: {
        query: vi.fn(),
      },
    };

    sessionBridge = new SessionBridge(mockSessionManager, mockKnowledgeGraph);
  });

  describe('Transition Analysis', () => {
    it('should detect working to broken transitions', async () => {
      const sessionId = 'test-session';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'test_pass',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          stateTransition: {
            from: 'working',
            to: 'working',
            verifiedBy: 'test',
            confidence: 0.95,
          },
          actor: 'agent-1',
        },
        {
          seq: 2,
          type: 'broke',
          timestamp: '2023-01-01T10:01:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          stateTransition: {
            from: 'working',
            to: 'broken',
            verifiedBy: 'test',
            confidence: 0.9,
          },
          impact: {
            severity: 'high',
            testsFailed: ['test-1'],
            perfDelta: -15,
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

      mockSessionManager.getSession.mockResolvedValue(mockSession);

      const transitions = await sessionBridge.getTransitions(sessionId);

      expect(transitions).toHaveLength(1);
      expect(transitions[0]).toEqual({
        fromSeq: 1,
        toSeq: 2,
        changeInfo: mockEvents[1].changeInfo,
        impact: mockEvents[1].impact,
      });
    });

    it('should enrich transitions with KG context when entityId provided', async () => {
      const sessionId = 'test-session';
      const entityId = 'entity-1';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'test_pass',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          stateTransition: { from: 'working', to: 'working', verifiedBy: 'test', confidence: 0.95 },
          actor: 'agent-1',
        },
        {
          seq: 2,
          type: 'broke',
          timestamp: '2023-01-01T10:01:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          stateTransition: { from: 'working', to: 'broken', verifiedBy: 'test', confidence: 0.9 },
          impact: { severity: 'high' },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'broken',
        events: mockEvents,
      };

      const mockKGResults = [
        {
          'start.id': 'entity-1',
          context: [
            {
              specTitle: 'User Authentication',
              clusterName: 'auth-cluster',
              benchmarkDelta: -10,
              entityType: 'Spec',
            },
          ],
        },
      ];

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockResolvedValue(mockKGResults);

      const transitions = await sessionBridge.getTransitions(sessionId, entityId);

      expect(transitions).toHaveLength(1);
      expect(transitions[0].kgContext).toEqual({
        specTitle: 'User Authentication',
        clusterName: 'auth-cluster',
        benchmarkDelta: -10,
        entityType: 'Spec',
      });
      expect(mockKnowledgeGraph.query).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (start:CodebaseEntity {id: $entityId})'),
        expect.objectContaining({
          entityId,
          affectedIds: ['entity-1'],
        })
      );
    });

    it('should detect high-impact changes', async () => {
      const sessionId = 'test-session';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'modified',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          impact: {
            severity: 'low',
            perfDelta: -1,
          },
          actor: 'agent-1',
        },
        {
          seq: 2,
          type: 'modified',
          timestamp: '2023-01-01T10:01:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-2'],
            operation: 'modified',
          },
          impact: {
            severity: 'critical',
            perfDelta: -50,
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

      mockSessionManager.getSession.mockResolvedValue(mockSession);

      const transitions = await sessionBridge.getTransitions(sessionId);

      expect(transitions).toHaveLength(1);
      expect(transitions[0].fromSeq).toBe(1);
      expect(transitions[0].toSeq).toBe(2);
      expect(transitions[0].impact?.severity).toBe('critical');
    });

    it('should handle session not found', async () => {
      const sessionId = 'non-existent';
      mockSessionManager.getSession.mockResolvedValue(null);

      await expect(sessionBridge.getTransitions(sessionId))
        .rejects.toThrow('Session not found');
    });
  });

  describe('Session Isolation', () => {
    it('should isolate session events by agent', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-1';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'modified',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
          actor: 'agent-1',
        },
        {
          seq: 2,
          type: 'modified',
          timestamp: '2023-01-01T10:01:00Z',
          changeInfo: { elementType: 'function', entityIds: ['entity-2'], operation: 'modified' },
          actor: 'agent-2',
        },
        {
          seq: 3,
          type: 'broke',
          timestamp: '2023-01-01T10:02:00Z',
          changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
          impact: { severity: 'high', perfDelta: -20 },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1', 'agent-2'],
        state: 'broken',
        events: mockEvents,
      };

      const mockKGResults = [
        {
          entityId: 'entity-1',
          anchors: [{
            sessionId,
            outcome: 'broken',
            checkpointId: 'cp-123',
            keyImpacts: ['test-failure'],
            perfDelta: -20,
            actors: ['agent-1'],
            timestamp: '2023-01-01T10:02:00Z',
          }],
          count: 1,
        },
      ];

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockResolvedValue(mockKGResults);

      const isolation = await sessionBridge.isolateSession(sessionId, agentId);

      expect(isolation.events).toHaveLength(2); // Only agent-1's events
      expect(isolation.events[0].seq).toBe(1);
      expect(isolation.events[1].seq).toBe(3);
      expect(isolation.agentId).toBe(agentId);
      expect(isolation.totalPerfDelta).toBe(-20);
      expect(isolation.impacts).toHaveLength(1);
      expect(isolation.impacts[0].entityId).toBe('entity-1');
    });

    it('should handle empty session impacts gracefully', async () => {
      const sessionId = 'test-session';
      const agentId = 'agent-1';
      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockResolvedValue([]);

      const isolation = await sessionBridge.isolateSession(sessionId, agentId);

      expect(isolation.events).toHaveLength(0);
      expect(isolation.impacts).toHaveLength(0);
      expect(isolation.totalPerfDelta).toBe(0);
    });
  });

  describe('Handoff Context', () => {
    it('should generate comprehensive handoff context', async () => {
      const sessionId = 'test-session';
      const joiningAgent = 'agent-3';
      const mockEvents: SessionEvent[] = [
        // 15 events total, should get last 10
        ...Array.from({ length: 15 }, (_, i) => ({
          seq: i + 1,
          type: 'modified' as const,
          timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
          changeInfo: {
            elementType: 'function' as const,
            entityIds: [`entity-${i + 1}`],
            operation: 'modified' as const,
          },
          actor: i % 2 === 0 ? 'agent-1' : 'agent-2',
        })),
      ];

      // Add a breaking change in recent events
      mockEvents[13] = {
        ...mockEvents[13],
        type: 'broke',
        stateTransition: {
          from: 'working',
          to: 'broken',
          verifiedBy: 'test',
          confidence: 0.9,
        },
        impact: {
          severity: 'high',
          testsFailed: ['test-1'],
        },
      };

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1', 'agent-2'],
        state: 'broken',
        events: mockEvents,
      };

      const mockKGContext = [
        {
          entityId: 'entity-15',
          related: [{ id: 'test-1', type: 'Test' }],
          lastAnchor: {
            sessionId,
            outcome: 'working',
            checkpointId: 'cp-456',
            keyImpacts: [],
            perfDelta: 0,
            actors: ['agent-1'],
            timestamp: '2023-01-01T09:00:00Z',
          },
        },
      ];

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockResolvedValue(mockKGContext);

      const context = await sessionBridge.getHandoffContext(sessionId, joiningAgent);

      expect(context.sessionId).toBe(sessionId);
      expect(context.recentChanges).toHaveLength(10); // Last 10 events
      expect(context.recentChanges[0].seq).toBe(6); // Events 6-15
      expect(context.kgContext).toEqual(mockKGContext);
      expect(context.joiningAdvice).toContain('agent-1, agent-2');
      expect(context.joiningAdvice).toContain('WARNING: Recent breaking changes detected');
    });

    it('should generate appropriate joining advice', async () => {
      const sessionId = 'test-session';
      const joiningAgent = 'agent-3';
      const mockEvents: SessionEvent[] = [
        {
          seq: 1,
          type: 'modified',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: {
            elementType: 'function',
            entityIds: ['entity-1'],
            operation: 'modified',
          },
          impact: {
            severity: 'critical',
          },
          actor: 'agent-1',
        },
      ];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1', 'agent-2'],
        state: 'working',
        events: mockEvents,
      };

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockResolvedValue([]);

      const context = await sessionBridge.getHandoffContext(sessionId, joiningAgent);

      expect(context.joiningAdvice).toContain('Sync with agents: agent-1, agent-2');
      expect(context.joiningAdvice).toContain('High-impact changes in progress');
      expect(context.joiningAdvice).toContain('Most active: agent-1');
    });
  });

  describe('Entity-Based Queries', () => {
    it('should query sessions by entity from both KG anchors and active sessions', async () => {
      const entityId = 'entity-1';
      const options: SessionQuery = {
        outcome: 'working',
        limit: 10,
      };

      // Mock KG results
      const mockKGResults = [
        { sessionId: 'session-1' },
        { sessionId: 'session-2' },
      ];

      // Mock active sessions
      const mockActiveSessions = ['session-2', 'session-3'];
      const mockSession2: SessionDocument = {
        sessionId: 'session-2',
        agentIds: ['agent-1'],
        state: 'working',
        events: [{
          seq: 1,
          type: 'modified',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
          actor: 'agent-1',
        }],
      };

      const mockSession3: SessionDocument = {
        sessionId: 'session-3',
        agentIds: ['agent-2'],
        state: 'working',
        events: [{
          seq: 1,
          type: 'modified',
          timestamp: '2023-01-01T10:00:00Z',
          changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
          actor: 'agent-2',
        }],
      };

      mockKnowledgeGraph.query.mockResolvedValue(mockKGResults);
      mockSessionManager.listActiveSessions.mockResolvedValue(mockActiveSessions);
      mockSessionManager.getSession
        .mockResolvedValueOnce(null) // session-1 not found (expired)
        .mockResolvedValueOnce(mockSession2) // session-2 found
        .mockResolvedValueOnce(mockSession2) // session-2 (deduplication test)
        .mockResolvedValueOnce(mockSession3); // session-3 found

      const sessions = await sessionBridge.querySessionsByEntity(entityId, options);

      expect(sessions).toHaveLength(2); // Deduplicated: session-2, session-3
      expect(sessions.map(s => s.sessionId)).toEqual(['session-2', 'session-3']);
    });

    it('should apply session filters correctly', async () => {
      const entityId = 'entity-1';
      const options: SessionQuery = {
        agentId: 'agent-1',
        state: 'working',
      };

      const mockActiveSessions = ['session-1', 'session-2'];
      const mockSession1: SessionDocument = {
        sessionId: 'session-1',
        agentIds: ['agent-1'],
        state: 'working',
        events: [{ seq: 1, type: 'modified', timestamp: '2023-01-01T10:00:00Z', changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' }, actor: 'agent-1' }],
      };

      const mockSession2: SessionDocument = {
        sessionId: 'session-2',
        agentIds: ['agent-2'], // Different agent
        state: 'working',
        events: [{ seq: 1, type: 'modified', timestamp: '2023-01-01T10:00:00Z', changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' }, actor: 'agent-2' }],
      };

      mockKnowledgeGraph.query.mockResolvedValue([]);
      mockSessionManager.listActiveSessions.mockResolvedValue(mockActiveSessions);
      mockSessionManager.getSession
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);

      const sessions = await sessionBridge.querySessionsByEntity(entityId, options);

      expect(sessions).toHaveLength(1); // Only session-1 matches agent filter
      expect(sessions[0].sessionId).toBe('session-1');
    });
  });

  describe('Session Aggregates', () => {
    it('should calculate comprehensive session aggregates', async () => {
      const entityIds = ['entity-1', 'entity-2'];
      const mockSessions: SessionDocument[] = [
        {
          sessionId: 'session-1',
          agentIds: ['agent-1', 'agent-2'],
          state: 'broken',
          events: [
            {
              seq: 1,
              type: 'modified',
              timestamp: '2023-01-01T10:00:00Z',
              changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
              stateTransition: { from: 'working', to: 'broken', verifiedBy: 'test', confidence: 0.9 },
              impact: { severity: 'high', perfDelta: -25 },
              actor: 'agent-1',
            },
          ],
        },
        {
          sessionId: 'session-2',
          agentIds: ['agent-3'],
          state: 'working',
          events: [
            {
              seq: 1,
              type: 'modified',
              timestamp: '2023-01-01T11:00:00Z',
              changeInfo: { elementType: 'function', entityIds: ['entity-2'], operation: 'modified' },
              stateTransition: { from: 'working', to: 'working', verifiedBy: 'build', confidence: 0.8 },
              impact: { severity: 'low', perfDelta: 5 },
              actor: 'agent-3',
            },
          ],
        },
      ];

      // Mock the querySessionsByEntity to return different sessions for each entity
      const bridge = sessionBridge as any;
      vi.spyOn(bridge, 'querySessionsByEntity')
        .mockResolvedValueOnce([mockSessions[0]]) // entity-1
        .mockResolvedValueOnce([mockSessions[1]]); // entity-2

      const aggregates = await sessionBridge.getSessionAggregates(entityIds);

      expect(aggregates.totalSessions).toBe(2);
      expect(aggregates.activeAgents).toEqual(['agent-1', 'agent-2', 'agent-3']);
      expect(aggregates.recentOutcomes).toEqual({
        broken: 1,
        working: 1,
      });
      expect(aggregates.performanceImpact.total).toBe(-20); // -25 + 5
      expect(aggregates.performanceImpact.average).toBe(-10);
      expect(aggregates.performanceImpact.worst).toBe(-25);
      expect(aggregates.entityBreakdown).toHaveLength(2);
      expect(aggregates.entityBreakdown[0].entityId).toBe('entity-1');
      expect(aggregates.entityBreakdown[0].sessionCount).toBe(1);
      expect(aggregates.entityBreakdown[0].avgImpact).toBe(-25);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all components are healthy', async () => {
      const mockSessionManagerHealth = {
        healthy: true,
        sessionManager: true,
        store: { healthy: true, latency: 10 },
        activeSessions: 5,
      };

      mockSessionManager.healthCheck.mockResolvedValue(mockSessionManagerHealth);
      mockKnowledgeGraph.query.mockResolvedValue([{ test: 1 }]);

      const health = await sessionBridge.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.bridge).toBe(true);
      expect(health.sessionManager).toBe(true);
      expect(health.knowledgeGraph).toBe(true);
    });

    it('should return unhealthy status when knowledge graph fails', async () => {
      const mockSessionManagerHealth = {
        healthy: true,
        sessionManager: true,
        store: { healthy: true, latency: 10 },
        activeSessions: 5,
      };

      mockSessionManager.healthCheck.mockResolvedValue(mockSessionManagerHealth);
      mockKnowledgeGraph.query.mockRejectedValue(new Error('KG connection failed'));

      const health = await sessionBridge.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.bridge).toBe(true);
      expect(health.sessionManager).toBe(true);
      expect(health.knowledgeGraph).toBe(false);
    });

    it('should return unhealthy status when session manager fails', async () => {
      mockSessionManager.healthCheck.mockResolvedValue({
        healthy: false,
        sessionManager: false,
        store: { healthy: false, latency: 0, error: 'Redis down' },
        activeSessions: 0,
      });

      const health = await sessionBridge.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.sessionManager).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle KG query failures gracefully', async () => {
      const sessionId = 'test-session';
      const entityId = 'entity-1';
      const mockEvents: SessionEvent[] = [{
        seq: 1,
        type: 'broke',
        timestamp: '2023-01-01T10:00:00Z',
        changeInfo: { elementType: 'function', entityIds: ['entity-1'], operation: 'modified' },
        stateTransition: { from: 'working', to: 'broken', verifiedBy: 'test', confidence: 0.9 },
        impact: { severity: 'high' },
        actor: 'agent-1',
      }];

      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'broken',
        events: mockEvents,
      };

      mockSessionManager.getSession.mockResolvedValue(mockSession);
      mockKnowledgeGraph.query.mockRejectedValue(new Error('KG connection failed'));

      // Should still return transitions without KG context
      const transitions = await sessionBridge.getTransitions(sessionId, entityId);

      expect(transitions).toHaveLength(1);
      expect(transitions[0].kgContext).toBeUndefined();
    });

    it('should work without knowledge graph dependency', async () => {
      const bridgeWithoutKG = new SessionBridge(mockSessionManager);
      const sessionId = 'test-session';
      const mockSession: SessionDocument = {
        sessionId,
        agentIds: ['agent-1'],
        state: 'working',
        events: [],
      };

      mockSessionManager.getSession.mockResolvedValue(mockSession);

      const isolation = await bridgeWithoutKG.isolateSession(sessionId, 'agent-1');

      expect(isolation.impacts).toHaveLength(0);
      expect(isolation.totalPerfDelta).toBe(0);
    });
  });
});
