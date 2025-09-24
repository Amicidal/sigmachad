/**
 * Session Integration
 *
 * Example integration showing how to use the session management system
 * with KnowledgeGraphService for multi-agent coordination
 */
import { SessionDocument, SessionManagerConfig } from './SessionTypes.js';
export declare class SessionIntegration {
    private sessionManager;
    private sessionBridge;
    private config;
    constructor(knowledgeGraph?: any, // KnowledgeGraphService
    configOverrides?: Partial<SessionManagerConfig>);
    /**
     * Start a new session for an agent working on specific entities
     */
    startSession(agentId: string, options?: {
        entityIds?: string[];
        metadata?: Record<string, any>;
        ttl?: number;
    }): Promise<string>;
    /**
     * Record a code change event in a session
     */
    recordCodeChange(sessionId: string, agentId: string, change: {
        entityIds: string[];
        operation: 'added' | 'modified' | 'deleted' | 'renamed';
        affectedLines?: number;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        perfDelta?: number;
    }): Promise<void>;
    /**
     * Record a test result event in a session
     */
    recordTestResult(sessionId: string, agentId: string, result: {
        entityIds: string[];
        passed: boolean;
        testIds?: string[];
        perfDelta?: number;
        confidence?: number;
    }): Promise<void>;
    /**
     * Enable multi-agent collaboration on a session
     */
    enableCollaboration(sessionId: string, joiningAgentId: string): Promise<import('./SessionTypes.js').HandoffContext>;
    /**
     * Get session analysis for debugging or review
     */
    analyzeSession(sessionId: string, options?: {
        entityId?: string;
        agentId?: string;
    }): Promise<{
        session: SessionDocument;
        transitions: any[];
        isolation?: any;
    }>;
    /**
     * Create a checkpoint and prepare for handoff
     */
    createCheckpoint(sessionId: string, options?: {
        gracePeriod?: number;
        includeFailureSnapshot?: boolean;
    }): Promise<string>;
    /**
     * Get impact analysis across multiple entities
     */
    getImpactAnalysis(entityIds: string[], options?: {
        timeframe?: number;
        agentId?: string;
    }): Promise<any>;
    /**
     * Get system health status
     */
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: {
            sessionManager: boolean;
            sessionBridge: boolean;
            redis: {
                healthy: boolean;
                latency: number;
            };
        };
        stats: {
            activeSessions: number;
            totalEvents: number;
            agentsActive: number;
        };
    }>;
    /**
     * Perform maintenance operations
     */
    performMaintenance(): Promise<void>;
    /**
     * Get active sessions for an agent
     */
    getAgentSessions(agentId: string): Promise<string[]>;
    /**
     * Get all active sessions
     */
    getAllActiveSessions(): Promise<string[]>;
    /**
     * Gracefully shutdown the session integration
     */
    shutdown(): Promise<void>;
}
/**
 * Create a session integration with environment-specific defaults
 */
export declare function createSessionIntegration(knowledgeGraph?: any, environment?: 'development' | 'test' | 'production'): SessionIntegration;
/**
 * Example usage patterns for session management
 */
export declare const SessionUsageExamples: {
    /**
     * Single agent workflow
     */
    singleAgent: (integration: SessionIntegration, agentId: string) => Promise<{
        sessionId: string;
        checkpointId: string;
    }>;
    /**
     * Multi-agent handoff workflow
     */
    multiAgentHandoff: (integration: SessionIntegration, agent1: string, agent2: string) => Promise<{
        sessionId: string;
        handoffContext: import("./SessionTypes.js").HandoffContext;
    }>;
    /**
     * Impact analysis workflow
     */
    impactAnalysis: (integration: SessionIntegration, entityIds: string[]) => Promise<any>;
};
export type { HandoffContext } from './SessionTypes.js';
//# sourceMappingURL=SessionIntegration.d.ts.map