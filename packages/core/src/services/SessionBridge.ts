// TODO(2025-09-30.35): Validate event payload keys before indexing.
/**
 * Session Bridge
 *
 * Bridge service for multi-agent session coordination providing intelligent queries
 * that join Redis session data with Knowledge Graph traversals for enriched context
 */

import { EventEmitter } from 'events';
import { SessionManager } from './SessionManager.js';
import {
  SessionDocument,
  SessionEvent,
  SessionQuery,
  TransitionResult,
  HandoffContext,
  IsolationResult,
  SessionAnchor,
  ISessionBridge,
  SessionError,
  SessionNotFoundError,
} from './SessionTypes.js';

export class SessionBridge extends EventEmitter implements ISessionBridge {
  constructor(
    private sessionManager: SessionManager,
    private knowledgeGraph?: any // KnowledgeGraphService - optional dependency
  ) {
    super();
    console.log('[SessionBridge] Initialized with KG integration:', !!this.knowledgeGraph);
  }

  // ========== Transition Analysis ==========

  async getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Detect transitions in event sequence
      const transitions = this.detectTransitions(session.events);

      // Enrich with KG context if available and entity specified
      if (this.knowledgeGraph && entityId && transitions.length > 0) {
        await this.enrichTransitionsWithKGContext(transitions, entityId);
      }

      console.log(`[SessionBridge] Found ${transitions.length} transitions for session ${sessionId}`);
      return transitions;
    } catch (error) {
      console.error(`[SessionBridge] Failed to get transitions for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get transitions: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_TRANSITIONS_FAILED',
        sessionId,
        { entityId, originalError: error }
      );
    }
  }

  private detectTransitions(events: SessionEvent[]): TransitionResult[] {
    const transitions: TransitionResult[] = [];

    for (let i = 1; i < events.length; i++) {
      const prev = events.at(i - 1)!;
      const curr = events.at(i)!;

      // Detect state transitions
      if (this.isSignificantTransition(prev, curr)) {
        transitions.push({
          fromSeq: prev.seq,
          toSeq: curr.seq,
          changeInfo: curr.changeInfo,
          impact: curr.impact,
        });
      }
    }

    return transitions;
  }

  private isSignificantTransition(prev: SessionEvent, curr: SessionEvent): boolean {
    // Working -> Broken transition
    if (prev.stateTransition?.to === 'working' && curr.stateTransition?.to === 'broken') {
      return true;
    }

    // Test pass -> failure
    if (prev.type === 'test_pass' && curr.type === 'broke') {
      return true;
    }

    // High impact changes
    if (curr.impact?.severity === 'high' || curr.impact?.severity === 'critical') {
      return true;
    }

    // Performance regressions
    if (curr.impact?.perfDelta && curr.impact.perfDelta < -5) {
      return true;
    }

    return false;
  }

  private async enrichTransitionsWithKGContext(
    transitions: TransitionResult[],
    entityId: string
  ): Promise<void> {
    if (!this.knowledgeGraph) return;

    try {
      const affectedIds = transitions.flatMap(t => t.changeInfo.entityIds);
      const cypher = `
        MATCH (start:CodebaseEntity {id: $entityId})
        MATCH path = (start)-[:IMPACTS|IMPLEMENTS_CLUSTER|PERFORMS_FOR*0..2]-(related)
        WHERE start.id IN $affectedIds
        RETURN start.id as startId,
               collect(DISTINCT {
                 specTitle: coalesce((related:Spec).title, null),
                 clusterName: coalesce((related:SemanticCluster).name, null),
                 benchmarkDelta: coalesce((related:Benchmark).perfDelta, 0),
                 entityType: labels(related)[0]
               }) as context
      `;

      const kgResults = await this.executeKGQuery(cypher, { entityId, affectedIds });

      // Assign context to transitions
      transitions.forEach(transition => {
        const match = kgResults.find((r: any) =>
          transition.changeInfo.entityIds.includes(r.startId)
        );
        if (match && match.context.length > 0) {
          transition.kgContext = match.context[0];
        }
      });
    } catch (error) {
      console.error('[SessionBridge] Failed to enrich transitions with KG context:', error);
      // Don't throw - enrichment is optional
    }
  }

  // ========== Session Isolation ==========

  async isolateSession(sessionId: string, agentId: string): Promise<IsolationResult> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Filter events by agent
      const agentEvents = session.events.filter(event => event.actor === agentId);

      // Get KG anchors for this agent/session
      const impacts = await this.getSessionImpacts(sessionId, agentId);

      // Calculate total performance impact
      const totalPerfDelta = impacts.reduce((sum, impact) => {
        return sum + impact.anchors.reduce((s: number, anchor) => s + (anchor.perfDelta || 0), 0);
      }, 0);

      const result: IsolationResult = {
        events: agentEvents,
        impacts,
        totalPerfDelta,
        agentId,
      };

      console.log(`[SessionBridge] Isolated session ${sessionId} for agent ${agentId}: ${agentEvents.length} events`);
      return result;
    } catch (error) {
      console.error(`[SessionBridge] Failed to isolate session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to isolate session: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_ISOLATE_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  private async getSessionImpacts(sessionId: string, agentId: string): Promise<Array<{
    entityId: string;
    anchors: SessionAnchor[];
    count: number;
  }>> {
    if (!this.knowledgeGraph) return [];

    try {
      const cypher = `
        MATCH (e:CodebaseEntity)
        WHERE ANY(s IN e.metadata.sessions
          WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId)
        RETURN e.id as entityId,
               [s IN e.metadata.sessions
                WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId] as anchors,
               size([s IN e.metadata.sessions
                WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId]) as count
      `;

      const results = await this.executeKGQuery(cypher, { sessionId, agentId });
      return results.map((r: any) => ({
        entityId: r.entityId,
        anchors: r.anchors,
        count: r.count,
      }));
    } catch (error) {
      console.error('[SessionBridge] Failed to get session impacts:', error);
      return [];
    }
  }

  // ========== Handoff Context ==========

  async getHandoffContext(sessionId: string, joiningAgent: string): Promise<HandoffContext> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Get recent changes (last 10 events)
      const recentChanges = session.events.slice(-10);

      // Get KG context for recent changes
      const kgContext = await this.getKGContextForChanges(recentChanges);

      // Generate joining advice
      const joiningAdvice = this.generateJoiningAdvice(session, recentChanges);

      const context: HandoffContext = {
        sessionId,
        recentChanges,
        kgContext,
        joiningAdvice,
      };

      console.log(`[SessionBridge] Generated handoff context for agent ${joiningAgent} joining session ${sessionId}`);
      return context;
    } catch (error) {
      console.error(`[SessionBridge] Failed to get handoff context for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get handoff context: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_HANDOFF_FAILED',
        sessionId,
        { joiningAgent, originalError: error }
      );
    }
  }

  private async getKGContextForChanges(events: SessionEvent[]): Promise<Array<{
    entityId: string;
    related: any[];
    lastAnchor?: SessionAnchor;
  }>> {
    if (!this.knowledgeGraph || events.length === 0) return [];

    try {
      const affectedIds = events.flatMap(e => e.changeInfo.entityIds);
      if (affectedIds.length === 0) return [];

      const cypher = `
        MATCH (e:CodebaseEntity)
        WHERE e.id IN $affectedIds
        OPTIONAL MATCH (e)-[:DEFINES|TESTS|PERFORMS_FOR]-(related)
        RETURN e.id as entityId,
               collect(DISTINCT related) as related,
               e.metadata.sessions[-1] as lastAnchor
      `;

      const results = await this.executeKGQuery(cypher, { affectedIds });
      return results.map((r: any) => ({
        entityId: r.entityId,
        related: r.related || [],
        lastAnchor: r.lastAnchor,
      }));
    } catch (error) {
      console.error('[SessionBridge] Failed to get KG context for changes:', error);
      return [];
    }
  }

  private generateJoiningAdvice(session: SessionDocument, recentChanges: SessionEvent[]): string {
    const activeAgents = session.agentIds;
    const recentActors = [...new Set(recentChanges.map(e => e.actor))];
    const hasRecentBreaks = recentChanges.some(e => e.stateTransition?.to === 'broken');
    const hasHighImpact = recentChanges.some(e =>
      e.impact?.severity === 'high' || e.impact?.severity === 'critical'
    );

    let advice = `Sync with agents: ${activeAgents.join(', ')}`;

    if (hasRecentBreaks) {
      advice += '. WARNING: Recent breaking changes detected';
    }

    if (hasHighImpact) {
      advice += '. High-impact changes in progress';
    }

    if (recentActors.length > 0) {
      advice += `. Most active: ${recentActors.slice(0, 3).join(', ')}`;
    }

    return advice;
  }

  // ========== Entity-Based Queries ==========

  async querySessionsByEntity(entityId: string, options: SessionQuery = {}): Promise<SessionDocument[]> {
    try {
      const sessions: SessionDocument[] = [];

      // Get sessions from KG anchors
      if (this.knowledgeGraph) {
        const anchoredSessions = await this.getSessionsFromKGAnchors(entityId, options);
        sessions.push(...anchoredSessions);
      }

      // Get active sessions that reference this entity
      const activeSessions = await this.sessionManager.listActiveSessions();
      for (const sessionId of activeSessions) {
        const session = await this.sessionManager.getSession(sessionId);
        if (session && this.sessionReferencesEntity(session, entityId)) {
          sessions.push(session);
        }
      }

      // Remove duplicates and apply filters
      const uniqueSessions = this.deduplicateSessions(sessions);
      const filteredSessions = this.applySessionFilters(uniqueSessions, options);

      console.log(`[SessionBridge] Found ${filteredSessions.length} sessions for entity ${entityId}`);
      return filteredSessions;
    } catch (error) {
      console.error(`[SessionBridge] Failed to query sessions for entity ${entityId}:`, error);
      throw new SessionError(
        `Failed to query sessions by entity: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_ENTITY_QUERY_FAILED',
        undefined,
        { entityId, options, originalError: error }
      );
    }
  }

  private async getSessionsFromKGAnchors(entityId: string, options: SessionQuery): Promise<SessionDocument[]> {
    if (!this.knowledgeGraph) return [];

    try {
      const cypher = `
        MATCH (e:CodebaseEntity {id: $entityId})
        UNWIND e.metadata.sessions as session
        WHERE ($outcome IS NULL OR session.outcome = $outcome)
          AND ($fromDate IS NULL OR datetime(session.timestamp) >= datetime($fromDate))
        RETURN DISTINCT session.sessionId as sessionId
        LIMIT ${options.limit || 50}
      `;

      const results = await this.executeKGQuery(cypher, {
        entityId,
        outcome: options.outcome,
        fromDate: options.fromSeq ? new Date(options.fromSeq).toISOString() : null,
      });

      const sessions: SessionDocument[] = [];
      for (const result of results) {
        const session = await this.sessionManager.getSession(result.sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('[SessionBridge] Failed to get sessions from KG anchors:', error);
      return [];
    }
  }

  private sessionReferencesEntity(session: SessionDocument, entityId: string): boolean {
    return session.events.some(event =>
      event.changeInfo.entityIds.includes(entityId)
    );
  }

  private deduplicateSessions(sessions: SessionDocument[]): SessionDocument[] {
    const seen = new Set<string>();
    return sessions.filter(session => {
      if (seen.has(session.sessionId)) {
        return false;
      }
      seen.add(session.sessionId);
      return true;
    });
  }

  private applySessionFilters(sessions: SessionDocument[], options: SessionQuery): SessionDocument[] {
    return sessions.filter(session => {
      if (options.agentId && !session.agentIds.includes(options.agentId)) {
        return false;
      }
      if (options.state && session.state !== options.state) {
        return false;
      }
      return true;
    });
  }

  // ========== Aggregation Queries ==========

  async getSessionAggregates(entityIds: string[], options: SessionQuery = {}): Promise<{
    totalSessions: number;
    activeAgents: string[];
    recentOutcomes: Record<string, number>;
    performanceImpact: {
      total: number;
      average: number;
      worst: number;
    };
    entityBreakdown: Array<{
      entityId: string;
      sessionCount: number;
      avgImpact: number;
    }>;
  }> {
    try {
      const allSessions: SessionDocument[] = [];

      // Collect sessions for all entities
      for (const entityId of entityIds) {
        const sessions = await this.querySessionsByEntity(entityId, options);
        allSessions.push(...sessions);
      }

      const uniqueSessions = this.deduplicateSessions(allSessions);

      // Calculate aggregates
      const totalSessions = uniqueSessions.length;
      const activeAgents = [...new Set(uniqueSessions.flatMap(s => s.agentIds))];

      const recentOutcomesMap = new Map<string, number>();
      const perfImpacts: number[] = [];

      uniqueSessions.forEach(session => {
        // Count outcomes from recent events
        session.events.forEach(event => {
          if (event.stateTransition?.to) {
            const key = event.stateTransition.to;
            recentOutcomesMap.set(key, (recentOutcomesMap.get(key) || 0) + 1);
          }
          if (event.impact?.perfDelta) {
            perfImpacts.push(event.impact.perfDelta);
          }
        });
      });

      const performanceImpact = {
        total: perfImpacts.reduce((sum, delta) => sum + delta, 0),
        average: perfImpacts.length > 0 ? perfImpacts.reduce((sum, delta) => sum + delta, 0) / perfImpacts.length : 0,
        worst: perfImpacts.length > 0 ? Math.min(...perfImpacts) : 0,
      };

      // Entity breakdown
      const entityBreakdown = entityIds.map(entityId => {
        const entitySessions = uniqueSessions.filter(session =>
          this.sessionReferencesEntity(session, entityId)
        );
        const impacts = entitySessions.flatMap(session =>
          session.events
            .filter(e => e.changeInfo.entityIds.includes(entityId) && e.impact?.perfDelta)
            .map(e => e.impact!.perfDelta!)
        );

        return {
          entityId,
          sessionCount: entitySessions.length,
          avgImpact: impacts.length > 0 ? impacts.reduce((sum, delta) => sum + delta, 0) / impacts.length : 0,
        };
      });

      console.log(`[SessionBridge] Generated aggregates for ${entityIds.length} entities: ${totalSessions} sessions`);

      return {
        totalSessions,
        activeAgents,
        recentOutcomes: Object.fromEntries(recentOutcomesMap),
        performanceImpact,
        entityBreakdown,
      };
    } catch (error) {
      console.error(`[SessionBridge] Failed to get session aggregates:`, error);
      throw new SessionError(
        `Failed to get session aggregates: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_AGGREGATES_FAILED',
        undefined,
        { entityIds, options, originalError: error }
      );
    }
  }

  // ========== Utility Methods ==========

  private async executeKGQuery(cypher: string, params: any): Promise<any[]> {
    if (!this.knowledgeGraph) {
      throw new SessionError(
        'Knowledge Graph service not available',
        'KG_NOT_AVAILABLE'
      );
    }

    try {
      if (this.knowledgeGraph.query) {
        return await this.knowledgeGraph.query(cypher, params);
      } else if (this.knowledgeGraph.neo4j?.query) {
        return await this.knowledgeGraph.neo4j.query(cypher, params);
      } else {
        throw new Error('No query method available on Knowledge Graph service');
      }
    } catch (error) {
      console.error('[SessionBridge] KG query failed:', error);
      throw new SessionError(
        `Knowledge Graph query failed: ${error instanceof Error ? error.message : String(error)}`,
        'KG_QUERY_FAILED',
        undefined,
        { cypher, params, originalError: error }
      );
    }
  }

  // ========== Health Check ==========

  async healthCheck(): Promise<{
    healthy: boolean;
    bridge: boolean;
    sessionManager: boolean;
    knowledgeGraph: boolean;
  }> {
    try {
      const sessionManagerHealth = await this.sessionManager.healthCheck();
      let kgHealthy = true;

      if (this.knowledgeGraph) {
        try {
          // Try a simple KG query
          await this.executeKGQuery('RETURN 1 as test', {});
        } catch (error) {
          kgHealthy = false;
        }
      }

      return {
        healthy: sessionManagerHealth.healthy && kgHealthy,
        bridge: true,
        sessionManager: sessionManagerHealth.healthy,
        knowledgeGraph: kgHealthy,
      };
    } catch (error) {
      return {
        healthy: false,
        bridge: false,
        sessionManager: false,
        knowledgeGraph: false,
      };
    }
  }
}
 
// TODO(2025-09-30.35): Validate event payload keys before indexing.
