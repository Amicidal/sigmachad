/**
 * Session Store Implementation
 *
 * Redis-backed session storage providing high-performance ephemeral storage
 * for multi-agent session coordination with TTL-based cleanup
 */
import { EventEmitter } from 'events';
import { SessionDocument, SessionEvent, SessionCreationOptions, RedisConfig, ISessionStore, SessionStats } from './SessionTypes.js';
export declare class SessionStore extends EventEmitter implements ISessionStore {
    private config;
    private redis;
    private pubClient;
    private subClient;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: RedisConfig);
    private createRedisClient;
    private initialize;
    createSession(sessionId: string, agentId: string, options?: SessionCreationOptions): Promise<void>;
    getSession(sessionId: string): Promise<SessionDocument | null>;
    updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    addEvent(sessionId: string, event: SessionEvent): Promise<void>;
    getEvents(sessionId: string, fromSeq?: number, toSeq?: number): Promise<SessionEvent[]>;
    getRecentEvents(sessionId: string, limit?: number): Promise<SessionEvent[]>;
    addAgent(sessionId: string, agentId: string): Promise<void>;
    removeAgent(sessionId: string, agentId: string): Promise<void>;
    setTTL(sessionId: string, ttl: number): Promise<void>;
    exists(sessionId: string): Promise<boolean>;
    publishSessionUpdate(sessionId: string, message: any): Promise<void>;
    subscribeToSession(sessionId: string, callback: (message: any) => void): Promise<void>;
    getStats(): Promise<SessionStats>;
    listActiveSessions(): Promise<string[]>;
    cleanup(): Promise<void>;
    close(): Promise<void>;
    private getSessionKey;
    private getEventsKey;
    healthCheck(): Promise<{
        healthy: boolean;
        latency: number;
        error?: string;
    }>;
}
//# sourceMappingURL=SessionStore.d.ts.map