/**
 * Session Manager
 *
 * Main session management service providing high-level session operations
 * Orchestrates SessionStore and integrates with KnowledgeGraphService for anchors
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SessionStore } from './SessionStore.js';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  SessionEventOptions,
  CheckpointOptions,
  SessionManagerConfig,
  SessionAnchor,
  ISessionManager,
  SessionError,
  SessionNotFoundError,
  SessionStats,
  SessionPubSubMessage,
  Outcome,
} from './SessionTypes.js';

export class SessionManager extends EventEmitter implements ISessionManager {
  private store: SessionStore;
  private knowledgeGraph?: any; // KnowledgeGraphService - optional dependency
  private eventSequences = new Map<string, number>(); // Track sequence numbers
  private config: Required<SessionManagerConfig>;

  constructor(
    config: SessionManagerConfig,
    knowledgeGraph?: any
  ) {
    super();

    // Set default configuration
    this.config = {
      redis: config.redis,
      defaultTTL: config.defaultTTL || 3600, // 1 hour
      checkpointInterval: config.checkpointInterval || 10, // every 10 events
      maxEventsPerSession: config.maxEventsPerSession || 1000,
      graceTTL: config.graceTTL || 300, // 5 minutes
      enableFailureSnapshots: config.enableFailureSnapshots || false,
      pubSubChannels: {
        global: 'global:sessions',
        session: 'session:',
        ...config.pubSubChannels,
      },
    };

    this.store = new SessionStore(this.config.redis);
    this.knowledgeGraph = knowledgeGraph;

    this.setupEventHandlers();
    console.log('[SessionManager] Initialized with configuration:', {
      defaultTTL: this.config.defaultTTL,
      checkpointInterval: this.config.checkpointInterval,
      enableFailureSnapshots: this.config.enableFailureSnapshots,
    });
  }

  private setupEventHandlers(): void {
    // Forward store events
    this.store.on('session:created', (data) => this.emit('session:created', data));
    this.store.on('session:updated', (data) => this.emit('session:updated', data));
    this.store.on('session:deleted', (data) => this.emit('session:deleted', data));
    this.store.on('event:added', (data) => this.emit('event:added', data));
    this.store.on('agent:added', (data) => this.emit('agent:added', data));
    this.store.on('agent:removed', (data) => this.emit('agent:removed', data));

    // Handle store errors
    this.store.on('error', (error) => {
      console.error('[SessionManager] Store error:', error);
      this.emit('error', error);
    });
  }

  // ========== Core Session Operations ==========

  async createSession(
    agentId: string,
    options: SessionCreationOptions = {}
  ): Promise<string> {
    try {
      const sessionId = `sess-${uuidv4()}`;

      // Initialize sequence tracking
      this.eventSequences.set(sessionId, 1);

      // Create session in store
      await this.store.createSession(sessionId, agentId, {
        ...options,
        ttl: options.ttl || this.config.defaultTTL,
      });

      // Announce new session globally
      await this.publishGlobalUpdate({
        type: 'new',
        sessionId,
        initiator: agentId,
      });

      console.log(`[SessionManager] Created session ${sessionId} for agent ${agentId}`);
      return sessionId;
    } catch (error) {
      console.error(`[SessionManager] Failed to create session for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to create session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CREATE_FAILED',
        undefined,
        { agentId, options, originalError: error }
      );
    }
  }

  async joinSession(sessionId: string, agentId: string): Promise<void> {
    try {
      const session = await this.store.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Add agent to session
      await this.store.addAgent(sessionId, agentId);

      // Emit handoff event
      await this.emitEvent(sessionId, {
        type: 'handoff',
        changeInfo: {
          elementType: 'session',
          entityIds: [],
          operation: 'modified',
        },
        actor: agentId,
      }, agentId);

      // Subscribe to session updates
      await this.store.subscribeToSession(sessionId, (message) => {
        this.emit('session:update', { sessionId, agentId, message });
      });

      console.log(`[SessionManager] Agent ${agentId} joined session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to join session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to join session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_JOIN_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  async leaveSession(sessionId: string, agentId: string): Promise<void> {
    try {
      await this.store.removeAgent(sessionId, agentId);

      // Emit handoff event
      await this.emitEvent(sessionId, {
        type: 'handoff',
        changeInfo: {
          elementType: 'session',
          entityIds: [],
          operation: 'modified',
        },
        actor: agentId,
      }, agentId);

      console.log(`[SessionManager] Agent ${agentId} left session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to leave session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to leave session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_LEAVE_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  async emitEvent(
    sessionId: string,
    eventData: Omit<SessionEvent, 'seq' | 'timestamp'>,
    actor: string,
    options: SessionEventOptions = {}
  ): Promise<void> {
    try {
      // Get next sequence number
      const seq = this.eventSequences.get(sessionId) || 1;
      this.eventSequences.set(sessionId, seq + 1);

      // Create complete event
      const event: SessionEvent = {
        ...eventData,
        seq,
        timestamp: new Date().toISOString(),
        actor,
      };

      // Add event to store
      await this.store.addEvent(sessionId, event);

      // Reset TTL if requested
      if (options.resetTTL !== false) {
        await this.store.setTTL(sessionId, this.config.defaultTTL);
      }

      // Publish update if requested
      if (options.publishUpdate !== false) {
        await this.store.publishSessionUpdate(sessionId, {
          type: event.type,
          seq: event.seq,
          actor,
          summary: {
            entityIds: event.changeInfo.entityIds,
            impact: event.impact,
          },
        });
      }

      // Auto-checkpoint if configured
      if (options.autoCheckpoint !== false &&
          (event.type === 'checkpoint' || seq % this.config.checkpointInterval === 0)) {
        await this.checkpoint(sessionId, { graceTTL: this.config.graceTTL });
      }

      console.log(`[SessionManager] Emitted event ${seq} for session ${sessionId}: ${event.type}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to emit event for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to emit event: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_EMIT_FAILED',
        sessionId,
        { eventData, actor, options, originalError: error }
      );
    }
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    try {
      return await this.store.getSession(sessionId);
    } catch (error) {
      console.error(`[SessionManager] Failed to get session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_GET_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }

  // ========== Checkpoint Operations ==========

  async checkpoint(
    sessionId: string,
    options: CheckpointOptions = {}
  ): Promise<string> {
    try {
      const session = await this.store.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      const checkpointId = `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const graceTTL = options.graceTTL || this.config.graceTTL;

      // Aggregate events for summary
      const recentEvents = session.events.slice(-20); // Last 20 events
      const summary = this.aggregateEvents(recentEvents);

      // Create checkpoint anchor if KG is available
      if (this.knowledgeGraph && recentEvents.length > 0) {
        const entityIds = this.extractEntityIds(recentEvents);
        const anchor: SessionAnchor = {
          sessionId,
          outcome: summary.outcome,
          checkpointId,
          keyImpacts: summary.keyImpacts,
          perfDelta: summary.perfDelta,
          actors: session.agentIds,
          timestamp: new Date().toISOString(),
        };

        await this.appendKGAnchor(entityIds, anchor);
      }

      // Handle failure snapshots if enabled
      if (options.includeFailureSnapshot ||
          (this.config.enableFailureSnapshots && summary.outcome === 'broken')) {
        await this.createFailureSnapshot(sessionId, session.events, summary.outcome);
      }

      // Set grace TTL for handoffs
      await this.store.setTTL(sessionId, graceTTL);

      // Schedule cleanup after grace period
      setTimeout(async () => {
        try {
          await this.cleanup(sessionId);
        } catch (error) {
          console.error(`[SessionManager] Failed to cleanup session ${sessionId}:`, error);
        }
      }, graceTTL * 1000);

      // Publish checkpoint completion
      await this.store.publishSessionUpdate(sessionId, {
        type: 'checkpoint_complete',
        checkpointId,
        outcome: summary.outcome,
      });

      console.log(`[SessionManager] Created checkpoint ${checkpointId} for session ${sessionId}`);
      return checkpointId;
    } catch (error) {
      console.error(`[SessionManager] Failed to create checkpoint for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to create checkpoint: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CHECKPOINT_FAILED',
        sessionId,
        { options, originalError: error }
      );
    }
  }

  async cleanup(sessionId: string): Promise<void> {
    try {
      await this.store.deleteSession(sessionId);
      this.eventSequences.delete(sessionId);
      console.log(`[SessionManager] Cleaned up session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to cleanup session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to cleanup session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CLEANUP_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }

  // ========== Administrative Operations ==========

  async listActiveSessions(): Promise<string[]> {
    try {
      return await this.store.listActiveSessions();
    } catch (error) {
      console.error('[SessionManager] Failed to list active sessions:', error);
      throw new SessionError(
        `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_LIST_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  async getSessionsByAgent(agentId: string): Promise<string[]> {
    try {
      const allSessions = await this.store.listActiveSessions();
      const agentSessions: string[] = [];

      for (const sessionId of allSessions) {
        const session = await this.store.getSession(sessionId);
        if (session && session.agentIds.includes(agentId)) {
          agentSessions.push(sessionId);
        }
      }

      return agentSessions;
    } catch (error) {
      console.error(`[SessionManager] Failed to get sessions for agent ${agentId}:`, error);
      throw new SessionError(
        `Failed to get agent sessions: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_AGENT_SESSIONS_FAILED',
        undefined,
        { agentId, originalError: error }
      );
    }
  }

  async getStats(): Promise<SessionStats> {
    try {
      return await this.store.getStats();
    } catch (error) {
      console.error('[SessionManager] Failed to get stats:', error);
      throw new SessionError(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_STATS_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  // ========== Private Helper Methods ==========

  private aggregateEvents(events: SessionEvent[]): {
    outcome: Outcome;
    keyImpacts: string[];
    perfDelta: number;
  } {
    const broken = events.some(e => e.stateTransition?.to === 'broken');
    const highImpacts = events
      .filter(e => e.impact?.severity === 'high' || e.impact?.severity === 'critical')
      .map(e => e.changeInfo.entityIds[0])
      .filter(Boolean);

    const perfDelta = events.reduce((sum, e) => sum + (e.impact?.perfDelta || 0), 0);

    return {
      outcome: broken ? 'broken' : 'working',
      keyImpacts: [...new Set(highImpacts)], // Remove duplicates
      perfDelta,
    };
  }

  private extractEntityIds(events: SessionEvent[]): string[] {
    const entityIds = new Set<string>();
    events.forEach(event => {
      event.changeInfo.entityIds.forEach(id => entityIds.add(id));
    });
    return Array.from(entityIds);
  }

  private async appendKGAnchor(entityIds: string[], anchor: SessionAnchor): Promise<void> {
    if (!this.knowledgeGraph) return;

    try {
      // Use Cypher query to append anchor to entity metadata
      const cypher = `
        UNWIND $entityIds as entityId
        MATCH (e:CodebaseEntity {id: entityId})
        SET e.metadata.sessions = CASE
          WHEN e.metadata.sessions IS NULL THEN [$anchor]
          ELSE e.metadata.sessions + [$anchor]
        END
        // Keep only last 5 sessions
        WITH e
        SET e.metadata.sessions = tail(e.metadata.sessions)[-5..]
      `;

      if (this.knowledgeGraph.query) {
        await this.knowledgeGraph.query(cypher, { entityIds, anchor });
      } else if (this.knowledgeGraph.neo4j?.query) {
        await this.knowledgeGraph.neo4j.query(cypher, { entityIds, anchor });
      }

      console.log(`[SessionManager] Appended KG anchor for ${entityIds.length} entities`);
    } catch (error) {
      console.error('[SessionManager] Failed to append KG anchor:', error);
      // Don't throw - this is non-critical
    }
  }

  private async createFailureSnapshot(
    sessionId: string,
    events: SessionEvent[],
    outcome: Outcome
  ): Promise<void> {
    if (!this.config.enableFailureSnapshots) return;

    try {
      // TODO: Implement Postgres failure snapshot
      // For now, just log the failure
      console.log(`[SessionManager] Would create failure snapshot for session ${sessionId}`, {
        outcome,
        eventCount: events.length,
      });
    } catch (error) {
      console.error(`[SessionManager] Failed to create failure snapshot for session ${sessionId}:`, error);
      // Don't throw - this is non-critical
    }
  }

  private async publishGlobalUpdate(message: SessionPubSubMessage): Promise<void> {
    try {
      await this.store.publishSessionUpdate(this.config.pubSubChannels.global, message);
    } catch (error) {
      console.error('[SessionManager] Failed to publish global update:', error);
      // Don't throw - this is non-critical
    }
  }

  // ========== Maintenance Operations ==========

  async performMaintenance(): Promise<void> {
    try {
      console.log('[SessionManager] Starting maintenance...');

      // Cleanup expired sessions
      await this.store.cleanup();

      // Clean up orphaned sequence trackers
      const activeSessions = await this.store.listActiveSessions();
      const activeSet = new Set(activeSessions);

      for (const sessionId of [...this.eventSequences.keys()]) {
        if (!activeSet.has(sessionId)) {
          this.eventSequences.delete(sessionId);
        }
      }

      console.log('[SessionManager] Maintenance completed');
    } catch (error) {
      console.error('[SessionManager] Maintenance failed:', error);
      this.emit('maintenance:error', error);
    }
  }

  // ========== Health Check ==========

  async healthCheck(): Promise<{
    healthy: boolean;
    sessionManager: boolean;
    store: { healthy: boolean; latency: number; error?: string };
    activeSessions: number;
  }> {
    try {
      const storeHealth = await this.store.healthCheck();
      const activeSessions = await this.store.listActiveSessions();

      return {
        healthy: storeHealth.healthy,
        sessionManager: true,
        store: storeHealth,
        activeSessions: activeSessions.length,
      };
    } catch (error) {
      return {
        healthy: false,
        sessionManager: false,
        store: { healthy: false, latency: 0, error: error instanceof Error ? error.message : String(error) },
        activeSessions: 0,
      };
    }
  }

  // ========== Cleanup ==========

  async close(): Promise<void> {
    try {
      await this.store.close();
      this.eventSequences.clear();
      this.emit('closed');
      console.log('[SessionManager] Closed successfully');
    } catch (error) {
      console.error('[SessionManager] Error during close:', error);
      throw new SessionError(
        `Failed to close: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CLOSE_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }
}