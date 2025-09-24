/**
 * Session Bridge
 *
 * Bridge service for multi-agent session coordination providing intelligent queries
 * that join Redis session data with Knowledge Graph traversals for enriched context
 */
import { EventEmitter } from 'events';
import { SessionError, SessionNotFoundError, } from './SessionTypes.js';
export class SessionBridge extends EventEmitter {
    constructor(sessionManager, knowledgeGraph // KnowledgeGraphService - optional dependency
    ) {
        super();
        this.sessionManager = sessionManager;
        this.knowledgeGraph = knowledgeGraph;
        console.log('[SessionBridge] Initialized with KG integration:', !!this.knowledgeGraph);
    }
    // ========== Transition Analysis ==========
    async getTransitions(sessionId, entityId) {
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
        }
        catch (error) {
            console.error(`[SessionBridge] Failed to get transitions for session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to get transitions: ${error instanceof Error ? error.message : String(error)}`, 'BRIDGE_TRANSITIONS_FAILED', sessionId, { entityId, originalError: error });
        }
    }
    detectTransitions(events) {
        const transitions = [];
        for (let i = 1; i < events.length; i++) {
            const prev = events[i - 1];
            const curr = events[i];
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
    isSignificantTransition(prev, curr) {
        var _a, _b, _c, _d, _e;
        // Working -> Broken transition
        if (((_a = prev.stateTransition) === null || _a === void 0 ? void 0 : _a.to) === 'working' && ((_b = curr.stateTransition) === null || _b === void 0 ? void 0 : _b.to) === 'broken') {
            return true;
        }
        // Test pass -> failure
        if (prev.type === 'test_pass' && curr.type === 'broke') {
            return true;
        }
        // High impact changes
        if (((_c = curr.impact) === null || _c === void 0 ? void 0 : _c.severity) === 'high' || ((_d = curr.impact) === null || _d === void 0 ? void 0 : _d.severity) === 'critical') {
            return true;
        }
        // Performance regressions
        if (((_e = curr.impact) === null || _e === void 0 ? void 0 : _e.perfDelta) && curr.impact.perfDelta < -5) {
            return true;
        }
        return false;
    }
    async enrichTransitionsWithKGContext(transitions, entityId) {
        if (!this.knowledgeGraph)
            return;
        try {
            const affectedIds = transitions.flatMap(t => t.changeInfo.entityIds);
            const cypher = `
        MATCH (start:CodebaseEntity {id: $entityId})
        MATCH path = (start)-[:IMPACTS|IMPLEMENTS_CLUSTER|PERFORMS_FOR*0..2]-(related)
        WHERE start.id IN $affectedIds
        RETURN start.id,
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
                const match = kgResults.find((r) => transition.changeInfo.entityIds.includes(r['start.id']));
                if (match && match.context.length > 0) {
                    transition.kgContext = match.context[0];
                }
            });
        }
        catch (error) {
            console.error('[SessionBridge] Failed to enrich transitions with KG context:', error);
            // Don't throw - enrichment is optional
        }
    }
    // ========== Session Isolation ==========
    async isolateSession(sessionId, agentId) {
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
                return sum + impact.anchors.reduce((s, anchor) => s + (anchor.perfDelta || 0), 0);
            }, 0);
            const result = {
                events: agentEvents,
                impacts,
                totalPerfDelta,
                agentId,
            };
            console.log(`[SessionBridge] Isolated session ${sessionId} for agent ${agentId}: ${agentEvents.length} events`);
            return result;
        }
        catch (error) {
            console.error(`[SessionBridge] Failed to isolate session ${sessionId} for agent ${agentId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to isolate session: ${error instanceof Error ? error.message : String(error)}`, 'BRIDGE_ISOLATE_FAILED', sessionId, { agentId, originalError: error });
        }
    }
    async getSessionImpacts(sessionId, agentId) {
        if (!this.knowledgeGraph)
            return [];
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
            return results.map((r) => ({
                entityId: r.entityId,
                anchors: r.anchors,
                count: r.count,
            }));
        }
        catch (error) {
            console.error('[SessionBridge] Failed to get session impacts:', error);
            return [];
        }
    }
    // ========== Handoff Context ==========
    async getHandoffContext(sessionId, joiningAgent) {
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
            const context = {
                sessionId,
                recentChanges,
                kgContext,
                joiningAdvice,
            };
            console.log(`[SessionBridge] Generated handoff context for agent ${joiningAgent} joining session ${sessionId}`);
            return context;
        }
        catch (error) {
            console.error(`[SessionBridge] Failed to get handoff context for session ${sessionId}:`, error);
            if (error instanceof SessionError)
                throw error;
            throw new SessionError(`Failed to get handoff context: ${error instanceof Error ? error.message : String(error)}`, 'BRIDGE_HANDOFF_FAILED', sessionId, { joiningAgent, originalError: error });
        }
    }
    async getKGContextForChanges(events) {
        if (!this.knowledgeGraph || events.length === 0)
            return [];
        try {
            const affectedIds = events.flatMap(e => e.changeInfo.entityIds);
            if (affectedIds.length === 0)
                return [];
            const cypher = `
        MATCH (e:CodebaseEntity)
        WHERE e.id IN $affectedIds
        OPTIONAL MATCH (e)-[:DEFINES|TESTS|PERFORMS_FOR]-(related)
        RETURN e.id as entityId,
               collect(DISTINCT related) as related,
               e.metadata.sessions[-1] as lastAnchor
      `;
            const results = await this.executeKGQuery(cypher, { affectedIds });
            return results.map((r) => ({
                entityId: r.entityId,
                related: r.related || [],
                lastAnchor: r.lastAnchor,
            }));
        }
        catch (error) {
            console.error('[SessionBridge] Failed to get KG context for changes:', error);
            return [];
        }
    }
    generateJoiningAdvice(session, recentChanges) {
        const activeAgents = session.agentIds;
        const recentActors = [...new Set(recentChanges.map(e => e.actor))];
        const hasRecentBreaks = recentChanges.some(e => { var _a; return ((_a = e.stateTransition) === null || _a === void 0 ? void 0 : _a.to) === 'broken'; });
        const hasHighImpact = recentChanges.some(e => { var _a, _b; return ((_a = e.impact) === null || _a === void 0 ? void 0 : _a.severity) === 'high' || ((_b = e.impact) === null || _b === void 0 ? void 0 : _b.severity) === 'critical'; });
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
    async querySessionsByEntity(entityId, options = {}) {
        try {
            const sessions = [];
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
        }
        catch (error) {
            console.error(`[SessionBridge] Failed to query sessions for entity ${entityId}:`, error);
            throw new SessionError(`Failed to query sessions by entity: ${error instanceof Error ? error.message : String(error)}`, 'BRIDGE_ENTITY_QUERY_FAILED', undefined, { entityId, options, originalError: error });
        }
    }
    async getSessionsFromKGAnchors(entityId, options) {
        if (!this.knowledgeGraph)
            return [];
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
            const sessions = [];
            for (const result of results) {
                const session = await this.sessionManager.getSession(result.sessionId);
                if (session) {
                    sessions.push(session);
                }
            }
            return sessions;
        }
        catch (error) {
            console.error('[SessionBridge] Failed to get sessions from KG anchors:', error);
            return [];
        }
    }
    sessionReferencesEntity(session, entityId) {
        return session.events.some(event => event.changeInfo.entityIds.includes(entityId));
    }
    deduplicateSessions(sessions) {
        const seen = new Set();
        return sessions.filter(session => {
            if (seen.has(session.sessionId)) {
                return false;
            }
            seen.add(session.sessionId);
            return true;
        });
    }
    applySessionFilters(sessions, options) {
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
    async getSessionAggregates(entityIds, options = {}) {
        try {
            const allSessions = [];
            // Collect sessions for all entities
            for (const entityId of entityIds) {
                const sessions = await this.querySessionsByEntity(entityId, options);
                allSessions.push(...sessions);
            }
            const uniqueSessions = this.deduplicateSessions(allSessions);
            // Calculate aggregates
            const totalSessions = uniqueSessions.length;
            const activeAgents = [...new Set(uniqueSessions.flatMap(s => s.agentIds))];
            const recentOutcomes = {};
            const perfImpacts = [];
            uniqueSessions.forEach(session => {
                // Count outcomes from recent events
                session.events.forEach(event => {
                    var _a, _b;
                    if ((_a = event.stateTransition) === null || _a === void 0 ? void 0 : _a.to) {
                        recentOutcomes[event.stateTransition.to] = (recentOutcomes[event.stateTransition.to] || 0) + 1;
                    }
                    if ((_b = event.impact) === null || _b === void 0 ? void 0 : _b.perfDelta) {
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
                const entitySessions = uniqueSessions.filter(session => this.sessionReferencesEntity(session, entityId));
                const impacts = entitySessions.flatMap(session => session.events
                    .filter(e => { var _a; return e.changeInfo.entityIds.includes(entityId) && ((_a = e.impact) === null || _a === void 0 ? void 0 : _a.perfDelta); })
                    .map(e => e.impact.perfDelta));
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
                recentOutcomes,
                performanceImpact,
                entityBreakdown,
            };
        }
        catch (error) {
            console.error(`[SessionBridge] Failed to get session aggregates:`, error);
            throw new SessionError(`Failed to get session aggregates: ${error instanceof Error ? error.message : String(error)}`, 'BRIDGE_AGGREGATES_FAILED', undefined, { entityIds, options, originalError: error });
        }
    }
    // ========== Utility Methods ==========
    async executeKGQuery(cypher, params) {
        var _a;
        if (!this.knowledgeGraph) {
            throw new SessionError('Knowledge Graph service not available', 'KG_NOT_AVAILABLE');
        }
        try {
            if (this.knowledgeGraph.query) {
                return await this.knowledgeGraph.query(cypher, params);
            }
            else if ((_a = this.knowledgeGraph.neo4j) === null || _a === void 0 ? void 0 : _a.query) {
                return await this.knowledgeGraph.neo4j.query(cypher, params);
            }
            else {
                throw new Error('No query method available on Knowledge Graph service');
            }
        }
        catch (error) {
            console.error('[SessionBridge] KG query failed:', error);
            throw new SessionError(`Knowledge Graph query failed: ${error instanceof Error ? error.message : String(error)}`, 'KG_QUERY_FAILED', undefined, { cypher, params, originalError: error });
        }
    }
    // ========== Health Check ==========
    async healthCheck() {
        try {
            const sessionManagerHealth = await this.sessionManager.healthCheck();
            let kgHealthy = true;
            if (this.knowledgeGraph) {
                try {
                    // Try a simple KG query
                    await this.executeKGQuery('RETURN 1 as test', {});
                }
                catch (error) {
                    kgHealthy = false;
                }
            }
            return {
                healthy: sessionManagerHealth.healthy && kgHealthy,
                bridge: true,
                sessionManager: sessionManagerHealth.healthy,
                knowledgeGraph: kgHealthy,
            };
        }
        catch (error) {
            return {
                healthy: false,
                bridge: false,
                sessionManager: false,
                knowledgeGraph: false,
            };
        }
    }
}
//# sourceMappingURL=SessionBridge.js.map