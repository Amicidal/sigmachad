/**
 * Session and Timeline Types for Memento
 * Common types for session management, timeline tracking, and change analysis
 */

import { RelationshipType } from './relationships.js';

// ========== Core Session Types ==========

export type SessionState = 'working' | 'broken' | 'coordinating' | 'completed';
export type EventType =
  | 'modified'
  | 'broke'
  | 'checkpoint'
  | 'handoff'
  | 'test_pass'
  | 'start';
export type ElementType =
  | 'function'
  | 'cluster'
  | 'spec'
  | 'benchmark'
  | 'session';
export type Operation = 'added' | 'modified' | 'deleted' | 'renamed' | 'init';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Outcome = 'working' | 'broken' | 'coordinated' | 'completed';
export type VerifiedBy = 'test' | 'build' | 'manual' | 'agent';

// ========== Session Event Structure ==========

export interface SessionChangeInfo {
  elementType: ElementType;
  entityIds: string[]; // KG refs
  operation: Operation;
  affectedLines?: number;
  semanticHash?: string;
}

export interface SessionStateTransition {
  from: SessionState;
  to: SessionState;
  verifiedBy: VerifiedBy;
  confidence: number; // 0-1
}

export interface SessionImpact {
  severity: Severity;
  testsFailed?: string[]; // KG testIds
  perfDelta?: number; // ms regression/improvement
  externalRef?: string; // Postgres ID for failure details
}

export interface SessionEvent {
  seq: number;
  type: EventType;
  timestamp: string; // ISODate
  changeInfo: SessionChangeInfo;
  stateTransition?: SessionStateTransition;
  impact?: SessionImpact;
  actor: string; // e.g., 'agent20'
}

// ========== Session Checkpoint ==========

export interface SessionCheckpoint {
  id: string;
  refEntities: string[]; // KG IDs for anchors
  summary: {
    outcome: Outcome;
    keyImpacts: string[];
    perfDelta?: number;
  };
}

// ========== Session Document Structure ==========

export interface SessionDocument {
  sessionId: string;
  agentIds: string[];
  state: SessionState;
  events: SessionEvent[];
  currentCheckpoint?: SessionCheckpoint;
  metadata?: Record<string, any>;
}

// ========== KG Anchor Types ==========

export interface SessionAnchor {
  sessionId: string;
  outcome: Outcome;
  checkpointId: string;
  keyImpacts: string[];
  perfDelta?: number;
  actors: string[];
  timestamp: string; // ISODate
  externalRef?: string; // Postgres ID for failure snapshot
}

// ========== Session Query Types ==========

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

// ========== Session Management Options ==========

export interface SessionCreationOptions {
  initialEntityIds?: string[];
  ttl?: number; // seconds
  metadata?: Record<string, any>;
}

export interface SessionEventOptions {
  resetTTL?: boolean;
  autoCheckpoint?: boolean;
  publishUpdate?: boolean;
}

export interface CheckpointOptions {
  forceSnapshot?: boolean;
  graceTTL?: number; // seconds before cleanup
  includeFailureSnapshot?: boolean;
}

// ========== Bridge Query Types ==========

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

// ========== Redis Data Structures ==========

export interface RedisSessionData {
  agentIds: string; // JSON array
  state: SessionState;
  events: string; // ZSET reference or count
  metadata?: string; // JSON object
}

export interface RedisEventData {
  score: number; // sequence number
  member: string; // JSON serialized SessionEvent
}

// ========== Pub/Sub Message Types ==========

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

// ========== Configuration Types ==========

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  lazyConnect?: boolean;
  tls?: boolean | Record<string, unknown>;
}

export interface SessionManagerConfig {
  redis: RedisConfig;
  defaultTTL?: number; // default session TTL in seconds
  checkpointInterval?: number; // auto-checkpoint every N events
  maxEventsPerSession?: number;
  graceTTL?: number; // cleanup grace period
  enableFailureSnapshots?: boolean;
  pubSubChannels?: {
    global?: string;
    session?: string;
  };
}

// ========== Error Types ==========

export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND', sessionId);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends SessionError {
  constructor(sessionId: string) {
    super(`Session expired: ${sessionId}`, 'SESSION_EXPIRED', sessionId);
    this.name = 'SessionExpiredError';
  }
}

// ========== Service Interface Types ==========

export interface ISessionStore {
  createSession(
    sessionId: string,
    agentId: string,
    options?: SessionCreationOptions
  ): Promise<void>;
  getSession(sessionId: string): Promise<SessionDocument | null>;
  updateSession(
    sessionId: string,
    updates: Partial<SessionDocument>
  ): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  addEvent(sessionId: string, event: SessionEvent): Promise<void>;
  getEvents(
    sessionId: string,
    fromSeq?: number,
    toSeq?: number
  ): Promise<SessionEvent[]>;
  getRecentEvents(sessionId: string, limit?: number): Promise<SessionEvent[]>;
  addAgent(sessionId: string, agentId: string): Promise<void>;
  removeAgent(sessionId: string, agentId: string): Promise<void>;
  setTTL(sessionId: string, ttl: number): Promise<void>;
  exists(sessionId: string): Promise<boolean>;
}

export interface ISessionManager {
  createSession(
    agentId: string,
    options?: SessionCreationOptions
  ): Promise<string>;
  joinSession(sessionId: string, agentId: string): Promise<void>;
  leaveSession(sessionId: string, agentId: string): Promise<void>;
  emitEvent(
    sessionId: string,
    event: Omit<SessionEvent, 'seq' | 'timestamp'>,
    actor: string
  ): Promise<void>;
  getSession(sessionId: string): Promise<SessionDocument | null>;
  checkpoint(sessionId: string, options?: CheckpointOptions): Promise<string>;
  cleanup(sessionId: string): Promise<void>;
  listActiveSessions(): Promise<string[]>;
  getSessionsByAgent(agentId: string): Promise<string[]>;
}

export interface ISessionBridge {
  getTransitions(
    sessionId: string,
    entityId?: string
  ): Promise<TransitionResult[]>;
  isolateSession(sessionId: string, agentId: string): Promise<IsolationResult>;
  getHandoffContext(
    sessionId: string,
    joiningAgent: string
  ): Promise<HandoffContext>;
  querySessionsByEntity(
    entityId: string,
    options?: SessionQuery
  ): Promise<SessionDocument[]>;
  getSessionAggregates(
    entityIds: string[],
    options?: SessionQuery
  ): Promise<any>;
}

// ========== Statistics and Monitoring ==========

export interface SessionStats {
  activeSessions: number;
  totalEvents: number;
  totalRelationships: number;
  totalChanges: number;
  averageEventsPerSession: number;
  checkpointsCreated: number;
  failureSnapshots: number;
  agentsActive: number;
  redisMemoryUsage: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface SessionMetrics {
  sessionDuration: number;
  eventCount: number;
  transitionCount: number;
  performanceImpact: number;
  agentCollaboration: number;
}

/**
 * Summary of changes made in a session
 */
export interface SessionChangeSummary {
  change: SessionChange;
  relationships: Array<{
    relationshipId: string;
    type: RelationshipType;
    entityId: string;
    direction: 'incoming' | 'outgoing';
  }>;
  versions: Array<{
    versionId: string;
    entityId: string;
    relationshipType: RelationshipType;
  }>;
}

/**
 * Result of querying session changes
 */
export interface SessionChangesResult {
  sessionId: string;
  total: number;
  changes: SessionChangeSummary[];
}

/**
 * Individual event in a session timeline
 */
export interface SessionTimelineEvent {
  relationshipId: string;
  type: RelationshipType;
  fromEntityId: string;
  toEntityId: string;
  timestamp: Date | null;
  sequenceNumber?: number | null;
  actor?: string;
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  changeInfo?: SessionRelationshipInfo['changeInfo'];
  impact?: SessionRelationshipInfo['impact'];
  stateTransition?: SessionRelationshipInfo['stateTransition'];
  metadata?: Record<string, any>;
}

/**
 * Summary statistics for a session timeline
 */
export interface SessionTimelineSummary {
  totalEvents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  actors: Array<{ actor: string; count: number }>;
  firstTimestamp?: Date;
  lastTimestamp?: Date;
}

/**
 * Result of querying session timeline
 */
export interface SessionTimelineResult {
  sessionId: string;
  total: number;
  events: SessionTimelineEvent[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: SessionTimelineSummary;
}

/**
 * Entry showing impact of a session on an entity
 */
export interface SessionImpactEntry {
  entityId: string;
  relationshipIds: string[];
  impactCount: number;
  firstTimestamp?: Date;
  latestTimestamp?: Date;
  latestSeverity?: 'critical' | 'high' | 'medium' | 'low' | null;
  latestSequenceNumber?: number | null;
  actors: string[];
}

/**
 * Result of querying session impacts on entities
 */
export interface SessionImpactsResult {
  sessionId: string;
  totalEntities: number;
  impacts: SessionImpactEntry[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: {
    bySeverity: Record<string, number>;
    totalRelationships: number;
  };
}

/**
 * Entry showing sessions that affect a specific entity
 */
export interface SessionsAffectingEntityEntry {
  sessionId: string;
  relationshipIds: string[];
  eventCount: number;
  firstTimestamp?: Date;
  lastTimestamp?: Date;
  actors: string[];
  severities: Record<string, number>;
}

/**
 * Result of querying sessions affecting an entity
 */
export interface SessionsAffectingEntityResult {
  entityId: string;
  totalSessions: number;
  sessions: SessionsAffectingEntityEntry[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: {
    bySeverity: Record<string, number>;
    totalRelationships: number;
  };
}

/**
 * Session relationship information
 */
export interface SessionRelationshipInfo {
  relationshipId: string;
  type: RelationshipType;
  fromEntityId: string;
  toEntityId: string;
  timestamp: Date | null;
  sequenceNumber?: number | null;
  actor?: string;
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  changeInfo?: {
    type: 'add' | 'remove' | 'update';
    description: string;
    metadata?: Record<string, any>;
  };
  impact?: {
    affectedEntities: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  };
  stateTransition?: {
    from: string;
    to: string;
    reason: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Session change information
 */
export interface SessionChange {
  id: string;
  type: 'add' | 'remove' | 'update';
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  id: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  actor?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Session statistics
 */
export interface SessionStats {
  totalEvents: number;
  totalRelationships: number;
  totalChanges: number;
  duration?: number;
  eventsPerMinute?: number;
  changesPerEvent?: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

/**
 * Session query options
 */
export interface SessionQueryOptions {
  limit?: number;
  offset?: number;
  startTime?: Date;
  endTime?: Date;
  status?: SessionMetadata['status'][];
  actor?: string;
  tags?: string[];
  includeMetadata?: boolean;
}
