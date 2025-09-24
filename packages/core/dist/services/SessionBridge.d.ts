/**
 * Session Bridge
 *
 * Bridge service for multi-agent session coordination providing intelligent queries
 * that join Redis session data with Knowledge Graph traversals for enriched context
 */
import { EventEmitter } from 'events';
import { SessionManager } from './SessionManager.js';
import { SessionDocument, SessionQuery, TransitionResult, HandoffContext, IsolationResult, ISessionBridge } from './SessionTypes.js';
export declare class SessionBridge extends EventEmitter implements ISessionBridge {
    private sessionManager;
    private knowledgeGraph?;
    constructor(sessionManager: SessionManager, knowledgeGraph?: any | undefined);
    getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]>;
    private detectTransitions;
    private isSignificantTransition;
    private enrichTransitionsWithKGContext;
    isolateSession(sessionId: string, agentId: string): Promise<IsolationResult>;
    private getSessionImpacts;
    getHandoffContext(sessionId: string, joiningAgent: string): Promise<HandoffContext>;
    private getKGContextForChanges;
    private generateJoiningAdvice;
    querySessionsByEntity(entityId: string, options?: SessionQuery): Promise<SessionDocument[]>;
    private getSessionsFromKGAnchors;
    private sessionReferencesEntity;
    private deduplicateSessions;
    private applySessionFilters;
    getSessionAggregates(entityIds: string[], options?: SessionQuery): Promise<{
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
    }>;
    private executeKGQuery;
    healthCheck(): Promise<{
        healthy: boolean;
        bridge: boolean;
        sessionManager: boolean;
        knowledgeGraph: boolean;
    }>;
}
//# sourceMappingURL=SessionBridge.d.ts.map