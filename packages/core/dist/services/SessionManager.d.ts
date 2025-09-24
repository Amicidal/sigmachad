/**
 * Session Manager
 *
 * Main session management service providing high-level session operations
 * Orchestrates SessionStore and integrates with KnowledgeGraphService for anchors
 */
import { EventEmitter } from 'events';
import { SessionDocument, SessionEvent, SessionCreationOptions, SessionEventOptions, CheckpointOptions, SessionManagerConfig, ISessionManager, SessionStats } from './SessionTypes.js';
export declare class SessionManager extends EventEmitter implements ISessionManager {
    private store;
    private knowledgeGraph?;
    private eventSequences;
    private config;
    constructor(config: SessionManagerConfig, knowledgeGraph?: any);
    private setupEventHandlers;
    createSession(agentId: string, options?: SessionCreationOptions): Promise<string>;
    joinSession(sessionId: string, agentId: string): Promise<void>;
    leaveSession(sessionId: string, agentId: string): Promise<void>;
    emitEvent(sessionId: string, eventData: Omit<SessionEvent, 'seq' | 'timestamp'>, actor: string, options?: SessionEventOptions): Promise<void>;
    getSession(sessionId: string): Promise<SessionDocument | null>;
    checkpoint(sessionId: string, options?: CheckpointOptions): Promise<string>;
    cleanup(sessionId: string): Promise<void>;
    listActiveSessions(): Promise<string[]>;
    getSessionsByAgent(agentId: string): Promise<string[]>;
    getStats(): Promise<SessionStats>;
    private aggregateEvents;
    private extractEntityIds;
    private appendKGAnchor;
    private createFailureSnapshot;
    private publishGlobalUpdate;
    performMaintenance(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        sessionManager: boolean;
        store: {
            healthy: boolean;
            latency: number;
            error?: string;
        };
        activeSessions: number;
    }>;
    close(): Promise<void>;
}
//# sourceMappingURL=SessionManager.d.ts.map