/**
 * Session Management Type Definitions
 *
 * Type definitions for Redis-based session coordination system
 * Supporting multi-agent workflows with ephemeral session storage
 */
export type SessionState = 'working' | 'broken' | 'coordinating' | 'completed';
export type EventType = 'modified' | 'broke' | 'checkpoint' | 'handoff' | 'test_pass' | 'start';
export type ElementType = 'function' | 'cluster' | 'spec' | 'benchmark' | 'session';
export type Operation = 'added' | 'modified' | 'deleted' | 'renamed' | 'init';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Outcome = 'working' | 'broken' | 'coordinated' | 'completed';
export type VerifiedBy = 'test' | 'build' | 'manual' | 'agent';
export interface SessionChangeInfo {
    elementType: ElementType;
    entityIds: string[];
    operation: Operation;
    affectedLines?: number;
    semanticHash?: string;
}
export interface SessionStateTransition {
    from: SessionState;
    to: SessionState;
    verifiedBy: VerifiedBy;
    confidence: number;
}
export interface SessionImpact {
    severity: Severity;
    testsFailed?: string[];
    perfDelta?: number;
    externalRef?: string;
}
export interface SessionEvent {
    seq: number;
    type: EventType;
    timestamp: string;
    changeInfo: SessionChangeInfo;
    stateTransition?: SessionStateTransition;
    impact?: SessionImpact;
    actor: string;
}
export interface SessionCheckpoint {
    id: string;
    refEntities: string[];
    summary: {
        outcome: Outcome;
        keyImpacts: string[];
        perfDelta?: number;
    };
}
export interface SessionDocument {
    sessionId: string;
    agentIds: string[];
    state: SessionState;
    events: SessionEvent[];
    currentCheckpoint?: SessionCheckpoint;
    metadata?: Record<string, any>;
}
export interface SessionAnchor {
    sessionId: string;
    outcome: Outcome;
    checkpointId: string;
    keyImpacts: string[];
    perfDelta?: number;
    actors: string[];
    timestamp: string;
    externalRef?: string;
}
export interface SessionQuery {
    sessionId?: string;
    agentId?: string;
    entityId?: string;
    state?: SessionState;
    outcome?: Outcome;
    fromSeq?: number;
    toSeq?: number;
    limit?: number;
    includeEvents?: boolean;
    includeKGContext?: boolean;
}
export interface TransitionResult {
    fromSeq: number;
    toSeq: number;
    changeInfo: SessionChangeInfo;
    impact?: SessionImpact;
    kgContext?: {
        specTitle?: string;
        clusterName?: string;
        benchmarkDelta?: number;
    };
}
export interface SessionCreationOptions {
    initialEntityIds?: string[];
    ttl?: number;
    metadata?: Record<string, any>;
}
export interface SessionEventOptions {
    resetTTL?: boolean;
    autoCheckpoint?: boolean;
    publishUpdate?: boolean;
}
export interface CheckpointOptions {
    forceSnapshot?: boolean;
    graceTTL?: number;
    includeFailureSnapshot?: boolean;
}
export interface HandoffContext {
    sessionId: string;
    recentChanges: SessionEvent[];
    kgContext: Array<{
        entityId: string;
        related: any[];
        lastAnchor?: SessionAnchor;
    }>;
    joiningAdvice: string;
}
export interface IsolationResult {
    events: SessionEvent[];
    impacts: Array<{
        entityId: string;
        anchors: SessionAnchor[];
        count: number;
    }>;
    totalPerfDelta: number;
    agentId: string;
}
export interface RedisSessionData {
    agentIds: string;
    state: SessionState;
    events: string;
    metadata?: string;
}
export interface RedisEventData {
    score: number;
    member: string;
}
export interface SessionPubSubMessage {
    type: 'new' | 'modified' | 'checkpoint_complete' | 'handoff';
    sessionId: string;
    seq?: number;
    actor?: string;
    initiator?: string;
    checkpointId?: string;
    outcome?: Outcome;
    summary?: {
        entityIds?: string[];
        impact?: SessionImpact;
    };
}
export interface RedisConfig {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    lazyConnect?: boolean;
}
export interface SessionManagerConfig {
    redis: RedisConfig;
    defaultTTL?: number;
    checkpointInterval?: number;
    maxEventsPerSession?: number;
    graceTTL?: number;
    enableFailureSnapshots?: boolean;
    pubSubChannels?: {
        global?: string;
        session?: string;
    };
}
export declare class SessionError extends Error {
    code: string;
    sessionId?: string | undefined;
    context?: Record<string, any> | undefined;
    constructor(message: string, code: string, sessionId?: string | undefined, context?: Record<string, any> | undefined);
}
export declare class SessionNotFoundError extends SessionError {
    constructor(sessionId: string);
}
export declare class SessionExpiredError extends SessionError {
    constructor(sessionId: string);
}
export interface ISessionStore {
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
}
export interface ISessionManager {
    createSession(agentId: string, options?: SessionCreationOptions): Promise<string>;
    joinSession(sessionId: string, agentId: string): Promise<void>;
    leaveSession(sessionId: string, agentId: string): Promise<void>;
    emitEvent(sessionId: string, event: Omit<SessionEvent, 'seq' | 'timestamp'>, actor: string): Promise<void>;
    getSession(sessionId: string): Promise<SessionDocument | null>;
    checkpoint(sessionId: string, options?: CheckpointOptions): Promise<string>;
    cleanup(sessionId: string): Promise<void>;
    listActiveSessions(): Promise<string[]>;
    getSessionsByAgent(agentId: string): Promise<string[]>;
}
export interface ISessionBridge {
    getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]>;
    isolateSession(sessionId: string, agentId: string): Promise<IsolationResult>;
    getHandoffContext(sessionId: string, joiningAgent: string): Promise<HandoffContext>;
    querySessionsByEntity(entityId: string, options?: SessionQuery): Promise<SessionDocument[]>;
    getSessionAggregates(entityIds: string[], options?: SessionQuery): Promise<any>;
}
export interface SessionStats {
    activeSessions: number;
    totalEvents: number;
    averageEventsPerSession: number;
    checkpointsCreated: number;
    failureSnapshots: number;
    agentsActive: number;
    redisMemoryUsage: number;
}
export interface SessionMetrics {
    sessionDuration: number;
    eventCount: number;
    transitionCount: number;
    performanceImpact: number;
    agentCollaboration: number;
}
export type { SessionDocument as RedisSession, SessionEvent as RedisEvent, SessionAnchor as RedisAnchor, SessionQuery as RedisQuery, HandoffContext as RedisHandoff, IsolationResult as RedisIsolation, TransitionResult as RedisTransition, };
//# sourceMappingURL=SessionTypes.d.ts.map