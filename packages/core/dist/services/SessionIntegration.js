/**
 * Session Integration
 *
 * Example integration showing how to use the session management system
 * with KnowledgeGraphService for multi-agent coordination
 */
import { SessionManager } from './SessionManager.js';
import { SessionBridge } from './SessionBridge.js';
import { SessionConfig, createSessionConfig } from './SessionConfig.js';
export class SessionIntegration {
    constructor(knowledgeGraph, // KnowledgeGraphService
    configOverrides) {
        // Create configuration based on environment
        this.config = {
            ...createSessionConfig(),
            ...configOverrides,
        };
        // Validate configuration
        const sessionConfig = SessionConfig.getInstance();
        const validation = sessionConfig.validateConfiguration();
        if (!validation.valid) {
            throw new Error(`Invalid session configuration: ${validation.errors.join(', ')}`);
        }
        // Initialize session management components
        this.sessionManager = new SessionManager(this.config, knowledgeGraph);
        this.sessionBridge = new SessionBridge(this.sessionManager, knowledgeGraph);
        console.log('[SessionIntegration] Initialized with configuration:', {
            environment: sessionConfig.getEnvironment(),
            redis: {
                host: this.config.redis.host,
                port: this.config.redis.port,
                db: this.config.redis.db,
            },
            session: {
                defaultTTL: this.config.defaultTTL,
                checkpointInterval: this.config.checkpointInterval,
            },
        });
    }
    // ========== High-Level Session Operations ==========
    /**
     * Start a new session for an agent working on specific entities
     */
    async startSession(agentId, options = {}) {
        var _a;
        const sessionOptions = {
            initialEntityIds: options.entityIds,
            metadata: options.metadata,
            ttl: options.ttl,
        };
        const sessionId = await this.sessionManager.createSession(agentId, sessionOptions);
        console.log(`[SessionIntegration] Started session ${sessionId} for agent ${agentId}`, {
            entityIds: ((_a = options.entityIds) === null || _a === void 0 ? void 0 : _a.length) || 0,
            metadata: options.metadata,
        });
        return sessionId;
    }
    /**
     * Record a code change event in a session
     */
    async recordCodeChange(sessionId, agentId, change) {
        const event = {
            type: 'modified',
            changeInfo: {
                elementType: 'function', // Could be inferred from entityIds
                entityIds: change.entityIds,
                operation: change.operation,
                affectedLines: change.affectedLines,
            },
            impact: change.severity || change.perfDelta ? {
                severity: change.severity || 'low',
                perfDelta: change.perfDelta,
            } : undefined,
            actor: agentId,
        };
        await this.sessionManager.emitEvent(sessionId, event, agentId);
        console.log(`[SessionIntegration] Recorded code change for session ${sessionId}`, {
            agent: agentId,
            entityIds: change.entityIds,
            operation: change.operation,
            severity: change.severity,
        });
    }
    /**
     * Record a test result event in a session
     */
    async recordTestResult(sessionId, agentId, result) {
        var _a;
        const event = {
            type: result.passed ? 'test_pass' : 'broke',
            changeInfo: {
                elementType: 'function',
                entityIds: result.entityIds,
                operation: 'modified',
            },
            stateTransition: {
                from: 'working',
                to: result.passed ? 'working' : 'broken',
                verifiedBy: 'test',
                confidence: result.confidence || 0.95,
            },
            impact: !result.passed ? {
                severity: 'high',
                testsFailed: result.testIds,
                perfDelta: result.perfDelta,
            } : {
                severity: 'low',
                perfDelta: result.perfDelta,
            },
            actor: agentId,
        };
        await this.sessionManager.emitEvent(sessionId, event, agentId);
        console.log(`[SessionIntegration] Recorded test result for session ${sessionId}`, {
            agent: agentId,
            passed: result.passed,
            entityIds: result.entityIds,
            testIds: ((_a = result.testIds) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
    }
    /**
     * Enable multi-agent collaboration on a session
     */
    async enableCollaboration(sessionId, joiningAgentId) {
        // Get handoff context for the joining agent
        const context = await this.sessionBridge.getHandoffContext(sessionId, joiningAgentId);
        // Add agent to session
        await this.sessionManager.joinSession(sessionId, joiningAgentId);
        console.log(`[SessionIntegration] Enabled collaboration for session ${sessionId}`, {
            joiningAgent: joiningAgentId,
            recentChanges: context.recentChanges.length,
            advice: context.joiningAdvice,
        });
        return context;
    }
    /**
     * Get session analysis for debugging or review
     */
    async analyzeSession(sessionId, options = {}) {
        const session = await this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const transitions = await this.sessionBridge.getTransitions(sessionId, options.entityId);
        let isolation;
        if (options.agentId) {
            isolation = await this.sessionBridge.isolateSession(sessionId, options.agentId);
        }
        return {
            session,
            transitions,
            isolation,
        };
    }
    /**
     * Create a checkpoint and prepare for handoff
     */
    async createCheckpoint(sessionId, options = {}) {
        const checkpointId = await this.sessionManager.checkpoint(sessionId, {
            graceTTL: options.gracePeriod,
            includeFailureSnapshot: options.includeFailureSnapshot,
        });
        console.log(`[SessionIntegration] Created checkpoint ${checkpointId} for session ${sessionId}`);
        return checkpointId;
    }
    /**
     * Get impact analysis across multiple entities
     */
    async getImpactAnalysis(entityIds, options = {}) {
        const aggregates = await this.sessionBridge.getSessionAggregates(entityIds, {
            agentId: options.agentId,
            // Could add date filtering based on timeframe
        });
        console.log(`[SessionIntegration] Generated impact analysis for ${entityIds.length} entities`, {
            totalSessions: aggregates.totalSessions,
            activeAgents: aggregates.activeAgents.length,
            performanceImpact: aggregates.performanceImpact.total,
        });
        return aggregates;
    }
    // ========== Administrative Operations ==========
    /**
     * Get system health status
     */
    async getHealthStatus() {
        const [managerHealth, bridgeHealth, stats] = await Promise.all([
            this.sessionManager.healthCheck(),
            this.sessionBridge.healthCheck(),
            this.sessionManager.getStats(),
        ]);
        const healthy = managerHealth.healthy && bridgeHealth.healthy;
        return {
            healthy,
            components: {
                sessionManager: managerHealth.sessionManager,
                sessionBridge: bridgeHealth.bridge,
                redis: managerHealth.store,
            },
            stats: {
                activeSessions: stats.activeSessions,
                totalEvents: stats.totalEvents,
                agentsActive: stats.agentsActive,
            },
        };
    }
    /**
     * Perform maintenance operations
     */
    async performMaintenance() {
        await this.sessionManager.performMaintenance();
        console.log('[SessionIntegration] Maintenance completed');
    }
    /**
     * Get active sessions for an agent
     */
    async getAgentSessions(agentId) {
        return await this.sessionManager.getSessionsByAgent(agentId);
    }
    /**
     * Get all active sessions
     */
    async getAllActiveSessions() {
        return await this.sessionManager.listActiveSessions();
    }
    // ========== Cleanup ==========
    /**
     * Gracefully shutdown the session integration
     */
    async shutdown() {
        await this.sessionManager.close();
        console.log('[SessionIntegration] Shutdown completed');
    }
}
// ========== Helper Functions ==========
/**
 * Create a session integration with environment-specific defaults
 */
export function createSessionIntegration(knowledgeGraph, environment) {
    const config = createSessionConfig(environment);
    return new SessionIntegration(knowledgeGraph, config);
}
/**
 * Example usage patterns for session management
 */
export const SessionUsageExamples = {
    /**
     * Single agent workflow
     */
    singleAgent: async (integration, agentId) => {
        // Start session
        const sessionId = await integration.startSession(agentId, {
            entityIds: ['function-auth-login', 'test-auth-integration'],
            metadata: { task: 'implement-login', priority: 'high' }
        });
        // Record code changes
        await integration.recordCodeChange(sessionId, agentId, {
            entityIds: ['function-auth-login'],
            operation: 'modified',
            affectedLines: 25,
            severity: 'medium'
        });
        // Record test results
        await integration.recordTestResult(sessionId, agentId, {
            entityIds: ['function-auth-login'],
            passed: false,
            testIds: ['test-auth-integration'],
            confidence: 0.9
        });
        // Create checkpoint
        const checkpointId = await integration.createCheckpoint(sessionId);
        return { sessionId, checkpointId };
    },
    /**
     * Multi-agent handoff workflow
     */
    multiAgentHandoff: async (integration, agent1, agent2) => {
        // Agent 1 starts session
        const sessionId = await integration.startSession(agent1, {
            entityIds: ['cluster-auth', 'spec-login-flow'],
            metadata: { task: 'auth-refactor', phase: 'analysis' }
        });
        // Agent 1 works on it
        await integration.recordCodeChange(sessionId, agent1, {
            entityIds: ['cluster-auth'],
            operation: 'modified',
            severity: 'high'
        });
        // Agent 2 joins for collaboration
        const handoffContext = await integration.enableCollaboration(sessionId, agent2);
        console.log('Handoff advice:', handoffContext.joiningAdvice);
        console.log('Recent changes:', handoffContext.recentChanges.length);
        // Agent 2 continues work
        await integration.recordTestResult(sessionId, agent2, {
            entityIds: ['cluster-auth'],
            passed: true,
            confidence: 0.95
        });
        return { sessionId, handoffContext };
    },
    /**
     * Impact analysis workflow
     */
    impactAnalysis: async (integration, entityIds) => {
        const analysis = await integration.getImpactAnalysis(entityIds, {
            timeframe: 7, // Last 7 days
        });
        console.log('Impact Analysis Results:', {
            totalSessions: analysis.totalSessions,
            activeAgents: analysis.activeAgents,
            brokenSessions: analysis.recentOutcomes.broken || 0,
            avgPerformanceImpact: analysis.performanceImpact.average,
            entityBreakdown: analysis.entityBreakdown.slice(0, 5), // Top 5 entities
        });
        return analysis;
    }
};
//# sourceMappingURL=SessionIntegration.js.map